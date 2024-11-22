/*
  Warnings:

  - The primary key for the `user_role` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "user_role_id_seq";
