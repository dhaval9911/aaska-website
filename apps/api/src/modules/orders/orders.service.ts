import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

interface CartItemSnapshot {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
  unit: string;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    userId: string | undefined,
    sessionId: string | undefined,
    dto: CreateOrderDto,
  ) {
    // Pull live cart
    const cartWhere = userId ? { userId } : sessionId ? { sessionId } : null;
    if (!cartWhere) throw new BadRequestException('No cart identity provided.');

    const cartItems = await this.prisma.cartItem.findMany({
      where: cartWhere,
      include: {
        product: { select: { id: true, name: true, price: true, images: true, unit: true } },
      },
    });

    if (cartItems.length === 0) throw new BadRequestException('Your cart is empty.');

    // Build item snapshot (price locked at order time)
    const items: CartItemSnapshot[] = cartItems.map((ci) => ({
      productId: ci.productId,
      name: ci.product.name,
      price: Number(ci.product.price),
      quantity: ci.quantity,
      images: ci.product.images,
      unit: ci.product.unit,
    }));

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Generate sequential order number within the current year
    const orderNumber = await this.generateOrderNumber();

    // Normalise WhatsApp number to 91XXXXXXXXXX
    const wa = `91${dto.whatsappNumber.replace(/\D/g, '').slice(-10)}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: userId ?? null,
        customerName: dto.customerName,
        whatsappNumber: wa,
        items: items as unknown as Prisma.InputJsonValue,
        totalAmount,
        shippingAddress: dto.shippingAddress,
        notes: dto.notes,
      },
    });

    // Clear cart after successful order creation
    await this.prisma.cartItem.deleteMany({ where: cartWhere });

    return order;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        items: true,
      },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    return this.prisma.order.update({ where: { id }, data: { status: dto.status } });
  }

  /** AASKA-YYYY-NNN — resets counter each calendar year */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    return `AASKA-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
