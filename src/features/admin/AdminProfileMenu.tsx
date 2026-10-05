"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { MediaPicker } from "@/features/admin/media";
import type { AdminMediaAsset } from "@/features/admin/media/media-api.client";
import type { AdminProfileView } from "./admin-profile.types";

import { patchAdminProfileAvatar } from "./profile/profile-api.client";

type AdminProfileMenuProps = {
  initialProfile: AdminProfileView;
};

const panelClassName =
  "absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),18rem)] overflow-hidden rounded-md border border-border bg-surface shadow-sm";

const menuButtonClassName =
  "flex w-full items-center justify-start px-4 py-2.5 text-left text-body-sm text-foreground transition-colors hover:bg-background/80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function AdminProfileMenu({ initialProfile }: AdminProfileMenuProps) {
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [syncedInitialProfile, setSyncedInitialProfile] =
    useState(initialProfile);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  if (initialProfile !== syncedInitialProfile) {
    setSyncedInitialProfile(initialProfile);
    setProfile(initialProfile);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const handleLogout = useCallback(async () => {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }, [router]);

  async function handleSelectAsset(asset: AdminMediaAsset) {
    setPickerOpen(false);
    setPending(true);
    setMessage("");
    const result = await patchAdminProfileAvatar(asset.id);
    setPending(false);

    if (!result.ok) {
      setMessage("No se pudo actualizar la imagen de perfil.");
      return;
    }

    setProfile(result.profile);
    setMessage("Imagen de perfil actualizada.");
    setOpen(false);
    router.refresh();
  }

  async function handleUseDefaultProfileLogo() {
    setPending(true);
    setMessage("");
    const result = await patchAdminProfileAvatar(null);
    setPending(false);

    if (!result.ok) {
      setMessage("No se pudo restaurar el logo de perfil.");
      return;
    }

    setProfile(result.profile);
    setMessage("Se restauró el logo de perfil ALTANA.");
    setOpen(false);
    router.refresh();
  }

  const avatarObjectFit = profile.avatar.isCustom ? "object-cover" : "object-contain";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-background/25 bg-background/10 shadow-sm transition-colors hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:h-12 sm:w-12"
        aria-label="Abrir menú de perfil"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Image
          src={profile.avatar.url}
          alt={profile.avatar.alt}
          fill
          sizes="(max-width: 640px) 44px, 48px"
          className={`${avatarObjectFit} ${profile.avatar.isCustom ? "" : "p-1"}`}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label="Perfil administrativo"
          className={panelClassName}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-body-md text-foreground">{profile.displayName}</p>
            <p className="text-body-sm text-muted">
              {profile.isPrincipalAdmin
                ? "Administrador principal"
                : "Usuario interno"}
            </p>
            <p className="mt-1 text-body-sm text-secondary">{profile.email}</p>
          </div>

          <div className="flex flex-col py-1">
            <button
              type="button"
              role="menuitem"
              className={menuButtonClassName}
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setPickerOpen(true);
              }}
            >
              Cambiar imagen de perfil
            </button>
            {profile.avatar.isCustom ? (
              <button
                type="button"
                role="menuitem"
                className={menuButtonClassName}
                disabled={pending}
                onClick={() => void handleUseDefaultProfileLogo()}
              >
                Usar logo de perfil ALTANA
              </button>
            ) : null}
            {profile.isPrincipalAdmin ? (
              <Link
                href="/admin/settings/security"
                role="menuitem"
                className={menuButtonClassName}
                onClick={() => setOpen(false)}
              >
                Seguridad de acceso
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className={menuButtonClassName}
              disabled={pending}
              onClick={() => void handleLogout()}
            >
              {pending ? "Saliendo…" : "Cerrar sesión"}
            </button>
          </div>

          {message ? (
            <p className="border-t border-border px-4 py-2 text-body-sm text-secondary">
              {message}
            </p>
          ) : null}
        </div>
      ) : null}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => void handleSelectAsset(asset)}
        accept="image"
        title="Imagen de perfil"
      />
    </div>
  );
}
