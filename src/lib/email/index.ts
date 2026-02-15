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
