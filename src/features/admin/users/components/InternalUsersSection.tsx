"use client";

import type { Role } from "@/types/role";
import type { UserRole } from "@/types/user-role";

import { AdminCard } from "../../AdminCard";
import type { AdminUserView, AssignablePermission } from "../users.types";
import {
  formatAdminDate,
  formatUserDisplayName,
  getRoleLabel,
  isAdminRoleUser,
  isPrincipalAdminUser,
} from "../users.logic";
import { WorkerPermissionsEditor } from "./WorkerPermissionsEditor";

type InternalUsersSectionProps = {
  users: AdminUserView[];
  roles: Role[];
  userRoles: UserRole[];
  principalAdminUserId: string;
  currentUserId: string;
  busyUserId: string | null;
  confirmDeleteUserId: string | null;
  userActionError?: string;
  onToggleActive: (userId: string, nextActive: boolean) => void;
  onRevokePrivileges: (userId: string) => void;
  onRequestDelete: (userId: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (userId: string) => void;
  assignablePermissions: AssignablePermission[];
  userPermissionNames: Record<string, string[]>;
  onPermissionsSaved: (userId: string, permissionNames: string[]) => void;
};

const buttonSecondaryClassName =
  "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const buttonDangerClassName =
  "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function InternalUsersSection({
  users,
  roles,
  userRoles,
  principalAdminUserId,
  currentUserId,
  busyUserId,
  confirmDeleteUserId,
  userActionError,
  onToggleActive,
  onRevokePrivileges,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  assignablePermissions,
  userPermissionNames,
  onPermissionsSaved,
}: InternalUsersSectionProps) {
  if (users.length === 0) {
    return (
      <AdminCard>
        <p className="text-body-md text-muted">
          No hay usuarios internos registrados todavía.
        </p>
      </AdminCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {userActionError ? (
        <p className="text-body-sm text-foreground" role="alert">
          {userActionError}
        </p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {users.map((user) => {
          const principal = isPrincipalAdminUser(user.id, principalAdminUserId);
          const isSelf = user.id === currentUserId;
          const extraAdmin = isAdminRoleUser(user.id, userRoles) && !principal;
          const canManage = !principal && !isSelf;
          const canDelete = canManage;
          const canToggleActive = canManage;
          const isBusy = busyUserId === user.id;
          const isConfirmingDelete = confirmDeleteUserId === user.id;

          return (
            <li key={user.id}>
              <AdminCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-body-md text-foreground">
                        {formatUserDisplayName(user)}
                      </p>
                      {principal ? (
                        <span className="inline-flex w-fit rounded-md border border-accent/40 px-2 py-1 text-label text-foreground">
                          Administrador principal
                        </span>
                      ) : extraAdmin ? (
                        <span className="inline-flex w-fit rounded-md border border-accent/40 px-2 py-1 text-label text-foreground">
                          Administrador
                        </span>
                      ) : null}
                    </div>
                    <p className="break-all text-body-sm text-muted">
                      {user.email}
                    </p>
                    <p className="text-body-sm text-muted">
                      {getRoleLabel(user.id, userRoles, roles)}
                      {" · "}
                      {user.active ? "Activo" : "Inactivo"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <p className="text-body-sm text-muted">
                      Actualizado {formatAdminDate(user.updatedAt)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {canToggleActive ? (
                        <button
                          type="button"
                          disabled={Boolean(busyUserId)}
                          onClick={() => onToggleActive(user.id, !user.active)}
                          className={buttonSecondaryClassName}
                        >
                          {isBusy
                            ? "Guardando…"
                            : user.active
                              ? "Revocar acceso"
                              : "Restaurar acceso"}
                        </button>
                      ) : null}

                      {canManage ? (
                        <button
                          type="button"
                          disabled={Boolean(busyUserId)}
                          onClick={() => onRevokePrivileges(user.id)}
                          className={buttonSecondaryClassName}
                        >
                          {isBusy ? "Guardando…" : "Quitar permisos"}
                        </button>
                      ) : null}

                      {canDelete && !isConfirmingDelete ? (
                        <button
                          type="button"
                          disabled={Boolean(busyUserId)}
                          onClick={() => onRequestDelete(user.id)}
                          className={buttonDangerClassName}
                        >
                          Expulsar
                        </button>
                      ) : null}

                      {isConfirmingDelete ? (
                        <div className="flex w-full flex-col gap-2 rounded-md border border-border bg-background p-3 sm:min-w-[18rem]">
                          <p className="text-body-sm text-foreground">
                            ¿Expulsar a este usuario?
                          </p>
                          <p className="text-body-sm text-muted">
                            Se eliminará de forma permanente. Perderá el acceso
                            al panel y no podrá recuperarse desde aquí.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={onCancelDelete}
                              disabled={isBusy}
                              className={buttonSecondaryClassName}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => onConfirmDelete(user.id)}
                              disabled={isBusy}
                              className={buttonDangerClassName}
                            >
                              {isBusy ? "Expulsando…" : "Expulsar usuario"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                {!principal ? (
                  <WorkerPermissionsEditor
                    userId={user.id}
                    initialPermissionNames={userPermissionNames[user.id] ?? []}
                    assignablePermissions={assignablePermissions}
                    onSaved={(permissionNames) =>
                      onPermissionsSaved(user.id, permissionNames)
                    }
                  />
                ) : null}
              </AdminCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
