import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const data = await request.json();

    const { amount, date, description, dateCom, ticker } = data;

    const avaliableStocks = await prisma.stock.findMany({
        where: {
            userId,
            ticker,
            buyDate: {
                lte: dateCom ? new Date(dateCom + 'T23:59:59.999Z') : new Date(date + 'T23:59:59.999Z')
            }
        }
    });

    if (avaliableStocks.length === 0) {
        return NextResponse.json({ error: "Não há ações disponíveis para o ticker informado" }, { status: 400 });
    }

    const sumQuantity = avaliableStocks.reduce((acc, stock) => acc + stock.quantity, 0);
    const valuePerStock = amount / sumQuantity;

    const newDividends = avaliableStocks.map(stock => ({
        amount: Number((valuePerStock * stock.quantity)),
        date: new Date(date + 'T03:00:00.000Z'),
        description,
        stockId: stock.id
    }));

    const createdDividends = await prisma.dividend.createMany({
        data: newDividends
    });

    return NextResponse.json(createdDividends, { status: 201 });
}

export async function DELETE(request: NextRequest) {

    const data = await request.json();

    const { dividendId } = data;

    try {
        const deletedDividend = await prisma.dividend.delete({
            where: {
                id: dividendId,
            }
        });

        return NextResponse.json(deletedDividend, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
