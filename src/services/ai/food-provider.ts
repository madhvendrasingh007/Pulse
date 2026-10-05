import type { FoodAIProvider, FoodEstimate } from "@/types/nutrition";

/** Optional integration seam. No provider is configured by default. */
export function getFoodAIProvider(): FoodAIProvider | null {
  return null;
}

export async function estimateFoodSafely(input: { text?: string; image?: string }): Promise<FoodEstimate[] | null> {
  const provider = getFoodAIProvider();
  if (!provider) return null;
  try {
    return await provider.estimateFood(input);
  } catch {
    // A provider outage must leave the manual logging path available.
    return null;
  }
}
