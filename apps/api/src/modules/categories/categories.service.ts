import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found.');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Slug "${slug}" is already taken.`);

    return this.prisma.category.create({
      data: { name: dto.name, slug, image: dto.image },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    if (dto.slug) {
      const conflict = await this.prisma.category.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`Slug "${dto.slug}" is already taken.`);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.image !== undefined && { image: dto.image }),
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted.' };
  }
}
