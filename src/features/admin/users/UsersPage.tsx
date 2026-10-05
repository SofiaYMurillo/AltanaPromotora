"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { AccessRequest, WorkerInvitationAdminView } from "@/domain";

import { AdminCard, AdminPage } from "@/features/admin";

import {
  approveAccessRequestRequest,
  createWorkerInvitation,
  deleteInternalUserRequest,
  fetchWorkerInvitations,
  rejectAccessRequestRequest,
  resendWorkerInvitation,
  revokeInternalUserPrivilegesRequest,
  revokeWorkerInvitation,
  setInternalUserActiveRequest,
} from "./users-api.client";
import {
  filterInternalUsers,
  mapInvitationApiError,
  mapInvitationEmailStatusMessage,
  mapInvitationResendStatusMessage,
  mapUserAdminApiError,
} from "./users.logic";
import type { AdminUserView } from "./users.types";
import type { UsersPageData } from "./users.types";
import { AccessRequestsSection } from "./components/AccessRequestsSection";
import { InternalUsersSection } from "./components/InternalUsersSection";
import { InviteWorkerPanel } from "./components/InviteWorkerPanel";
import { WorkerInvitationsSection } from "./components/WorkerInvitationsSection";

type UsersPageProps = {
  data: UsersPageData;
  isPrincipalAdmin: boolean;
  principalAdminUserId: string;
  currentUserId: string;
};

const buttonPrimaryClassName =
  "inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-label text-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

type DevCodeBannerProps = {
  code: string;
  onDismiss: () => void;
};

function DevCodeBanner({ code, onDismiss }: DevCodeBannerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AdminCard>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-heading-sm text-foreground">
            Código de acceso de desarrollo
          </h3>
          <p className="text-body-sm text-muted">
            Comparte este código con el trabajador. Solo se muestra una vez y no
            se almacena en el navegador.
          </p>
        </div>
        <p className="font-mono text-heading-sm tracking-widest text-foreground">
          {code}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {copied ? "Copiado" : "Copiar código"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Cerrar
          </button>
        </div>
      </div>
    </AdminCard>
  );
}

