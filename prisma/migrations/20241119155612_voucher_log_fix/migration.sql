/*
  Warnings:

  - You are about to drop the column `userId` on the `voucher_log` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "voucher_log" DROP CONSTRAINT "voucher_log_userId_fkey";

-- AlterTable
ALTER TABLE "voucher_log" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "voucher_log" ADD CONSTRAINT "voucher_log_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
