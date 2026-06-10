import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartItem } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  images: true,
  unit: true,
  stock: true,
  hasVariants: true,
} as const;

const VARIANT_SELECT = {
  id: true,
  label: true,
  price: true,
  stock: true,
} as const;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId?: string, sessionId?: string) {
    const where = this.buildWhere(userId, sessionId);
    if (!where) return [];

    return this.prisma.cartItem.findMany({
      where,
      include: {
        product: { select: PRODUCT_SELECT },
        variant: { select: VARIANT_SELECT },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addItem(userId: string | undefined, sessionId: string | undefined, dto: AddToCartDto) {
    if (!userId && !sessionId) throw new BadRequestException('No cart identity provided.');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found.');

    // Variant validation
    if (product.hasVariants) {
      if (!dto.variantId) {
        throw new BadRequestException('This product requires a variant selection.');
      }
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: dto.variantId, productId: dto.productId },
      });
      if (!variant) throw new NotFoundException('Variant not found.');
      if (variant.stock === 0) throw new BadRequestException('This variant is out of stock.');
    } else {
      if (product.stock === 0) throw new BadRequestException('Product is out of stock.');
    }

    const qty = dto.quantity ?? 1;
    const variantId = product.hasVariants ? dto.variantId : undefined;

    if (userId) {
      return this.upsertItem({ userId, productId: dto.productId }, { userId }, qty, variantId);
    }
    return this.upsertItem(
      { sessionId: sessionId!, productId: dto.productId },
      { sessionId },
      qty,
      variantId,
    );
  }

  private async upsertItem(
    uniqueWhere: { userId?: string; sessionId?: string; productId: string },
    createOwner: { userId?: string; sessionId?: string },
    qty: number,
    variantId?: string,
  ) {
    const prismaWhere =
      'userId' in uniqueWhere && uniqueWhere.userId
        ? { userId_productId: { userId: uniqueWhere.userId!, productId: uniqueWhere.productId } }
        : {
            sessionId_productId: {
              sessionId: uniqueWhere.sessionId!,
              productId: uniqueWhere.productId,
            },
          };

    const existing = await this.prisma.cartItem.findUnique({ where: prismaWhere });

    const includeOpts = {
      product: { select: PRODUCT_SELECT },
      variant: { select: VARIANT_SELECT },
    };

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + qty,
          ...(variantId !== undefined && { variantId }),
        },
        include: includeOpts,
      });
    }

    return this.prisma.cartItem.create({
      data: {
        ...createOwner,
        productId: uniqueWhere.productId,
        quantity: qty,
        ...(variantId !== undefined && { variantId }),
      },
      include: includeOpts,
    });
  }

  async updateItem(
    id: string,
    userId: string | undefined,
    sessionId: string | undefined,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.findAndAssertOwner(id, userId, sessionId);

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
      return { deleted: true };
    }

    return this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
      include: {
        product: { select: PRODUCT_SELECT },
        variant: { select: VARIANT_SELECT },
      },
    });
  }

  async removeItem(id: string, userId: string | undefined, sessionId: string | undefined) {
    const item = await this.findAndAssertOwner(id, userId, sessionId);
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return { deleted: true };
  }

  async mergeCart(userId: string, sessionId: string | undefined) {
    if (!sessionId) return { merged: 0 };

    const guestItems = await this.prisma.cartItem.findMany({ where: { sessionId } });

    for (const guestItem of guestItems) {
      const existing = await this.prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId: guestItem.productId } },
      });

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + guestItem.quantity },
        });
        await this.prisma.cartItem.delete({ where: { id: guestItem.id } });
      } else {
        await this.prisma.cartItem.update({
          where: { id: guestItem.id },
          data: { userId, sessionId: null },
        });
      }
    }

    return { merged: guestItems.length };
  }

  private buildWhere(userId?: string, sessionId?: string) {
    if (userId) return { userId };
    if (sessionId) return { sessionId };
    return null;
  }

  private async findAndAssertOwner(
    id: string,
    userId?: string,
    sessionId?: string,
  ): Promise<CartItem> {
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Cart item not found.');
    if (userId && item.userId !== userId) throw new ForbiddenException();
    if (!userId && item.sessionId !== sessionId) throw new ForbiddenException();
    return item;
  }
}
