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
        return NextResponse.json({ error: "Bond not found" }, { status: 404 });
    }

    return NextResponse.json(bond);
}