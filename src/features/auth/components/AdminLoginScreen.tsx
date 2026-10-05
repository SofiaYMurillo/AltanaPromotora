"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { normalizeEmail } from "@/features/auth/access";

type AuthMethod = "password" | "invitation_code";

type ChallengeResponse =
  | { method: AuthMethod; email: string }
  | { method: "unsupported"; email: string; reason: string };

type AdminLoginScreenProps = {
  googleEnabled: boolean;
  initialError?: string;
  initialRequestSent?: boolean;
};

const REQUEST_SENT_MESSAGE =
  "Tu solicitud ha sido enviada. En breve un administrador la revisará y te responderemos al correo con un código de un solo uso.";

export function AdminLoginScreen({
  googleEnabled,
  initialError = "",
  initialRequestSent = false,
}: AdminLoginScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<
    "credentials" | "invitation" | "request"
  >("credentials");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [requestSent, setRequestSent] = useState(initialRequestSent);
  const [pending, setPending] = useState(false);
  const [showCodeRecovery, setShowCodeRecovery] = useState(false);

  const subtitle = useMemo(() => {
    if (requestSent) {
      return "Gracias por escribirnos. Quedamos atentos a tu solicitud.";
    }
    if (mode === "invitation") {
      return "Si ya te aceptaron, escribe el correo y el código de un solo uso.";
    }
    if (mode === "request") {
      return "Cualquier correo puede pedir acceso. Te avisaremos cuando lo aceptemos.";
    }
    return "Cualquier correo puede ingresar. Si aún no estás autorizado, enviaremos tu solicitud.";
  }, [mode, requestSent]);

  function showRequestSent() {
    setError("");
    setRequestSent(true);
  }

  async function confirmSession() {
    const sessionResponse = await fetch("/api/auth/session", {
      credentials: "include",
    });
    const session = (await sessionResponse.json().catch(() => null)) as {
      authenticated?: boolean;
    } | null;

    if (!session?.authenticated) {
      setError(
        "La sesión no se guardó en el navegador. Entra por http://localhost:3000 o revisa COOKIE_SECURE/APP_URL.",
      );
      return false;
    }

    router.replace("/admin");
    router.refresh();
    return true;
  }

  async function onCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password: password.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        requestSent?: boolean;
        needsPassword?: boolean;
        needsCode?: boolean;
        error?: string;
        retryAfterSeconds?: number;
      } | null;

      if (response.status === 202 || payload?.requestSent) {
        showRequestSent();
        return;
      }

      if (payload?.needsPassword) {
        setError("Esta cuenta usa contraseña. Escríbela para entrar.");
        return;
      }

      if (payload?.needsCode) {
        setMode("invitation");
        setError("Esta cuenta entra con el código que te enviamos al correo.");
        return;
      }

      if (!response.ok) {
        if (payload?.error === "already_member") {
          setError("Esta cuenta ya tiene acceso. Entra con Google o con tu código.");
          return;
        }
        setError(mapLoginError(payload, "password"));
        return;
      }

      await confirmSession();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setPending(false);
    }
  }

  async function onInvitationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);

    try {
      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const challenge = (await challengeResponse.json().catch(() => null)) as
        | ChallengeResponse
        | null;

      if (
        !challengeResponse.ok ||
        !challenge ||
        challenge.method === "unsupported"
      ) {
        const requestResponse = await fetch("/api/auth/access-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        });
        if (requestResponse.ok || requestResponse.status === 202) {
          showRequestSent();
          return;
        }
        setError("No se pudo enviar la solicitud. Revisa el correo.");
        return;
      }

      if (challenge.method === "password") {
        setMode("credentials");
        setError("Este correo inicia sesión con contraseña o Google.");
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, code }),
      });

      if (!response.ok) {
        setError(mapLoginError(await readError(response), "invitation_code"));
        return;
      }

      await confirmSession();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setPending(false);
    }
  }

  async function onRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setRequestSent(false);
    setPending(true);

    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);

    try {
      const response = await fetch("/api/auth/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        alreadyPending?: boolean;
        retryAfterSeconds?: number;
      } | null;

      if (!response.ok) {
        if (payload?.error === "already_member") {
          setError("Ese correo ya tiene acceso. Inicia sesión o usa tu código.");
          return;
        }
        if (payload?.error === "rate_limited") {
          showRequestSent();
          return;
        }
        setError("No se pudo enviar la solicitud. Revisa el correo.");
        return;
      }

      showRequestSent();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-visual" aria-hidden="true">
        <Image
          src="/images/Escalera1.jpg"
          alt=""
          fill
          priority
          className="admin-login-visual-image object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="admin-login-visual-overlay" />
        <div className="admin-login-orb admin-login-orb-a" />
        <div className="admin-login-orb admin-login-orb-b" />
        <div className="admin-login-grain" />
        <div className="admin-login-visual-copy">
          <p className="admin-login-kicker">ALTANA PROMOTORA</p>
          <h1 className="font-heading text-display-lg text-background">
            Acceso interno
          </h1>
          <p className="max-w-md text-body-md text-background/80">
            Panel de gestión para el equipo autorizado. Identidad, roles y
            permisos los define ALTANA; Google solo confirma el correo.
          </p>
        </div>
      </section>

      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-card admin-login-card-glow">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="admin-login-mark" aria-hidden="true" />
            <p className="mt-5 text-caption uppercase tracking-[0.18em] text-secondary">
              Acceso seguro
            </p>
            <h2
              id="admin-login-title"
              className="mt-2 font-heading text-heading-lg text-foreground"
            >
              {requestSent ? "Solicitud enviada" : "Inicia sesión"}
            </h2>
            <p className="mt-2 max-w-sm text-body-sm text-secondary">
              {subtitle}
            </p>
          </div>

          {requestSent ? (
            <div className="admin-login-waiting" role="status">
              <p className="text-body-md text-foreground">{REQUEST_SENT_MESSAGE}</p>
              <p className="mt-3 text-body-sm text-secondary">
                No hace falta volver a enviarla. Cuando se acepte, el código
                llegará a tu correo.
              </p>
            </div>
          ) : mode === "request" ? (
            <form className="flex flex-col gap-4" onSubmit={onRequestSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-body-sm text-secondary">Nombre</span>
                  <input
                    type="text"
                    name="firstName"
                    className="admin-input"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-body-sm text-secondary">Apellido</span>
                  <input
                    type="text"
                    name="lastName"
                    className="admin-input"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </label>
              </div>
              <EmailField email={email} onChange={setEmail} />
              {error ? (
                <p className="text-body-sm text-bronce" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="btn-primary admin-login-submit w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Enviando solicitud…" : "Solicitar ingreso"}
              </button>
            </form>
          ) : mode === "credentials" ? (
            <form className="flex flex-col gap-4" onSubmit={onCredentialsSubmit}>
              <EmailField email={email} onChange={setEmail} />
              <PasswordField
                password={password}
                showPassword={showPassword}
                onPasswordChange={setPassword}
                onToggleVisibility={() => setShowPassword((value) => !value)}
              />

              {error ? (
                <p className="text-body-sm text-bronce" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="btn-primary admin-login-submit w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Ingresando…" : "Ingresar"}
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={onInvitationSubmit}>
              <EmailField email={email} onChange={setEmail} />
              <label className="flex flex-col gap-2">
                <span className="text-body-sm text-secondary">
                  Código de acceso
                </span>
                <input
                  type="text"
                  name="code"
                  autoComplete="one-time-code"
                  required
                  className="admin-input font-mono uppercase"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                />
              </label>

              <button
                type="button"
                className="w-fit text-body-sm text-secondary underline-offset-2 transition-colors hover:text-accent hover:underline"
                onClick={() => setShowCodeRecovery((value) => !value)}
                aria-expanded={showCodeRecovery}
              >
                ¿Olvidaste tu código?
              </button>

              {showCodeRecovery ? (
                <div className="rounded-md border border-border bg-background px-3 py-3 text-body-sm text-secondary">
                  Solicita al administrador principal que reenvíe o genere
                  nuevamente tu código desde Usuarios → Reenviar.
                </div>
              ) : null}

              {error ? (
                <p className="text-body-sm text-bronce" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="btn-primary admin-login-submit w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Ingresando…" : "Ingresar con código"}
              </button>
            </form>
          )}

          {googleEnabled && !requestSent ? (
            <>
              <div className="admin-login-divider" role="separator">
                <span>o</span>
              </div>
              <a href="/api/auth/google" className="admin-login-google">
                <GoogleMark />
                Continuar con Google
              </a>
              <p className="mt-3 text-center text-caption text-secondary">
                Si aún no te han aceptado, tu solicitud quedará en revisión.
              </p>
            </>
          ) : null}

          <div className="mt-6 flex flex-col items-center gap-3">
            {!requestSent ? (
            <button
              type="button"
              className="text-center text-body-sm text-secondary underline-offset-2 transition-colors hover:text-accent hover:underline"
              onClick={() => {
                setError("");
                setRequestSent(false);
                setShowCodeRecovery(false);
                setMode((current) =>
                  current === "credentials" ? "invitation" : "credentials",
                );
              }}
            >
              {mode === "invitation"
                ? "Volver a correo y contraseña"
                : "Ingresar con código de invitación"}
            </button>
            ) : null}
            <button
              type="button"
              className="text-center text-body-sm text-secondary underline-offset-2 transition-colors hover:text-accent hover:underline"
              onClick={() => {
                setError("");
                setShowCodeRecovery(false);
                if (requestSent) {
                  setRequestSent(false);
                  setMode("credentials");
                  return;
                }
                setMode((current) =>
                  current === "request" ? "credentials" : "request",
                );
              }}
            >
              {requestSent || mode === "request"
                ? "Volver al ingreso"
                : "¿Eres nuevo? Solicita ingreso"}
            </button>
          </div>

          <ul className="admin-login-trust">
            <li>Equipo autorizado</li>
            <li>Sesión cifrada</li>
            <li>Roles y permisos</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function EmailField({
  email,
  onChange,
}: {
  email: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm text-secondary">Usuario o correo</span>
      <input
        type="email"
        name="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        placeholder="nombre@correo.com"
        className="admin-input"
        value={email}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onChange(email.trim())}
      />
    </label>
  );
}

function PasswordField({
  password,
  showPassword,
  onPasswordChange,
  onToggleVisibility,
}: {
  password: string;
  showPassword: boolean;
  onPasswordChange: (value: string) => void;
  onToggleVisibility: () => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm text-secondary">Contraseña</span>
      <div className="admin-login-password">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          className="admin-input pr-12"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
        />
        <button
          type="button"
          className="admin-login-password-toggle"
          onClick={onToggleVisibility}
          aria-pressed={showPassword}
          aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2M9.9 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.3M6.1 6.1A17.5 17.5 0 0 0 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

async function readError(response: Response) {
  return (await response.json().catch(() => null)) as {
    error?: string;
    retryAfterSeconds?: number;
  } | null;
}

function mapLoginError(
  payload: { error?: string; retryAfterSeconds?: number } | null,
  method: AuthMethod,
) {
  if (payload?.error === "rate_limited") {
    return `Demasiados intentos. Espera ${payload.retryAfterSeconds ?? 300} segundos.`;
  }
  if (payload?.error === "inactive") {
    return "La cuenta no está activa.";
  }
  if (payload?.error === "unauthorized") {
    return "No tienes autorización para el panel administrativo.";
  }
  if (payload?.error === "expired") {
    return "La invitación ha expirado.";
  }
  if (payload?.error === "revoked") {
    return "La invitación fue revocada.";
  }
  if (method === "invitation_code") {
    return "Código de acceso inválido.";
  }
  return "Credenciales inválidas.";
}
