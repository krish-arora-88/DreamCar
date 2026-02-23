import { describe, it, expect } from 'vitest';
import { CRITERIA_KEYS } from '../../src/config/criteria';
import { derivePreferences } from '../../src/lib/quiz/v2/derivePreferences';
import type { QuizV2Answers } from '../../src/types/quiz';

function fullAnswers(overrides: Partial<QuizV2Answers> = {}): QuizV2Answers {
  return {
    budget_range: '35_50k',
    body_style: ['sedan', 'suv'],
    plug_in_openness: 'open_anything',
    running_costs: 3,
    quickness: 3,
    braking_confidence: 3,
    driving_vibe: 'balanced',
    quiet_cabin: 3,
    front_seat_fit: 3,
    adjustability: 3,
    tech_lag: 3,
    screen_readability: 3,
    simple_controls: 'mix',
    parking_help: 3,
    messy_weather_camera: false,
    small_item_storage: 3,
    back_seat_usage: 'sometimes',
    back_seat_priorities: ['legroom', 'headroom'],
    kids_car_seats: 'no',
    cargo_frequency: 'sometimes',
    cargo_usability: ['flat_floor'],
    safety_rating: 3,
    visibility_confidence: 3,
    solid_build: 3,
    clean_honest_design: 'little_drama',
    easy_entry_exit: false,
    reliability: 3,
    ...overrides,
  };
}

