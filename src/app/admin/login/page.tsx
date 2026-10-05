import type { Metadata } from "next";

import { AdminLoginScreen } from "@/features/auth/components/AdminLoginScreen";

export const metadata: Metadata = {
  title: "Acceso interno | ALTANA PROMOTORA",
};

export const dynamic = "force-dynamic";

const GOOGLE_LOGIN_ERRORS: Record<string, string> = {
  google_unavailable:
    "Google no está configurado en este entorno. Usa correo y contraseña.",
  google_denied: "Cancelaste el inicio de sesión con Google.",
  google_failed: "No se pudo completar el inicio con Google. Inténtalo de nuevo.",
  google_not_allowed:
    "Esa cuenta de Google no está autorizada para el panel interno.",
  google_inactive: "La cuenta no está activa.",
  google_rate_limited: "Demasiados intentos. Espera unos minutos.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; status?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const requestSent =
    rawStatus === "request_sent" || rawError === "google_request_sent";

  return (
    <AdminLoginScreen
      googleEnabled
      initialRequestSent={requestSent}
      initialError={
        requestSent ? "" : rawError ? GOOGLE_LOGIN_ERRORS[rawError] ?? "" : ""
      }
    />
  );
}
