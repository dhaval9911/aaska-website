-- Add showStock flag to Product table
-- Controls whether the stock count badge is shown on the product detail page
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "showStock" BOOLEAN NOT NULL DEFAULT true;
