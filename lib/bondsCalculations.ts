import { Bond } from "./types";
import xirr from "xirr";

export const calculateBondTotals = (bond: Bond): {
    totalInvested: number,
    currentValue: number,
    totalRescued: number,
    profit: number,
    profitPercentage: number,
    profitPercentageMonthly: number,
    isLiquidated: boolean,
    irrAnnual: number | undefined,
    irrMonthly: number | undefined
} => {

    let totalInvested = 0
    let currentValue = 0
    let totalRescued = 0
    let profit = 0
    let profitPercentage = 0
    let profitPercentageMonthly = 0
    let isLiquidated = false

    const cashFlow: { amount: number, when: Date }[] = [];

    for (const transaction of bond.transactions) {

        const date = new Date(transaction.date);

        if (transaction.type === "INVESTMENT") {
            totalInvested += transaction.transactionValue
            currentValue += transaction.transactionValue
            cashFlow.push({ amount: -transaction.transactionValue, when: date });
        } else if (transaction.type === "CORRECTION") {
            currentValue += transaction.transactionValue
        } else if (transaction.type === "RESCUE") {
            totalRescued += transaction.transactionValue
            currentValue -= transaction.transactionValue
            cashFlow.push({ amount: transaction.transactionValue, when: date });
        } else if (transaction.type === "LIQUIDATION") {
            currentValue = transaction.currentValue
            isLiquidated = true
            cashFlow.push({ amount: transaction.currentValue, when: date });
        }
    }

    profit = currentValue - totalInvested + totalRescued

    profitPercentage = (profit / totalInvested) * 100

    const buyDate = new Date(bond.buyDate).getTime();
    const expirationDate = new Date(bond.expirationDate || new Date(bond.transactions[bond.transactions.length - 1].date)).getTime();
    const months = (expirationDate - buyDate) / (1000 * 60 * 60 * 24 * 30);
    profitPercentageMonthly = months > 0 ? (Math.pow(1 + profitPercentage / 100, 1 / months) - 1) * 100 : 0;

    // IRR cálculo
    let irrAnnual: number | undefined = undefined;
    let irrMonthly: number | undefined = undefined;

    if (cashFlow.length >= 2) {
        try {
            irrAnnual = xirr(cashFlow);
            irrMonthly = irrAnnual !== undefined ? Math.pow(1 + irrAnnual, 1 / 12) - 1 : undefined;
        } catch (err) {
            console.warn("Erro ao calcular XIRR:", err);
        }
    }

    return {
        totalInvested,
        currentValue,
        totalRescued,
        profit,
        profitPercentage,
        profitPercentageMonthly,
        isLiquidated,
        irrAnnual,
        irrMonthly
    }
}