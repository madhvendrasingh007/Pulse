import type { FoodLogInput } from "@/types/nutrition";

/** Persistence boundary; replace with an authenticated repository call when storage is added. */
export interface FoodLogRepository {
  saveForUser(userId: string, entry: FoodLogInput): Promise<void>;
}

export async function saveFoodLog(repository: FoodLogRepository, userId: string, entry: FoodLogInput) {
  if (!userId) throw new Error("A signed-in user is required to persist a food log.");
  await repository.saveForUser(userId, { ...entry, eatenAt: entry.eatenAt ?? new Date() });
}
