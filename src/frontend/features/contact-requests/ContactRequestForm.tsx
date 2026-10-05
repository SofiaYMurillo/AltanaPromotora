"use client";

import { useId, useState } from "react";

import { createPublicContactRequestRequest } from "./contact-requests-api.client";
import {
  getPublicContactRequestFormError,
  mapContactRequestError,
} from "./contact-requests.logic";

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const buttonClassName =
  "inline-flex w-fit items-center justify-center rounded-md bg-accent px-6 py-3 text-label uppercase tracking-[0.14em] text-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactRequestForm() {
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const messageId = useId();
  const contactHintId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    if (status === "submitting") {
      return;
    }

    const draft = {
      name,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      message,
    };
    const localError = getPublicContactRequestFormError(draft);
    if (localError) {
      setStatus("error");
      setErrorMessage(localError);
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const result = await createPublicContactRequestRequest(draft);

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(mapContactRequestError(result.error));
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setStatus("success");
  }

  return (
    <form
      className="flex w-full max-w-none flex-col gap-5 lg:max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <label className="flex flex-col gap-2" htmlFor={nameId}>
        <span className="text-body-sm text-muted">Nombre</span>
        <input
          id={nameId}
          className={fieldClassName}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          disabled={status === "submitting"}
        />
      </label>

      <label className="flex flex-col gap-2" htmlFor={emailId}>
        <span className="text-body-sm text-muted">Correo</span>
        <input
          id={emailId}
          type="email"
          className={fieldClassName}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          disabled={status === "submitting"}
          aria-describedby={contactHintId}
          aria-invalid={status === "error"}
        />
      </label>

      <label className="flex flex-col gap-2" htmlFor={phoneId}>
        <span className="text-body-sm text-muted">Teléfono</span>
        <input
          id={phoneId}
          type="tel"
          className={fieldClassName}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          disabled={status === "submitting"}
          aria-describedby={contactHintId}
          aria-invalid={status === "error"}
        />
      </label>

      <label className="flex flex-col gap-2" htmlFor={messageId}>
        <span className="text-body-sm text-muted">Mensaje</span>
        <textarea
          id={messageId}
          className={fieldClassName}
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          disabled={status === "submitting"}
        />
      </label>

      <p id={contactHintId} className="text-body-sm text-muted">
        Indica al menos un correo o un teléfono para que podamos responderte.
      </p>

      {status === "error" ? (
        <p className="text-body-sm text-foreground" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {status === "success" ? (
        <p className="text-body-sm text-muted" role="status">
          Recibimos tu mensaje. Te contactaremos pronto.
        </p>
      ) : null}

      <button
        type="submit"
        className={buttonClassName}
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
