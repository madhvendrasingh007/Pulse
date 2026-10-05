import { z } from "zod";

export const foodLogSchema = z.object({
  foodName: z.string().trim().min(1).max(160),
  quantity: z.number().positive().max(10000),
  unit: z.string().trim().min(1).max(40),
  calories: z.number().nonnegative().max(100000),
  protein: z.number().nonnegative().max(10000),
  carbs: z.number().nonnegative().max(10000),
  fats: z.number().nonnegative().max(10000),
  confidence: z.number().min(0).max(1).optional(),
  source: z.enum(["ai", "database", "manual"]),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
});

export type ValidFoodLog = z.infer<typeof foodLogSchema>;
