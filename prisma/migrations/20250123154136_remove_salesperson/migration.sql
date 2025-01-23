/*
  Warnings:

  - You are about to drop the `salesperson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salesperson_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "salesperson" DROP CONSTRAINT "salesperson_created_by_fkey";

-- DropForeignKey
ALTER TABLE "salesperson" DROP CONSTRAINT "salesperson_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "salesperson" DROP CONSTRAINT "salesperson_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "salesperson_log" DROP CONSTRAINT "salesperson_log_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "salesperson_log" DROP CONSTRAINT "salesperson_log_salesperson_id_fkey";

-- DropTable
DROP TABLE "salesperson";

-- DropTable
DROP TABLE "salesperson_log";
