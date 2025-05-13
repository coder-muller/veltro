import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const data = await request.json();

    const { amount, date, description, ticker } = data;

    if (!amount || !date || !description || !ticker) {
        return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }

    if (isNaN(new Date(date).getTime())) {
        return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    const avaliableStocks = await prisma.stock.findMany({
        where: {
            userId,
            ticker,
            buyDate: {
                lte: new Date(date + 'T23:59:59.999Z')
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    const data = await request.json();

    const { dividendDate, description } = data;

    if (!dividendDate || !description) {
        return NextResponse.json({ error: "Data e descrição são obrigatórios" }, { status: 400 });
    }

    if (isNaN(new Date(dividendDate).getTime())) {
        return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    try {
        const deletedDividend = await prisma.dividend.deleteMany({
            where: {
                stock: {
                    userId,
                },
                date: {
                    gte: new Date(dividendDate.split('T')[0] + 'T00:00:00.000Z'),
                    lte: new Date(dividendDate.split('T')[0] + 'T23:59:59.999Z')
                },
                description
            }
        });

        return NextResponse.json(deletedDividend, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
