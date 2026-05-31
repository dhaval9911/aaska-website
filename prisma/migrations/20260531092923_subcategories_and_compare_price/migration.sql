-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "featuredOnHome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "homeDisplayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "homeTileImage" TEXT,
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "compareAtPrice" DECIMAL(10,2),
ADD COLUMN     "showComparePrice" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
