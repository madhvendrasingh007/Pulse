export type FoodSource = "ai" | "database" | "manual";

export interface FoodEstimate {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence?: number;
  source: FoodSource;
}

export interface FoodAIProvider {
  estimateFood(input: { text?: string; image?: string }): Promise<FoodEstimate[]>;
}

export interface FoodLogInput extends FoodEstimate {
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  eatenAt?: Date;
}
