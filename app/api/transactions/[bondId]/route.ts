import { calculateBondTotals } from "@/lib/bondsCalculations";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Bond } from "../../../../lib/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ bondId: string }> }) {
    const { bondId } = await params;

    const { type, value, date } = await request.json();

    const bond = await prisma.bond.findUnique({
        where: {
            id: bondId,
        },
        include: {
            transactions: true,
            wallet: true,
            user: true
        },
    }) as Bond | null;

    if (!bond) {
        return NextResponse.json({ error: "Bond not found" }, { status: 404 });
    }

    let transactionValue = 0;
    let currentValue = 0;

    if (type === "INVESTMENT") {
        transactionValue = Number(value.replace(",", "."));
        currentValue = calculateBondTotals(bond).currentValue + transactionValue;
    } else if (type === "RESCUE") {
        transactionValue = Number(value.replace(",", "."));
        currentValue = calculateBondTotals(bond).currentValue - transactionValue;
    } else if (type === "CORRECTION") {
        transactionValue = Number(value.replace(",", ".")) - calculateBondTotals(bond).currentValue;
        currentValue = Number(value.replace(",", "."));
    } else if (type === "LIQUIDATION") {
        transactionValue = Number(value.replace(",", ".")) - calculateBondTotals(bond).currentValue;
        currentValue = Number(value.replace(",", "."));
    }

    const transaction = await prisma.transaction.create({
        data: {
            bondId,
            type,
            currentValue,
            transactionValue,
            date: new Date(date + "T03:00:00.000Z"),
        },
    });

    return NextResponse.json(transaction);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ bondId: string }> }) {
    const { bondId } = await params;

    const bond = await prisma.bond.findUnique({
        where: {
            id: bondId,
        },
    }) as Bond | null;

    if (!bond) {
        return NextResponse.json({ error: "Bond not found" }, { status: 404 });
    }

    const { id } = await request.json();

    try {
        const transaction = await prisma.transaction.delete({
            where: {
                id,
            },
        });

        return NextResponse.json(transaction, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
}
