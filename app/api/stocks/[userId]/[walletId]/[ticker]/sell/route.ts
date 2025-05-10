import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string, walletId: string, ticker: string }> }) {
    const { walletId, ticker } = await params;

    const { amount, sellPrice, sellDate, isTotal } = await request.json();

    const wallet = await prisma.wallet.findUnique({
        where: {
            id: walletId,
        },
    });

    if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const stocks = await prisma.stock.findMany({
        where: {
            walletId,
            ticker,
            sellDate: null,
        },
        orderBy: {
            buyDate: "asc",
        },
    });

    if (!stocks || stocks.length === 0) {
        return NextResponse.json({ error: "No available stocks found" }, { status: 404 });
    }

    const totalAvailable = stocks.reduce((acc, curr) => acc + curr.quantity, 0);

    if (isTotal) {
        // Total sale - sell all available stocks
        const updates = stocks.map(stock => 
            prisma.stock.update({
                where: { id: stock.id },
                data: { 
                    sellDate: new Date(sellDate),
                    sellPrice: parseFloat(sellPrice) 
                }
            })
        );
        
        await prisma.$transaction(updates);
        
        return NextResponse.json({ success: true, message: "All stocks sold successfully" });
    } else {
        // Partial sale
        const saleAmount = parseFloat(amount);
        
        if (totalAvailable < saleAmount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }
        
        let remainingToSell = saleAmount;
        const operations = [];
        
        for (const stock of stocks) {
            if (remainingToSell <= 0) break;
            
            if (stock.quantity <= remainingToSell) {
                // Sell entire stock
                operations.push(
                    prisma.stock.update({
                        where: { id: stock.id },
                        data: { 
                            sellDate: new Date(sellDate),
                            sellPrice: parseFloat(sellPrice)
                        }
                    })
                );
                
                remainingToSell -= stock.quantity;
            } else {
                // Partial sell of this stock
                // 1. Update the current stock to reduce quantity
                operations.push(
                    prisma.stock.update({
                        where: { id: stock.id },
                        data: { 
                            quantity: stock.quantity - remainingToSell
                        }
                    })
                );
                
                // 2. Create a new entry for the sold portion
                operations.push(
                    prisma.stock.create({
                        data: {
                            name: stock.name,
                            ticker: stock.ticker,
                            type: stock.type,
                            buyPrice: stock.buyPrice,
                            quantity: remainingToSell,
                            price: stock.price,
                            buyDate: stock.buyDate,
                            sellDate: new Date(sellDate),
                            sellPrice: parseFloat(sellPrice),
                            walletId: stock.walletId,
                            userId: stock.userId
                        }
                    })
                );
                
                remainingToSell = 0;
            }
        }
        
        await prisma.$transaction(operations);
        
        return NextResponse.json({ success: true, message: "Partial sale completed successfully" });
    }
}