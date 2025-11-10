export const runtime = 'nodejs';

import { prisma } from '../../../lib/prisma';
import type { Preferences } from '../../../types/preferences';
import { scoreCars } from '../../../scoring/weighted';
import { cacheGet, cacheSet } from '../../../lib/cache';
import { preferenceSignature } from '../../../utils/hash';

export async function POST(req: Request): Promise<Response> {
  try {
    const prefs = (await req.json()) as Preferences;
    const signature = preferenceSignature(prefs);

    const cached = await cacheGet<{ items: unknown[] }>(`search:${signature}`);
    if (cached) {
      return Response.json({ ...cached, signature });
    }

    const where: any = {};
    if (prefs.hardFilters?.brands && prefs.hardFilters.brands.length > 0) {
      where.make = { in: prefs.hardFilters.brands };
    }
    if (prefs.hardFilters?.vehicleType && prefs.hardFilters.vehicleType.length > 0) {
      where.vehicleType = { in: prefs.hardFilters.vehicleType };
    }
    if (prefs.hardFilters?.year?.min != null || prefs.hardFilters?.year?.max != null) {
      where.year = {};
      if (prefs.hardFilters.year.min != null) where.year.gte = prefs.hardFilters.year.min;
      if (prefs.hardFilters.year.max != null) where.year.lte = prefs.hardFilters.year.max;
    }
    if (prefs.hardFilters?.price?.max != null) {
      where.OR = [
        { priceLower: { lte: prefs.hardFilters.price.max } },
        { priceUpper: { lte: prefs.hardFilters.price.max } },
      ];
    }

    const cars = await prisma.car.findMany({ where, take: 2000 });

    const fuelAllowed = prefs.hardFilters?.fuelType ?? [];
    const filtered = cars.filter((c) => {
      if (fuelAllowed.length === 0) return true;
      return (
        (fuelAllowed.includes('gas') && c.gas === true) ||
        (fuelAllowed.includes('hybrid') && c.hybrid === true) ||
        (fuelAllowed.includes('phev') && c.phev === true) ||
        (fuelAllowed.includes('ev') && c.ev === true)
      );
    });

    const scored = scoreCars(filtered, prefs);
    const n = prefs.topN ?? 10;
    const top = scored.slice(0, Math.max(1, Math.min(100, n)));
    const payload = { items: top };
    await cacheSet(`search:${signature}`, payload);
    return Response.json({ ...payload, signature });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}


