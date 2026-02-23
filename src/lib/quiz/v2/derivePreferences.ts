import { CRITERIA_KEYS, CRITERIA_CATEGORIES } from '@/config/criteria';
import type { CriterionKey } from '@/config/criteria';
import type { QuizV2Answers, DerivedPreferences } from '@/types/quiz';
import type { FuelKind } from '@/types/preferences';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Map a 1–5 scale answer to 0.1 … 0.9 importance. */
function impScale(v: number): number {
  return 0.1 + (v - 1) * 0.2;
}

function avgImportance(
  ci: Record<CriterionKey, number>,
  keys: readonly CriterionKey[],
): number {
  return keys.reduce((s, k) => s + ci[k], 0) / keys.length;
}

// ── helpers that mutate the importance map in-place ───────────────

function setImp(ci: Record<CriterionKey, number>, keys: readonly CriterionKey[], v: number) {
  for (const k of keys) ci[k] = clamp01(v);
}

function addImp(ci: Record<CriterionKey, number>, keys: readonly CriterionKey[], delta: number) {
  for (const k of keys) ci[k] = clamp01(ci[k] + delta);
}

function maxImp(ci: Record<CriterionKey, number>, keys: readonly CriterionKey[], v: number) {
  for (const k of keys) ci[k] = clamp01(Math.max(ci[k], v));
}

// ── criteria groupings for conditional questions ─────────────────

const BACKSEAT_CRITERIA: readonly CriterionKey[] = [
  'backseat_headroom', 'backseat_kneeroom', 'backseat_incline',
  'backseat_deep_footwell', 'backseat_flat_floor', 'backseat_isofix',
  'backseat_armrest_cover', 'backseat_seat_belts_pos',
  'backseat_rear_windows_roll', 'rear_a_c_port_climate',
];

const CARGO_CRITERIA: readonly CriterionKey[] = [
  'boot_lip', 'flat_boot', 'easily_foldable_seats', 'load_cover_fits_inside',
];

const STORAGE_CRITERIA: readonly CriterionKey[] = [
  'centre_cubby', 'doorbins_front', 'doorbins_back', 'cup_holder',
  'glovebox', 'seatback_pocket', 'sunglass_storage', 'charging_ports',
];

const BACKSEAT_PRIORITY_MAP: Record<string, CriterionKey> = {
  legroom: 'backseat_kneeroom',
  headroom: 'backseat_headroom',
  foot_space: 'backseat_deep_footwell',
  recline: 'backseat_incline',
  flat_floor: 'backseat_flat_floor',
  rear_windows: 'backseat_rear_windows_roll',
  armrest: 'backseat_armrest_cover',
  rear_climate: 'rear_a_c_port_climate',
};

const CARGO_USABILITY_MAP: Record<string, CriterionKey> = {
  easy_lift: 'boot_lip',
  flat_floor: 'flat_boot',
  fold_seats: 'easily_foldable_seats',
  cover_stores: 'load_cover_fits_inside',
};

// ── main entry point ─────────────────────────────────────────────

