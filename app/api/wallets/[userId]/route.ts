import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
        include: {
            Stock: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return NextResponse.json(wallets);
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {

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

    return NextResponse.json(wallet, { status: 201 });
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
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

    const { id, name } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Wallet ID is required" }, { status: 400 });
    }

    // Verificar se a carteira pertence ao usuário
    const existingWallet = await prisma.wallet.findUnique({
        where: { id },
    });

    if (!existingWallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (existingWallet.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized to edit this wallet" }, { status: 403 });
    }

    const updatedWallet = await prisma.wallet.update({
        where: { id },
        data: { name },
    });

    return NextResponse.json(updatedWallet);
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
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

    // Extrair o ID da carteira do corpo da solicitação
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Wallet ID is required" }, { status: 400 });
    }

    // Verificar se a carteira pertence ao usuário
    const existingWallet = await prisma.wallet.findUnique({
        where: { id },
    });

    if (!existingWallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (existingWallet.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized to delete this wallet" }, { status: 403 });
    }

    // Primeiro excluir todos os ativos associados à carteira
    await prisma.stock.deleteMany({
        where: { walletId: id }
    });

    // Depois excluir a carteira
    await prisma.wallet.delete({
        where: { id }
    });

    return NextResponse.json({ success: true });
}