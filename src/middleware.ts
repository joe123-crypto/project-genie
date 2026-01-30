import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('auth-token')?.value
    const username = request.cookies.get('username')?.value;
    const isAuthPage = request.nextUrl.pathname.startsWith('/login');
    const { pathname } = request.nextUrl;
    const isProtectedRoute = /^\/[^\/]+\/(dashboard|createmenu)/.test(pathname);

    //console.log(isProtectedRoute);
    if (isProtectedRoute && !session) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (isAuthPage && session && username) {
        return NextResponse.redirect(new URL(`/${username}/dashboard`, request.url));
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}