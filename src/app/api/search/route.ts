export const runtime = 'nodejs';

import { prisma } from '../../../lib/prisma';
import type { Preferences } from '../../../types/preferences';
import { scoreCars } from '../../../scoring/weighted';
import { cacheGet, cacheSet } from '../../../lib/cache';
import { preferenceSignature } from '../../../utils/hash';
import { PreferencesSchema } from '../../../lib/api-schemas';
import { withTelemetry } from '../../../lib/telemetry';

async function handler(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const parsed = PreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid preferences', details: parsed.error.flatten() }),
      { status: 400 },
    );
  }

  const prefs: Preferences = {
    ...parsed.data,
    topN: Math.max(1, Math.min(100, parsed.data.topN ?? 10)),
  };

  const signature = preferenceSignature(prefs);

  const cached = await cacheGet<{ items: unknown[] }>(`search:${signature}`);
  if (cached) {
    return Response.json({ ...cached, signature });
  }

  const where: Record<string, unknown> = {};
  if (prefs.hardFilters?.brands && prefs.hardFilters.brands.length > 0) {
    where.make = { in: prefs.hardFilters.brands };
  }
  if (prefs.hardFilters?.vehicleType && prefs.hardFilters.vehicleType.length > 0) {
    where.vehicleType = { in: prefs.hardFilters.vehicleType };
  }
  if (prefs.hardFilters?.year?.min != null || prefs.hardFilters?.year?.max != null) {
    const yearFilter: Record<string, number> = {};
    if (prefs.hardFilters!.year!.min != null) yearFilter.gte = prefs.hardFilters!.year!.min;
    if (prefs.hardFilters!.year!.max != null) yearFilter.lte = prefs.hardFilters!.year!.max;
    where.year = yearFilter;
  }
  if (prefs.hardFilters?.price?.max != null) {
    where.OR = [
      { priceLower: { lte: prefs.hardFilters.price.max } },
      { priceUpper: { lte: prefs.hardFilters.price.max } },
    ];
  }

  const queryStart = Date.now();
  const cars = await prisma.car.findMany({
    where,
    take: 2000,
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      vehicleType: true,
      priceLower: true,
      priceUpper: true,
      gas: true,
      hybrid: true,
      phev: true,
      ev: true,
      transmission: true,
      features: true,
    },
  });
  const queryMs = Date.now() - queryStart;
  console.log(JSON.stringify({ event: 'prisma_query', table: 'car', rows: cars.length, durationMs: queryMs }));

  const fuelAllowed = prefs.hardFilters?.fuelType ?? [];
  const filtered = cars.filter((c) => {
    if (fuelAllowed.length === 0) return true;
    // If the car has no fuel data at all, include it rather than excluding
    const hasFuelData = c.gas === true || c.hybrid === true || c.phev === true || c.ev === true;
    if (!hasFuelData) return true;
    return (
      (fuelAllowed.includes('gas') && c.gas === true) ||
      (fuelAllowed.includes('hybrid') && c.hybrid === true) ||
      (fuelAllowed.includes('phev') && c.phev === true) ||
      (fuelAllowed.includes('ev') && c.ev === true)
    );
  });

  const scored = scoreCars(filtered as any, prefs);
  const top = scored.slice(0, prefs.topN!);
  const payload = { items: top };
  await cacheSet(`search:${signature}`, payload);
  return Response.json({ ...payload, signature });
}

export const POST = withTelemetry('/api/search', handler);
