-- DropForeignKey
ALTER TABLE "Dividend" DROP CONSTRAINT "Dividend_stockId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_userId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_walletId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dividend" ADD CONSTRAINT "Dividend_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
