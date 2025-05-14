import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bonds = await prisma.bond.findMany({
        where: {
            userId: userId,
        },
        include: {
            wallet: true,
            transactions: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return NextResponse.json(bonds);
}

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, walletId, type, buyDate, expirationDate, investedValue, description } = await request.json();


    try {
        const bondCreated = await prisma.bond.create({
            data: {
                name,
                walletId,
                type,
                buyDate: new Date(buyDate + "T03:00:00.000Z"),
                expirationDate: expirationDate ? new Date(expirationDate + "T03:00:00.000Z") : null,
                description,
                userId,
            },
        });

        await prisma.transaction.create({
            data: {
                bondId: bondCreated.id,
                type: "INVESTMENT",
                currentValue: Number(investedValue.replace(",", ".")),
                transactionValue: Number(investedValue.replace(",", ".")),
                date: new Date(buyDate + "T03:00:00.000Z"),
            },
        });

        return NextResponse.json(bondCreated, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create bond" }, { status: 500 });
    }
}

