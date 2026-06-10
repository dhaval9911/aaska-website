/**
 * One-time cleanup script — deletes all Products and Categories.
 *
 * Deletion order (foreign-key safe):
 *   1. CartItem   — references Product (and User, which we keep)
 *   2. Product    — references Category
 *   3. Category (children, parentId IS NOT NULL) — must go before parents
 *   4. Category (parents,  parentId IS NULL)
 *
 * NOT deleted: Users, Orders, Admins — order history is preserved.
 *
 * Run (from monorepo root, requires DATABASE_URL pointing to a reachable DB):
 *   pnpm --filter @aaska/api db:clear-products
 *
 * Or directly:
 *   cd apps/api && npx tsx src/scripts/clear-products-categories.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting cleanup...\n');

  // ── 1. CartItem ────────────────────────────────────────────────────────────
  // CartItem.product has onDelete:Cascade, but we delete explicitly so the
  // count is accurate and the intent is clear.
  const { count: cartItemCount } = await prisma.cartItem.deleteMany({});
  console.log(`  Cleared ${cartItemCount} cart item(s)`);

  // ── 2. Product ─────────────────────────────────────────────────────────────
  // Order.items is a Json field — no separate OrderItem table — so orders are
  // unaffected. CartItems are already gone, so no FK violation.
  const { count: productCount } = await prisma.product.deleteMany({});
  console.log(`  Deleted ${productCount} product(s)`);

  // ── 3. Category — children first (parentId IS NOT NULL) ───────────────────
  const { count: childCount } = await prisma.category.deleteMany({
    where: { parentId: { not: null } },
  });
  console.log(`  Deleted ${childCount} subcategory/ies`);

  // ── 4. Category — top-level (parentId IS NULL) ────────────────────────────
  const { count: parentCount } = await prisma.category.deleteMany({
    where: { parentId: null },
  });
  console.log(`  Deleted ${parentCount} top-level category/ies`);

  const totalCategories = childCount + parentCount;

  console.log(`\nDeleted ${productCount} products, ${totalCategories} categories`);
}

main()
  .catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
