-- Add hasVariants flag to Product
ALTER TABLE "Product" ADD COLUMN "hasVariants" BOOLEAN NOT NULL DEFAULT false;

-- Create ProductVariant table
CREATE TABLE "ProductVariant" (
    "id"               TEXT         NOT NULL,
    "productId"        TEXT         NOT NULL,
    "label"            TEXT         NOT NULL,
    "price"            DECIMAL(10,2) NOT NULL,
    "compareAtPrice"   DECIMAL(10,2),
    "showComparePrice" BOOLEAN      NOT NULL DEFAULT false,
    "stock"            INTEGER      NOT NULL DEFAULT 0,
    "sku"              TEXT,
    "isDefault"        BOOLEAN      NOT NULL DEFAULT false,
    "displayOrder"     INTEGER      NOT NULL DEFAULT 0,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- ProductVariant → Product foreign key (cascade delete)
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add nullable variantId to CartItem
ALTER TABLE "CartItem" ADD COLUMN "variantId" TEXT;

-- CartItem → ProductVariant foreign key (set null on variant delete)
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