export function derivePreferences(answers: QuizV2Answers): DerivedPreferences {
  const ci = {} as Record<CriterionKey, number>;
  for (const key of CRITERIA_KEYS) ci[key] = 0.15;

  const hardFilters: DerivedPreferences['hardFilters'] = {};

  // ── Q1  budget_range → price filter ─────────────────────────────
  const budgetMax: Record<string, number> = {
    under_25k: 25_000,
    '25_35k': 35_000,
    '35_50k': 50_000,
    '50_75k': 75_000,
    '75_100k': 100_000,
  };
  if (typeof answers.budget_range === 'string') {
    const max = budgetMax[answers.budget_range];
    if (max) hardFilters.price = { max };
  }

  // ── Q2  body_style → vehicleType filter ─────────────────────────
  if (Array.isArray(answers.body_style)) {
    const typeMap: Record<string, string> = {
      small_car: 'Hatchback',
      sedan: 'Sedan',
      hatchback: 'Hatchback',
      wagon: 'Wagon',
      suv: 'SUV',
      pickup: 'Pickup',
      van: 'Van',
    };
    const mapped = (answers.body_style as string[])
      .map((v) => typeMap[v])
      .filter(Boolean);
    if (mapped.length > 0) hardFilters.vehicleType = [...new Set(mapped)];
  }

  // ── Q3  plug_in_openness → fuelType filter + eco baseline ──────
  if (typeof answers.plug_in_openness === 'string') {
    const fuelMap: Record<string, FuelKind[]> = {
      gas_only: ['gas'],
      open_hybrid: ['gas', 'hybrid'],
      plugin_sometimes: ['gas', 'hybrid', 'phev'],
      must_ev: ['ev'],
      open_anything: ['gas', 'hybrid', 'phev', 'ev'],
    };
    hardFilters.fuelType = fuelMap[answers.plug_in_openness] ?? [];

    const ecoMap: Record<string, number> = {
      must_ev: 0.8,
      plugin_sometimes: 0.6,
      open_hybrid: 0.4,
      gas_only: 0.15,
    };
    const eco = ecoMap[answers.plug_in_openness];
    if (eco != null) setImp(ci, ['eco'], eco);
  }

  // ── Q4  running_costs → eco ─────────────────────────────────────
  if (typeof answers.running_costs === 'number') {
    maxImp(ci, ['eco'], impScale(answers.running_costs));
  }

  // ── Q5  quickness → acceleration ────────────────────────────────
  if (typeof answers.quickness === 'number') {
    setImp(ci, ['acceleration'], impScale(answers.quickness));
  }

  // ── Q6  braking_confidence → brake ──────────────────────────────
  if (typeof answers.braking_confidence === 'number') {
    setImp(ci, ['brake'], impScale(answers.braking_confidence));
  }

  // ── Q7  driving_vibe → handling, body_roll, suspension, insulation, brake
  if (typeof answers.driving_vibe === 'string') {
    switch (answers.driving_vibe) {
      case 'relaxed':
        setImp(ci, ['suspension', 'insulation'], 0.8);
        setImp(ci, ['handling', 'body_roll'], 0.3);
        break;
      case 'balanced':
        setImp(ci, ['suspension', 'insulation', 'handling', 'body_roll'], 0.5);
        break;
      case 'sporty':
        setImp(ci, ['handling', 'body_roll'], 0.85);
        maxImp(ci, ['brake'], 0.7);
        setImp(ci, ['suspension'], 0.6);
        break;
    }
  }

  // ── Q8  quiet_cabin → insulation, engine_noise ──────────────────
  if (typeof answers.quiet_cabin === 'number') {
    const v = impScale(answers.quiet_cabin);
    setImp(ci, ['engine_noise'], v);
    maxImp(ci, ['insulation'], v);
  }

  // ── Q9  front_seat_fit → driver_seat_pos_shape_mtr ──────────────
  if (typeof answers.front_seat_fit === 'number') {
    setImp(ci, ['driver_seat_pos_shape_mtr'], impScale(answers.front_seat_fit));
  }

  // ── Q10 adjustability → driver_seat_adjustment, steering_adjustment
  if (typeof answers.adjustability === 'number') {
    setImp(ci, ['driver_seat_adjustment', 'steering_adjustment'], impScale(answers.adjustability));
  }

  // ── Q11 tech_lag → infotainment_responsive ──────────────────────
  if (typeof answers.tech_lag === 'number') {
    setImp(ci, ['infotainment_responsive'], impScale(answers.tech_lag));
  }

  // ── Q12 screen_readability → infotainment_bright, driver_s_display_bright
  if (typeof answers.screen_readability === 'number') {
    setImp(ci, ['infotainment_bright', 'driver_s_display_bright'], impScale(answers.screen_readability));
  }

  // ── Q13 simple_controls → a/c, vol, display easy ───────────────
  if (typeof answers.simple_controls === 'string') {
    const controlKeys: readonly CriterionKey[] = [
      'infotainment_a_c_control', 'infotainment_vol_control', 'driver_s_display_easy',
    ];
    switch (answers.simple_controls) {
      case 'real_buttons': setImp(ci, controlKeys, 0.85); break;
      case 'mix':          setImp(ci, controlKeys, 0.5);  break;
      case 'all_screen':   setImp(ci, controlKeys, 0.15); break;
    }
  }

  // ── Q14 parking_help → infotainment_parking_cam + visibility bump
  if (typeof answers.parking_help === 'number') {
    const v = impScale(answers.parking_help);
    setImp(ci, ['infotainment_parking_cam'], v);
    addImp(ci, ['visibility_side_mirrors', 'visibility_irvm_back', 'visibility_pillars'], v * 0.3);
  }

  // ── Q15 messy_weather_camera → parking_cam_mud ──────────────────
  if (typeof answers.messy_weather_camera === 'boolean') {
    setImp(ci, ['parking_cam_mud'], answers.messy_weather_camera ? 0.85 : 0.1);
  }

  // ── Q16 small_item_storage → storage criteria ──────────────────
  if (typeof answers.small_item_storage === 'number') {
    setImp(ci, STORAGE_CRITERIA, impScale(answers.small_item_storage));
  }

  // ── Q17 back_seat_usage → backseat baseline ────────────────────
  if (typeof answers.back_seat_usage === 'string') {
    switch (answers.back_seat_usage) {
      case 'almost_never': setImp(ci, BACKSEAT_CRITERIA, 0.05); break;
      case 'sometimes':    setImp(ci, BACKSEAT_CRITERIA, 0.3);  break;
      case 'often':        setImp(ci, BACKSEAT_CRITERIA, 0.5);  break;
    }
  }

  // ── Q18 back_seat_priorities → specific backseat criteria ──────
  if (
    Array.isArray(answers.back_seat_priorities) &&
    answers.back_seat_usage !== 'almost_never'
  ) {
    for (const prio of answers.back_seat_priorities as string[]) {
      const key = BACKSEAT_PRIORITY_MAP[prio];
      if (key) setImp(ci, [key], 0.8);
    }
    if ((answers.back_seat_priorities as string[]).includes('rear_climate')) {
      addImp(ci, ['charging_ports'], 0.15);
    }
  }

  // ── Q19 kids_car_seats → isofix, seat-belt position ────────────
  if (
    typeof answers.kids_car_seats === 'string' &&
    answers.back_seat_usage !== 'almost_never'
  ) {
    switch (answers.kids_car_seats) {
      case 'yes':
        setImp(ci, ['backseat_isofix'], 0.9);
        setImp(ci, ['backseat_seat_belts_pos'], 0.7);
        break;
      case 'maybe_soon':
        setImp(ci, ['backseat_isofix'], 0.7);
        setImp(ci, ['backseat_seat_belts_pos'], 0.5);
        break;
    }
  }

  // ── Q20 back_seat_comfort_details → comfort boost ──────────────
  if (typeof answers.back_seat_comfort_details === 'number' && answers.back_seat_usage === 'often') {
    const v = impScale(answers.back_seat_comfort_details);
    maxImp(ci, ['backseat_headroom', 'backseat_kneeroom', 'backseat_incline', 'backseat_seat_belts_pos'], v);
  }

  // ── Q21 cargo_frequency → cargo baseline ───────────────────────
  if (typeof answers.cargo_frequency === 'string') {
    switch (answers.cargo_frequency) {
      case 'rarely':    setImp(ci, CARGO_CRITERIA, 0.05); break;
      case 'sometimes': setImp(ci, CARGO_CRITERIA, 0.35); break;
      case 'often':     setImp(ci, CARGO_CRITERIA, 0.55); break;
    }
  }

  // ── Q22 cargo_usability → specific cargo criteria ──────────────
  if (
    Array.isArray(answers.cargo_usability) &&
    answers.cargo_frequency !== 'rarely'
  ) {
    for (const prio of answers.cargo_usability as string[]) {
      const key = CARGO_USABILITY_MAP[prio];
      if (key) setImp(ci, [key], 0.85);
    }
  }

  // ── Q23 safety_rating → ncap + small bumps ─────────────────────
  if (typeof answers.safety_rating === 'number') {
    const v = impScale(answers.safety_rating);
    setImp(ci, ['ncap'], v);
    addImp(ci, ['backseat_isofix'], v * 0.2);
    addImp(ci, ['visibility_side_mirrors', 'visibility_irvm_back', 'visibility_pillars'], v * 0.15);
  }

  // ── Q24 visibility_confidence → visibility criteria ────────────
  if (typeof answers.visibility_confidence === 'number') {
    maxImp(
      ci,
      ['visibility_side_mirrors', 'visibility_irvm_back', 'visibility_pillars'],
      impScale(answers.visibility_confidence),
    );
  }

  // ── Q25 solid_build → build, key_design_weight ─────────────────
  if (typeof answers.solid_build === 'number') {
    setImp(ci, ['build', 'key_design_weight'], impScale(answers.solid_build));
  }

  // ── Q26 clean_honest_design → fakery ───────────────────────────
  if (typeof answers.clean_honest_design === 'string') {
    switch (answers.clean_honest_design) {
      case 'simple':      setImp(ci, ['fakery'], 0.85); break;
      case 'little_drama': setImp(ci, ['fakery'], 0.5);  break;
      case 'bold_flashy':  setImp(ci, ['fakery'], 0.1);  break;
    }
  }

  // ── Q27 easy_entry_exit → door_sills_protrude ──────────────────
  if (typeof answers.easy_entry_exit === 'boolean') {
    setImp(ci, ['door_sills_protrude'], answers.easy_entry_exit ? 0.85 : 0.1);
  }

  // ── Q28 reliability → reliable ─────────────────────────────────
  if (typeof answers.reliability === 'number') {
    setImp(ci, ['reliable'], impScale(answers.reliability));
  }

  // ── final clamp ────────────────────────────────────────────────
  for (const key of CRITERIA_KEYS) ci[key] = clamp01(ci[key]);

  // ── compute category weights from criteria importance ──────────
  const weights: DerivedPreferences['weights'] = {
    priceFit: 1,
    fuel: Math.max(0.1, ci.eco),
    vehicleType: 1,
    safety: Math.max(0.1, avgImportance(ci, CRITERIA_CATEGORIES.safety)),
    technology: Math.max(0.1, avgImportance(ci, CRITERIA_CATEGORIES.technology)),
    space: Math.max(0.1, avgImportance(ci, CRITERIA_CATEGORIES.space)),
    performance: Math.max(0.1, avgImportance(ci, CRITERIA_CATEGORIES.performance)),
  };

  // ── mustHaves / avoid ─────────────────────────────────────────
  const mustHaves: string[] = [];
  const avoid: string[] = [];
  for (const key of CRITERIA_KEYS) {
    if (ci[key] >= 0.85) mustHaves.push(key);
    else if (ci[key] <= 0.05) avoid.push(key);
  }

  // ── reasoning ─────────────────────────────────────────────────
  const reasoning = generateReasoning(answers);

  return {
    hardFilters,
    weights,
    criteriaImportance: ci,
    mustHaves: mustHaves.length > 0 ? mustHaves : undefined,
    avoid: avoid.length > 0 ? avoid : undefined,
    reasoning,
  };
}

