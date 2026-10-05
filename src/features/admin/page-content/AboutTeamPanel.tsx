"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AboutTeamSectionContent } from "@/domain";
import { CoverImage } from "@/frontend/components/common/CoverImage";
import { AdminCard } from "@/features/admin";
import { MediaPicker } from "@/features/admin/media";
import type { AdminMediaAsset } from "@/features/admin/media/media-api.client";

import {
  createAboutTeamMemberRequest,
  deleteAboutTeamMemberRequest,
  saveAboutTeamSectionRequest,
  updateAboutTeamMemberRequest,
  type AdminAboutTeamMemberView,
} from "./about-team-api.client";

type AboutTeamPanelProps = {
  initialSection: AboutTeamSectionContent;
  initialMembers: AdminAboutTeamMemberView[];
};

type MemberDraft = AdminAboutTeamMemberView;

function emptyMemberDraft(sortOrder: number): MemberDraft {
  return {
    id: "",
    name: "",
    role: "",
    description: "",
    mediaAssetId: null,
    sortOrder,
    published: false,
    image: null,
  };
}

export function AboutTeamPanel({
  initialSection,
  initialMembers,
}: AboutTeamPanelProps) {
  const router = useRouter();
  const [section, setSection] = useState(initialSection);
  const [members, setMembers] = useState(initialMembers);
  const [sectionStatus, setSectionStatus] = useState("");
  const [memberStatus, setMemberStatus] = useState("");
  const [savingSection, setSavingSection] = useState(false);
  const [pickerMemberId, setPickerMemberId] = useState<string | null>(null);

  async function handleSaveSection(event: React.FormEvent) {
    event.preventDefault();
    setSavingSection(true);
    setSectionStatus("");
    const ok = await saveAboutTeamSectionRequest(section);
    setSavingSection(false);
    setSectionStatus(
      ok ? "Contenido de Equipo guardado." : "No se pudo guardar el contenido.",
    );
    if (ok) {
      router.refresh();
    }
  }

  async function persistMember(member: MemberDraft) {
    const payload = {
      name: member.name.trim(),
      role: member.role.trim(),
      description: member.description.trim(),
      mediaAssetId: member.mediaAssetId,
      sortOrder: member.sortOrder,
      published: member.published,
    };

    if (!member.id) {
      const result = await createAboutTeamMemberRequest(payload);
      if (!result.ok) {
        return false;
      }
      return true;
    }

    return updateAboutTeamMemberRequest(member.id, payload);
  }

  async function handleSaveMember(member: MemberDraft) {
    setMemberStatus("");
    const ok = await persistMember(member);
    if (!ok) {
      setMemberStatus("No se pudo guardar el integrante.");
      return;
    }
    setMemberStatus("Integrante guardado.");
    router.refresh();
  }

  async function handleAddMember() {
    setMemberStatus("");
    const nextOrder =
      members.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
    const draft = emptyMemberDraft(nextOrder);
    draft.name = "Nuevo integrante";
    draft.role = "Cargo";
    const result = await createAboutTeamMemberRequest({
      name: draft.name,
      role: draft.role,
      description: "",
      mediaAssetId: null,
      sortOrder: draft.sortOrder,
      published: false,
    });
    if (!result.ok) {
      setMemberStatus("No se pudo crear el integrante.");
      return;
    }
    setMembers((current) => [
      ...current,
      { ...result.member, image: null },
    ]);
    router.refresh();
  }

  async function handleDeleteMember(id: string) {
    setMemberStatus("");
    const ok = await deleteAboutTeamMemberRequest(id);
    if (!ok) {
      setMemberStatus("No se pudo eliminar el integrante.");
      return;
    }
    setMembers((current) => current.filter((item) => item.id !== id));
    router.refresh();
  }

  function updateMember(id: string, patch: Partial<MemberDraft>) {
    setMembers((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function applyMedia(memberId: string, asset: AdminMediaAsset) {
    if (asset.kind !== "image") {
      setMemberStatus("Selecciona una imagen.");
      return;
    }
    updateMember(memberId, {
      mediaAssetId: asset.id,
      image: { src: asset.url, alt: asset.alt || asset.originalName },
    });
    setPickerMemberId(null);
  }

  return (
    <AdminCard>
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-heading-sm text-foreground">
            Equipo — Sobre Nosotros
          </h2>
          <p className="mt-1 text-body-sm text-muted">
            Texto introductorio e integrantes publicados en{" "}
            <span className="text-foreground">/about</span>.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSaveSection}>
          <label className="flex flex-col gap-2">
            <span className="field-label">Título</span>
            <input
              className="admin-input"
              value={section.title}
              onChange={(event) =>
                setSection((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="field-label">Descripción</span>
            <textarea
              className="admin-input min-h-24"
              value={section.description}
              onChange={(event) =>
                setSection((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="field-label">Texto complementario (estado vacío)</span>
            <textarea
              className="admin-input min-h-24"
              value={section.pendingMessage}
              onChange={(event) =>
                setSection((current) => ({
                  ...current,
                  pendingMessage: event.target.value,
                }))
              }
              required
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary" disabled={savingSection}>
              {savingSection ? "Guardando…" : "Guardar contenido"}
            </button>
            {sectionStatus ? (
              <p className="text-body-sm text-muted">{sectionStatus}</p>
            ) : null}
          </div>
        </form>

        <div className="flex flex-col gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-body-md text-foreground">Integrantes</p>
            <button type="button" className="btn-secondary" onClick={handleAddMember}>
              Añadir integrante
            </button>
          </div>

          {members.length === 0 ? (
            <p className="text-body-sm text-muted">
              Aún no hay integrantes. El sitio mostrará el texto complementario.
            </p>
          ) : null}

          <ul className="flex list-none flex-col gap-6">
            {members.map((member) => (
              <li
                key={member.id}
                className="rounded-md border border-border p-4 md:p-5"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="field-label">Nombre</span>
                    <input
                      className="admin-input"
                      value={member.name}
                      onChange={(event) =>
                        updateMember(member.id, { name: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="field-label">Cargo</span>
                    <input
                      className="admin-input"
                      value={member.role}
                      onChange={(event) =>
                        updateMember(member.id, { role: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="field-label">Descripción</span>
                    <textarea
                      className="admin-input min-h-20"
                      value={member.description}
                      onChange={(event) =>
                        updateMember(member.id, {
                          description: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="field-label">Orden</span>
                    <input
                      className="admin-input"
                      type="number"
                      min={0}
                      value={member.sortOrder}
                      onChange={(event) =>
                        updateMember(member.id, {
                          sortOrder: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 self-end">
                    <input
                      type="checkbox"
                      checked={member.published}
                      onChange={(event) =>
                        updateMember(member.id, {
                          published: event.target.checked,
                        })
                      }
                    />
                    <span className="text-body-sm text-foreground">Publicado</span>
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    {member.image?.src ? (
                      <div className="relative h-20 w-16 overflow-hidden rounded">
                        <CoverImage
                          src={member.image.src}
                          alt={member.image.alt}
                          sizes="4rem"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-16 items-center justify-center rounded border border-dashed border-border text-body-xs text-muted">
                        Sin foto
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setPickerMemberId(member.id)}
                    >
                      Elegir imagen
                    </button>
                    {member.mediaAssetId ? (
                      <button
                        type="button"
                        className="btn-ghost text-body-sm"
                        onClick={() =>
                          updateMember(member.id, {
                            mediaAssetId: null,
                            image: null,
                          })
                        }
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleSaveMember(member)}
                    >
                      Guardar integrante
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-destructive"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {memberStatus ? (
            <p className="text-body-sm text-muted">{memberStatus}</p>
          ) : null}
        </div>
      </div>

      <MediaPicker
        open={pickerMemberId !== null}
        onClose={() => setPickerMemberId(null)}
        accept="image"
        onSelect={(asset) => {
          if (pickerMemberId) {
            applyMedia(pickerMemberId, asset);
          }
        }}
      />
    </AdminCard>
  );
}
