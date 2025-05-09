export const calculateStock = (stock: {
    name: string;
    ticker: string;
    type: string;
    buyPrice: number;
    quantity: number;
    price: number;
    dividends?: { amount: number }[];
}): {
    currentValue: number;
    totalInvested: number;
    totalProfit: number;
    totalProfitPercentage: number;
    totalDividends: number;
} => {
    const currentValue = stock.price * stock.quantity;
    const totalInvested = stock.buyPrice * stock.quantity;
    const totalDividends = stock.dividends ? stock.dividends.reduce((acc, dividend) => acc + dividend.amount, 0) : 0;
    const totalProfit = currentValue - totalInvested + totalDividends;
    const totalProfitPercentage = (totalProfit / totalInvested);

    return { currentValue, totalInvested, totalProfit, totalProfitPercentage, totalDividends };
}
