import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {

    const { userId } = await params;

    const token = await (await cookies()).get("token");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return NextResponse.json({ error: "JWT secret not found" }, { status: 500 });
    }

    try {
        jwt.verify(token.value, secret);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const stocks = await prisma.stock.findMany({
        where: {
            userId: userId,
        },
        include: {
            wallet: true,
            dividends: true,
        }
    });

    return NextResponse.json(stocks, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {

    const { userId } = await params;

    const token = await (await cookies()).get("token");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return NextResponse.json({ error: "JWT secret not found" }, { status: 500 });
    }

    try {
        jwt.verify(token.value, secret);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { ticker, name, walletId, type, quantity, buyPrice, buyDate } = body;

    const isValidWallet = await prisma.wallet.findUnique({
        where: {
            id: walletId,
            userId: userId,
        },
    });

    if (!isValidWallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    try {
        const stock = await prisma.stock.create({
            data: {
                userId,
                ticker,
                name,
                walletId,
                type,
                quantity: Number(quantity.replace(",", ".")),
                buyPrice: Number(buyPrice.replace(",", ".")),
                buyDate: new Date(buyDate.split("T")[0] + "T03:00:00.000Z"),
                price: 0,
            },
        });

        return NextResponse.json(stock, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