export function UsersPage({
  data,
  principalAdminUserId,
  currentUserId,
}: UsersPageProps) {
  const router = useRouter();

  const [internalUsers, setInternalUsers] = useState<AdminUserView[]>(() =>
    filterInternalUsers(data.users, data.userRoles),
  );
  const [invitations, setInvitations] = useState<WorkerInvitationAdminView[]>(
    data.invitations,
  );
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(
    data.accessRequests,
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>();
  const [listPending, setListPending] = useState(false);
  const [listError, setListError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [devCode, setDevCode] = useState<string | undefined>();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | undefined>();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [userBusyId, setUserBusyId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(
    null,
  );
  const [userActionError, setUserActionError] = useState<string | undefined>();
  const [userPermissionNames, setUserPermissionNames] = useState(
    () => data.userPermissionNames,
  );
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [requestActionError, setRequestActionError] = useState<
    string | undefined
  >();

  const handleSessionExpired = useCallback(
    (error: string | undefined, status: number) => {
      if (
        error === "unauthorized" ||
        error === "forbidden" ||
        status === 401
      ) {
        router.push("/admin/login");
      }
    },
    [router],
  );

  const refreshInvitations = useCallback(async () => {
    setListPending(true);
    setListError(undefined);

    const result = await fetchWorkerInvitations();
    setListPending(false);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setListError(mapInvitationApiError(result.error));
      return;
    }

    setInvitations(result.invitations);
  }, [handleSessionExpired]);

  async function handleCreateInvitation(input: {
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    permissionNames: string[];
  }) {
    setCreatePending(true);
    setCreateError(undefined);
    setSuccessMessage(undefined);
    setDevCode(undefined);

    const result = await createWorkerInvitation(input);
    setCreatePending(false);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setCreateError(result.error);
      return;
    }

    setShowInviteForm(false);
    setSuccessMessage(
      mapInvitationEmailStatusMessage(
        result.invitation.email,
        result.email?.status,
      ),
    );

    if (result.devCode) {
      setDevCode(result.devCode);
    }

    await refreshInvitations();
    router.refresh();
  }

  async function handleConfirmRevoke(invitationId: string) {
    setRevokingId(invitationId);
    setRevokeError(undefined);
    setSuccessMessage(undefined);

    const result = await revokeWorkerInvitation(invitationId);
    setRevokingId(null);
    setConfirmRevokeId(null);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setRevokeError(mapInvitationApiError(result.error));
      return;
    }

    setSuccessMessage(
      result.alreadyRevoked
        ? "La invitación ya estaba revocada."
        : `Invitación revocada para ${result.invitation.email}.`,
    );

    await refreshInvitations();
    router.refresh();
  }

  async function handleToggleUserActive(userId: string, nextActive: boolean) {
    setUserBusyId(userId);
    setUserActionError(undefined);
    setSuccessMessage(undefined);

    const result = await setInternalUserActiveRequest(userId, nextActive);
    setUserBusyId(null);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setUserActionError(mapUserAdminApiError(result.error));
      return;
    }

    setInternalUsers((current) =>
      current.map((user) => (user.id === userId ? result.user : user)),
    );
    setSuccessMessage(
      nextActive
        ? "Acceso restaurado."
        : "Acceso revocado. El usuario ya no puede entrar.",
    );
    router.refresh();
  }

  async function handleRevokePrivileges(userId: string) {
    setUserBusyId(userId);
    setUserActionError(undefined);
    setSuccessMessage(undefined);

    const result = await revokeInternalUserPrivilegesRequest(userId);
    setUserBusyId(null);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setUserActionError(mapUserAdminApiError(result.error));
      return;
    }

    setUserPermissionNames((current) => ({
      ...current,
      [userId]: [],
    }));
    setSuccessMessage("Permisos revocados. El usuario queda como trabajador.");
    router.refresh();
  }

  async function handleApproveAccessRequest(requestId: string) {
    setBusyRequestId(requestId);
    setRequestActionError(undefined);
    setSuccessMessage(undefined);
    setDevCode(undefined);

    const result = await approveAccessRequestRequest(requestId);
    setBusyRequestId(null);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setRequestActionError(mapUserAdminApiError(result.error));
      return;
    }

    setAccessRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? { ...request, status: "approved", updatedAt: new Date().toISOString() }
          : request,
      ),
    );
    setSuccessMessage(
      mapInvitationEmailStatusMessage(
        result.invitation.email,
        result.email?.status,
      ),
    );
    if (result.devCode) {
      setDevCode(result.devCode);
    }
    await refreshInvitations();
    router.refresh();
  }

  async function handleRejectAccessRequest(requestId: string) {
    setBusyRequestId(requestId);
    setRequestActionError(undefined);
    setSuccessMessage(undefined);

    const result = await rejectAccessRequestRequest(requestId);
    setBusyRequestId(null);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setRequestActionError(mapUserAdminApiError(result.error));
      return;
    }

    setAccessRequests((current) =>
      current.map((request) =>
        request.id === requestId ? result.request : request,
      ),
    );
    setSuccessMessage(`Solicitud rechazada para ${result.request.email}.`);
    router.refresh();
  }

  async function handleConfirmDeleteUser(userId: string) {
    setUserBusyId(userId);
    setUserActionError(undefined);
    setSuccessMessage(undefined);

    const result = await deleteInternalUserRequest(userId);
    setUserBusyId(null);
    setConfirmDeleteUserId(null);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setUserActionError(mapUserAdminApiError(result.error));
      return;
    }

    setInternalUsers((current) => current.filter((user) => user.id !== userId));
    setSuccessMessage("Usuario expulsado del panel.");
    router.refresh();
  }

  async function handleResendInvitation(invitationId: string) {
    if (resendingId) {
      return;
    }

    setResendingId(invitationId);
    setRevokeError(undefined);
    setSuccessMessage(undefined);
    setDevCode(undefined);

    const result = await resendWorkerInvitation(invitationId);
    setResendingId(null);

    if (!result.ok) {
      handleSessionExpired(result.error, result.status);
      setRevokeError(mapInvitationApiError(result.error));
      return;
    }

    setSuccessMessage(
      mapInvitationResendStatusMessage(
        result.invitation.email,
        result.email?.status,
      ),
    );

    if (result.devCode) {
      setDevCode(result.devCode);
    }

    await refreshInvitations();
    router.refresh();
  }

  return (
    <AdminPage
      title="Usuarios internos"
      description="Administra accesos, solicitudes de ingreso, permisos e invitaciones del equipo interno."
    >
      <div className="flex flex-col gap-8">
        {successMessage ? (
          <p
            className="rounded-md border border-accent/40 bg-background px-4 py-3 text-body-sm text-foreground"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        {devCode ? (
          <DevCodeBanner code={devCode} onDismiss={() => setDevCode(undefined)} />
        ) : null}

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-heading-sm text-foreground">
              Solicitudes de ingreso
            </h2>
            <p className="text-body-sm text-muted">
              Cuando alguien nuevo pide entrar, aparece aquí. Al aceptarlo se le
              envía un código de un solo uso a su correo.
            </p>
          </div>
          <AccessRequestsSection
            requests={accessRequests}
            busyRequestId={busyRequestId}
            errorMessage={requestActionError}
            onApprove={handleApproveAccessRequest}
            onReject={handleRejectAccessRequest}
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-heading-sm text-foreground">Accesos actuales</h2>
          </div>
          <InternalUsersSection
            users={internalUsers}
            roles={data.roles}
            userRoles={data.userRoles}
            principalAdminUserId={principalAdminUserId}
            currentUserId={currentUserId}
            busyUserId={userBusyId}
            confirmDeleteUserId={confirmDeleteUserId}
            userActionError={userActionError}
            onToggleActive={handleToggleUserActive}
            onRevokePrivileges={handleRevokePrivileges}
            onRequestDelete={(userId) => {
              setConfirmDeleteUserId(userId);
              setUserActionError(undefined);
            }}
            onCancelDelete={() => setConfirmDeleteUserId(null)}
            onConfirmDelete={handleConfirmDeleteUser}
            assignablePermissions={data.assignablePermissions}
            userPermissionNames={userPermissionNames}
            onPermissionsSaved={(userId, permissionNames) => {
              setUserPermissionNames((current) => ({
                ...current,
                [userId]: permissionNames,
              }));
            }}
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-heading-sm text-foreground">Invitaciones</h2>
              <p className="text-body-sm text-muted">
                Autorización temporal para acceso de trabajadores. No se muestran
                códigos ni secretos almacenados.
              </p>
            </div>
            {!showInviteForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(true);
                  setCreateError(undefined);
                }}
                disabled={createPending || listPending}
                className={buttonPrimaryClassName}
              >
                Invitar trabajador
              </button>
            ) : null}
          </div>

          {showInviteForm ? (
            <InviteWorkerPanel
              roles={data.roles}
              assignablePermissions={data.assignablePermissions}
              pending={createPending}
              serverError={createError}
              onCancel={() => {
                setShowInviteForm(false);
                setCreateError(undefined);
              }}
              onSubmit={handleCreateInvitation}
            />
          ) : null}

          {listPending ? (
            <p className="text-body-sm text-muted" role="status">
              Actualizando invitaciones…
            </p>
          ) : null}

          {listError ? (
            <p className="text-body-sm text-foreground" role="alert">
              {listError}
            </p>
          ) : null}

          <WorkerInvitationsSection
            invitations={invitations}
            roles={data.roles}
            revokingId={revokingId}
            confirmRevokeId={confirmRevokeId}
            resendingId={resendingId}
            onRequestRevoke={(id) => {
              setConfirmRevokeId(id);
              setRevokeError(undefined);
            }}
            onCancelRevoke={() => setConfirmRevokeId(null)}
            onConfirmRevoke={handleConfirmRevoke}
            onResend={handleResendInvitation}
            errorMessage={revokeError}
          />
        </section>
      </div>
    </AdminPage>
  );
}
