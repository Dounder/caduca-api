/*
  Warnings:

  - You are about to drop the column `productId` on the `voucher_item` table. All the data in the column will be lost.
  - Added the required column `productCodeId` to the `voucher_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "voucher_item" DROP CONSTRAINT "voucher_item_productId_fkey";

-- DropIndex
DROP INDEX "voucher_item_product_id";

-- AlterTable
ALTER TABLE "voucher_item" DROP COLUMN "productId",
ADD COLUMN     "productCodeId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "voucher_item_productCodeId_voucherId_idx" ON "voucher_item"("productCodeId", "voucherId");

-- AddForeignKey
ALTER TABLE "voucher_item" ADD CONSTRAINT "voucher_item_productCodeId_fkey" FOREIGN KEY ("productCodeId") REFERENCES "product_code"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
