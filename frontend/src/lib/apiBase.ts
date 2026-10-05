function normalizeBase(raw: string | undefined): string {
  const t = raw?.trim();
  if (!t) return '';
  return t.replace(/\/+$/, '');
}

/** Server / RSC: prefers API_BASE_URL, then NEXT_PUBLIC_API_BASE_URL, then localhost. */
export function getApiBaseUrl(): string {
  const fromServer = normalizeBase(process.env.API_BASE_URL);
  if (fromServer) return fromServer;
  const fromPublic = normalizeBase(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (fromPublic) return fromPublic;
  return 'http://127.0.0.1:8000';
}

/**
 * Browser-only fetches: always use NEXT_PUBLIC_API_BASE_URL when set (build-time),
 * otherwise localhost. Use this in `"use client"` components so login/saved/chat work.
 */
export function getClientApiBaseUrl(): string {
  const fromPublic = normalizeBase(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (fromPublic) return fromPublic;
  return 'http://127.0.0.1:8000';
}
