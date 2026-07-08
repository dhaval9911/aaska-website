import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { TrackVisitDto } from './dto/track-visit.dto';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Public — fire-and-forget visit tracker. */
  @Post('analytics/track')
  @HttpCode(204)
  async track(@Body() dto: TrackVisitDto, @Req() req: Request): Promise<void> {
    // Respect X-Forwarded-For set by Nginx/Cloudflare; use the leftmost (real client) IP.
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp =
      (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded?.[0])?.trim() ??
      req.socket.remoteAddress ??
      '127.0.0.1';

    // Non-blocking — never let analytics errors affect the response
    this.analyticsService.track(dto, rawIp).catch(() => undefined);
  }

  /** Admin — monthly analytics overview. */
  @Get('admin/analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getOverview(@Query('month') month?: string) {
    const target = month ?? new Date().toISOString().slice(0, 7); // "YYYY-MM"
    return this.analyticsService.getOverview(target);
  }
}
