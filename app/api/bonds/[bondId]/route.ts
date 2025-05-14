import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ bondId: string }> }) {
    const { bondId } = await params;

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bond = await prisma.bond.findUnique({
        where: {
            id: bondId,
            userId: userId,
        },
        include: {
            transactions: true,
            wallet: true,
        },
    });

    if (!bond) {
        console.log("Bond not found");
        return NextResponse.json({ error: "Bond not found" }, { status: 404 });
    }

    return NextResponse.json(bond);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ bondId: string }> }) {
    const { bondId } = await params;

    const { name, description, type, walletId } = await request.json();

    try {
        const bond = await prisma.bond.update({
            where: { id: bondId },
            data: { name, description, type, walletId },
        });

        return NextResponse.json(bond, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Bond not found" }, { status: 404 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ bondId: string }> }) {
    const { bondId } = await params;

    try {
        const bond = await prisma.bond.delete({
            where: { id: bondId },
        });

        return NextResponse.json(bond, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Bond not found" }, { status: 404 });
    }
}