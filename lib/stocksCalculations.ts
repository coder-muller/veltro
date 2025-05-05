export const calculateStock = (stock: {
    name: string;
    ticker: string;
    type: string;
    buyPrice: number;
    quantity: number;
    price: number;
}): {
    currentValue: number;
    totalInvested: number;
    totalProfit: number;
    totalProfitPercentage: number;
} => {
    const currentValue = stock.price * stock.quantity;
    const totalInvested = stock.buyPrice * stock.quantity;
    const totalProfit = currentValue - totalInvested;
    const totalProfitPercentage = (totalProfit / totalInvested);

    return { currentValue, totalInvested, totalProfit, totalProfitPercentage };
}
