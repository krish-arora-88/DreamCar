export type QuizV2Answers = Record<string, string | string[] | number | boolean>;

export interface QuizV2Question {
  id: string;
  section?: string;
  title: string;
  helper?: string;
  type: 'single' | 'multi' | 'scale' | 'yesno';
  options?: { value: string; label: string }[];
  scale?: { min: 1; max: 5; labels: { 1: string; 3?: string; 5: string } };
  maxSelect?: number;
  showIf?: (answers: QuizV2Answers) => boolean;
}

export interface DerivedPreferences {
  hardFilters: {
    price?: { min?: number; max?: number };
    vehicleType?: string[];
    fuelType?: ('gas' | 'hybrid' | 'phev' | 'ev')[];
    brands?: string[];
    year?: { min?: number; max?: number };
  };
  weights: {
    priceFit: number;
    fuel: number;
    vehicleType: number;
    safety: number;
    technology: number;
    space: number;
    performance: number;
  };
  criteriaImportance: Record<string, number>;
  mustHaves?: string[];
  avoid?: string[];
  reasoning: string;
}
