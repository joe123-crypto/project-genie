import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { token, username } = await request.json();

    if (!token) {
        return NextResponse.json({
            error: 'Token is required'
        }, {
            status: 400
        })
    }

    (await cookies()).set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    (await cookies()).set('username', username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    })

    return NextResponse.json({
        success: true
    })
}

export async function DELETE() {
    (await cookies()).delete('auth-token');
    (await cookies()).delete('username');

    return NextResponse.json({
        success: true
    })
}
