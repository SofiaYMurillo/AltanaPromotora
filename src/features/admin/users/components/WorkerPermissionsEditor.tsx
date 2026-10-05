"use client";

import { useState } from "react";

import type { AssignablePermission } from "../users.types";
import { updateInternalUserPermissionsRequest } from "../users-api.client";

type WorkerPermissionsEditorProps = {
  userId: string;
  initialPermissionNames: string[];
  assignablePermissions: AssignablePermission[];
  onSaved: (permissionNames: string[]) => void;
};

export function WorkerPermissionsEditor({
  userId,
  initialPermissionNames,
  assignablePermissions,
  onSaved,
}: WorkerPermissionsEditorProps) {
  const [selected, setSelected] = useState<string[]>(initialPermissionNames);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function toggle(name: string) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const result = await updateInternalUserPermissionsRequest({
      userId,
      permissionNames: selected,
    });
    setSaving(false);

    if (!result.ok) {
      setMessage("No se pudieron guardar los permisos.");
      return;
    }

    setSelected(result.permissionNames);
    onSaved(result.permissionNames);
    setMessage("Permisos actualizados.");
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
      <p className="text-body-sm text-muted">
        Permisos extra de este usuario. Puedes quitarlos todos y dejar solo el
        rol base.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {assignablePermissions.map((permission) => (
          <li key={permission.name}>
            <label className="flex items-start gap-2 text-body-sm text-foreground">
              <input
                type="checkbox"
                checked={selected.includes(permission.name)}
                onChange={() => toggle(permission.name)}
              />
              <span>{permission.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar permisos"}
        </button>
        {message ? (
          <p className="text-body-sm text-muted" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
