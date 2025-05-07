/*
  Warnings:

  - Added the required column `buyDate` to the `Stock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "buyDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sellDate" TIMESTAMP(3),
ADD COLUMN     "sellPrice" DOUBLE PRECISION;
