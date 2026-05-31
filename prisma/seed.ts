import { PrismaClient, ProductUnit, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Top-level categories (no parentId)
// featuredOnHome + homeDisplayOrder control the homepage tile grid.
// ---------------------------------------------------------------------------
const topLevelCategories = [
  {
    name: 'Resin Frames',
    slug: 'resin-frames',
    description: 'Handcrafted resin photo and wall frames for every occasion.',
    featuredOnHome: true,
    homeDisplayOrder: 1,
  },
  {
    name: 'Resin Trays',
    slug: 'resin-trays',
    description: 'Beautiful resin serving and decorative trays, made to order.',
    featuredOnHome: true,
    homeDisplayOrder: 2,
  },
  {
    name: 'Resin Jewellery',
    slug: 'resin-jewellery',
    description: 'Lightweight, one-of-a-kind resin jewellery pieces.',
    featuredOnHome: true,
    homeDisplayOrder: 3,
  },
  {
    name: 'Resin Clocks',
    slug: 'resin-clocks',
    description: 'Functional resin wall and table clocks with unique designs.',
    featuredOnHome: true,
    homeDisplayOrder: 4,
  },
  {
    name: 'Resin Coasters',
    slug: 'resin-coasters',
    description: 'Non-slip, waterproof resin coasters with floral and abstract designs.',
    featuredOnHome: true,
    homeDisplayOrder: 5,
  },
  {
    name: 'Custom Resin Art',
    slug: 'custom-resin-art',
    description: 'Fully customised resin art — send us your idea and we will craft it.',
    featuredOnHome: true,
    homeDisplayOrder: 6,
  },
  {
    name: 'Epoxy Resin',
    slug: 'epoxy-resin',
    description: 'Crystal-clear, UV-resistant epoxy resin kits for artists.',
    featuredOnHome: false,
    homeDisplayOrder: 0,
  },
  {
    name: 'Pigments & Dyes',
    slug: 'pigments-dyes',
    description: 'Premium mica powders, alcohol inks, and pigment pastes.',
    featuredOnHome: false,
    homeDisplayOrder: 0,
  },
  {
    name: 'Moulds & Tools',
    slug: 'moulds-tools',
    description: 'Silicone moulds, mixing tools, and accessories for resin crafting.',
    featuredOnHome: false,
    homeDisplayOrder: 0,
  },
  {
    name: 'Glitters & Inclusions',
    slug: 'glitters-inclusions',
    description: 'Holographic glitters, dried flowers, shells, and decorative inclusions.',
    featuredOnHome: false,
    homeDisplayOrder: 0,
  },
];

// ---------------------------------------------------------------------------
// Subcategory definitions — each references a parent slug
// ---------------------------------------------------------------------------
const subCategories: Array<{
  name: string;
  slug: string;
  description?: string;
  parentSlug: string;
}> = [
  // Resin Frames → children
  {
    name: 'Photo Frames',
    slug: 'photo-frames',
    description: 'Resin frames designed for single and collage photos.',
    parentSlug: 'resin-frames',
  },
  {
    name: 'Varmala Frames',
    slug: 'varmala-frames',
    description: 'Preserve wedding varmala flowers in beautiful resin frames.',
    parentSlug: 'resin-frames',
  },
  {
    name: 'Name Plate Frames',
    slug: 'name-plate-frames',
    description: 'Custom name plate frames for home and office doors.',
    parentSlug: 'resin-frames',
  },
  // Epoxy Resin → children
  {
    name: 'Crystal Clear Resin',
    slug: 'crystal-clear-resin',
    description: 'Water-clear, bubble-free epoxy for artwork and jewellery.',
    parentSlug: 'epoxy-resin',
  },
  {
    name: 'Casting Resin',
    slug: 'casting-resin',
    description: 'Low-viscosity resin ideal for deep pours and moulds.',
    parentSlug: 'epoxy-resin',
  },
  // Pigments & Dyes → children
  {
    name: 'Mica Powders',
    slug: 'mica-powders',
    description: 'Metallic and pearlescent mica pigment powders.',
    parentSlug: 'pigments-dyes',
  },
  {
    name: 'Alcohol Inks',
    slug: 'alcohol-inks',
    description: 'Vibrant, fast-drying alcohol inks for fluid resin art.',
    parentSlug: 'pigments-dyes',
  },
];

// ---------------------------------------------------------------------------
// Products (with compareAtPrice / showComparePrice sample data)
// ---------------------------------------------------------------------------
const products = [
  {
    name: 'Luxury Resin Photo Frame',
    slug: 'luxury-resin-photo-frame',
    description:
      'Handcrafted resin photo frame with gold leaf inclusions. Each piece is unique and made to order. Perfect for displaying your cherished memories.',
    price: 899,
    compareAtPrice: 1199,
    showComparePrice: true,
    stock: 15,
    unit: ProductUnit.PIECE,
    images: [] as string[],
    categorySlug: 'resin-frames',
  },
  {
    name: 'Ocean Wave Resin Tray',
    slug: 'ocean-wave-resin-tray',
    description:
      'Large serving tray with hand-poured ocean wave resin art. Food-safe, heat-resistant finish. Ideal for home décor and gifting.',
    price: 1499,
    compareAtPrice: null,
    showComparePrice: false,
    stock: 8,
    unit: ProductUnit.PIECE,
    images: [] as string[],
    categorySlug: 'resin-trays',
  },
  {
    name: 'Crystal Resin Coaster Set (4)',
    slug: 'crystal-resin-coaster-set',
    description:
      'Set of 4 handmade resin coasters with dried flower inclusions. Non-slip base, waterproof finish.',
    price: 599,
    compareAtPrice: 799,
    showComparePrice: true,
    stock: 25,
    unit: ProductUnit.PACK,
    images: [] as string[],
    categorySlug: 'resin-coasters',
  },
  {
    name: 'Transparent Epoxy Resin 1kg',
    slug: 'transparent-epoxy-resin-1kg',
    description:
      'Crystal clear, low-viscosity epoxy resin for art and crafts. 1:1 mix ratio, UV resistant, self-levelling formula.',
    price: 750,
    compareAtPrice: null,
    showComparePrice: false,
    stock: 50,
    unit: ProductUnit.KG,
    images: [] as string[],
    categorySlug: 'epoxy-resin',
  },
  {
    name: 'Mica Pigment Powder Set (12 colours)',
    slug: 'mica-pigment-powder-set-12',
    description:
      'Set of 12 premium mica pigment powders. Compatible with all resin types. Vibrant, fade-resistant colours.',
    price: 449,
    compareAtPrice: 599,
    showComparePrice: true,
    stock: 40,
    unit: ProductUnit.PACK,
    images: [] as string[],
    categorySlug: 'pigments-dyes',
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Seeding database…');

  // ── Admin user ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aaska.in' },
    update: {},
    create: {
      name: 'Aaska Admin',
      email: 'admin@aaska.in',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Admin: ${admin.email}`);

  // ── Top-level categories ────────────────────────────────────────────────
  const createdCategories: Record<string, string> = {};
  for (const cat of topLevelCategories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        description: cat.description,
        featuredOnHome: cat.featuredOnHome,
        homeDisplayOrder: cat.homeDisplayOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
        featuredOnHome: cat.featuredOnHome,
        homeDisplayOrder: cat.homeDisplayOrder,
      },
    });
    createdCategories[cat.slug] = record.id;
    console.log(`Category: ${record.name}`);
  }

  // ── Subcategories ───────────────────────────────────────────────────────
  for (const sub of subCategories) {
    const parentId = createdCategories[sub.parentSlug];
    if (!parentId) {
      console.warn(`  Skipping subcategory "${sub.name}" — parent "${sub.parentSlug}" not found`);
      continue;
    }
    const record = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {
        parentId,
        description: sub.description ?? null,
      },
      create: {
        name: sub.name,
        slug: sub.slug,
        description: sub.description ?? null,
        parentId,
      },
    });
    createdCategories[sub.slug] = record.id;
    console.log(`  Subcategory: ${record.name} → parent: ${sub.parentSlug}`);
  }

  // ── Products ─────────────────────────────────────────────────────────────
  for (const p of products) {
    const { categorySlug, compareAtPrice, ...data } = p;
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        compareAtPrice: compareAtPrice ?? null,
        showComparePrice: data.showComparePrice,
      },
      create: {
        ...data,
        compareAtPrice: compareAtPrice ?? null,
        categoryId,
      },
    });
    console.log(
      `Product: ${product.name}` +
        (product.showComparePrice ? ` (was ₹${product.compareAtPrice})` : ''),
    );
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
