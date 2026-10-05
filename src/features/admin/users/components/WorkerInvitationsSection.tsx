"use client";

import {
  canRevokeWorkerInvitation,
  getWorkerInvitationDisplayStatus,
  type WorkerInvitationAdminView,
} from "@/domain";

import type { Role } from "@/types/role";

import { AdminCard } from "../../AdminCard";
import {
  formatAdminDate,
  getRoleLabelById,
  invitationEmailDeliveryLabels,
} from "../users.logic";
import { InvitationStatusBadge } from "./InvitationStatusBadge";

type WorkerInvitationsSectionProps = {
  invitations: WorkerInvitationAdminView[];
  roles: Role[];
  revokingId: string | null;
  confirmRevokeId: string | null;
  resendingId: string | null;
  onRequestRevoke: (invitationId: string) => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: (invitationId: string) => void;
  onResend: (invitationId: string) => void;
  errorMessage?: string;
};

const buttonSecondaryClassName =
  "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const buttonDangerClassName =
  "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function WorkerInvitationsSection({
  invitations,
  roles,
  revokingId,
  confirmRevokeId,
  resendingId,
  onRequestRevoke,
  onCancelRevoke,
  onConfirmRevoke,
  onResend,
  errorMessage,
}: WorkerInvitationsSectionProps) {
  if (invitations.length === 0) {
    return (
      <AdminCard>
        <p className="text-body-md text-muted">
          No hay invitaciones registradas. Crea una invitación para dar acceso a
          un trabajador.
        </p>
      </AdminCard>
    );
  }

  const busy = Boolean(revokingId || resendingId);

  return (
    <div className="flex flex-col gap-4">
      {errorMessage ? (
        <p className="text-body-sm text-foreground" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {invitations.map((invitation) => {
          const status = getWorkerInvitationDisplayStatus(invitation);
          const canRevoke = canRevokeWorkerInvitation(invitation);
          const isConfirming = confirmRevokeId === invitation.id;
          const isRevoking = revokingId === invitation.id;
          const isResending = resendingId === invitation.id;
          const deliveryStatus = invitation.emailDeliveryStatus ?? "not_attempted";

          return (
            <li key={invitation.id}>
              <AdminCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all text-body-md text-foreground">
                        {invitation.email}
                      </p>
                      <InvitationStatusBadge status={status} />
                    </div>
                    <p className="text-body-sm text-muted">
                      Rol: {getRoleLabelById(invitation.roleId, roles)}
                    </p>
                    <p className="text-body-sm text-muted">
                      {invitationEmailDeliveryLabels[deliveryStatus]}
                    </p>
                    <p className="text-body-sm text-muted">
                      Creada {formatAdminDate(invitation.createdAt)}
                      {" · "}
                      Expira {formatAdminDate(invitation.expiresAt)}
                    </p>
                    {invitation.usedAt ? (
                      <p className="text-body-sm text-muted">
                        Utilizada {formatAdminDate(invitation.usedAt)}
                      </p>
                    ) : null}
                    {invitation.revokedAt ? (
                      <p className="text-body-sm text-muted">
                        Revocada {formatAdminDate(invitation.revokedAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {invitation.canResend ? (
                      <button
                        type="button"
                        onClick={() => onResend(invitation.id)}
                        disabled={busy}
                        aria-label={`Reenviar invitación a ${invitation.email}`}
                        className={buttonSecondaryClassName}
                      >
                        {isResending ? "Reenviando…" : "Reenviar"}
                      </button>
                    ) : null}

                    {canRevoke && !isConfirming ? (
                      <button
                        type="button"
                        onClick={() => onRequestRevoke(invitation.id)}
                        disabled={busy}
                        className={buttonDangerClassName}
                      >
                        Revocar
                      </button>
                    ) : null}

                    {isConfirming ? (
                      <div className="flex w-full flex-col gap-2 rounded-md border border-border bg-background p-3 sm:w-auto">
                        <p className="text-body-sm text-foreground">
                          ¿Revocar esta invitación?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={onCancelRevoke}
                            disabled={isRevoking}
                            className={buttonSecondaryClassName}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => onConfirmRevoke(invitation.id)}
                            disabled={isRevoking}
                            className={buttonDangerClassName}
                          >
                            {isRevoking ? "Revocando…" : "Confirmar revocación"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </AdminCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