// ── friendly reasoning builder ──────────────────────────────────

function generateReasoning(answers: QuizV2Answers): string {
  const lines: string[] = [];

  const budgetLabel: Record<string, string> = {
    under_25k: 'under $25k',
    '25_35k': '$25k–$35k',
    '35_50k': '$35k–$50k',
    '50_75k': '$50k–$75k',
    '75_100k': '$75k–$100k',
    '100k_plus': 'over $100k',
  };
  if (typeof answers.budget_range === 'string') {
    lines.push(
      `You're looking for something ${budgetLabel[answers.budget_range] ?? 'within your budget'}`,
    );
  }

  if (answers.plug_in_openness === 'must_ev') lines.push('You want a fully electric vehicle');
  else if (answers.plug_in_openness === 'plugin_sometimes') lines.push("You're open to plug-in options");
  else if (answers.plug_in_openness === 'open_hybrid') lines.push('A hybrid could work well for you');

  if (typeof answers.running_costs === 'number' && answers.running_costs >= 4)
    lines.push('Keeping running costs low is a priority');

  if (answers.driving_vibe === 'relaxed') lines.push('You value a relaxed, smooth ride over sportiness');
  else if (answers.driving_vibe === 'sporty') lines.push('You enjoy a sporty, sharp driving feel');

  if (typeof answers.quickness === 'number' && answers.quickness >= 4)
    lines.push('Quick acceleration when you need it matters to you');

  if (typeof answers.quiet_cabin === 'number' && answers.quiet_cabin >= 4)
    lines.push('A quiet, peaceful cabin is important to you');

  if (typeof answers.front_seat_fit === 'number' && answers.front_seat_fit >= 4)
    lines.push('Seat comfort on longer drives is a big deal for you');

  if (typeof answers.tech_lag === 'number' && answers.tech_lag >= 4)
    lines.push('You want tech that responds quickly without lag');

  if (answers.simple_controls === 'real_buttons')
    lines.push('You prefer real buttons and knobs for everyday controls');

  if (typeof answers.small_item_storage === 'number' && answers.small_item_storage >= 4)
    lines.push('Having convenient places for everyday items matters');

  if (answers.back_seat_usage === 'often')
    lines.push('You often carry passengers, so back-seat comfort and space matter');
  else if (answers.back_seat_usage === 'sometimes')
    lines.push('You sometimes have passengers in back, so it should be decent');

  if (answers.kids_car_seats === 'yes') lines.push('Child-seat compatibility is a must');

  if (answers.cargo_frequency === 'often')
    lines.push('You regularly carry bulky cargo, so a practical boot matters');

  if (typeof answers.safety_rating === 'number' && answers.safety_rating >= 4)
    lines.push('Top safety ratings are a priority for you');

  if (typeof answers.visibility_confidence === 'number' && answers.visibility_confidence >= 4)
    lines.push('Being able to see clearly all around gives you confidence');

  if (typeof answers.solid_build === 'number' && answers.solid_build >= 4)
    lines.push('You appreciate a solid, well-built feel');

  if (answers.clean_honest_design === 'simple')
    lines.push('You prefer clean, honest design without fake sporty bits');

  if (typeof answers.reliability === 'number' && answers.reliability >= 4)
    lines.push('Low-hassle, reliable ownership is very important to you');

  if (lines.length === 0) lines.push('Based on your answers, here are the best matches');

  return lines.map((l) => `• ${l}`).join('\n');
}
