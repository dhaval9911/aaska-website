import { Injectable, Logger } from '@nestjs/common';

interface OrderSnapshot {
  id: string;
  orderNumber: string;
  customerName: string;
  whatsappNumber: string;
  totalAmount: string | number;
  items: { name: string; quantity: number; price: number }[];
  shippingAddress?: string | null;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private get phoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
  }
  private get accessToken() {
    return process.env.WHATSAPP_ACCESS_TOKEN ?? '';
  }
  private get apiUrl() {
    return `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
  }
  private get upiId() {
    return process.env.UPI_ID ?? 'aaska@upi';
  }
  private get publicUrl() {
    return process.env.PUBLIC_URL ?? 'http://localhost';
  }

  private isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  private async send(payload: Record<string, unknown>): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn('WhatsApp not configured — skipping message send');
      return;
    }

    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`WhatsApp API error ${res.status}: ${body}`);
    }
  }

  async sendOrderConfirmationRequest(order: OrderSnapshot): Promise<void> {
    try {
      const itemLines = order.items
        .map(
          (i) =>
            `- ${i.name} x${i.quantity} = Rs ${(i.price * i.quantity).toLocaleString('en-IN')}`,
        )
        .join('\n');

      const body =
        `Hi ${order.customerName}! Your order *${order.orderNumber}* has been placed.\n\n` +
        `*Items:*\n${itemLines}\n\n` +
        `*Total:* Rs ${Number(order.totalAmount).toLocaleString('en-IN')}\n\n` +
        `Please confirm or cancel your order below.`;

      await this.send({
        recipient_type: 'individual',
        to: order.whatsappNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: body },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: { id: `confirm_${order.id}`, title: 'Confirm Order' },
              },
              {
                type: 'reply',
                reply: { id: `cancel_${order.id}`, title: 'Cancel' },
              },
            ],
          },
        },
      });

      this.logger.log(`Sent order confirmation request for ${order.orderNumber}`);
    } catch (err) {
      this.logger.error('Failed to send order confirmation request', err);
    }
  }

  async sendPaymentInstructions(order: OrderSnapshot): Promise<void> {
    try {
      const amount = Number(order.totalAmount).toLocaleString('en-IN');
      const caption =
        `Your order *${order.orderNumber}* is confirmed!\n\n` +
        `Please pay *Rs ${amount}* to:\n` +
        `UPI ID: *${this.upiId}*\n\n` +
        `After payment, send us the screenshot and we will process your order right away. Thank you!`;

      await this.send({
        to: order.whatsappNumber,
        type: 'image',
        image: {
          link: `${this.publicUrl}/uploads/payment/upi-qr.jpg`,
          caption,
        },
      });

      this.logger.log(`Sent payment instructions for ${order.orderNumber}`);
    } catch (err) {
      this.logger.error('Failed to send payment instructions', err);
    }
  }

  async sendOrderStatusUpdate(order: OrderSnapshot, status: string): Promise<void> {
    try {
      const messages: Record<string, string> = {
        SHIPPED: `Great news! Your order *${order.orderNumber}* has been shipped. We will share tracking details shortly.`,
        DELIVERED: `Your order *${order.orderNumber}* has been delivered! We hope you love it. Thank you for shopping with Aaska.`,
        CANCELLED: `Your order *${order.orderNumber}* has been cancelled. If you have any questions please reply to this message.`,
      };

      const text = messages[status];
      if (!text) return;

      await this.send({
        to: order.whatsappNumber,
        type: 'text',
        text: { body: text },
      });

      this.logger.log(`Sent status update (${status}) for ${order.orderNumber}`);
    } catch (err) {
      this.logger.error('Failed to send order status update', err);
    }
  }
}
