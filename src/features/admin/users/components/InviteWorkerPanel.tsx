"use client";

import { FormEvent, useState } from "react";

import type { Role } from "@/types/role";

import { AdminCard } from "../../AdminCard";
import type { AssignablePermission } from "../users.types";
import {
  getWorkerRoleId,
  isReasonableEmail,
  mapInvitationApiError,
  normalizeFormEmail,
} from "../users.logic";

type InviteWorkerPanelProps = {
  roles: Role[];
  assignablePermissions: AssignablePermission[];
  pending: boolean;
  onSubmit: (input: {
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    permissionNames: string[];
  }) => void;
  onCancel: () => void;
  serverError?: string;
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const buttonPrimaryClassName =
  "inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-label text-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const buttonSecondaryClassName =
  "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function InviteWorkerPanel({
  roles,
  assignablePermissions,
  pending,
  onSubmit,
  onCancel,
  serverError,
}: InviteWorkerPanelProps) {
  const workerRoleId = getWorkerRoleId(roles);
  const workerRoleLabel =
    roles.find((role) => role.id === workerRoleId)?.label ?? "Trabajador";

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [permissionNames, setPermissionNames] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState("");

  function togglePermission(name: string) {
    setPermissionNames((current) =>
      current.includes(name)
        ? current.filter((value) => value !== name)
        : [...current, name],
    );
  }

  function validate(): string | null {
    const normalized = normalizeFormEmail(email);

    if (!normalized) {
      return "El correo es obligatorio.";
    }

    if (!firstName.trim()) {
      return "El nombre es obligatorio.";
    }

    if (!lastName.trim()) {
      return "El apellido es obligatorio.";
    }

    if (!isReasonableEmail(normalized)) {
      return "Introduce un correo válido.";
    }

    if (permissionNames.length === 0) {
      return "Selecciona al menos un permiso.";
    }

    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setFieldError("");
    onSubmit({
      email: normalizeFormEmail(email),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      roleId: workerRoleId,
      permissionNames,
    });
  }

  const errorMessage =
    fieldError || (serverError ? mapInvitationApiError(serverError) : "");

  return (
    <AdminCard>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
        aria-labelledby="invite-worker-title"
      >
        <div className="flex flex-col gap-2">
          <h3
            id="invite-worker-title"
            className="text-heading-sm text-foreground"
          >
            Invitar trabajador
          </h3>
          <p className="text-body-sm text-muted">
            Se enviará un código de un solo uso al correo. También puedes
            invitar cuentas de Gmail.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-body-sm text-muted">Nombre</span>
            <input
              type="text"
              name="firstName"
              autoComplete="off"
              required
              disabled={pending}
              className={fieldClassName}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-body-sm text-muted">Apellido</span>
            <input
              type="text"
              name="lastName"
              autoComplete="off"
              required
              disabled={pending}
              className={fieldClassName}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-muted">Correo</span>
          <input
            type="email"
            name="email"
            autoComplete="off"
            required
            disabled={pending}
            className={fieldClassName}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "invite-worker-error" : undefined}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-body-sm text-muted">Rol</span>
          <p className="rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground">
            {workerRoleLabel}
          </p>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-body-sm text-muted">Permisos</legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {assignablePermissions.map((permission) => (
              <li key={permission.name}>
                <label className="flex items-start gap-2 text-body-sm text-foreground">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={permissionNames.includes(permission.name)}
                    disabled={pending}
                    onChange={() => togglePermission(permission.name)}
                  />
                  <span>{permission.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        {errorMessage ? (
          <p
            id="invite-worker-error"
            className="text-body-sm text-foreground"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={buttonSecondaryClassName}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className={buttonPrimaryClassName}
          >
            {pending ? "Creando invitación…" : "Crear invitación"}
          </button>
        </div>
      </form>
    </AdminCard>
  );
}
