import { Body, Controller, Get, HttpCode, Logger, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';

interface WaButtonReply {
  id: string; // e.g. "confirm_<orderId>" or "cancel_<orderId>"
  title: string;
}

interface WaMessage {
  type: 'interactive' | 'text';
  interactive?: {
    type: 'button_reply';
    button_reply: WaButtonReply;
  };
  from: string;
}

interface WaWebhookBody {
  object: string;
  entry?: {
    changes?: {
      value?: {
        messages?: WaMessage[];
      };
    }[];
  }[];
}

@Controller('webhooks/whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {}

  /** Meta webhook verification handshake */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? '';
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  /** Incoming messages from Meta */
  @Post()
  @HttpCode(200)
  async handleIncoming(@Body() body: WaWebhookBody) {
    try {
      const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
      if (!messages?.length) return { status: 'ok' };

      for (const msg of messages) {
        if (msg.type !== 'interactive' || msg.interactive?.type !== 'button_reply') continue;

        const replyId = msg.interactive.button_reply.id; // "confirm_<id>" | "cancel_<id>"
        const [action, orderId] = replyId.split('_');

        if (!orderId) continue;

        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
          this.logger.warn(`Webhook received reply for unknown order ${orderId}`);
          continue;
        }

        if (action === 'confirm') {
          await this.prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CONFIRMED },
          });
          this.logger.log(`Order ${order.orderNumber} confirmed via WhatsApp`);
          await this.whatsappService.sendPaymentInstructions({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            whatsappNumber: order.whatsappNumber,
            totalAmount: order.totalAmount.toString(),
            items: (order.items as { name: string; quantity: number; price: number }[]) ?? [],
          });
        } else if (action === 'cancel') {
          await this.prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CANCELLED },
          });
          this.logger.log(`Order ${order.orderNumber} cancelled via WhatsApp`);
          await this.whatsappService.sendOrderStatusUpdate(
            {
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              whatsappNumber: order.whatsappNumber,
              totalAmount: order.totalAmount.toString(),
              items: [],
            },
            'CANCELLED',
          );
        }
      }
    } catch (err) {
      this.logger.error('Error processing WhatsApp webhook', err);
    }

    return { status: 'ok' };
  }
}
