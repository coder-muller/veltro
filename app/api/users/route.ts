import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {

    const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
    });

    try {
        const body = await request.json();
        const { name, email, password } = body;

        const { success } = schema.safeParse(body);
        if (!success) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
