import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

type AuthedRequest = { user: { sub: string; role: string } | null };

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Create order from current cart — works for guests and logged-in users. */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  createOrder(
    @Request() req: AuthedRequest,
    @Headers('x-cart-session') sessionId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user?.sub, sessionId, dto);
  }

  /** Logged-in user's order history. */
  @Get()
  @UseGuards(JwtAuthGuard)
  getUserOrders(@Request() req: { user: { sub: string } }) {
    return this.ordersService.getUserOrders(req.user.sub);
  }

  /** Admin: all orders with optional status filter. */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAllOrders(@Query('status') status?: string) {
    return this.ordersService.getAllOrders(status);
  }

  /** Admin: dashboard stats. */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.ordersService.getAdminStats();
  }

  /** Public order detail — orderId is a cuid (hard to guess). */
  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  /** Admin: update order status. */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
