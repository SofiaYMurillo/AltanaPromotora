export {
  canAccessAdmin,
  getRoleNames,
  isClient,
  isPrincipalAdmin,
  isSessionActive,
  isWorker,
  normalizeEmail,
} from "./access";
export { PRINCIPAL_ADMIN_EMAIL, PRINCIPAL_ADMIN_USER_ID } from "./auth.data";
export type {
  AuthRoleName,
  InternalAccessDecision,
  InternalAccessReason,
} from "./auth.types";
export type {
  InvitationEvaluation,
  InvitationEvaluationReason,
} from "@/domain";
export { AccessDenied } from "./components/AccessDenied";
export { AdminLoginScreen } from "./components/AdminLoginScreen";

/** Re-exports of access/security contracts for composition (not Presentation). */
export type {
  AccountRecoveryPolicy,
  AdminRecoveryPolicy,
  InternalAccessPolicy,
  SecurityEvent,
  SecurityNotification,
  SecurityNotificationPolicy,
  SecurityRateLimitPolicy,
} from "@/domain";
export {
  isEmailDomainAllowed,
  isWorkerEmailCompliant,
  securityEventTypeForAccessDenial,
  securityEventTypeForInvitationDenial,
} from "@/domain";
