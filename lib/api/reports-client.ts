// Auth mechanism: next-auth with CredentialsProvider.
// The JWT is stored in a next-auth HttpOnly cookie and surfaced via
// session.user.session (see app/api/auth/[...nextauth]/route.ts).
// Because getToken() may be called from a hook (client component),
// we import getSession() from next-auth/react instead of reading
// localStorage — the token never lands in localStorage in this app.

import { getSession } from 'next-auth/react';

// Same-origin proxy path. The rewrite in next.config.js forwards
// `/backend-api/:path*` to `${NEXT_PUBLIC_API_URL}/api/:path*` server-side,
// so when the frontend is served over HTTPS the browser never has to talk
// directly to an HTTP backend (which would be blocked as mixed content).
const API_PROXY = process.env.NEXT_PUBLIC_API_PROXY ?? '/backend-api';

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const session = await getSession();
  return (session?.user as any)?.session ?? null;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    }
  }
  const queryString = qs.toString();
  const url = `${API_PROXY}${path}${queryString ? `?${queryString}` : ''}`;
  const token = await getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}
