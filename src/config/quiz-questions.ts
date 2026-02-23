import type { QuizV2Question, QuizV2Answers } from '@/types/quiz';

export const quizV2Questions: QuizV2Question[] = [
  // ── SECTION 1 — Basics ──────────────────────────────────────────
  {
    id: 'budget_range',
    section: 'Basics',
    title: 'What budget feels comfortable?',
    type: 'single',
    options: [
      { value: 'under_25k', label: 'Under $25k' },
      { value: '25_35k', label: '$25k – $35k' },
      { value: '35_50k', label: '$35k – $50k' },
      { value: '50_75k', label: '$50k – $75k' },
      { value: '75_100k', label: '$75k – $100k' },
      { value: '100k_plus', label: 'Over $100k' },
    ],
  },
  {
    id: 'body_style',
    section: 'Basics',
    title: 'What kinds of vehicles are you open to?',
    helper: 'Pick all that interest you',
    type: 'multi',
    options: [
      { value: 'small_car', label: 'Small car' },
      { value: 'sedan', label: 'Sedan' },
      { value: 'hatchback', label: 'Hatchback' },
      { value: 'wagon', label: 'Wagon' },
      { value: 'suv', label: 'SUV' },
      { value: 'pickup', label: 'Pickup' },
      { value: 'van', label: 'Van' },
    ],
  },
  {
    id: 'plug_in_openness',
    section: 'Basics',
    title: 'How do you feel about plugging in to charge?',
    type: 'single',
    options: [
      { value: 'gas_only', label: 'No thanks — gas is fine' },
      { value: 'open_hybrid', label: 'Open to hybrid' },
      { value: 'plugin_sometimes', label: 'Plug-in is okay sometimes' },
      { value: 'must_ev', label: 'Must be fully electric' },
      { value: 'open_anything', label: "I'm open to anything" },
    ],
  },
  {
    id: 'running_costs',
    section: 'Basics',
    title: 'How important is low running cost (fuel/energy efficiency)?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Not important', 5: 'Very important' } },
  },

  // ── SECTION 2 — How it feels to drive ───────────────────────────
  {
    id: 'quickness',
    section: 'How it feels to drive',
    title: 'When you press the pedal to merge or pass, how quick should it feel?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Gentle is fine', 5: 'Quick and responsive' } },
  },
  {
    id: 'braking_confidence',
    section: 'How it feels to drive',
    title: 'How important is strong, confidence-inspiring braking?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Not a concern', 5: 'Very important' } },
  },
  {
    id: 'driving_vibe',
    section: 'How it feels to drive',
    title: 'Pick the vibe that fits you best',
    type: 'single',
    options: [
      { value: 'relaxed', label: 'Relaxed and smooth — comfort first' },
      { value: 'balanced', label: 'Balanced — a bit of both' },
      { value: 'sporty', label: 'Sporty and controlled — I like it sharp' },
    ],
  },
  {
    id: 'quiet_cabin',
    section: 'How it feels to drive',
    title: 'How much do you care about a quiet cabin on the highway?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: "Doesn't matter", 5: 'Very important' } },
  },

  // ── SECTION 3 — Seats & daily comfort ───────────────────────────
  {
    id: 'front_seat_fit',
    section: 'Seats & daily comfort',
    title: 'How picky are you about seat comfort and support on longer drives?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Not picky', 5: 'Very picky' } },
  },
  {
    id: 'adjustability',
    section: 'Seats & daily comfort',
    title: 'Do you need lots of adjustment to get comfortable (seat + steering wheel)?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Basic is fine', 5: 'Lots of adjustment' } },
  },

  // ── SECTION 4 — Tech that doesn't annoy ─────────────────────────
  {
    id: 'tech_lag',
    section: "Tech that doesn't annoy",
    title: 'How much do you hate laggy, slow screens?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: "Don't mind", 5: "Can't stand it" } },
  },
  {
    id: 'screen_readability',
    section: "Tech that doesn't annoy",
    title: 'Do you drive in bright sun a lot and need screens/displays to stay readable?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Rarely an issue', 5: 'Very important' } },
  },
  {
    id: 'simple_controls',
    section: "Tech that doesn't annoy",
    title: 'Which sounds more like you?',
    type: 'single',
    options: [
      { value: 'real_buttons', label: 'Give me real buttons/knobs for the basics' },
      { value: 'mix', label: 'Mix of buttons and screen is fine' },
      { value: 'all_screen', label: 'All on screen is fine if it works well' },
    ],
  },
  {
    id: 'parking_help',
    section: "Tech that doesn't annoy",
    title: 'How important is an easy, clear backup camera for parking?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Not needed', 5: 'Essential' } },
  },
  {
    id: 'messy_weather_camera',
    section: "Tech that doesn't annoy",
    title: 'Do you often drive in rain/snow/slush where a camera can get dirty?',
    type: 'yesno',
  },

  // ── SECTION 5 — Everyday storage ────────────────────────────────
  {
    id: 'small_item_storage',
    section: 'Everyday storage',
    title: 'How much do you care about convenient places for everyday stuff (phone, bottle, sunglasses)?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Not fussed', 5: 'Very important' } },
  },

  // ── SECTION 6 — Back seat ───────────────────────────────────────
  {
    id: 'back_seat_usage',
    section: 'Back seat',
    title: 'How often do you have people in the back seat?',
    type: 'single',
    options: [
      { value: 'almost_never', label: 'Almost never' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'often', label: 'Often' },
    ],
  },
  {
    id: 'back_seat_priorities',
    section: 'Back seat',
    title: 'When people are in the back, what matters most?',
    helper: 'Pick up to 3',
    type: 'multi',
    maxSelect: 3,
    options: [
      { value: 'legroom', label: 'Legroom' },
      { value: 'headroom', label: 'Headroom' },
      { value: 'foot_space', label: 'Foot space' },
      { value: 'recline', label: 'Comfortable recline' },
      { value: 'flat_floor', label: 'Flat floor (middle seat is usable)' },
      { value: 'rear_windows', label: 'Rear windows roll down' },
      { value: 'armrest', label: 'Rear armrest for comfort' },
      { value: 'rear_climate', label: 'Rear vents/ports/climate comfort' },
    ],
    showIf: (a: QuizV2Answers) =>
      a.back_seat_usage === 'sometimes' || a.back_seat_usage === 'often',
  },
  {
    id: 'kids_car_seats',
    section: 'Back seat',
    title: 'Do you need to fit a child seat?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'maybe_soon', label: 'Maybe soon' },
      { value: 'no', label: 'No' },
    ],
    showIf: (a: QuizV2Answers) =>
      a.back_seat_usage === 'sometimes' || a.back_seat_usage === 'often',
  },
  {
    id: 'back_seat_comfort_details',
    section: 'Back seat',
    title: 'How important is it that the back seat feels comfortable for adults?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Just needs to work', 5: 'Very comfortable' } },
    showIf: (a: QuizV2Answers) => a.back_seat_usage === 'often',
  },

  // ── SECTION 7 — Cargo ──────────────────────────────────────────
  {
    id: 'cargo_frequency',
    section: 'Cargo',
    title: 'How often do you carry bulky cargo (stroller, sports gear, DIY/furniture)?',
    type: 'single',
    options: [
      { value: 'rarely', label: 'Rarely' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'often', label: 'Often' },
    ],
  },
  {
    id: 'cargo_usability',
    section: 'Cargo',
    title: 'What would make the cargo area easier for you?',
    helper: 'Pick up to 2',
    type: 'multi',
    maxSelect: 2,
    options: [
      { value: 'easy_lift', label: 'Easy lift-in (no big step up)' },
      { value: 'flat_floor', label: 'Flat cargo floor' },
      { value: 'fold_seats', label: 'Seats fold down easily' },
      { value: 'cover_stores', label: 'Cargo cover that stores neatly' },
    ],
    showIf: (a: QuizV2Answers) =>
      a.cargo_frequency === 'sometimes' || a.cargo_frequency === 'often',
  },

  // ── SECTION 8 — Safety, visibility, ownership, "feel" ──────────
  {
    id: 'safety_rating',
    section: 'Safety & ownership',
    title: 'How important is top-tier safety?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Standard is fine', 5: 'Top priority' } },
  },
  {
    id: 'visibility_confidence',
    section: 'Safety & ownership',
    title: 'How important is it that you can see out easily (good mirrors, not huge blind spots)?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Not a concern', 5: 'Very important' } },
  },
  {
    id: 'solid_build',
    section: 'Safety & ownership',
    title: 'How much do you care that the car feels solid and well put together (no flimsy bits)?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: "Doesn't matter", 5: 'Very important' } },
  },
  {
    id: 'clean_honest_design',
    section: 'Safety & ownership',
    title: 'Which feels more like your taste?',
    type: 'single',
    options: [
      { value: 'simple', label: 'Simple, honest design — no fake sporty bits' },
      { value: 'little_drama', label: 'A little drama is fine' },
      { value: 'bold_flashy', label: "I like bold/flashy styling even if it's not 'pure'" },
    ],
  },
  {
    id: 'easy_entry_exit',
    section: 'Safety & ownership',
    title: 'Do you care about getting in/out easily without awkward rubbing/catching on the door opening?',
    type: 'yesno',
  },
  {
    id: 'reliability',
    section: 'Safety & ownership',
    title: 'How important is low hassle ownership (reliability)?',
    type: 'scale',
    scale: { min: 1, max: 5, labels: { 1: 'Will deal with it', 5: 'Top priority' } },
  },
];
