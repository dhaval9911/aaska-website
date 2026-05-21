const SERVER_API = process.env.API_BASE_URL ?? 'http://localhost:4000/api';
const CLIENT_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getBase() {
  return typeof window === 'undefined' ? SERVER_API : CLIENT_API;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = options ?? {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${getBase()}${path}`, { ...rest, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function apiUpload(file: File, token: string): Promise<{ path: string }> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${getBase()}/storage/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Upload failed`);
  }

  return res.json() as Promise<{ path: string }>;
}
