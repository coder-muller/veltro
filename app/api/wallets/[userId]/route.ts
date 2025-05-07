import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return NextResponse.json({ error: "JWT secret not found" }, { status: 500 });
    }

    const decoded = jwt.verify(token.value, secret);

    if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wallets = await prisma.wallet.findMany({
        where: { userId },
    });

    return NextResponse.json(wallets);
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {

    const schema = z.object({
        userId: z.string(),
    });

    const { success } = schema.safeParse(params);

    if (!success) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { userId } = params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return NextResponse.json({ error: "JWT secret not found" }, { status: 500 });
    }

    const decoded = jwt.verify(token.value, secret);

    if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { name } = await request.json();

    const wallet = await prisma.wallet.create({
        data: { userId, name },
    });

    return NextResponse.json(wallet);
}