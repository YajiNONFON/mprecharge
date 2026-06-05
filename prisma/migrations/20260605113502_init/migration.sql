/*
  Warnings:

  - You are about to drop the column `referredById` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Gateway" AS ENUM ('FEEXPAY', 'FEDAPAY');

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_referredById_fkey";

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "activeGateway" "Gateway" NOT NULL DEFAULT 'FEEXPAY';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "referredById";
