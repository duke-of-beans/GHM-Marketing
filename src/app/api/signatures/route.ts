import { NextRequest, NextResponse } from "next/server";
import { withPermission, getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";

/**
 * GET /api/signatures
 * List SignatureEnvelopes for the current user.
 * Admin (isElevated) sees all envelopes; others see only their own.
 * Paginated: take=20, skip from query param.
 */
export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const skip = parseInt(searchParams.get("skip") ?? "0") || 0;
    const take = 20;

    const where = isElevated(user.role) ? {} : { createdById: parseInt(user.id) };

    const envelopes = await prisma.signatureEnvelope.findMany({
      where,
      include: {
        vaultFile: true,
        client: true,
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    return NextResponse.json({ success: true, data: envelopes });
  } catch (error) {
    console.error("[GET /api/signatures]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch signature envelopes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/signatures
 * Create a SignatureEnvelope record (status="draft"), fetch the document,
 * base64-encode it, call DocuSign Create Envelope API, then update the record
 * with envelopeId, status="sent", sentAt.
 *
 * Body: { documentUrl, documentName, recipientEmail, recipientName, vaultFileId?, clientId? }
 *
 * Returns 503 { error: "DocuSign not configured" } if env vars are unset.
 */
export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  const dsApiKey = process.env.DOCUSIGN_API_KEY;
  const dsAccountId = process.env.DOCUSIGN_ACCOUNT_ID;
  if (!dsApiKey || !dsAccountId) {
    return NextResponse.json({ error: "DocuSign not configured" }, { status: 503 });
  }

  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      documentUrl: string;
      documentName: string;
      recipientEmail: string;
      recipientName: string;
      vaultFileId?: number;
      clientId?: number;
    };

    const { documentUrl, documentName, recipientEmail, recipientName, vaultFileId, clientId } =
      body;

    if (!documentUrl || !documentName || !recipientEmail || !recipientName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: documentUrl, documentName, recipientEmail, recipientName",
        },
        { status: 400 }
      );
    }

    // Create draft record first so we have a DB ID regardless of DocuSign outcome
    const envelope = await prisma.signatureEnvelope.create({
      data: {
        documentUrl,
        documentName,
        recipientEmail,
        recipientName,
        status: "draft",
        createdById: parseInt(user.id),
        ...(vaultFileId != null ? { vaultFileId } : {}),
        ...(clientId != null ? { clientId } : {}),
      },
    });

    // Fetch the document from the provided URL and base64-encode it
    const docResponse = await fetch(documentUrl);
    if (!docResponse.ok) {
      // Clean up the draft record if we cannot fetch the document
      await prisma.signatureEnvelope.delete({ where: { id: envelope.id } });
      return NextResponse.json(
        { success: false, error: "Failed to fetch document from provided URL" },
        { status: 400 }
      );
    }

    const docBuffer = await docResponse.arrayBuffer();
    const docBase64 = Buffer.from(docBuffer).toString("base64");

    // Derive file extension from Content-Type header or URL
    const contentType = docResponse.headers.get("content-type") ?? "";
    const fileExtension = contentType.includes("pdf")
      ? "pdf"
      : (documentUrl.split(".").pop()?.split("?")[0] ?? "pdf");

    // DocuSign eSignature REST API — Create Envelope (sandbox)
    const dsResponse = await fetch(
      `https://demo.docusign.net/restapi/v2.1/accounts/${dsAccountId}/envelopes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dsApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailSubject: documentName,
          status: "sent",
          documents: [
            {
              documentBase64: docBase64,
              name: documentName,
              fileExtension,
              documentId: "1",
            },
          ],
          recipients: {
            signers: [
              {
                email: recipientEmail,
                name: recipientName,
                recipientId: "1",
                routingOrder: "1",
              },
            ],
          },
        }),
      }
    );

    if (!dsResponse.ok) {
      const errorText = await dsResponse.text();
      console.error("[POST /api/signatures] DocuSign API error:", errorText);
      return NextResponse.json(
        { success: false, error: "DocuSign API error — envelope was not sent" },
        { status: 502 }
      );
    }

    const dsData = (await dsResponse.json()) as { envelopeId: string; status: string };

    // Update record with DocuSign envelope ID, sent status, and sentAt timestamp
    const updated = await prisma.signatureEnvelope.update({
      where: { id: envelope.id },
      data: {
        envelopeId: dsData.envelopeId,
        status: "sent",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        envelopeId: updated.envelopeId,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("[POST /api/signatures]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create signature envelope" },
      { status: 500 }
    );
  }
}
