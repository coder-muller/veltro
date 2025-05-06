import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";


export async function POST(request: NextRequest) {

    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
    });

    try {
        const body = await request.json();
        const { email, password } = body;

        const { success } = schema.safeParse(body);
        if (!success) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.isVerified) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return NextResponse.json({ error: "JWT secret not found" }, { status: 500 });
        }

        const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "1h" });

        const cookieStore = await cookies();

        cookieStore.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60,
            path: "/",
            sameSite: "strict",
        });

        cookieStore.set("userId", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60,
            path: "/",
            sameSite: "strict",
        });

        cookieStore.set("userName", user.name, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60,
            path: "/",
            sameSite: "strict",
        });

        cookieStore.set("userEmail", user.email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60,
            path: "/",
            sameSite: "strict",
        });

        return NextResponse.json({ message: "Logged in successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("token");
        cookieStore.delete("userId");
        cookieStore.delete("userName");
        cookieStore.delete("userEmail");

        return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
    }
}