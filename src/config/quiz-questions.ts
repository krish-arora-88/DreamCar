export interface QuizQuestion {
  id: string;
  question: string;
  type: 'yes_no' | 'multiple_choice' | 'scale' | 'text';
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'family_size',
    question: 'How many people typically travel in your car?',
    type: 'multiple_choice',
    options: ['Just me', '2-3 people', '4-5 people', '6+ people'],
  },
  {
    id: 'has_infants',
    question: 'Do you have infants or young children in your family?',
    type: 'yes_no',
  },
  {
    id: 'daily_commute',
    question: 'What is your typical daily commute distance?',
    type: 'multiple_choice',
    options: ['No commute / Work from home', 'Under 10 miles', '10-30 miles', '30-60 miles', 'Over 60 miles'],
  },
  {
    id: 'driving_environment',
    question: 'Where do you drive most often?',
    type: 'multiple_choice',
    options: ['City streets', 'Mix of city and highway', 'Mostly highway', 'Off-road or rural areas'],
  },
  {
    id: 'parking_situation',
    question: 'What is your typical parking situation?',
    type: 'multiple_choice',
    options: ['Tight city parking', 'Street parking', 'Garage at home', 'Large parking lots', 'Varied locations'],
  },
  {
    id: 'weather_conditions',
    question: 'Do you regularly drive in snow, ice, or harsh weather?',
    type: 'yes_no',
  },
  {
    id: 'cargo_needs',
    question: 'How often do you need to transport large items or cargo?',
    type: 'multiple_choice',
    options: ['Rarely or never', 'Occasionally', 'Frequently', 'Very often'],
  },
  {
    id: 'towing_needs',
    question: 'Do you need to tow a trailer, boat, or RV?',
    type: 'yes_no',
  },
  {
    id: 'environmental_priority',
    question: 'How important is environmental impact to you?',
    type: 'scale',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: 'Not important', max: 'Very important' },
  },
  {
    id: 'charging_access',
    question: 'Do you have access to home charging for an electric vehicle?',
    type: 'yes_no',
  },
  {
    id: 'budget_comfort',
    question: 'What is your comfortable budget range?',
    type: 'multiple_choice',
    options: ['Under $25k', '$25k-$35k', '$35k-$50k', '$50k-$75k', '$75k-$100k', 'Over $100k'],
  },
  {
    id: 'style_preference',
    question: 'Which style appeals to you most?',
    type: 'multiple_choice',
    options: ['Sporty and dynamic', 'Elegant and luxurious', 'Rugged and adventurous', 'Practical and efficient', 'Modern and tech-forward'],
  },
  {
    id: 'tech_enthusiasm',
    question: 'How important are the latest technology features?',
    type: 'scale',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: 'Basic is fine', max: 'Must have latest tech' },
  },
  {
    id: 'driving_enjoyment',
    question: 'Do you enjoy driving for the experience, or is it purely transportation?',
    type: 'multiple_choice',
    options: ['I love driving', 'It\'s enjoyable', 'It\'s just transportation', 'I prefer not to drive'],
  },
  {
    id: 'safety_priority',
    question: 'How important are advanced safety features?',
    type: 'scale',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: 'Standard safety is enough', max: 'Want every safety feature' },
  },
];

