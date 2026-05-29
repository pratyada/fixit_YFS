// Common foods with pre-filled macros for quick-add
// Calories per serving, protein/carbs/fat in grams

export const COMMON_FOODS = [
  // Proteins
  { name: 'Chicken Breast (grilled, 150g)', calories: 231, protein: 43, carbs: 0, fat: 5, fiber: 0, category: 'Protein' },
  { name: 'Salmon Fillet (150g)', calories: 310, protein: 34, carbs: 0, fat: 18, fiber: 0, category: 'Protein' },
  { name: 'Eggs (2 large)', calories: 156, protein: 12, carbs: 1, fat: 11, fiber: 0, category: 'Protein' },
  { name: 'Egg Whites (4)', calories: 68, protein: 14, carbs: 1, fat: 0, fiber: 0, category: 'Protein' },
  { name: 'Ground Turkey (150g)', calories: 240, protein: 34, carbs: 0, fat: 11, fiber: 0, category: 'Protein' },
  { name: 'Ground Beef 90% lean (150g)', calories: 270, protein: 38, carbs: 0, fat: 12, fiber: 0, category: 'Protein' },
  { name: 'Tofu Firm (150g)', calories: 130, protein: 14, carbs: 3, fat: 7, fiber: 1, category: 'Protein' },
  { name: 'Greek Yogurt (175g)', calories: 150, protein: 15, carbs: 8, fat: 5, fiber: 0, category: 'Protein' },
  { name: 'Cottage Cheese (125g)', calories: 110, protein: 14, carbs: 4, fat: 4, fiber: 0, category: 'Protein' },
  { name: 'Whey Protein Shake (1 scoop)', calories: 120, protein: 25, carbs: 3, fat: 1, fiber: 0, category: 'Protein' },
  { name: 'Tuna Can (120g)', calories: 130, protein: 28, carbs: 0, fat: 1, fiber: 0, category: 'Protein' },
  { name: 'Shrimp (150g)', calories: 140, protein: 27, carbs: 1, fat: 2, fiber: 0, category: 'Protein' },

  // Carbs
  { name: 'White Rice (1 cup cooked)', calories: 205, protein: 4, carbs: 45, fat: 0, fiber: 1, category: 'Carbs' },
  { name: 'Brown Rice (1 cup cooked)', calories: 215, protein: 5, carbs: 45, fat: 2, fiber: 4, category: 'Carbs' },
  { name: 'Oatmeal (1 cup cooked)', calories: 160, protein: 6, carbs: 28, fat: 3, fiber: 4, category: 'Carbs' },
  { name: 'Sweet Potato (medium)', calories: 112, protein: 2, carbs: 26, fat: 0, fiber: 4, category: 'Carbs' },
  { name: 'White Bread (2 slices)', calories: 160, protein: 5, carbs: 30, fat: 2, fiber: 1, category: 'Carbs' },
  { name: 'Whole Wheat Bread (2 slices)', calories: 160, protein: 7, carbs: 28, fat: 2, fiber: 4, category: 'Carbs' },
  { name: 'Pasta (1 cup cooked)', calories: 220, protein: 8, carbs: 43, fat: 1, fiber: 3, category: 'Carbs' },
  { name: 'Banana (medium)', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, category: 'Carbs' },
  { name: 'Apple (medium)', calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, category: 'Carbs' },
  { name: 'Bagel (plain)', calories: 280, protein: 10, carbs: 54, fat: 2, fiber: 2, category: 'Carbs' },

  // Fats
  { name: 'Avocado (half)', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, category: 'Fats' },
  { name: 'Almonds (30g)', calories: 170, protein: 6, carbs: 6, fat: 15, fiber: 3, category: 'Fats' },
  { name: 'Peanut Butter (2 tbsp)', calories: 190, protein: 7, carbs: 7, fat: 16, fiber: 2, category: 'Fats' },
  { name: 'Olive Oil (1 tbsp)', calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0, category: 'Fats' },
  { name: 'Cheese Cheddar (30g)', calories: 115, protein: 7, carbs: 0, fat: 9, fiber: 0, category: 'Fats' },
  { name: 'Butter (1 tbsp)', calories: 100, protein: 0, carbs: 0, fat: 11, fiber: 0, category: 'Fats' },

  // Vegetables
  { name: 'Broccoli (1 cup)', calories: 55, protein: 4, carbs: 11, fat: 0, fiber: 5, category: 'Vegetables' },
  { name: 'Spinach (2 cups)', calories: 14, protein: 2, carbs: 2, fat: 0, fiber: 1, category: 'Vegetables' },
  { name: 'Mixed Salad (2 cups)', calories: 30, protein: 2, carbs: 5, fat: 0, fiber: 2, category: 'Vegetables' },
  { name: 'Bell Pepper (1 medium)', calories: 30, protein: 1, carbs: 7, fat: 0, fiber: 2, category: 'Vegetables' },
  { name: 'Carrots (1 cup)', calories: 50, protein: 1, carbs: 12, fat: 0, fiber: 4, category: 'Vegetables' },
  { name: 'Tomato (1 medium)', calories: 22, protein: 1, carbs: 5, fat: 0, fiber: 1, category: 'Vegetables' },

  // Dairy & Drinks
  { name: 'Milk 2% (1 cup)', calories: 125, protein: 8, carbs: 12, fat: 5, fiber: 0, category: 'Dairy' },
  { name: 'Almond Milk (1 cup)', calories: 30, protein: 1, carbs: 1, fat: 3, fiber: 0, category: 'Dairy' },
  { name: 'Coffee (black)', calories: 5, protein: 0, carbs: 0, fat: 0, fiber: 0, category: 'Drinks' },
  { name: 'Coffee with Cream', calories: 50, protein: 1, carbs: 1, fat: 5, fiber: 0, category: 'Drinks' },
  { name: 'Orange Juice (1 cup)', calories: 110, protein: 2, carbs: 26, fat: 0, fiber: 0, category: 'Drinks' },

  // Meals / Combos
  { name: 'Chicken & Rice Bowl', calories: 450, protein: 40, carbs: 50, fat: 8, fiber: 2, category: 'Meals' },
  { name: 'Protein Smoothie', calories: 300, protein: 30, carbs: 35, fat: 5, fiber: 3, category: 'Meals' },
  { name: 'Turkey Sandwich', calories: 380, protein: 28, carbs: 35, fat: 12, fiber: 3, category: 'Meals' },
  { name: 'Steak & Vegetables', calories: 480, protein: 45, carbs: 15, fat: 25, fiber: 5, category: 'Meals' },
  { name: 'Burrito Bowl', calories: 550, protein: 35, carbs: 55, fat: 18, fiber: 8, category: 'Meals' },
  { name: 'Sushi (8 pieces)', calories: 350, protein: 15, carbs: 50, fat: 8, fiber: 2, category: 'Meals' },
  { name: 'Pizza Slice (cheese)', calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2, category: 'Meals' },
  { name: 'Caesar Salad (with chicken)', calories: 360, protein: 30, carbs: 12, fat: 22, fiber: 3, category: 'Meals' },

  // Snacks
  { name: 'Protein Bar', calories: 210, protein: 20, carbs: 22, fat: 8, fiber: 3, category: 'Snacks' },
  { name: 'Rice Cakes (2)', calories: 70, protein: 1, carbs: 15, fat: 0, fiber: 0, category: 'Snacks' },
  { name: 'Trail Mix (30g)', calories: 140, protein: 4, carbs: 13, fat: 9, fiber: 2, category: 'Snacks' },
  { name: 'Dark Chocolate (30g)', calories: 170, protein: 2, carbs: 13, fat: 12, fiber: 3, category: 'Snacks' },
];

export const FOOD_CATEGORIES = [...new Set(COMMON_FOODS.map(f => f.category))];
