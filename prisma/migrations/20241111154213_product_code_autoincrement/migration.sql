/*
  Warnings:

  - The `code` column on the `product_code` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[code]` on the table `product_code` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "product_code" DROP COLUMN "code",
ADD COLUMN     "code" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "product_code_code_key" ON "product_code"("code");
