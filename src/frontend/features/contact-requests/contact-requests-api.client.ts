type ApiErrorResponse = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function createPublicContactRequestRequest(input: {
  name: string;
  email?: string;
  phone?: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const response = await fetch("/api/contact-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  return { ok: true };
}
