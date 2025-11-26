import { getToken } from "next-auth/jwt";
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    if (token && token.session && !req.nextUrl.pathname.startsWith('/dashboard')) {
        return Response.redirect(new URL('/dashboard/home', req.url));
    }
    if ((!token || (token && !token.session)) && req.nextUrl.pathname !== '/' && req.nextUrl.pathname !== '/recover' && !req.nextUrl.pathname.includes("favicon.ico") && !req.nextUrl.pathname.includes("icon.ico")) {
        return Response.redirect(new URL('/', req.url));
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
