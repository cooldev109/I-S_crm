/*
  Warnings:

  - You are about to drop the column `lineItems` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Budget` table. All the data in the column will be lost.
  - Added the required column `chapters` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feeAmount` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pemTotal` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxBaseTotal` to the `Budget` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "lineItems",
DROP COLUMN "subtotal",
DROP COLUMN "taxRate",
DROP COLUMN "total",
ADD COLUMN     "chapters" JSONB NOT NULL,
ADD COLUMN     "feeAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "feeMinAmount" DOUBLE PRECISION NOT NULL DEFAULT 4500,
ADD COLUMN     "feePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
ADD COLUMN     "pemTotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "taxBaseTotal" DOUBLE PRECISION NOT NULL;
