/**
 * Email Automation System
 * Sends reports, upsell notifications, and other client communications
 */

// Note: This uses Resend API. Install with: npm install resend
// Add RESEND_API_KEY to .env

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "reports@ghmdigital.com";

export async function sendReportEmail(params: {
  to: string;
  clientName: string;
  reportType: string;
  reportUrl: string;
  periodStart: Date;
  periodEnd: Date;
}) {
  const { to, clientName, reportType, reportUrl, periodStart, periodEnd } = params;

  const html = generateReportEmailHTML({
    clientName,
    reportType,
    reportUrl,
    periodStart,
    periodEnd,
  });

  return sendEmail({
    to,
    subject: `Your ${reportType} Performance Report - ${clientName}`,
    html,
  });
}

export async function sendUpsellNotification(params: {
  to: string;
  clientName: string;
  productName: string;
  opportunityScore: number;
  projectedMrr: number;
  projectedRoi: number | null;
  reasoning: string;
}) {
  const { to, clientName, productName, opportunityScore, projectedMrr, projectedRoi, reasoning } =
    params;

  const html = generateUpsellEmailHTML({
    clientName,
    productName,
    opportunityScore,
    projectedMrr,
    projectedRoi,
    reasoning,
  });

  return sendEmail({
    to,
    subject: `Growth Opportunity for ${clientName}: ${productName}`,
    html,
  });
}

export async function sendPortalInvite(params: {
  to: string;
  clientName: string;
  portalUrl: string;
}) {
  const { to, clientName, portalUrl } = params;

  const html = generatePortalInviteHTML({
    clientName,
    portalUrl,
  });

  return sendEmail({
    to,
    subject: `Access Your Client Portal - ${clientName}`,
    html,
  });
}

/**
 * Core email sending function
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const { to, subject, html, from = FROM_EMAIL } = params;

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured. Email not sent.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate HTML for report email
 */
function generateReportEmailHTML(params: {
  clientName: string;
  reportType: string;
  reportUrl: string;
  periodStart: Date;
  periodEnd: Date;
}): string {
  const { clientName, reportType, reportUrl, periodStart, periodEnd } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Performance Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Your ${reportType} Report is Ready</h1>
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${clientName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Your performance report for the period ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()} is now available.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">What's Inside:</h2>
          <ul style="padding-left: 20px;">
            <li>Health score trends and competitive standing</li>
            <li>Top wins and areas of improvement</li>
            <li>Work completed and deployed</li>
            <li>Performance metrics and insights</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reportUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            View Your Report
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Questions? Reply to this email or contact your account manager.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} GHM Digital Marketing. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for upsell notification email
 */
function generateUpsellEmailHTML(params: {
  clientName: string;
  productName: string;
  opportunityScore: number;
  projectedMrr: number;
  projectedRoi: number | null;
  reasoning: string;
}): string {
  const { clientName, productName, opportunityScore, projectedMrr, projectedRoi, reasoning } =
    params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Growth Opportunity</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h1 style="color: #10b981; margin-bottom: 10px;">We've Identified a Growth Opportunity</h1>
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${clientName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Based on our latest competitive analysis, we've identified an opportunity to accelerate your growth.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h2 style="font-size: 20px; margin-bottom: 10px; color: #10b981;">${productName}</h2>
          <p style="font-size: 14px; color: #666; margin-bottom: 15px;">${reasoning}</p>
          
          <div style="display: flex; gap: 20px; margin-top: 20px;">
            <div>
              <div style="font-size: 12px; color: #666;">Investment</div>
              <div style="font-size: 24px; font-weight: bold; color: #2563eb;">$${projectedMrr}/mo</div>
            </div>
            ${
              projectedRoi !== null
                ? `
            <div>
              <div style="font-size: 12px; color: #666;">Estimated ROI</div>
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${projectedRoi}%</div>
            </div>
            `
                : ""
            }
            <div>
              <div style="font-size: 12px; color: #666;">Priority Score</div>
              <div style="font-size: 24px; font-weight: bold;">${opportunityScore}/100</div>
            </div>
          </div>
        </div>
        
        <p style="font-size: 16px; margin: 20px 0;">
          Let's schedule a quick call to discuss how ${productName} can help you achieve your goals.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:hello@ghmdigital.com?subject=Growth%20Opportunity:%20${encodeURIComponent(productName)}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Schedule a Call
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Questions? Reply to this email or contact your account manager.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} GHM Digital Marketing. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for portal invite email
 */
function generatePortalInviteHTML(params: {
  clientName: string;
  portalUrl: string;
}): string {
  const { clientName, portalUrl } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Client Portal Access</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to Your Client Portal</h1>
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${clientName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          We've set up a dedicated portal where you can track your performance, view reports, and see the work we're doing for you — all in one place.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">What You Can Do:</h2>
          <ul style="padding-left: 20px;">
            <li>View your health score and competitive standing</li>
            <li>Download performance reports anytime</li>
            <li>Track completed work and deployments</li>
            <li>Monitor progress in real-time</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Access Your Portal
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Bookmark this link for easy access anytime. This secure link is unique to you.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Questions? Reply to this email or contact your account manager.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} GHM Digital Marketing. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}
