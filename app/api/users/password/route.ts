import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
const passwordUpdateSchema = z.object({
    currentPassword: z.string().min(8, { message: "A senha atual deve ter pelo menos 8 caracteres" }),
    newPassword: z.string().min(8, { message: "A nova senha deve ter pelo menos 8 caracteres" }),
});

export async function PUT(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const validationResult = passwordUpdateSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = body;

        // Fetch user with password
        const user = await prisma.user.findUnique({
            where: {
                id: userId.value,
            },
            select: {
                password: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: {
                id: userId.value,
            },
            data: {
                password: hashedPassword,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update password:", error);
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }
} 