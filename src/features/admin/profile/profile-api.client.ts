import type { AdminProfileView } from "../admin-profile.types";

type ApiError = { error?: string };

type ProfileResult =
  | { ok: true; profile: AdminProfileView }
  | { ok: false; status: number; error?: string };

export async function patchAdminProfileAvatar(
  profileMediaAssetId: string | null,
): Promise<ProfileResult> {
  const response = await fetch("/api/admin/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileMediaAssetId }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    return { ok: false, status: response.status, error: payload?.error };
  }

  const data = (await response.json()) as { profile: AdminProfileView };
  return { ok: true, profile: data.profile };
}
