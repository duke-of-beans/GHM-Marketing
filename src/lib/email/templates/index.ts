/**
 * Email Templates — Sprint 36 (FEAT-016c)
 * Barrel export for all email templates built on the shared base layout.
 */

export { baseLayout, styles } from "./base";
export type { BaseLayoutOptions } from "./base";

export { workOrderEmailHtml } from "./work-order";
export type { WorkOrderEmailData } from "./work-order";

export { reportDeliveryEmailHtml } from "./report-delivery";
export type { ReportDeliveryEmailData } from "./report-delivery";

export { opsOnboardingEmailHtml, partnerOnboardingEmailHtml } from "./onboarding-invite";
export type { OpsOnboardingData, PartnerOnboardingData } from "./onboarding-invite";

export { notificationEmailHtml, statusNotificationEmailHtml, STATUS_LABELS } from "./notification";
export type { NotificationEmailData, StatusNotificationData } from "./notification";

export { resetPasswordEmailHtml } from "./reset-password";
export type { ResetPasswordEmailData } from "./reset-password";
