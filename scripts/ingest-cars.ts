import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

type Nullable<T> = T | null;

const prisma = new PrismaClient();

function parseCurrencyToInt(value: string | undefined): Nullable<number> {
  if (!value) return null;
  const cleaned = value.replace(/[$,\s]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number.parseFloat(cleaned);
  if (Number.isNaN(n)) return null;
  return Math.round(n); // store whole dollars
}

function parseBoolean(value: string | undefined): Nullable<boolean> {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (v === 'true' || v === 'yes' || v === 'y' || v === '1') return true;
  if (v === 'false' || v === 'no' || v === 'n' || v === '0') return false;
  return null;
}

function parseIntSafe(value: string | undefined): Nullable<number> {
  if (value == null || value.trim() === '') return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function normalizeKey(key: string): string {
  return key
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const inputPathArg = process.argv[2] ?? "data/Cars_Nov_4_2025.csv";
  const inputPath = path.resolve(process.cwd(), inputPathArg);

  if (!fs.existsSync(inputPath)) {
    console.error(`CSV not found at: ${inputPath}`);
    process.exit(1);
  }

  const parser = fs
    .createReadStream(inputPath)
    .pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      })
    );

  let imported = 0;
  for await (const rawRecord of parser) {
    // Record keys match the CSV header exactly; normalize where we read
    const record = Object.fromEntries(
      Object.entries(rawRecord).map(([k, v]) => [normalizeKey(k), typeof v === 'string' ? v.trim() : v])
    ) as Record<string, string>;

    const make = record['Make'];
    const model = record['Model'];
    const year = parseIntSafe(record['Model Year']);
    if (!make || !model || year == null) {
      // Skip rows without core identity
      continue;
    }

    const vehicleType = record['Type'] || null;
    const priceLower = parseCurrencyToInt(record['Price LL']);
    const priceUpper = parseCurrencyToInt(record['Price UL']);
    const score = (() => {
      const n = parseIntSafe(record['Score']);
      if (n == null || n < 0) return null;
      return n;
    })();

    const gas = parseBoolean(record['Gas']);
    const hybrid = parseBoolean(record['Hybrid']);
    const phev = parseBoolean(record['PHEV']);
    const ev = parseBoolean(record['EV']);
    const transmission = record['Transmission'] || null;

    // Collect remaining fields into features JSON
    const handled = new Set([
      'Make',
      'Model',
      'Model Year',
      'Type',
      'Price LL',
      'Price UL',
      'Score',
      'Gas',
      'Hybrid',
      'PHEV',
      'EV',
      'Transmission',
    ]);

    const features: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, val] of Object.entries(record)) {
      if (handled.has(key)) continue;
      const text = typeof val === 'string' ? val.trim() : '';
      if (text === '') {
        features[key] = null;
        continue;
      }
      const asBool = parseBoolean(text);
      if (asBool !== null) {
        features[key] = asBool;
        continue;
      }
      const asNum = Number(text.replace(/,/g, ''));
      if (!Number.isNaN(asNum) && text !== '') {
        features[key] = asNum;
        continue;
      }
      features[key] = text;
    }

    await prisma.car.upsert({
      where: {
        make_model_year: {
          make,
          model,
          year: year as number,
        },
      },
      update: {
        vehicleType,
        priceLower,
        priceUpper,
        score,
        gas,
        hybrid,
        phev,
        ev,
        transmission,
        features: features as Prisma.InputJsonObject,
      },
      create: {
        make,
        model,
        year: year as number,
        vehicleType,
        priceLower,
        priceUpper,
        score,
        gas,
        hybrid,
        phev,
        ev,
        transmission,
        features: features as Prisma.InputJsonObject,
      },
    });

    imported += 1;
    if (imported % 100 === 0) {
      console.log(`Imported ${imported} rows...`);
    }
  }

  console.log(`Done. Imported/updated ${imported} cars.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


