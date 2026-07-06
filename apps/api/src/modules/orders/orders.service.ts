import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
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
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
  ) {}

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

    // Send WhatsApp confirmation request — non-blocking; errors must never fail the order
    const orderSnapshot = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      whatsappNumber: order.whatsappNumber,
      totalAmount: order.totalAmount.toString(),
      items,
    };

    // Notify customer
    this.whatsapp
      .sendOrderConfirmationRequest(orderSnapshot)
      .catch((err) => this.logger.error('WhatsApp customer notification failed', err));

    // Notify owner
    this.whatsapp
      .sendOwnerNewOrderAlert(orderSnapshot)
      .catch((err) => this.logger.error('WhatsApp owner notification failed', err));

    return order;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId, deletedAt: null },
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

  async getAllOrders(status?: string) {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        whatsappNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        items: true,
      },
    });
  }

  async getTrashedOrders() {
    return this.prisma.order.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        whatsappNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        items: true,
      },
    });
  }

  async getAdminStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, pendingConfirmations, monthRevenue] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: todayStart }, deletedAt: null },
      }),
      this.prisma.order.count({
        where: { status: 'PENDING_WHATSAPP' as never, deletedAt: null },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: monthStart },
          status: 'DELIVERED' as never,
          deletedAt: null,
        },
      }),
    ]);

    return {
      todayOrders,
      pendingConfirmations,
      monthlyRevenue: Number(monthRevenue._sum.totalAmount ?? 0),
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.deletedAt) throw new BadRequestException('Cannot update a deleted order.');

    const updated = await this.prisma.order.update({ where: { id }, data: { status: dto.status } });

    const notifyStatuses = [
      'CONFIRMED',
      'PAYMENT_PENDING',
      'PAID',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    if (notifyStatuses.includes(dto.status)) {
      this.whatsapp
        .sendOrderStatusUpdate(
          {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            whatsappNumber: order.whatsappNumber,
            totalAmount: order.totalAmount.toString(),
            items: [],
          },
          dto.status,
        )
        .catch((err) => this.logger.error('WhatsApp status update failed', err));
    }

    return updated;
  }

  async softDeleteOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.deletedAt) throw new BadRequestException('Order is already in trash.');
    return this.prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restoreOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    if (!order.deletedAt) throw new BadRequestException('Order is not in trash.');
    return this.prisma.order.update({ where: { id }, data: { deletedAt: null } });
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
