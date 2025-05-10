import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string, walletId: string, ticker: string }> }) {

    const { userId, walletId, ticker } = await params;
    const includeAll = request.nextUrl.searchParams.get("includeAll") === "true";

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

    // Build the where clause based on whether includeAll is true or not
    const whereClause = {
        userId,
        walletId,
        ticker,
        ...(includeAll ? {} : { sellDate: null }) // Only include unsold stocks unless includeAll is true
    };

    const stock = await prisma.stock.findMany({
        where: whereClause,
        include: {
            dividends: true,
            wallet: true,
        },
    });

    return NextResponse.json(stock, { status: 200 });
}