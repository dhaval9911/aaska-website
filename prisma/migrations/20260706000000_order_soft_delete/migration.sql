-- AlterTable: add soft-delete column to Order
ALTER TABLE "Order" ADD COLUMN "deletedAt" TIMESTAMP(3);
