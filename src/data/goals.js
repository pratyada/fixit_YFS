import { Heart, Dumbbell, Trophy, Star, Activity, Target } from 'lucide-react';

export const GOAL_OPTIONS = [
  { id: 'rehab', label: 'Rehabilitation', desc: 'Recovering from injury or surgery', icon: Heart, color: '#E53935' },
  { id: 'fitness', label: 'Fitness & Strength', desc: 'Build strength and improve form', icon: Dumbbell, color: '#1565C0' },
  { id: 'competition', label: 'Competition & Events', desc: 'Training for a race, event, or competition', icon: Trophy, color: '#7B1FA2' },
  { id: 'skills', label: 'Skill Goals', desc: 'Learn a specific movement or skill', icon: Star, color: '#00897B' },
  { id: 'pain', label: 'Pain Management', desc: 'Manage chronic pain and mobility', icon: Activity, color: '#F57C00' },
  { id: 'wellness', label: 'General Wellness', desc: 'Stay active and track health', icon: Target, color: '#2E7D32' },
];

export const TRAINING_TARGETS = [
  // Hyrox
  { id: 'hyrox-strength', label: 'Hyrox Strength', category: 'Hyrox', icon: '💪', desc: 'Strength-focused Hyrox prep' },
  { id: 'hyrox-conditioning', label: 'Hyrox Conditioning', category: 'Hyrox', icon: '🔥', desc: 'Cardio & endurance for race day' },
  { id: 'hyrox-build', label: 'Hyrox Build', category: 'Hyrox', icon: '🏗️', desc: 'Full Hyrox race preparation' },
  // Endurance
  { id: 'marathon-full', label: 'Marathon', category: 'Endurance', icon: '🏃', desc: '42.2 km / 26.2 miles' },
  { id: 'marathon-half', label: 'Half Marathon', category: 'Endurance', icon: '🏃‍♂️', desc: '21.1 km / 13.1 miles' },
  { id: 'ironman-full', label: 'Ironman Full', category: 'Endurance', icon: '🏊', desc: 'Swim 3.8km, Bike 180km, Run 42km' },
  { id: 'ironman-half', label: 'Ironman 70.3', category: 'Endurance', icon: '🏊‍♂️', desc: 'Half distance triathlon' },
  { id: '5k-10k', label: '5K / 10K', category: 'Endurance', icon: '👟', desc: 'Shorter distance running' },
  // Strength
  { id: 'powerlifting', label: 'Powerlifting', category: 'Strength', icon: '🏋️', desc: 'Squat, bench, deadlift focus' },
  { id: 'bodybuilding', label: 'Bodybuilding', category: 'Strength', icon: '💪', desc: 'Hypertrophy & aesthetics' },
  { id: 'crossfit', label: 'CrossFit', category: 'Strength', icon: '⚡', desc: 'Functional fitness & WODs' },
  { id: 'olympic-lifting', label: 'Olympic Lifting', category: 'Strength', icon: '🥇', desc: 'Snatch & clean and jerk' },
  // Skills
  { id: 'handstand', label: 'Handstand', category: 'Skills', icon: '🤸', desc: 'Freestanding handstand hold' },
  { id: 'backflip', label: 'Backflip', category: 'Skills', icon: '🌀', desc: 'Standing back tuck' },
  { id: 'muscle-up', label: 'Muscle-Up', category: 'Skills', icon: '💫', desc: 'Bar or ring muscle-up' },
  { id: 'pistol-squat', label: 'Pistol Squat', category: 'Skills', icon: '🦵', desc: 'Single-leg squat mastery' },
  { id: 'planche', label: 'Planche', category: 'Skills', icon: '🤸‍♂️', desc: 'Full planche hold' },
  { id: 'front-lever', label: 'Front Lever', category: 'Skills', icon: '🏋️‍♂️', desc: 'Full front lever hold' },
  // Flexibility & Movement
  { id: 'splits', label: 'Full Splits', category: 'Flexibility', icon: '🧘', desc: 'Front or side splits' },
  { id: 'mobility', label: 'Full Body Mobility', category: 'Flexibility', icon: '🧘‍♂️', desc: 'Improve overall range of motion' },
];

export const TARGET_CATEGORIES = [...new Set(TRAINING_TARGETS.map(t => t.category))];

export const EXPERIENCE_OPTIONS = [
  { id: 'beginner', label: 'Beginner', desc: 'New to exercise or returning after a break' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with basic exercises' },
  { id: 'advanced', label: 'Advanced', desc: 'Experienced with structured training' },
];
