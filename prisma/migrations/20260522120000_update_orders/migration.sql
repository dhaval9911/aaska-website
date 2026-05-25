-- Add whatsappNumber to User
ALTER TABLE "User" ADD COLUMN "whatsappNumber" TEXT;

-- Drop old Order table (references old OrderStatus enum)
DROP TABLE IF EXISTS "Order";

-- Drop old OrderStatus enum
DROP TYPE "OrderStatus";

-- Create new OrderStatus enum
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING_WHATSAPP',
  'CONFIRMED',
  'PAYMENT_PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
);

-- Recreate Order table with full schema
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_WHATSAPP',
    "shippingAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- Unique order number
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- FK to user (SET NULL on delete so orders survive user deletion)
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
