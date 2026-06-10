import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Consistent variant include — always ordered by displayOrder */
const VARIANT_INCLUDE = {
  variants: { orderBy: { displayOrder: 'asc' as const } },
} as const;

/**
 * Validate a variant array:
 * - at least one variant
 * - exactly one isDefault
 */
function assertVariants(variants: CreateProductVariantDto[]): void {
  if (variants.length === 0) {
    throw new BadRequestException('hasVariants requires at least one variant.');
  }
  const defaults = variants.filter((v) => v.isDefault);
  if (defaults.length !== 1) {
    throw new BadRequestException('Exactly one variant must have isDefault: true.');
  }
}

/**
 * Derive product-level price and stock from variants when hasVariants=true.
 * price  → default variant's price (for listings/sorting)
 * stock  → sum of all variant stocks
 */
function deriveFromVariants(variants: CreateProductVariantDto[]): {
  price: number;
  stock: number;
} {
  const def = variants.find((v) => v.isDefault) ?? variants[0];
  const stock = variants.reduce((s, v) => s + (v.stock ?? 0), 0);
  return { price: Number(def.price), stock };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      include: { category: true, ...VARIANT_INCLUDE },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    // Allow lookup by slug OR id (admin panel uses product.id in edit links)
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: { category: true, ...VARIANT_INCLUDE },
    });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Slug "${slug}" is already taken.`);

    const hasVariants = dto.hasVariants ?? false;
    const variants = dto.variants ?? [];

    if (hasVariants) assertVariants(variants);

    const { price: derivedPrice, stock: derivedStock } = hasVariants
      ? deriveFromVariants(variants)
      : { price: dto.price, stock: dto.stock };

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: derivedPrice,
        compareAtPrice: hasVariants ? null : (dto.compareAtPrice ?? null),
        showComparePrice: hasVariants ? false : (dto.showComparePrice ?? false),
        stock: derivedStock,
        unit: dto.unit,
        images: dto.images ?? [],
        categoryId: dto.categoryId,
        hasVariants,
        showStock: dto.showStock ?? true,
        ...(hasVariants && variants.length > 0
          ? {
              variants: {
                create: variants.map((v, i) => ({
                  label: v.label,
                  price: v.price,
                  compareAtPrice: v.compareAtPrice ?? null,
                  showComparePrice: v.showComparePrice ?? false,
                  stock: v.stock ?? 0,
                  sku: v.sku ?? null,
                  isDefault: v.isDefault ?? false,
                  displayOrder: v.displayOrder ?? i,
                })),
              },
            }
          : {}),
      },
      include: { category: true, ...VARIANT_INCLUDE },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    if (dto.slug) {
      const conflict = await this.prisma.product.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    }

    const hasVariants = dto.hasVariants;
    const variants = dto.variants;

    if (hasVariants && variants) assertVariants(variants);

    // Derive price/stock from variants when toggling on
    let derivedPrice: number | undefined;
    let derivedStock: number | undefined;
    if (hasVariants && variants && variants.length > 0) {
      const d = deriveFromVariants(variants);
      derivedPrice = d.price;
      derivedStock = d.stock;
    }

    // Replace variants when a new array is supplied
    if (variants !== undefined) {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        // price: prefer derived (from variants), otherwise dto value
        price: derivedPrice ?? dto.price,
        // compareAtPrice: null when hasVariants, else dto value
        ...(hasVariants
          ? { compareAtPrice: null, showComparePrice: false }
          : {
              ...(dto.compareAtPrice !== undefined && { compareAtPrice: dto.compareAtPrice }),
              ...(dto.showComparePrice !== undefined && { showComparePrice: dto.showComparePrice }),
            }),
        stock: derivedStock ?? dto.stock,
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.images !== undefined && { images: dto.images }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(hasVariants !== undefined && { hasVariants }),
        ...(dto.showStock !== undefined && { showStock: dto.showStock }),
        // Create the replacement variant set (old ones already deleted above)
        ...(variants !== undefined && variants.length > 0
          ? {
              variants: {
                create: variants.map((v, i) => ({
                  label: v.label,
                  price: v.price,
                  compareAtPrice: v.compareAtPrice ?? null,
                  showComparePrice: v.showComparePrice ?? false,
                  stock: v.stock ?? 0,
                  sku: v.sku ?? null,
                  isDefault: v.isDefault ?? false,
                  displayOrder: v.displayOrder ?? i,
                })),
              },
            }
          : {}),
      },
      include: { category: true, ...VARIANT_INCLUDE },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted.' };
  }

  private async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }
}
