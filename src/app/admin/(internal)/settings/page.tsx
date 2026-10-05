import { getPrincipalAdminEmail } from "@/backend/config/auth-config";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { SettingsPage } from "@/features/admin/settings";
import { readGmailMailToken } from "@/backend/email/gmail-mail-token-store";

const MAIL_NOTICES: Record<string, string> = {
  connected:
    "Gmail quedó conectado. A partir de ahora el código se envía al aceptar un ingreso.",
  denied: "Cancelaste la conexión de Gmail.",
  failed:
    "No se pudo conectar Gmail. Revisa la URI de redirección en Google Cloud.",
  unavailable: "Google OAuth no está configurado en este entorno.",
  no_refresh:
    "Google no entregó permiso persistente. En la cuenta de Google, quita el acceso a ALTANA y vuelve a conectar.",
};

export default async function SettingsRoute({
  searchParams,
}: {
  searchParams: Promise<{ mail?: string | string[] }>;
}) {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.history,
    },
    deniedDescription: "No tienes permiso para acceder a la configuración.",
  });
  if (!access.allowed) {
    return access.element;
  }

  const params = await searchParams;
  const rawMail = Array.isArray(params.mail) ? params.mail[0] : params.mail;
  const stored = readGmailMailToken();
  const mailExpectedEmail = getPrincipalAdminEmail();
  const notice =
    rawMail === "wrong_account"
      ? `Debes conectar la cuenta ${mailExpectedEmail}, no otra.`
      : rawMail
        ? MAIL_NOTICES[rawMail]
        : undefined;

  return (
    <SettingsPage
      isPrincipalAdmin={Boolean(access.context.access.isPrincipalAdmin)}
      mailConnected={Boolean(stored?.refreshToken)}
      mailEmail={stored?.email}
      mailExpectedEmail={mailExpectedEmail}
      mailNotice={notice}
    />
  );
}
