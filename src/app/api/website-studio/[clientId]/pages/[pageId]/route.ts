import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import {
  getComposerPage,
  updatePageSections,
  updatePageReviewStatus,
} from "@/lib/db/website-studio";

// GET /api/website-studio/[clientId]/pages/[pageId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; pageId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { pageId } = await params;
  const id = parseInt(pageId);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: "Invalid pageId" }, { status: 400 });
  }

  const page = await getComposerPage(id);
  if (!page) {
    return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: page });
}

// PATCH /api/website-studio/[clientId]/pages/[pageId]
// Dual purpose: update sections content OR update review status.
// Discriminated by body shape:
//   { sections: {...} }              → save draft
//   { reviewStatus, reviewNote? }    → reviewer action
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; pageId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { pageId } = await params;
  const id = parseInt(pageId);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: "Invalid pageId" }, { status: 400 });
  }

  try {
    const body = await request.json();

    if (body.sections !== undefined) {
      const updated = await updatePageSections(id, body.sections);
      return NextResponse.json({ success: true, data: updated });
    }

    if (body.reviewStatus !== undefined) {
      const validStatuses = ["pending", "approved", "changes_requested"];
      if (!validStatuses.includes(body.reviewStatus)) {
        return NextResponse.json(
          { success: false, error: `reviewStatus must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      const updated = await updatePageReviewStatus(id, body.reviewStatus, body.reviewNote);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: "Body must contain either sections or reviewStatus" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[website-studio/pages] PATCH failed", err);
    return NextResponse.json({ success: false, error: "Failed to update page" }, { status: 500 });
  }
}
