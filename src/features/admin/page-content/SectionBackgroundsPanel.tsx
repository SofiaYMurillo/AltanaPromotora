"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminCard } from "@/features/admin";

import {
  SectionBackgroundEditor,
  type SectionBackgroundEditorRow,
} from "./SectionBackgroundEditor";

const HEADER_SECTION_IDS = new Set([
  "home.hero",
  "about.hero",
  "projects.header",
  "contact.hero",
]);

type SectionBackgroundsPanelProps = {
  variant: "headers" | "sections";
  title: string;
  description: string;
};

export function SectionBackgroundsPanel({
  variant,
  title,
  description,
}: SectionBackgroundsPanelProps) {
  const [rows, setRows] = useState<SectionBackgroundEditorRow[]>([]);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/section-backgrounds", {
      cache: "no-store",
    });
    if (!response.ok) return;
    const data = (await response.json()) as {
      backgrounds: SectionBackgroundEditorRow[];
    };
    setRows(data.backgrounds);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial CMS load
    void load();
  }, [load]);

  const filtered = rows.filter((row) =>
    variant === "headers"
      ? HEADER_SECTION_IDS.has(row.definition.id)
      : !HEADER_SECTION_IDS.has(row.definition.id),
  );

  return (
    <AdminCard>
      <div className="flex flex-col gap-2">
        <h2 className="text-heading-sm text-foreground">{title}</h2>
        <p className="text-body-sm text-muted">{description}</p>
      </div>
      <div className="mt-6 flex flex-col gap-6">
        {filtered.map((row) => (
          <SectionBackgroundEditor
            key={row.definition.id}
            row={row}
            onSaved={() => {
              setStatus("Fondo actualizado.");
              void load();
            }}
          />
        ))}
        {filtered.length === 0 ? (
          <p className="text-body-sm text-muted">No hay secciones en este grupo.</p>
        ) : null}
      </div>
      {status ? (
        <p className="mt-4 text-body-sm text-secondary" role="status">
          {status}
        </p>
      ) : null}
    </AdminCard>
  );
}
