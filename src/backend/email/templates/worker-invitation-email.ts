export type WorkerInvitationEmailInput = {
  recipientEmail: string;
  invitationCode: string;
  expiresAt: Date;
  loginUrl: string | null;
};

function formatExpiry(expiresAt: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(expiresAt);
}

export function buildWorkerInvitationEmail(input: WorkerInvitationEmailInput) {
  const expiryLabel = formatExpiry(input.expiresAt);
  const subject = "Tu código de un solo uso — ALTANA PROMOTORA";
  const loginInstruction = input.loginUrl
    ? `Ingresa a ${input.loginUrl}, escribe tu correo y el código de acceso.`
    : "Ingresa al acceso interno de ALTANA PROMOTORA, escribe tu correo y el código de acceso.";

  const text = [
    "ALTANA PROMOTORA",
    "",
    "Tu ingreso fue aceptado. Usa este código de un solo uso para entrar al panel.",
    "",
    `Código de un solo uso: ${input.invitationCode}`,
    `Válido hasta: ${expiryLabel}`,
    "",
    loginInstruction,
    "",
    "Si no esperabas este mensaje, ignóralo. Nunca compartas este código.",
  ].join("\n");

  const loginBlock = input.loginUrl
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3B4754;">Accede aquí: <a href="${input.loginUrl}" style="color:#6B5A3E;">${input.loginUrl}</a></p>`
    : `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3B4754;">Entra al acceso interno de ALTANA PROMOTORA e introduce tu correo y el código.</p>`;

  const html = `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#F2F2F2;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F2F2F2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #B7BDC5;border-radius:6px;">
            <tr>
              <td style="background-color:#1A1D22;padding:24px 32px;">
                <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#C9AD7A;">ALTANA PROMOTORA</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#1A1D22;">Tu código de un solo uso</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3B4754;font-family:Arial,Helvetica,sans-serif;">
                  Tu ingreso fue aceptado. Usa este código para acceder al panel interno de ALTANA PROMOTORA.
                </p>
                <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6B5A3E;font-family:Arial,Helvetica,sans-serif;">Código de un solo uso</p>
                <p style="margin:0 0 20px;font-size:28px;letter-spacing:0.18em;color:#1A1D22;">${input.invitationCode}</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3B4754;font-family:Arial,Helvetica,sans-serif;">
                  Este código es válido hasta ${expiryLabel}.
                </p>
                ${loginBlock}
                <p style="margin:0;font-size:13px;line-height:1.6;color:#3B4754;font-family:Arial,Helvetica,sans-serif;">
                  Si no esperabas esta invitación, ignora este mensaje. No compartas el código.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
