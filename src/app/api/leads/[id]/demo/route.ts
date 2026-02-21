import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { generateDemoData } from "@/lib/demo/generator";
import { generateDemoHTML } from "@/lib/demo/template";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }

  const user = session.user as unknown as SessionUser;
  const repName = user.name ?? undefined;

  try {
    const data = await generateDemoData(leadId, repName);
    const html = generateDemoHTML(data);

    // Persist history record (non-fatal)
    await prisma.prospectDemo.create({
      data: {
        leadId,
        generatedBy: (user as unknown as { id: number }).id,
        repName: repName ?? null,
      },
    }).catch(() => {});

    const autoprint = request.nextUrl.searchParams.get("autoprint") === "1";

    // Inject autoprint script if requested
    const finalHtml = autoprint
      ? html.replace(
          "</head>",
          `<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),400));</script></head>`
        )
      : html;

    return new NextResponse(finalHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Demo generation error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate demo" },
      { status: 500 }
    );
  }
}
