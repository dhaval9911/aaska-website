// PRIVACY: We store hashed IPs (SHA-256) + approximate city/state only.
// Raw IP addresses are never persisted. Add a line to the site's
// privacy policy disclosing approximate location analytics collection.

import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as geoip from 'geoip-lite';

import { PrismaService } from '../prisma/prisma.service';
import { TrackVisitDto } from './dto/track-visit.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(dto: TrackVisitDto, rawIp: string): Promise<void> {
    const geo = geoip.lookup(rawIp);
    const ipHash = createHash('sha256').update(rawIp).digest('hex');

    // Dedup: skip if this visitor already has a record for this path in the last 30 min
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await this.prisma.pageVisit.findFirst({
      where: {
        ipHash,
        path: dto.path,
        visitedAt: { gte: thirtyMinutesAgo },
      },
      select: { id: true },
    });
    if (existing) return;

    await this.prisma.pageVisit.create({
      data: {
        ipHash,
        country: geo?.country ?? null,
        state: geo?.region ?? null,
        city: geo?.city ?? null,
        path: dto.path,
        referrer: dto.referrer ?? null,
      },
    });
  }

  async getOverview(month: string) {
    // month format: "YYYY-MM"
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    const twelveMonthsAgo = new Date(year, mon - 13, 1);

    const [summary, daily, topLocations, topPages, trend] = await Promise.all([
      // Total visits + unique visitors for the month
      this.prisma.$queryRaw<{ visits: bigint; unique_visitors: bigint }[]>`
        SELECT
          COUNT(*)                   AS visits,
          COUNT(DISTINCT "ipHash")   AS unique_visitors
        FROM "PageVisit"
        WHERE "visitedAt" >= ${start} AND "visitedAt" < ${end}
      `,

      // Daily breakdown
      this.prisma.$queryRaw<{ date: Date; visits: bigint; unique_visitors: bigint }[]>`
        SELECT
          DATE("visitedAt")          AS date,
          COUNT(*)                   AS visits,
          COUNT(DISTINCT "ipHash")   AS unique_visitors
        FROM "PageVisit"
        WHERE "visitedAt" >= ${start} AND "visitedAt" < ${end}
        GROUP BY DATE("visitedAt")
        ORDER BY date ASC
      `,

      // Top 10 locations
      this.prisma.$queryRaw<{ state: string | null; city: string | null; count: bigint }[]>`
        SELECT state, city, COUNT(*) AS count
        FROM "PageVisit"
        WHERE "visitedAt" >= ${start} AND "visitedAt" < ${end}
          AND state IS NOT NULL
        GROUP BY state, city
        ORDER BY count DESC
        LIMIT 10
      `,

      // Top 10 pages
      this.prisma.$queryRaw<{ path: string; count: bigint }[]>`
        SELECT path, COUNT(*) AS count
        FROM "PageVisit"
        WHERE "visitedAt" >= ${start} AND "visitedAt" < ${end}
        GROUP BY path
        ORDER BY count DESC
        LIMIT 10
      `,

      // Monthly trend — last 12 months
      this.prisma.$queryRaw<{ month: string; visits: bigint; unique_visitors: bigint }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "visitedAt"), 'YYYY-MM') AS month,
          COUNT(*)                                              AS visits,
          COUNT(DISTINCT "ipHash")                             AS unique_visitors
        FROM "PageVisit"
        WHERE "visitedAt" >= ${twelveMonthsAgo}
        GROUP BY DATE_TRUNC('month', "visitedAt")
        ORDER BY month ASC
      `,
    ]);

    const totalVisits = Number(summary[0]?.visits ?? 0);
    const uniqueVisitors = Number(summary[0]?.unique_visitors ?? 0);

    return {
      totalVisits,
      uniqueVisitors,
      avgVisitsPerVisitor: uniqueVisitors > 0 ? +(totalVisits / uniqueVisitors).toFixed(1) : 0,
      dailyBreakdown: daily.map((r) => ({
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
        visits: Number(r.visits),
        uniqueVisitors: Number(r.unique_visitors),
      })),
      topLocations: topLocations.map((r) => ({
        state: r.state,
        city: r.city,
        count: Number(r.count),
      })),
      topPages: topPages.map((r) => ({
        path: r.path,
        count: Number(r.count),
      })),
      monthlyTrend: trend.map((r) => ({
        month: r.month,
        visits: Number(r.visits),
        uniqueVisitors: Number(r.unique_visitors),
      })),
    };
  }
}
