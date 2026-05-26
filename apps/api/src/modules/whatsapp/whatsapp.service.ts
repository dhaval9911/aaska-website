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

  private get serviceUrl(): string {
    return process.env.WHATSAPP_SERVICE_URL ?? 'http://whatsapp-service:3001';
  }

  private get upiId(): string {
    return process.env.UPI_ID ?? 'aaska@upi';
  }

  /** Send a plain-text message via the local whatsapp-web.js service. */
  private async send(number: string, message: string): Promise<void> {
    const url = `${this.serviceUrl}/send`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, message }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`WhatsApp service responded ${res.status}: ${body}`);
    }

    const json = (await res.json()) as { success: boolean; error?: string };
    if (!json.success) {
      throw new Error(`WhatsApp service error: ${json.error ?? 'unknown'}`);
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

      const message =
        `Hi ${order.customerName}! \n\n` +
        `Your order *#${order.orderNumber}* has been received.\n\n` +
        `*Items:*\n${itemLines}\n\n` +
        `*Total:* Rs ${Number(order.totalAmount).toLocaleString('en-IN')}\n\n` +
        `Reply on WhatsApp if you want customization details or have any questions.`;

      await this.send(order.whatsappNumber, message);
      this.logger.log(
        `Sent order confirmation for ${order.orderNumber} to ${order.whatsappNumber}`,
      );
    } catch (err) {
      this.logger.error('Failed to send order confirmation', err);
    }
  }

  async sendPaymentInstructions(order: OrderSnapshot): Promise<void> {
    try {
      const amount = Number(order.totalAmount).toLocaleString('en-IN');

      const message =
        `Payment Details\n\n` +
        `Order: *#${order.orderNumber}*\n\n` +
        `Amount: *Rs ${amount}*\n\n` +
        `UPI ID: *${this.upiId}*\n\n` +
        `Please send the payment screenshot after completing payment and we will process your order right away.`;

      await this.send(order.whatsappNumber, message);
      this.logger.log(`Sent payment instructions for ${order.orderNumber}`);
    } catch (err) {
      this.logger.error('Failed to send payment instructions', err);
    }
  }

  async sendOrderStatusUpdate(order: OrderSnapshot, status: string): Promise<void> {
    try {
      const messages: Record<string, string> = {
        CONFIRMED: `Hi ${order.customerName}!\n\nYour order *#${order.orderNumber}* has been confirmed. We will start processing it shortly.`,
        PAYMENT_PENDING: `Hi ${order.customerName}!\n\nWe are waiting for your payment for order *#${order.orderNumber}*.\n\nUPI ID: *${this.upiId}*\n\nPlease send the payment screenshot once done.`,
        PAID: `Hi ${order.customerName}!\n\nWe have received your payment for order *#${order.orderNumber}*. Thank you! We will start processing your order now.`,
        PROCESSING: `Hi ${order.customerName}!\n\nYour order *#${order.orderNumber}* is now being processed. We will notify you once it ships.`,
        SHIPPED: `Hi ${order.customerName}!\n\nGreat news! Your order *#${order.orderNumber}* has been shipped. We will share tracking details shortly.`,
        DELIVERED: `Hi ${order.customerName}!\n\nYour order *#${order.orderNumber}* has been delivered. We hope you love it! Thank you for shopping with Aaska.`,
        CANCELLED: `Hi ${order.customerName}!\n\nYour order *#${order.orderNumber}* has been cancelled. If you have any questions please reply to this message.`,
      };

      const text = messages[status];
      if (!text) return;

      await this.send(order.whatsappNumber, text);
      this.logger.log(`Sent status update (${status}) for ${order.orderNumber}`);
    } catch (err) {
      this.logger.error('Failed to send order status update', err);
    }
  }
}
