// Auth mechanism: next-auth with CredentialsProvider.
// The JWT is stored in a next-auth HttpOnly cookie and surfaced via
// session.user.session (see app/api/auth/[...nextauth]/route.ts).
// Because getToken() may be called from a hook (client component),
// we import getSession() from next-auth/react instead of reading
// localStorage — the token never lands in localStorage in this app.

import { getSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const session = await getSession();
  return (session?.user as any)?.session ?? null;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${API_BASE}/api${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const token = await getToken();
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}
