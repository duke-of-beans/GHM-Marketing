import { Resend } from "resend";
import { prisma } from "@/lib/db";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@ghmmarketing.com";
const FROM_NAME = "GHM Marketing";

// ============================================================================
// Send Work Order PDF via email
// ============================================================================

export async function sendWorkOrderEmail(params: {
  workOrderId: number;
  pdfBuffer: Buffer;
  woNumber: string;
  recipientEmail: string;
  recipientName: string;
  repName: string;
  repEmail: string;
  businessName: string;
  grandTotal: number;
}) {
  const { workOrderId, pdfBuffer, woNumber, recipientEmail, recipientName, repName, repEmail, businessName, grandTotal } = params;

  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return { success: false, error: "Email not configured" };
  }

  try {
    const formatCurrency = (val: number) =>
      `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    const { data, error } = await getResend()!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipientEmail,
      cc: repEmail,
      subject: `Work Order ${woNumber} - ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a2e; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GHM Marketing</h1>
            <p style="color: #a0a0b0; margin: 4px 0 0 0; font-size: 12px; letter-spacing: 1px;">DIGITAL MARKETING SOLUTIONS</p>
          </div>

          <div style="padding: 32px 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px;">
              Hi${recipientName ? ` ${recipientName}` : ""},
            </p>

            <p style="color: #666; line-height: 1.6;">
              Thank you for your interest in our services. Please find attached your customized work order
              with our recommended digital marketing solutions for <strong>${businessName}</strong>.
            </p>

            <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #666; font-size: 14px;">Work Order</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #333;">${woNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #666; font-size: 14px;">Total Investment</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #1a1a2e; font-size: 18px;">${formatCurrency(grandTotal)}</td>
                </tr>
              </table>
            </div>

            <p style="color: #666; line-height: 1.6;">
              Your dedicated account manager <strong>${repName}</strong> is available to discuss
              any questions. Feel free to reply to this email or call us directly.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
              This work order is valid for 30 days from the date of issue.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `GHM-${woNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    // Update work order record
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        sentViaEmail: true,
        emailSentAt: new Date(),
      },
    });

    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// Send status update notification to lead
// ============================================================================

export async function sendStatusNotification(params: {
  recipientEmail: string;
  businessName: string;
  newStatus: string;
  repName: string;
  repEmail: string;
  message?: string;
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: "Email not configured" };

  const statusLabels: Record<string, string> = {
    scheduled: "We've scheduled your consultation",
    contacted: "Thanks for connecting with us",
    follow_up: "Following up on our conversation",
    paperwork: "Your proposal is ready for review",
    won: "Welcome aboard! Let's get started",
  };

  const subject = statusLabels[params.newStatus] || `Update: ${params.businessName}`;

  try {
    const { error } = await getResend()!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.recipientEmail,
      replyTo: params.repEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a2e;">${subject}</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi, this is ${params.repName} from GHM Marketing.
          </p>
          ${params.message ? `<p style="color: #666; line-height: 1.6;">${params.message}</p>` : ""}
          <p style="color: #666; line-height: 1.6;">
            If you have any questions, feel free to reply to this email.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            GHM Marketing · Digital Marketing Solutions
          </p>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// Onboarding submission — notify ops team
// ============================================================================

export async function sendOpsOnboardingNotification(params: {
  submissionId: number;
  businessName: string;
  partnerName: string;
  opsEmails: string[];
  dashboardUrl?: string;
}) {
  const { submissionId, businessName, partnerName, opsEmails, dashboardUrl } = params;
  if (!process.env.RESEND_API_KEY || opsEmails.length === 0) {
    console.warn("Ops onboarding notification skipped — no RESEND_API_KEY or no recipients");
    return { success: false, error: "Not configured" };
  }

  const viewUrl = dashboardUrl ?? `https://app.ghmdigital.com/clients/onboarding/${submissionId}`;

  try {
    const { error } = await getResend()!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: opsEmails,
      subject: `🎉 New onboarding completed — ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
          <div style="background: #1a1a2e; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">New Client Onboarding Received</h1>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 16px; margin-top: 0;">
              <strong>${businessName}</strong> has completed their onboarding form.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;">Business</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">${businessName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Partner / Sales rep</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">${partnerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Submission ID</td>
                <td style="padding: 8px 0; color: #111827;">#${submissionId}</td>
              </tr>
            </table>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${viewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">
                View Submission + Checklist →
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">
              The ops checklist is ready for you. Work through each item to complete client onboarding.
            </p>
          </div>
        </div>
      `,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// Contractor Wave onboarding — sent when a new contractor is added to the system
// ============================================================================

export async function sendContractorWaveInvite(params: {
  contractorEmail: string;
  contractorName: string;
  entityName: string;
}) {
  const { contractorEmail, contractorName, entityName } = params;
  if (!process.env.RESEND_API_KEY) return { success: false, error: "Email not configured" };

  try {
    const { data, error } = await getResend()!.emails.send({
      from: `GHM Marketing <${FROM_EMAIL}>`,
      to: contractorEmail,
      subject: "Action required: Set up your payment account with GHM Marketing",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
          <div style="background: #1a1a2e; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">GHM Marketing</h1>
            <p style="color: #a0a0b0; margin: 4px 0 0; font-size: 12px; letter-spacing: 1px;">PARTNER PAYMENT SETUP</p>
          </div>

          <div style="background: #fff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #111827; font-size: 16px; margin-top: 0;">Hi ${contractorName},</p>

            <p style="color: #374151; line-height: 1.7;">
              You've been added to GHM's payment system as a contractor under the entity
              <strong>${entityName}</strong>. To receive your commissions and residuals, you need
              to complete one quick step: connect your bank account through Wave, our payment platform.
            </p>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="color: #1e40af; font-weight: 700; font-size: 15px; margin: 0 0 12px;">What you need to do</p>
              <ol style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px; line-height: 2;">
                <li>Check your inbox for a separate email from <strong>Wave (waveapps.com)</strong> — it may take a few minutes to arrive.</li>
                <li>Open that email and click <strong>"Accept invitation"</strong> or <strong>"Set up account"</strong>.</li>
                <li>Create your free Wave account (or log in if you already have one).</li>
                <li>Go to <strong>Payments → Payout account</strong> and enter your bank account details (routing + account number).</li>
                <li>That's it — you're set up. GHM will process your payments directly to that account each month.</li>
              </ol>
            </div>

            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px; font-weight: 600;">A few things to know:</p>
              <ul style="color: #6b7280; font-size: 13px; margin: 0; padding-left: 18px; line-height: 1.9;">
                <li>Wave is free for contractors — you won't be charged anything.</li>
                <li>Your bank details are entered directly into Wave and are never stored by GHM.</li>
                <li>Payments are processed once your commissions are approved each month.</li>
                <li>Wave will issue your 1099 at year-end automatically.</li>
              </ul>
            </div>

            <p style="color: #374151; line-height: 1.7;">
              If you don't see the Wave email within 10 minutes, check your spam folder. If it's
              not there either, reply to this email and we'll sort it out.
            </p>

            <p style="color: #374151; line-height: 1.7;">
              Welcome to the team — we're glad to have you.
            </p>

            <p style="color: #374151; margin-bottom: 0;">
              — The GHM Team
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 16px;" />
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              GHM Digital Marketing Inc · Questions? Reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, emailId: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// Onboarding submission — notify the partner who generated the link
// ============================================================================

export async function sendPartnerOnboardingNotification(params: {
  partnerEmail: string;
  partnerName: string;
  businessName: string;
  submissionId: number;
  dashboardUrl?: string;
}) {
  const { partnerEmail, partnerName, businessName, submissionId, dashboardUrl } = params;
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "Not configured" };
  }

  const viewUrl = dashboardUrl ?? `https://app.ghmdigital.com/clients/onboarding/${submissionId}`;

  try {
    const { error } = await getResend()!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: partnerEmail,
      subject: `🎉 ${businessName} completed onboarding!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
          <div style="background: #1a1a2e; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">GHM Marketing</h1>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 16px; margin-top: 0;">Hi ${partnerName},</p>
            <p style="color: #374151; font-size: 16px;">
              Great news — <strong>${businessName}</strong> just completed their onboarding form. The ops team has been notified and will begin setting up their account.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">✅ What happens next</p>
              <ul style="color: #166534; font-size: 14px; margin: 8px 0 0 0; padding-left: 20px; line-height: 1.8;">
                <li>Ops team reviews the submission and begins account setup</li>
                <li>Technical access is collected and verified</li>
                <li>First work order is issued and invoicing begins</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${viewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">
                View Submission
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">
              Questions? Reply to this email or reach out to the ops team directly.
            </p>
          </div>
        </div>
      `,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
