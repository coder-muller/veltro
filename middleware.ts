import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'


export async function middleware(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')
    if (!token) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const secret = process.env.JWT_SECRET as string

    try {
        const decoded = await jwtVerify(token.value, new TextEncoder().encode(secret))
        if (!decoded) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
    } catch (error) {
        console.error(error)
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
}

export const config = {
    matcher: '/profile/:path*',
}