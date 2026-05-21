import { PrismaClient, ProductUnit, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  { name: 'Resin Frames', slug: 'resin-frames' },
  { name: 'Resin Trays', slug: 'resin-trays' },
  { name: 'Resin Jewellery', slug: 'resin-jewellery' },
  { name: 'Resin Clocks', slug: 'resin-clocks' },
  { name: 'Resin Coasters', slug: 'resin-coasters' },
  { name: 'Custom Resin Art', slug: 'custom-resin-art' },
  { name: 'Epoxy Resin', slug: 'epoxy-resin' },
  { name: 'Pigments & Dyes', slug: 'pigments-dyes' },
  { name: 'Moulds & Tools', slug: 'moulds-tools' },
  { name: 'Glitters & Inclusions', slug: 'glitters-inclusions' },
];

async function main() {
  console.log('Seeding database…');

  // Admin user
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

  // Categories
  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = record.id;
    console.log(`Category: ${record.name}`);
  }

  // Sample products
  const products = [
    {
      name: 'Luxury Resin Photo Frame',
      slug: 'luxury-resin-photo-frame',
      description:
        'Handcrafted resin photo frame with gold leaf inclusions. Each piece is unique and made to order. Perfect for displaying your cherished memories.',
      price: 899,
      stock: 15,
      unit: ProductUnit.PIECE,
      images: [],
      categorySlug: 'resin-frames',
    },
    {
      name: 'Ocean Wave Resin Tray',
      slug: 'ocean-wave-resin-tray',
      description:
        'Large serving tray with hand-poured ocean wave resin art. Food-safe, heat-resistant finish. Ideal for home décor and gifting.',
      price: 1499,
      stock: 8,
      unit: ProductUnit.PIECE,
      images: [],
      categorySlug: 'resin-trays',
    },
    {
      name: 'Crystal Resin Coaster Set (4)',
      slug: 'crystal-resin-coaster-set',
      description:
        'Set of 4 handmade resin coasters with dried flower inclusions. Non-slip base, waterproof finish.',
      price: 599,
      stock: 25,
      unit: ProductUnit.PACK,
      images: [],
      categorySlug: 'resin-coasters',
    },
    {
      name: 'Transparent Epoxy Resin 1kg',
      slug: 'transparent-epoxy-resin-1kg',
      description:
        'Crystal clear, low-viscosity epoxy resin for art and crafts. 1:1 mix ratio, UV resistant, self-levelling formula.',
      price: 750,
      stock: 50,
      unit: ProductUnit.KG,
      images: [],
      categorySlug: 'epoxy-resin',
    },
    {
      name: 'Mica Pigment Powder Set (12 colours)',
      slug: 'mica-pigment-powder-set-12',
      description:
        'Set of 12 premium mica pigment powders. Compatible with all resin types. Vibrant, fade-resistant colours.',
      price: 449,
      stock: 40,
      unit: ProductUnit.PACK,
      images: [],
      categorySlug: 'pigments-dyes',
    },
  ];

  for (const p of products) {
    const { categorySlug, ...data } = p;
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: { ...data, categoryId },
    });
    console.log(`Product: ${product.name}`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
