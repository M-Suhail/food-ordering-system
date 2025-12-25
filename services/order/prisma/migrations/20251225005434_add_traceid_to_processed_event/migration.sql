-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "traceId" TEXT;

-- AlterTable
ALTER TABLE "ProcessedEvent" ADD COLUMN     "traceId" TEXT;
