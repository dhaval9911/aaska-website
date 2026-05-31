import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderHomeTilesDto } from './dto/reorder-home-tiles.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Fields returned on every category object (flat or nested). */
const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  image: true,
  parentId: true,
  bannerImage: true,
  homeTileImage: true,
  featuredOnHome: true,
  homeDisplayOrder: true,
  description: true,
  createdAt: true,
  _count: { select: { products: true } },
} as const;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // GET /categories  (flat, backward-compatible)
  // GET /categories?tree=true  (nested: parents with children array)
  // ---------------------------------------------------------------------------

  async findAll(tree = false) {
    if (tree) {
      return this.prisma.category.findMany({
        where: { parentId: null },
        select: {
          ...CATEGORY_SELECT,
          children: {
            select: CATEGORY_SELECT,
            orderBy: { name: 'asc' },
          },
        },
        orderBy: [{ homeDisplayOrder: 'asc' }, { name: 'asc' }],
      });
    }

    // Default: flat list ordered by creation date (existing behaviour)
    return this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // GET /categories/:slug
  // Returns category + children + products (parent includes child products too)
  // ---------------------------------------------------------------------------

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: {
        ...CATEGORY_SELECT,
        children: {
          select: CATEGORY_SELECT,
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found.');

    // For a parent category include products from every child too
    const childIds = category.children.map((c) => c.id);
    const products = await this.prisma.product.findMany({
      where: {
        categoryId: childIds.length > 0 ? { in: [category.id, ...childIds] } : category.id,
      },
      include: { category: { select: CATEGORY_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    return { ...category, products };
  }

  // ---------------------------------------------------------------------------
  // Internal: find by id (used by update / delete)
  // ---------------------------------------------------------------------------

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found.');
    return category;
  }

  // ---------------------------------------------------------------------------
  // POST /categories
  // ---------------------------------------------------------------------------

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Slug "${slug}" is already taken.`);

    // Enforce max 2-level depth
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException(`Parent category "${dto.parentId}" not found.`);
      if (parent.parentId) {
        throw new BadRequestException(
          'Subcategories can only be one level deep. The chosen parent is already a subcategory.',
        );
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        image: dto.image ?? null,
        parentId: dto.parentId ?? null,
        bannerImage: dto.bannerImage ?? null,
        homeTileImage: dto.homeTileImage ?? null,
        featuredOnHome: dto.featuredOnHome ?? false,
        homeDisplayOrder: dto.homeDisplayOrder ?? 0,
        description: dto.description ?? null,
      },
      select: CATEGORY_SELECT,
    });
  }

  // ---------------------------------------------------------------------------
  // PATCH /categories/:id
  // ---------------------------------------------------------------------------

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    if (dto.slug) {
      const conflict = await this.prisma.category.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent.');
      }
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException(`Parent category "${dto.parentId}" not found.`);
      if (parent.parentId) {
        throw new BadRequestException(
          'Subcategories can only be one level deep. The chosen parent is already a subcategory.',
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.image !== undefined && { image: dto.image }),
        // parentId: null explicitly clears the parent (promotes to top-level)
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.bannerImage !== undefined && { bannerImage: dto.bannerImage }),
        ...(dto.homeTileImage !== undefined && { homeTileImage: dto.homeTileImage }),
        ...(dto.featuredOnHome !== undefined && { featuredOnHome: dto.featuredOnHome }),
        ...(dto.homeDisplayOrder !== undefined && { homeDisplayOrder: dto.homeDisplayOrder }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      select: CATEGORY_SELECT,
    });
  }

  // ---------------------------------------------------------------------------
  // PATCH /categories/home-order  (bulk re-order homepage tiles)
  // ---------------------------------------------------------------------------

  async reorderHomeTiles(dto: ReorderHomeTilesDto) {
    await this.prisma.$transaction(
      dto.tiles.map(({ id, homeDisplayOrder }) =>
        this.prisma.category.update({
          where: { id },
          data: { homeDisplayOrder },
        }),
      ),
    );

    // Return the updated featured set in new order
    return this.prisma.category.findMany({
      where: { featuredOnHome: true },
      select: CATEGORY_SELECT,
      orderBy: [{ homeDisplayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  // ---------------------------------------------------------------------------
  // DELETE /categories/:id
  // ---------------------------------------------------------------------------

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted.' };
  }
}
