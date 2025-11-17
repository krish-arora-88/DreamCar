import { z } from 'zod';

export const searchFormSchema = z.object({
  priceMax: z.coerce.number().min(1000).max(500000).optional(),
  priceMin: z.coerce.number().min(0).max(500000).optional(),
  vehicleTypes: z.array(z.string()).optional(),
  fuelTypes: z.array(z.enum(['gas', 'hybrid', 'phev', 'ev'])).optional(),
  brands: z.array(z.string()).optional(),
  yearMin: z.coerce.number().min(1990).max(2030).optional(),
  yearMax: z.coerce.number().min(1990).max(2030).optional(),
  weightPriceFit: z.coerce.number().min(0).max(10).default(2),
  weightFuel: z.coerce.number().min(0).max(10).default(1),
  weightVehicleType: z.coerce.number().min(0).max(10).default(1),
});

export type SearchFormData = z.infer<typeof searchFormSchema>;

