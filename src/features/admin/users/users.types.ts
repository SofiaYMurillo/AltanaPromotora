import type { AccessRequest, WorkerInvitationAdminView } from "@/domain";
import type { Role } from "@/types/role";
import type { UserRole } from "@/types/user-role";

/** Safe subset of User for the admin directory — no phone, no credentials. */
export type AdminUserView = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssignablePermission = {
  name: string;
  label: string;
};

export interface UsersPageData {
  users: AdminUserView[];
  roles: Role[];
  userRoles: UserRole[];
  invitations: WorkerInvitationAdminView[];
  accessRequests: AccessRequest[];
  assignablePermissions: AssignablePermission[];
  userPermissionNames: Record<string, string[]>;
}
