import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { spawn } from "child_process";
import path from "path";
import {
  getComposerPage,
  recordScrvnrResult,
  updateBuildJobPageCounts,
} from "@/lib/db/website-studio";
import type { ScrvnrAdapterResult } from "@/types/website-studio";

const SCRVNR_ROOT = path.resolve(process.cwd(), "scrvnr");
const PYTHON_SCRIPT = path.join(SCRVNR_ROOT, "ws_gate_runner.py");

// POST /api/website-studio/[clientId]/scrvnr
// Runs the SCRVNR gate on a composer page (full page or single section).
//
// Body:
//   pageId:        number   — ComposerPage id
//   sections:      object   — { sectionName: copyText } — full page check
//   section?:      string   — if provided, single-section live check only
//   override?:     boolean
//   overrideNote?: string
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await request.json();
    const { pageId, sections, section, override, overrideNote } = body;

    if (!pageId || !sections) {
      return NextResponse.json(
        { success: false, error: "pageId and sections are required" },
        { status: 400 }
      );
    }

    const page = await getComposerPage(pageId);
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }

    // Resolve voice profile slug from the property's build job
    // We pass it via the page → job → property relation query
    const pageWithContext = page as any;
    const voiceProfileSlug =
      pageWithContext?.job?.property?.voiceProfileSlug ?? null;

    const adapterInput = {
      property_slug: voiceProfileSlug ?? "no-profile",
      sections,
      section_only: section ?? null,
      override: override ?? false,
      override_note: overrideNote ?? "",
      job_id: String(pageId),
    };

    const adapterResult = await runPythonAdapter(adapterInput);

    // Single-section live checks don't persist to the audit trail
    if (section) {
      return NextResponse.json({ success: true, data: adapterResult });
    }

    // Full page check — record in DB and sync page status
    const gateRecord = await recordScrvnrResult(
      pageId,
      voiceProfileSlug ?? "no-profile",
      voiceProfileSlug,
      adapterResult
    );

    // Re-tally build job page counts
    if (pageWithContext?.job?.id) {
      await updateBuildJobPageCounts(pageWithContext.job.id);
    }

    return NextResponse.json({ success: true, data: { adapterResult, gateRecord } });
  } catch (err) {
    console.error("[website-studio/scrvnr] POST failed", err);
    return NextResponse.json(
      { success: false, error: "SCRVNR evaluation failed" },
      { status: 500 }
    );
  }
}

// ── Python adapter runner ─────────────────────────────────────────────────────
// Calls ws_gate_runner.py which accepts JSON on stdin, returns JSON on stdout.
// This is a clean subprocess contract — no HTTP server needed for SCRVNR.

function runPythonAdapter(input: object): Promise<ScrvnrAdapterResult> {
  return new Promise((resolve, reject) => {
    const python = spawn("python", [PYTHON_SCRIPT], {
      cwd: SCRVNR_ROOT,
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    python.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`SCRVNR runner exited ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as ScrvnrAdapterResult);
      } catch {
        reject(new Error(`SCRVNR runner returned invalid JSON: ${stdout}`));
      }
    });

    python.stdin.write(JSON.stringify(input));
    python.stdin.end();
  });
}
