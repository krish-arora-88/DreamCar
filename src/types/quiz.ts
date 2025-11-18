export interface QuizAnswers {
  [questionId: string]: string | number | boolean;
}

export interface AnalyzedPreferences {
  hardFilters?: {
    price?: { min?: number; max?: number };
    vehicleType?: string[];
    fuelType?: ('gas' | 'hybrid' | 'phev' | 'ev')[];
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
  reasoning?: string; // GPT explanation of why these weights were chosen
}