describe('Quiz v2 – criteria coverage', () => {
  it('produces all 50 criteria keys in criteriaImportance', () => {
    const result = derivePreferences(fullAnswers());

    expect(Object.keys(result.criteriaImportance).length).toBe(CRITERIA_KEYS.length);
    for (const key of CRITERIA_KEYS) {
      expect(result.criteriaImportance).toHaveProperty(key);
      const v = result.criteriaImportance[key];
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('produces all 50 keys even with empty answers', () => {
    const result = derivePreferences({});
    for (const key of CRITERIA_KEYS) {
      expect(result.criteriaImportance).toHaveProperty(key);
    }
  });

  it('returns hard filters from budget, body style, and fuel', () => {
    const result = derivePreferences(fullAnswers({ budget_range: '50_75k' }));
    expect(result.hardFilters.price?.max).toBe(75_000);
    expect(result.hardFilters.vehicleType).toEqual(expect.arrayContaining(['Sedan', 'SUV']));
    expect(result.hardFilters.fuelType).toEqual(['gas', 'hybrid', 'phev', 'ev']);
  });

  it('returns weights with all 7 category keys', () => {
    const result = derivePreferences(fullAnswers());
    expect(result.weights).toHaveProperty('priceFit');
    expect(result.weights).toHaveProperty('fuel');
    expect(result.weights).toHaveProperty('vehicleType');
    expect(result.weights).toHaveProperty('safety');
    expect(result.weights).toHaveProperty('technology');
    expect(result.weights).toHaveProperty('space');
    expect(result.weights).toHaveProperty('performance');
  });

  it('generates non-empty reasoning string', () => {
    const result = derivePreferences(fullAnswers());
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.reasoning).toContain('•');
  });

  // ── pairwise tests: each criterion moves away from baseline ────

  const baseline = derivePreferences({});

  it('Q5 quickness changes acceleration', () => {
    const r = derivePreferences(fullAnswers({ quickness: 5 }));
    expect(r.criteriaImportance.acceleration).not.toBe(baseline.criteriaImportance.acceleration);
  });

  it('Q6 braking_confidence changes brake', () => {
    const r = derivePreferences(fullAnswers({ braking_confidence: 5 }));
    expect(r.criteriaImportance.brake).not.toBe(baseline.criteriaImportance.brake);
  });

  it('Q4 running_costs changes eco', () => {
    const r = derivePreferences(fullAnswers({ running_costs: 5 }));
    expect(r.criteriaImportance.eco).not.toBe(baseline.criteriaImportance.eco);
  });

  it('Q7 driving_vibe=sporty raises handling and body_roll', () => {
    const r = derivePreferences(fullAnswers({ driving_vibe: 'sporty' }));
    expect(r.criteriaImportance.handling).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.body_roll).toBeGreaterThan(0.5);
  });

  it('Q7 driving_vibe=relaxed raises suspension and insulation', () => {
    const r = derivePreferences(fullAnswers({ driving_vibe: 'relaxed' }));
    expect(r.criteriaImportance.suspension).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.insulation).toBeGreaterThan(0.5);
  });

  it('Q8 quiet_cabin changes engine_noise and insulation', () => {
    const r = derivePreferences(fullAnswers({ quiet_cabin: 5 }));
    expect(r.criteriaImportance.engine_noise).not.toBe(baseline.criteriaImportance.engine_noise);
    expect(r.criteriaImportance.insulation).toBeGreaterThan(baseline.criteriaImportance.insulation);
  });

  it('Q9 front_seat_fit changes driver_seat_pos_shape_mtr', () => {
    const r = derivePreferences(fullAnswers({ front_seat_fit: 5 }));
    expect(r.criteriaImportance.driver_seat_pos_shape_mtr).not.toBe(
      baseline.criteriaImportance.driver_seat_pos_shape_mtr,
    );
  });

  it('Q10 adjustability changes driver_seat_adjustment and steering_adjustment', () => {
    const r = derivePreferences(fullAnswers({ adjustability: 5 }));
    expect(r.criteriaImportance.driver_seat_adjustment).not.toBe(
      baseline.criteriaImportance.driver_seat_adjustment,
    );
    expect(r.criteriaImportance.steering_adjustment).not.toBe(
      baseline.criteriaImportance.steering_adjustment,
    );
  });

  it('Q11 tech_lag changes infotainment_responsive', () => {
    const r = derivePreferences(fullAnswers({ tech_lag: 5 }));
    expect(r.criteriaImportance.infotainment_responsive).not.toBe(
      baseline.criteriaImportance.infotainment_responsive,
    );
  });

  it('Q12 screen_readability changes infotainment_bright and driver_s_display_bright', () => {
    const r = derivePreferences(fullAnswers({ screen_readability: 5 }));
    expect(r.criteriaImportance.infotainment_bright).not.toBe(
      baseline.criteriaImportance.infotainment_bright,
    );
    expect(r.criteriaImportance.driver_s_display_bright).not.toBe(
      baseline.criteriaImportance.driver_s_display_bright,
    );
  });

  it('Q13 simple_controls=real_buttons raises control criteria', () => {
    const r = derivePreferences(fullAnswers({ simple_controls: 'real_buttons' }));
    expect(r.criteriaImportance.infotainment_a_c_control).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.infotainment_vol_control).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.driver_s_display_easy).toBeGreaterThan(0.5);
  });

  it('Q14 parking_help changes infotainment_parking_cam', () => {
    const r = derivePreferences(fullAnswers({ parking_help: 5 }));
    expect(r.criteriaImportance.infotainment_parking_cam).not.toBe(
      baseline.criteriaImportance.infotainment_parking_cam,
    );
  });

  it('Q15 messy_weather_camera=true raises parking_cam_mud', () => {
    const r = derivePreferences(fullAnswers({ messy_weather_camera: true }));
    expect(r.criteriaImportance.parking_cam_mud).toBeGreaterThan(0.5);
  });

  it('Q16 small_item_storage changes storage criteria', () => {
    const r = derivePreferences(fullAnswers({ small_item_storage: 5 }));
    for (const key of [
      'centre_cubby', 'doorbins_front', 'doorbins_back', 'cup_holder',
      'glovebox', 'seatback_pocket', 'sunglass_storage', 'charging_ports',
    ] as const) {
      expect(r.criteriaImportance[key]).not.toBe(baseline.criteriaImportance[key]);
    }
  });

  it('Q17 back_seat_usage=almost_never sets backseat criteria low', () => {
    const r = derivePreferences(fullAnswers({ back_seat_usage: 'almost_never' }));
    expect(r.criteriaImportance.backseat_headroom).toBeLessThan(0.1);
    expect(r.criteriaImportance.backseat_kneeroom).toBeLessThan(0.1);
  });

  it('Q18 back_seat_priorities raises selected backseat criteria', () => {
    const r = derivePreferences(
      fullAnswers({
        back_seat_usage: 'sometimes',
        back_seat_priorities: ['legroom', 'headroom', 'rear_climate'],
      }),
    );
    expect(r.criteriaImportance.backseat_kneeroom).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.backseat_headroom).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.rear_a_c_port_climate).toBeGreaterThan(0.5);
  });

  it('Q19 kids_car_seats=yes raises isofix and seat_belts_pos', () => {
    const r = derivePreferences(
      fullAnswers({ back_seat_usage: 'sometimes', kids_car_seats: 'yes' }),
    );
    expect(r.criteriaImportance.backseat_isofix).toBeGreaterThan(0.8);
    expect(r.criteriaImportance.backseat_seat_belts_pos).toBeGreaterThan(0.5);
  });

  it('Q20 back_seat_comfort_details boosts comfort when usage=often', () => {
    const r = derivePreferences(
      fullAnswers({ back_seat_usage: 'often', back_seat_comfort_details: 5 }),
    );
    expect(r.criteriaImportance.backseat_headroom).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.backseat_kneeroom).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.backseat_incline).toBeGreaterThan(0.5);
  });

  it('Q21 cargo_frequency=rarely sets cargo criteria low', () => {
    const r = derivePreferences(fullAnswers({ cargo_frequency: 'rarely' }));
    expect(r.criteriaImportance.boot_lip).toBeLessThan(0.1);
    expect(r.criteriaImportance.flat_boot).toBeLessThan(0.1);
  });

  it('Q22 cargo_usability raises selected cargo criteria', () => {
    const r = derivePreferences(
      fullAnswers({
        cargo_frequency: 'sometimes',
        cargo_usability: ['easy_lift', 'fold_seats'],
      }),
    );
    expect(r.criteriaImportance.boot_lip).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.easily_foldable_seats).toBeGreaterThan(0.5);
  });

  it('Q23 safety_rating changes ncap', () => {
    const r = derivePreferences(fullAnswers({ safety_rating: 5 }));
    expect(r.criteriaImportance.ncap).not.toBe(baseline.criteriaImportance.ncap);
  });

  it('Q24 visibility_confidence changes visibility criteria', () => {
    const r = derivePreferences(fullAnswers({ visibility_confidence: 5 }));
    expect(r.criteriaImportance.visibility_side_mirrors).not.toBe(
      baseline.criteriaImportance.visibility_side_mirrors,
    );
    expect(r.criteriaImportance.visibility_irvm_back).not.toBe(
      baseline.criteriaImportance.visibility_irvm_back,
    );
    expect(r.criteriaImportance.visibility_pillars).not.toBe(
      baseline.criteriaImportance.visibility_pillars,
    );
  });

  it('Q25 solid_build changes build and key_design_weight', () => {
    const r = derivePreferences(fullAnswers({ solid_build: 5 }));
    expect(r.criteriaImportance.build).not.toBe(baseline.criteriaImportance.build);
    expect(r.criteriaImportance.key_design_weight).not.toBe(
      baseline.criteriaImportance.key_design_weight,
    );
  });

  it('Q26 clean_honest_design=simple raises fakery', () => {
    const r = derivePreferences(fullAnswers({ clean_honest_design: 'simple' }));
    expect(r.criteriaImportance.fakery).toBeGreaterThan(0.5);
  });

  it('Q27 easy_entry_exit=true raises door_sills_protrude', () => {
    const r = derivePreferences(fullAnswers({ easy_entry_exit: true }));
    expect(r.criteriaImportance.door_sills_protrude).toBeGreaterThan(0.5);
  });

  it('Q28 reliability changes reliable', () => {
    const r = derivePreferences(fullAnswers({ reliability: 5 }));
    expect(r.criteriaImportance.reliable).not.toBe(baseline.criteriaImportance.reliable);
  });

  // ── remaining criteria covered indirectly ──────────────────────

  it('Q18 rear_climate also bumps charging_ports', () => {
    const r = derivePreferences(
      fullAnswers({
        back_seat_usage: 'sometimes',
        back_seat_priorities: ['rear_climate'],
      }),
    );
    expect(r.criteriaImportance.charging_ports).toBeGreaterThan(
      baseline.criteriaImportance.charging_ports,
    );
  });

  it('Q18 covers backseat_deep_footwell, flat_floor, rear_windows_roll, armrest_cover', () => {
    const r = derivePreferences(
      fullAnswers({
        back_seat_usage: 'sometimes',
        back_seat_priorities: ['foot_space', 'flat_floor', 'rear_windows'],
      }),
    );
    expect(r.criteriaImportance.backseat_deep_footwell).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.backseat_flat_floor).toBeGreaterThan(0.5);
    expect(r.criteriaImportance.backseat_rear_windows_roll).toBeGreaterThan(0.5);

    const r2 = derivePreferences(
      fullAnswers({
        back_seat_usage: 'sometimes',
        back_seat_priorities: ['armrest'],
      }),
    );
    expect(r2.criteriaImportance.backseat_armrest_cover).toBeGreaterThan(0.5);
  });

  it('Q22 covers load_cover_fits_inside', () => {
    const r = derivePreferences(
      fullAnswers({
        cargo_frequency: 'often',
        cargo_usability: ['cover_stores'],
      }),
    );
    expect(r.criteriaImportance.load_cover_fits_inside).toBeGreaterThan(0.5);
  });
});
