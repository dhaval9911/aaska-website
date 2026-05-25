import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type AuthedRequest = { user: { sub: string } | null };

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getCart(@Request() req: AuthedRequest, @Headers('x-cart-session') sessionId?: string) {
    return this.cartService.getCart(req.user?.sub, sessionId);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  addItem(
    @Request() req: AuthedRequest,
    @Headers('x-cart-session') sessionId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addItem(req.user?.sub, sessionId, dto);
  }

  @Patch(':id')
  @UseGuards(OptionalJwtAuthGuard)
  updateItem(
    @Param('id') id: string,
    @Request() req: AuthedRequest,
    @Headers('x-cart-session') sessionId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(id, req.user?.sub, sessionId, dto);
  }

  @Delete(':id')
  @UseGuards(OptionalJwtAuthGuard)
  removeItem(
    @Param('id') id: string,
    @Request() req: AuthedRequest,
    @Headers('x-cart-session') sessionId: string,
  ) {
    return this.cartService.removeItem(id, req.user?.sub, sessionId);
  }

  /** Merge guest cart into user cart immediately after login. */
  @Post('merge')
  @UseGuards(JwtAuthGuard)
  mergeCart(
    @Request() req: { user: { sub: string } },
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cartService.mergeCart(req.user.sub, sessionId);
  }
}
