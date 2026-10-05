"use client";

import { useState } from "react";

import type { AvailabilityRule, AvailabilityScope } from "@/domain";

type AdminAvailabilityScopeView = {
  scope: AvailabilityScope;
  title: string;
  subtitle: string;
  resourceType: "office" | "property";
  resourceId: string;
  rules: AvailabilityRule[];
};

type AvailabilityAdminPageProps = {
  initialOffice: AdminAvailabilityScopeView;
  initialProperty: AdminAvailabilityScopeView;
};

type DraftRule = {
  clientKey: string;
  day: AvailabilityRule["day"];
  startTime: string;
  endTime: string;
  interval: number;
  slotCapacity: number;
  active: boolean;
};

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function toDraft(rule: AvailabilityRule, index: number): DraftRule {
  return {
    clientKey: rule.id || `rule-${index}`,
    day: rule.day,
    startTime: rule.startTime,
    endTime: rule.endTime,
    interval: rule.interval,
    slotCapacity: rule.slotCapacity,
    active: rule.active,
  };
}

function ScopePanel({
  view,
  onSaved,
}: {
  view: AdminAvailabilityScopeView;
  onSaved: (next: AdminAvailabilityScopeView) => void;
}) {
  const [rules, setRules] = useState<DraftRule[]>(() =>
    view.rules.length > 0
      ? view.rules.map(toDraft)
      : [
          {
            clientKey: "new-0",
            day: 1,
            startTime: "09:00",
            endTime: "12:00",
            interval: 30,
            slotCapacity: 1,
            active: true,
          },
        ],
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setPending(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/admin/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: view.scope,
        rules: rules.map(({ clientKey, ...rule }) => {
          void clientKey;
          return rule;
        }),
      }),
    });

    setPending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(
        payload?.error === "invalid_rules"
          ? "Revisa los horarios: horas o intervalos no válidos."
          : "No se pudo guardar.",
      );
      return;
    }

    const payload = (await response.json()) as {
      availability: AdminAvailabilityScopeView;
    };
    onSaved(payload.availability);
    setRules(
      payload.availability.rules.length > 0
        ? payload.availability.rules.map(toDraft)
        : rules,
    );
    setMessage("Horarios guardados.");
  }

  function updateRule(index: number, patch: Partial<DraftRule>) {
    setRules((current) =>
      current.map((rule, currentIndex) =>
        currentIndex === index ? { ...rule, ...patch } : rule,
      ),
    );
  }

  function addRule() {
    setRules((current) => [
      ...current,
      {
        clientKey: `new-${Date.now()}`,
        day: 1,
        startTime: "14:00",
        endTime: "17:00",
        interval: 30,
        slotCapacity: 1,
        active: true,
      },
    ]);
  }

  function removeRule(index: number) {
    setRules((current) => current.filter((_, i) => i !== index));
  }

  return (
    <section className="admin-card flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-border/60 pb-4">
        <h2 className="text-heading-sm text-foreground">{view.title}</h2>
        <p className="text-body-sm text-muted">{view.subtitle}</p>
      </header>

      <ul className="flex flex-col gap-4">
        {rules.map((rule, index) => (
          <li
            key={rule.clientKey}
            className="grid gap-3 rounded-lg border border-border/60 p-4 md:grid-cols-2 lg:grid-cols-6"
          >
            <label className="flex flex-col gap-1 lg:col-span-2">
              <span className="field-label">Día</span>
              <select
                className="admin-input"
                value={rule.day}
                onChange={(event) =>
                  updateRule(index, {
                    day: Number(event.target.value) as DraftRule["day"],
                  })
                }
              >
                {dayLabels.map((label, day) => (
                  <option key={label} value={day}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="field-label">Inicio</span>
              <input
                type="time"
                className="admin-input"
                value={rule.startTime}
                onChange={(event) =>
                  updateRule(index, { startTime: event.target.value })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="field-label">Fin</span>
              <input
                type="time"
                className="admin-input"
                value={rule.endTime}
                onChange={(event) =>
                  updateRule(index, { endTime: event.target.value })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="field-label">Intervalo (min)</span>
              <input
                type="number"
                min={5}
                step={5}
                className="admin-input"
                value={rule.interval}
                onChange={(event) =>
                  updateRule(index, { interval: Number(event.target.value) })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="field-label">Activo</span>
              <select
                className="admin-input"
                value={rule.active ? "yes" : "no"}
                onChange={(event) =>
                  updateRule(index, { active: event.target.value === "yes" })
                }
              >
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
            <div className="flex items-end lg:col-span-6">
              <button
                type="button"
                className="btn-ghost text-body-sm"
                onClick={() => removeRule(index)}
              >
                Eliminar franja
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-secondary" onClick={addRule}>
          Agregar franja
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={pending}
          onClick={() => void handleSave()}
        >
          {pending ? "Guardando…" : "Guardar horarios"}
        </button>
      </div>

      {message ? (
        <p className="text-body-sm text-muted" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-body-sm text-foreground" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function AvailabilityAdminPage({
  initialOffice,
  initialProperty,
}: AvailabilityAdminPageProps) {
  const [office, setOffice] = useState(initialOffice);
  const [property, setProperty] = useState(initialProperty);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="section-eyebrow">Administración</p>
        <h1 className="font-display text-heading-lg text-foreground">
          Horarios
        </h1>
        <p className="max-w-2xl text-body-md text-muted">
          La visita a oficina y la visita a inmueble usan reglas independientes.
          Los cambios se reflejan de inmediato en el flujo público de citas.
        </p>
      </header>

      <ScopePanel view={office} onSaved={setOffice} />
      <ScopePanel view={property} onSaved={setProperty} />
    </div>
  );
}
