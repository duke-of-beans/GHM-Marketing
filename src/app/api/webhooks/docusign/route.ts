import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { VaultSpace } from "@prisma/client";

/**
 * POST /api/webhooks/docusign
 *
 * DocuSign Connect webhook receiver — NO auth required (called by DocuSign servers).
 *
 * Security: If DOCUSIGN_WEBHOOK_SECRET is set, the HMAC-SHA256 signature in
 * x-docusign-signature-1 is verified against the raw body. If the env var is
 * unset, a warning is logged but the request is still processed (graceful
 * degradation for local dev / initial setup).
 *
 * On completion: downloads the signed PDF from DocuSign, uploads to Vercel Blob,
 * and creates a VaultFile record in the "signed_contracts" space.
 *
 * ALWAYS returns 200 — DocuSign retries on non-2xx and a retry storm is worse
 * than a missed status update.
 */
export async function POST(req: NextRequest) {
  // Read raw body once — needed for both HMAC verification and JSON parsing
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[DocuSign webhook] Failed to read request body:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── HMAC signature verification ──────────────────────────────────────────
  const webhookSecret = process.env.DOCUSIGN_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers.get("x-docusign-signature-1");
    if (!signature) {
      console.warn("[DocuSign webhook] Missing x-docusign-signature-1 header — rejecting");
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const expectedHmac = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("base64");
    if (expectedHmac !== signature) {
      console.warn("[DocuSign webhook] HMAC signature mismatch — rejecting");
      return NextResponse.json({ received: true }, { status: 200 });
    }
  } else {
    console.warn(
      "[DocuSign webhook] DOCUSIGN_WEBHOOK_SECRET is unset — skipping signature verification"
    );
  }

  // ── Parse payload ─────────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch (err) {
    console.error("[DocuSign webhook] Failed to parse JSON payload:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // DocuSign Connect JSON payload structure:
  // { event, data: { envelopeId, envelopeSummary: { status, ... } } }
  const data = payload.data as Record<string, unknown> | undefined;
  const envelopeId = data?.envelopeId as string | undefined;
  const envelopeSummary = data?.envelopeSummary as Record<string, unknown> | undefined;
  const newStatus = envelopeSummary?.status as string | undefined;

  if (!envelopeId || !newStatus) {
    console.error("[DocuSign webhook] Missing envelopeId or status in payload", {
      envelopeId,
      newStatus,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Only handle terminal statuses we care about
  if (!["completed", "declined", "voided"].includes(newStatus)) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    // ── Find envelope record ────────────────────────────────────────────────
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { envelopeId },
    });

    if (!envelope) {
      console.warn("[DocuSign webhook] No envelope found for envelopeId:", envelopeId);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ── Update status (and completedAt if completed) ────────────────────────
    const updateData: { status: string; completedAt?: Date } = { status: newStatus };
    if (newStatus === "completed") {
      updateData.completedAt = new Date();
    }

    await prisma.signatureEnvelope.update({
      where: { id: envelope.id },
      data: updateData,
    });

    // ── Download signed PDF and vault it (completed only) ──────────────────
    if (newStatus === "completed") {
      const dsApiKey = process.env.DOCUSIGN_API_KEY;
      const dsAccountId = process.env.DOCUSIGN_ACCOUNT_ID;

      if (!dsApiKey || !dsAccountId) {
        console.warn(
          "[DocuSign webhook] DocuSign env vars unset — skipping signed PDF download"
        );
        return NextResponse.json({ received: true }, { status: 200 });
      }

      try {
        // TODO: Before go-live, replace the static DOCUSIGN_API_KEY with a proper
        // OAuth 2.0 access token obtained via JWT Grant or Authorization Code flow.
        // A static key is acceptable for sandbox testing only.

        // GET /envelopes/{id}/documents/combined — returns the signed PDF
        const pdfResponse = await fetch(
          `https://demo.docusign.net/restapi/v2.1/accounts/${dsAccountId}/envelopes/${envelopeId}/documents/combined`,
          {
            headers: {
              Authorization: `Bearer ${dsApiKey}`,
              Accept: "application/pdf",
            },
          }
        );

        if (!pdfResponse.ok) {
          console.error(
            "[DocuSign webhook] Failed to download signed PDF:",
            await pdfResponse.text()
          );
          // Status update succeeded above — log and continue, do not block the 200
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();

        // Sanitise filename for storage
        const safeName = envelope.documentName.replace(/[^a-z0-9._-]/gi, "_");
        const fileName = `${safeName}_signed.pdf`;
        const blobPath = `vault/signed_contracts/${Date.now()}-${fileName}`;

        // Upload to Vercel Blob
        const blob = await put(blobPath, pdfBuffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: "application/pdf",
        });

        // Create VaultFile record in the "Signed Contracts" space.
        // SignatureEnvelope.clientId references Lead.id, so it maps to VaultFile.leadId.
        await prisma.vaultFile.create({
          data: {
            name: fileName,
            originalName: fileName,
            displayName: `${envelope.documentName} (Signed)`,
            mimeType: "application/pdf",
            size: pdfBuffer.byteLength,
            blobUrl: blob.url,
            space: VaultSpace.signed_contracts,
            category: "Signed Contracts",
            uploadedBy: envelope.createdById,
            leadId: envelope.clientId ?? null,
            version: 1,
            isLatest: true,
          },
        });

        console.log("[DocuSign webhook] Signed PDF vaulted successfully for envelope:", envelopeId);
      } catch (uploadErr) {
        // The status update already committed — log the upload failure but do not
        // surface it to DocuSign (would cause retries that re-run the status update).
        console.error(
          "[DocuSign webhook] Failed to download/upload signed PDF (status update succeeded):",
          uploadErr
        );
      }
    }
  } catch (err) {
    // Unhandled error after status update attempt — log only, return 200
    console.error("[DocuSign webhook] Unhandled error during processing:", err);
  }

  // Always acknowledge — DocuSign retries on any non-2xx response
  return NextResponse.json({ received: true }, { status: 200 });
}
