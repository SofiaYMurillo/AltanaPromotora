"use client";

import { useState } from "react";

import { AdminCard } from "@/features/admin";
import { defaultSiteSettings } from "@/frontend/config/site-settings.data";
import type { SiteSettings } from "@/types/site-settings";

type ContactSettingsFormProps = {
  settings: SiteSettings;
};

export function ContactSettingsForm({ settings }: ContactSettingsFormProps) {
  const [email, setEmail] = useState(settings.emails[0]?.address ?? "");
  const [phone, setPhone] = useState(settings.phones[0]?.number ?? "");
  const [address, setAddress] = useState(settings.address);
  const [instagramUrl, setInstagramUrl] = useState(
    settings.socialLinks.find(
      (link) => link.platform.toLowerCase() === "instagram",
    )?.url ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const baseEmail = settings.emails[0] ?? defaultSiteSettings.emails[0];
    const basePhone = settings.phones[0] ?? defaultSiteSettings.phones[0];
    const baseInstagram =
      settings.socialLinks.find(
        (link) => link.platform.toLowerCase() === "instagram",
      ) ?? defaultSiteSettings.socialLinks[0];

    const response = await fetch("/api/admin/site-settings/contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emails: [{ ...baseEmail, address: email.trim() }],
        phones: [{ ...basePhone, number: phone.trim() }],
        address: address.trim(),
        socialLinks: [{ ...baseInstagram, url: instagramUrl.trim() }],
      }),
    });

    setSaving(false);
    if (!response.ok) {
      setStatus("No se pudo guardar la información de contacto.");
      return;
    }
    setStatus("Información de contacto guardada.");
  }

  return (
    <AdminCard>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <p className="text-body-sm text-muted">
          Estos datos alimentan la página de contacto, el pie de página y
          cualquier enlace telefónico del sitio público.
        </p>

        <label className="flex flex-col gap-2">
          <span className="field-label">Correo</span>
          <input
            className="admin-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Teléfono / WhatsApp</span>
          <input
            className="admin-input"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Dirección</span>
          <input
            className="admin-input"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Instagram (URL)</span>
          <input
            className="admin-input"
            type="url"
            value={instagramUrl}
            onChange={(event) => setInstagramUrl(event.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar contacto"}
          </button>
          {status ? (
            <p className="text-body-sm text-secondary" role="status">
              {status}
            </p>
          ) : null}
        </div>
      </form>
    </AdminCard>
  );
}
