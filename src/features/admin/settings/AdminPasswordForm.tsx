"use client";

import { FormEvent, useState } from "react";

import { changeAdminPassword } from "./profile-password-api.client";

const errorMessages: Record<string, string> = {
  invalid_current_password: "La contraseña actual no es correcta.",
  password_too_short: "La nueva contraseña debe tener al menos 8 caracteres.",
  password_unchanged: "La nueva contraseña debe ser distinta a la actual.",
  password_mismatch: "La confirmación no coincide.",
  password_not_configured: "No hay contraseña configurada para esta cuenta.",
  unauthorized: "Solo el administrador principal puede cambiar esta contraseña.",
};

export function AdminPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);

    const result = await changeAdminPassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setPending(false);

    if (!result.ok) {
      setError(errorMessages[result.error] ?? "No se pudo actualizar la contraseña.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(
      "Contraseña actualizada. Las demás sesiones activas fueron cerradas.",
    );
  }

  return (
    <form className="flex max-w-md flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Contraseña actual</span>
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Nueva contraseña</span>
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Confirmar nueva contraseña</span>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>

      {error ? (
        <p className="text-body-sm text-foreground" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="text-body-sm text-secondary" role="status">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-fit items-center justify-center rounded-md bg-accent px-6 py-3 text-label text-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
