export type ChangeAdminPasswordResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function changeAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ChangeAdminPasswordResult> {
  const response = await fetch("/api/admin/profile/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (response.ok) {
    return { ok: true };
  }

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return {
    ok: false,
    status: response.status,
    error: payload?.error ?? "unknown",
  };
}
