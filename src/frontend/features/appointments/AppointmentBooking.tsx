"use client";

import { useEffect, useId, useMemo, useState } from "react";

import type {
  AppointmentCommunicationPreference,
  AppointmentVisitType,
  AvailabilityDaySlots,
  AvailabilitySlot,
  OfficeLocation,
} from "@/domain";
import { resolveAvailabilityQuery } from "@/domain/availability-resources";
import { propertyBookingHash } from "@/frontend/config/site";

import {
  createPublicAppointmentRequest,
  getPublicAvailabilityRequest,
  isSlotNoLongerAvailable,
  mapBookingApiError,
  type PublicAppointmentConfirmation,
} from "./appointments-api.client";

type AppointmentBookingProps = {
  propertyId?: string;
  propertyTitle?: string;
  propertyCity?: string;
  offices: OfficeLocation[];
  presentation?: "collapsible" | "embedded";
  allowedVisitTypes?: AppointmentVisitType[];
  defaultVisitType?: AppointmentVisitType;
  onDismiss?: () => void;
  sectionId?: string;
  formTitle?: string;
  formLead?: string;
};

type BookingStep = "form" | "confirmation";

type ConfirmedPlace = {
  title: string;
  details: string[];
};

type AvailabilityLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; days: AvailabilityDaySlots[] };

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const primaryButtonClassName =
  "inline-flex w-fit items-center justify-center rounded-md bg-accent px-6 py-3 text-label text-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

const visitTypeLabels = {
  property: "Visita a inmueble",
  office: "Visita a sede",
} as const;

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

