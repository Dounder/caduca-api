/*
  Warnings:

  - Added the required column `slug` to the `product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "product_slug_unique" ON "product"("slug");
