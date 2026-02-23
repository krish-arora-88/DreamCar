import { z } from 'zod';

export const PreferencesSchema = z.object({
  hardFilters: z
    .object({
      price: z
        .object({
          min: z.number().min(0).optional(),
          max: z.number().min(0).optional(),
        })
        .optional(),
      vehicleType: z.array(z.string()).optional(),
      fuelType: z.array(z.enum(['gas', 'hybrid', 'phev', 'ev'])).optional(),
      brands: z.array(z.string()).optional(),
      year: z
        .object({
          min: z.number().int().min(1900).max(2100).optional(),
          max: z.number().int().min(1900).max(2100).optional(),
        })
        .optional(),
    })
    .optional(),
  weights: z
    .object({
      priceFit: z.number().min(0).optional(),
      fuel: z.number().min(0).optional(),
      vehicleType: z.number().min(0).optional(),
      safety: z.number().min(0).optional(),
      technology: z.number().min(0).optional(),
      space: z.number().min(0).optional(),
      performance: z.number().min(0).optional(),
    })
    .optional(),
  criteriaImportance: z.record(z.string(), z.number().min(0).max(1)).optional(),
  topN: z.number().int().min(1).max(100).optional(),
});

export type ValidatedPreferences = z.infer<typeof PreferencesSchema>;

const scaleField = z.number().int().min(1).max(5);

export const QuizV2AnswersSchema = z.object({
  budget_range: z.enum(['under_25k', '25_35k', '35_50k', '50_75k', '75_100k', '100k_plus']),
  body_style: z.array(z.string()).min(1),
  plug_in_openness: z.enum(['gas_only', 'open_hybrid', 'plugin_sometimes', 'must_ev', 'open_anything']),
  running_costs: scaleField,
  quickness: scaleField,
  braking_confidence: scaleField,
  driving_vibe: z.enum(['relaxed', 'balanced', 'sporty']),
  quiet_cabin: scaleField,
  front_seat_fit: scaleField,
  adjustability: scaleField,
  tech_lag: scaleField,
  screen_readability: scaleField,
  simple_controls: z.enum(['real_buttons', 'mix', 'all_screen']),
  parking_help: scaleField,
  messy_weather_camera: z.boolean(),
  small_item_storage: scaleField,
  back_seat_usage: z.enum(['almost_never', 'sometimes', 'often']),
  back_seat_priorities: z.array(z.string()).optional(),
  kids_car_seats: z.enum(['yes', 'maybe_soon', 'no']).optional(),
  back_seat_comfort_details: scaleField.optional(),
  cargo_frequency: z.enum(['rarely', 'sometimes', 'often']),
  cargo_usability: z.array(z.string()).optional(),
  safety_rating: scaleField,
  visibility_confidence: scaleField,
  solid_build: scaleField,
  clean_honest_design: z.enum(['simple', 'little_drama', 'bold_flashy']),
  easy_entry_exit: z.boolean(),
  reliability: scaleField,
});
