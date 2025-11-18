export type FuelKind = 'gas' | 'hybrid' | 'phev' | 'ev';

export interface Preferences {
  hardFilters?: {
    price?: { min?: number; max?: number };
    vehicleType?: string[];
    fuelType?: FuelKind[];
    brands?: string[];
    year?: { min?: number; max?: number };
  };
  weights?: {
    priceFit?: number;
    fuel?: number;
    vehicleType?: number;
    safety?: number;
    technology?: number;
    space?: number;
    performance?: number;
  };
  topN?: number;
}

export interface Contribution {
  priceFit?: number;
  fuel?: number;
  vehicleType?: number;
  safety?: number;
  technology?: number;
  space?: number;
  performance?: number;
}

export interface ScoredCarResult {
  carId: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string | null;
  priceLower: number | null;
  priceUpper: number | null;
  overall: number;
  contributions: Contribution;
}

