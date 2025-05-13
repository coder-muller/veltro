import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";

const updateUserSchema = z.object({
    name: z.string().min(1, { message: "O nome é obrigatório" }),
    email: z.string().email({ message: "O email é inválido" }),
});

export async function PUT(request: NextRequest) {
    try {

        const cookieStore = await cookies();
        const userId = cookieStore.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const validationResult = updateUserSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { name, email } = body;

        // Check if email already exists (for another user)
        if (email) {
            const existingUser = await prisma.user.findUnique({
                where: {
                    email: email,
                }
            });

            if (existingUser && existingUser.id !== userId.value) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: {
                id: userId.value,
            },
            data: {
                name,
                email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        cookieStore.set("userName", updatedUser.name);
        cookieStore.set("userEmail", updatedUser.email);

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Failed to update user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
} 