function formatTimeLabel(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function officeOptionLabel(office: OfficeLocation) {
  return `${office.name} — ${office.city}`;
}

function buildConfirmedPlace(
  visitType: AppointmentVisitType,
  propertyTitle: string,
  propertyCity: string,
  office?: OfficeLocation,
): ConfirmedPlace {
  if (visitType === "property") {
    return {
      title: propertyTitle,
      details: [propertyCity],
    };
  }

  if (!office) {
    return {
      title: "Sede",
      details: [],
    };
  }

  return {
    title: office.name,
    details: [office.city, office.address],
  };
}

function datesWithAvailability(days: AvailabilityDaySlots[]) {
  return days
    .filter((day) => day.slots.some((slot) => slot.available))
    .map((day) => day.date);
}

function slotsForDate(days: AvailabilityDaySlots[], date: string) {
  return days.find((day) => day.date === date)?.slots ?? [];
}

function slotOptionLabel(slot: AvailabilitySlot) {
  const time = formatTimeLabel(slot.startTime);
  if (!slot.available) {
    return `${time} — no disponible`;
  }

  if (slot.remainingCapacity > 1) {
    return `${time} · ${slot.remainingCapacity} cupos`;
  }

  return time;
}

export function AppointmentBooking({
  propertyId = "",
  propertyTitle = "",
  propertyCity = "",
  offices,
  presentation = "collapsible",
  allowedVisitTypes,
  defaultVisitType,
  onDismiss,
  sectionId = "agendar-visita",
  formTitle = "Agendar visita",
  formLead = "Elige el lugar, una fecha disponible y una hora libre.",
}: AppointmentBookingProps) {
  const formId = useId();
  const resolvedAllowedVisitTypes =
    allowedVisitTypes ??
    (propertyId ? (["property", "office"] as const) : (["office"] as const));
  const initialVisitType =
    defaultVisitType ??
    (resolvedAllowedVisitTypes.includes("property") && propertyId
      ? "property"
      : "office");

  const [isOpen, setIsOpen] = useState(presentation === "embedded");
  const [step, setStep] = useState<BookingStep>("form");
  const [visitType, setVisitType] =
    useState<AppointmentVisitType>(initialVisitType);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [communication, setCommunication] =
    useState<AppointmentCommunicationPreference>("none");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<PublicAppointmentConfirmation | null>(null);
  const [confirmedPlace, setConfirmedPlace] = useState<ConfirmedPlace | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityLoadState>({ status: "idle" });
  const [availabilityFetchSignature, setAvailabilityFetchSignature] = useState<
    string | null
  >(null);
  const [availabilityReloadKey, setAvailabilityReloadKey] = useState(0);

  const activeOffices = useMemo(
    () => offices.filter((office) => office.active),
    [offices],
  );

  const singleOffice =
    activeOffices.length === 1 ? activeOffices[0] : undefined;

  const resolvedOfficeId =
    visitType === "office" && singleOffice
      ? singleOffice.id
      : selectedOfficeId;

  const availabilityResource = resolveAvailabilityQuery({
    visitType,
    propertyId,
    officeLocationId: resolvedOfficeId,
  });

  const resourceId =
    availabilityResource.ok ? availabilityResource.resourceId : "";

  const visitPropertyId =
    availabilityResource.ok ? availabilityResource.visitPropertyId : undefined;

  const availabilityResourceType = availabilityResource.ok
    ? availabilityResource.resourceType
    : visitType;

  const canSelectSchedule =
    visitType === "property" || Boolean(resolvedOfficeId);

  const availableDates = useMemo(
    () =>
      availabilityState.status === "ready"
        ? datesWithAvailability(availabilityState.days)
        : [],
    [availabilityState],
  );

  const daySlots = useMemo(
    () =>
      availabilityState.status === "ready" && selectedDate
        ? slotsForDate(availabilityState.days, selectedDate)
        : [],
    [availabilityState, selectedDate],
  );

  if (selectedDate && !availableDates.includes(selectedDate)) {
    setSelectedDate("");
    setSelectedTime("");
  } else {
    const selectedSlot = daySlots.find(
      (slot) => slot.startTime === selectedTime,
    );
    if (selectedTime && (!selectedSlot || !selectedSlot.available)) {
      setSelectedTime("");
    }
  }

  const hasAvailability =
    canSelectSchedule &&
    availabilityState.status === "ready" &&
    availableDates.length > 0;

  const schedulePanelOpen = presentation === "embedded" || isOpen;

  const shouldLoadAvailability =
    schedulePanelOpen && canSelectSchedule && Boolean(resourceId);

  const nextAvailabilityFetchSignature = shouldLoadAvailability
    ? `${resourceId}:${availabilityResourceType}:${visitPropertyId ?? ""}:${availabilityReloadKey}`
    : null;

  if (nextAvailabilityFetchSignature !== availabilityFetchSignature) {
    setAvailabilityFetchSignature(nextAvailabilityFetchSignature);
    if (!nextAvailabilityFetchSignature) {
      setAvailabilityState({ status: "idle" });
    } else {
      setAvailabilityState({ status: "loading" });
    }
  }

  useEffect(() => {
    if (!nextAvailabilityFetchSignature) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void getPublicAvailabilityRequest({
      resourceType: availabilityResourceType,
      resourceId,
      visitPropertyId,
      signal: controller.signal,
    })
      .then((result) => {
        if (cancelled || controller.signal.aborted) {
          return;
        }

        if (!result.ok) {
          setAvailabilityState({
            status: "error",
            message: mapBookingApiError(result.error),
          });
          return;
        }

        setAvailabilityState({
          status: "ready",
          days: result.availability.days,
        });
      })
      .catch(() => {
        if (cancelled || controller.signal.aborted) {
          return;
        }

        setAvailabilityState({
          status: "error",
          message: mapBookingApiError("request_failed"),
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    nextAvailabilityFetchSignature,
    availabilityResourceType,
    resourceId,
    visitPropertyId,
  ]);

  function resetForm() {
    setStep("form");
    setVisitType(initialVisitType);
    setSelectedOfficeId("");
    setSelectedDate("");
    setSelectedTime("");
    setCommunication("none");
    setPhone("");
    setEmail("");
    setErrorMessage("");
    setConfirmedAppointment(null);
    setConfirmedPlace(null);
    setAvailabilityState({ status: "idle" });
  }

  function handleOpen() {
    resetForm();
    setIsOpen(true);
  }

  useEffect(() => {
    if (presentation !== "collapsible" || !propertyId) {
      return;
    }

    function openFromBookingHash() {
      if (window.location.hash !== propertyBookingHash) {
        return;
      }

      const section = document.getElementById("agendar-visita");
      if (!section) {
        return;
      }

      section.scrollIntoView({ behavior: "smooth", block: "start" });

      const openButton = section.querySelector<HTMLButtonElement>(
        'button[type="button"]',
      );
      if (openButton?.textContent?.trim() === "Agendar visita") {
        openButton.click();
      }

      window.requestAnimationFrame(() => {
        const title = section.querySelector<HTMLElement>("h3");
        if (title) {
          title.tabIndex = -1;
          title.focus({ preventScroll: true });
        }
      });
    }

    openFromBookingHash();
    window.addEventListener("hashchange", openFromBookingHash);

    return () => {
      window.removeEventListener("hashchange", openFromBookingHash);
    };
  }, [presentation, propertyId]);

  function handleClose() {
    if (onDismiss) {
      onDismiss();
      resetForm();
      if (presentation === "embedded") {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
      return;
    }

    setIsOpen(false);
    resetForm();
  }

  function handleVisitTypeChange(nextType: AppointmentVisitType) {
    setVisitType(nextType);
    setSelectedOfficeId("");
    setSelectedDate("");
    setSelectedTime("");
    setErrorMessage("");
  }

  function handleCommunicationChange(
    nextPreference: AppointmentCommunicationPreference,
  ) {
    setCommunication(nextPreference);
    setPhone("");
    setEmail("");
    setErrorMessage("");
  }

  function reloadAvailability() {
    setAvailabilityReloadKey((current) => current + 1);
  }

  async function handleConfirm() {
    setErrorMessage("");

    if (!resourceId) {
      setErrorMessage("Selecciona una sede para continuar.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMessage("Selecciona una fecha y una hora disponibles.");
      return;
    }

    if (communication === "whatsapp" && !phone.trim()) {
      setErrorMessage("Ingresa un número de WhatsApp.");
      return;
    }

    if (communication === "email" && !email.trim()) {
      setErrorMessage("Ingresa un correo electrónico.");
      return;
    }

    const selectedOffice = activeOffices.find(
      (office) => office.id === resolvedOfficeId,
    );

    setIsSubmitting(true);
    const result = await createPublicAppointmentRequest({
      type: visitType,
      propertyId: visitType === "property" ? propertyId : undefined,
      officeLocationId: visitType === "office" ? resolvedOfficeId : undefined,
      date: selectedDate,
      time: selectedTime,
      communicationPreference: communication,
      contact:
        communication === "whatsapp"
          ? { phone: phone.trim() }
          : communication === "email"
            ? { email: email.trim() }
            : undefined,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(mapBookingApiError(result.error));
      if (isSlotNoLongerAvailable(result.error)) {
        setSelectedTime("");
        reloadAvailability();
      }
      return;
    }

    setConfirmedAppointment(result.appointment);
    setConfirmedPlace(
      buildConfirmedPlace(
        visitType,
        propertyTitle,
        propertyCity,
        selectedOffice,
      ),
    );
    setStep("confirmation");
  }

  const showVisitTypeChoice =
    resolvedAllowedVisitTypes.length > 1 &&
    resolvedAllowedVisitTypes.includes("property") &&
    resolvedAllowedVisitTypes.includes("office");

  const dismissLabel = onDismiss ? "Volver" : "Cerrar";
  const cancelLabel = onDismiss ? "Volver a elegir tipo de visita" : "Cancelar";

  return (
    <section
      id={sectionId}
      className={
        presentation === "embedded"
          ? "flex flex-col gap-4"
          : "scroll-mt-[calc(var(--layout-header-padding-y)+3rem)] flex flex-col gap-4 border-t border-border pt-6"
      }
    >
      {presentation === "collapsible" && !isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          className={primaryButtonClassName}
        >
          Agendar visita
        </button>
      ) : null}

      {schedulePanelOpen ? (
        <div
          className="flex flex-col gap-6"
          role="region"
          aria-labelledby={`${formId}-title`}
          aria-busy={availabilityState.status === "loading" || isSubmitting}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h3
                id={`${formId}-title`}
                className="text-heading-sm text-foreground"
              >
                {step === "confirmation" ? "Cita solicitada" : formTitle}
              </h3>
              {step === "form" ? (
                <p className="text-body-sm text-muted">{formLead}</p>
              ) : null}
            </div>

            {presentation === "collapsible" ? (
              <button
                type="button"
                onClick={handleClose}
                className="text-body-sm text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {dismissLabel}
              </button>
            ) : onDismiss ? (
              <button
                type="button"
                onClick={handleClose}
                className="text-body-sm text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                ← Volver a elegir tipo de visita
              </button>
            ) : null}
          </div>

          {step === "confirmation" &&
          confirmedAppointment &&
          confirmedPlace ? (
            <div className="flex flex-col gap-4">
              <dl className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <dt className="text-body-sm text-muted">Tipo de visita</dt>
                  <dd className="text-body-md text-foreground">
                    {visitTypeLabels[confirmedAppointment.type]}
                  </dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="text-body-sm text-muted">Fecha</dt>
                  <dd className="text-body-md text-foreground">
                    {formatDateLabel(confirmedAppointment.date)}
                  </dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="text-body-sm text-muted">Hora</dt>
                  <dd className="text-body-md text-foreground">
                    {formatTimeLabel(confirmedAppointment.time)}
                  </dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="text-body-sm text-muted">
                    {confirmedAppointment.type === "office" ? "Sede" : "Lugar"}
                  </dt>
                  <dd className="flex flex-col gap-1 text-body-md text-foreground">
                    <span>{confirmedPlace.title}</span>
                    {confirmedPlace.details.map((detail) => (
                      <span key={detail} className="text-muted">
                        {detail}
                      </span>
                    ))}
                  </dd>
                </div>

                {confirmedAppointment.communicationPreference !== "none" ? (
                  <div className="flex flex-col gap-1">
                    <dt className="text-body-sm text-muted">
                      Medio de comunicación
                    </dt>
                    <dd className="text-body-md text-foreground">
                      {confirmedAppointment.communicationPreference ===
                      "whatsapp"
                        ? `WhatsApp · ${confirmedAppointment.contact?.phone ?? ""}`
                        : `Correo electrónico · ${confirmedAppointment.contact?.email ?? ""}`}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <p className="text-body-sm text-muted">
                {confirmedAppointment.communicationPreference === "none"
                  ? "Guarda estos datos. No enviaremos notificaciones adicionales."
                  : "Quedamos listos para enviarte la información de tu cita cuando el canal esté disponible."}
              </p>

              <button
                type="button"
                onClick={handleClose}
                className={primaryButtonClassName}
              >
                Listo
              </button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                void handleConfirm();
              }}
            >
              {showVisitTypeChoice ? (
                <fieldset className="flex flex-col gap-3">
                  <legend className="text-body-sm text-muted">
                    ¿Qué deseas visitar?
                  </legend>

                  <label className="flex items-center gap-3 text-body-md text-foreground">
                    <input
                      type="radio"
                      name={`${formId}-visit-type`}
                      checked={visitType === "property"}
                      onChange={() => handleVisitTypeChange("property")}
                      className="accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    Visitar un inmueble · {propertyTitle}
                  </label>

                  <label className="flex items-center gap-3 text-body-md text-foreground">
                    <input
                      type="radio"
                      name={`${formId}-visit-type`}
                      checked={visitType === "office"}
                      onChange={() => handleVisitTypeChange("office")}
                      className="accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    Visitar una sede
                  </label>
                </fieldset>
              ) : null}

              {visitType === "office" && activeOffices.length > 1 ? (
                <label className="flex flex-col gap-2">
                  <span className="text-body-sm text-muted">Sede</span>
                  <select
                    className={fieldClassName}
                    value={selectedOfficeId}
                    onChange={(event) => {
                      setSelectedOfficeId(event.target.value);
                      setSelectedDate("");
                      setSelectedTime("");
                      setErrorMessage("");
                    }}
                    required
                  >
                    <option value="">Selecciona una sede</option>
                    {activeOffices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {officeOptionLabel(office)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {visitType === "office" && singleOffice ? (
                <p className="text-body-sm text-secondary">
                  Sede: {officeOptionLabel(singleOffice)}
                </p>
              ) : null}

              {canSelectSchedule && availabilityState.status === "loading" ? (
                <p className="text-body-sm text-muted" aria-live="polite">
                  Cargando horarios disponibles…
                </p>
              ) : null}

              {canSelectSchedule && availabilityState.status === "error" ? (
                <div className="flex flex-col gap-3">
                  <p className="text-body-sm text-foreground" role="alert">
                    {availabilityState.message}
                  </p>
                  <button
                    type="button"
                    onClick={reloadAvailability}
                    className={secondaryButtonClassName}
                  >
                    Reintentar
                  </button>
                </div>
              ) : null}

              {canSelectSchedule &&
              availabilityState.status === "ready" &&
              !hasAvailability ? (
                <p className="text-body-sm text-muted">
                  No hay disponibilidad para{" "}
                  {visitType === "property"
                    ? "este inmueble"
                    : "esta sede"}{" "}
                  en las próximas semanas.
                </p>
              ) : null}

              {hasAvailability ? (
                <>
                  <label className="flex flex-col gap-2">
                    <span className="text-body-sm text-muted">
                      Fecha disponible
                    </span>
                    <select
                      className={fieldClassName}
                      value={selectedDate}
                      onChange={(event) => {
                        setSelectedDate(event.target.value);
                        setSelectedTime("");
                        setErrorMessage("");
                      }}
                      required
                    >
                      <option value="">Selecciona una fecha</option>
                      {availableDates.map((date) => (
                        <option key={date} value={date}>
                          {formatDateLabel(date)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-body-sm text-muted">
                      Hora disponible
                    </span>
                    <select
                      className={fieldClassName}
                      value={selectedTime}
                      onChange={(event) => {
                        setSelectedTime(event.target.value);
                        setErrorMessage("");
                      }}
                      required
                      disabled={!selectedDate || daySlots.length === 0}
                    >
                      <option value="">
                        {selectedDate
                          ? "Selecciona una hora"
                          : "Primero elige una fecha"}
                      </option>
                      {daySlots.map((slot) => (
                        <option
                          key={slot.startTime}
                          value={slot.startTime}
                          disabled={!slot.available}
                        >
                          {slotOptionLabel(slot)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              {hasAvailability && selectedDate && selectedTime ? (
                <fieldset className="flex flex-col gap-3">
                  <legend className="text-body-sm text-muted">
                    ¿Cómo deseas recibir la información de tu cita?
                  </legend>

                  <label className="flex items-center gap-3 text-body-md text-foreground">
                    <input
                      type="radio"
                      name={`${formId}-communication`}
                      checked={communication === "whatsapp"}
                      onChange={() => handleCommunicationChange("whatsapp")}
                      className="accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    WhatsApp
                  </label>

                  <label className="flex items-center gap-3 text-body-md text-foreground">
                    <input
                      type="radio"
                      name={`${formId}-communication`}
                      checked={communication === "email"}
                      onChange={() => handleCommunicationChange("email")}
                      className="accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    Correo electrónico
                  </label>

                  <label className="flex items-center gap-3 text-body-md text-foreground">
                    <input
                      type="radio"
                      name={`${formId}-communication`}
                      checked={communication === "none"}
                      onChange={() => handleCommunicationChange("none")}
                      className="accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    No deseo recibir información
                  </label>

                  {communication === "whatsapp" ? (
                    <label className="flex flex-col gap-2">
                      <span className="text-body-sm text-muted">
                        Número de WhatsApp
                      </span>
                      <input
                        type="tel"
                        className={fieldClassName}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        autoComplete="tel"
                        required
                      />
                    </label>
                  ) : null}

                  {communication === "email" ? (
                    <label className="flex flex-col gap-2">
                      <span className="text-body-sm text-muted">
                        Correo electrónico
                      </span>
                      <input
                        type="email"
                        className={fieldClassName}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>
                  ) : null}
                </fieldset>
              ) : null}

              {errorMessage ? (
                <p className="text-body-sm text-foreground" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={
                    isSubmitting ||
                    availabilityState.status === "loading" ||
                    !hasAvailability ||
                    !selectedDate ||
                    !selectedTime
                  }
                >
                  {isSubmitting ? "Confirmando cita…" : "Confirmar cita"}
                </button>

                {presentation === "collapsible" || onDismiss ? (
                  <button
                    type="button"
                    onClick={handleClose}
                    className={secondaryButtonClassName}
                  >
                    {cancelLabel}
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </div>
      ) : null}
    </section>
  );
}
