import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { Preferences } from '../src/types/preferences';
import { scoreCars } from '../src/scoring/weighted';

const prisma = new PrismaClient();

async function run() {
  const prefsPath = process.argv[2];
  const topN = Number(process.argv[3] ?? '10');
  if (!prefsPath) {
    console.error('Usage: tsx scripts/search.ts <preferences.json> [topN]');
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), prefsPath);
  const raw = fs.readFileSync(abs, 'utf8');
  const prefs = JSON.parse(raw) as Preferences;

  // Hard filters in query
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
    // Keep cars whose lower (or median) price is <= max, as an SQL prefilter
    where.OR = [
      { priceLower: { lte: prefs.hardFilters.price.max } },
      { priceUpper: { lte: prefs.hardFilters.price.max } },
    ];
  }

  const cars = await prisma.car.findMany({ where, take: 2000 });

  // Additional hard filter: fuel set
  const fuelAllowed = prefs.hardFilters?.fuelType ?? [];
  const filteredByFuel = cars.filter((c) => {
    if (fuelAllowed.length === 0) return true;
    return (
      (fuelAllowed.includes('gas') && c.gas === true) ||
      (fuelAllowed.includes('hybrid') && c.hybrid === true) ||
      (fuelAllowed.includes('phev') && c.phev === true) ||
      (fuelAllowed.includes('ev') && c.ev === true)
    );
  });

  const scored = scoreCars(filteredByFuel, prefs);
  const n = isFinite(topN) ? Math.max(1, Math.min(topN, 100)) : 10;
  const top = scored.slice(0, n);
  console.log(JSON.stringify({ items: top }, null, 2));
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


