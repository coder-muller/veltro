import { Bond } from "./types";
import { differenceInDays } from 'date-fns'

export const calculateBondTotals = (bond: Bond): {
    totalInvested: number,
    currentValue: number,
    totalRescued: number,
    profit: number,
    profitPercentage: number,
    profitPercentageMonthly: number,
    isLiquidated: boolean,
} => {

    let totalInvested = 0
    let currentValue = 0
    let totalRescued = 0
    let profit = 0
    let profitPercentage = 0
    let profitPercentageMonthly = 0
    let isLiquidated = false

    const sortedTransactions = bond.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const transaction of sortedTransactions) {
        if (transaction.type === "INVESTMENT") {
            totalInvested += transaction.transactionValue
            currentValue += transaction.transactionValue
        } else if (transaction.type === "CORRECTION") {
            currentValue += transaction.transactionValue
        } else if (transaction.type === "RESCUE") {
            totalRescued += transaction.transactionValue
            currentValue -= transaction.transactionValue
        } else if (transaction.type === "LIQUIDATION") {
            currentValue = transaction.currentValue
            isLiquidated = true
        }
    }

    profit = currentValue - totalInvested + totalRescued

    profitPercentage = (profit / totalInvested)

    const start = new Date(bond.buyDate)
    const end = new Date(bond.transactions.at(-1)?.date || Date.now())
    const months = differenceInDays(end, start) / 30

    profitPercentageMonthly = months > 0
        ? (Math.pow(1 + profitPercentage, 1 / months) - 1)
        : 0

    console.table({
        transactions: bond.name,
        profitPercentage,
        profitPercentageMonthly,
        profit,
        totalInvested,
        currentValue,
        totalRescued,
        isLiquidated,
        buyDate: bond.buyDate,
        expirationDate: bond.expirationDate,
        start,
        end,
        months,
    })

    return {
        totalInvested,
        currentValue,
        totalRescued,
        profit,
        profitPercentage,
        profitPercentageMonthly,
        isLiquidated,
    }
}