-- CreateEnum
CREATE TYPE "PipelineStep" AS ENUM ('INITIATED', 'GATEWAY_PENDING', 'GATEWAY_CONFIRMED', 'MOCASH_CREDIT', 'MOCASH_DEBIT', 'ADMIN_PROCESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PipelineStepStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "step" "PipelineStep" NOT NULL,
    "status" "PipelineStepStatus" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransactionLog" ADD CONSTRAINT "TransactionLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
