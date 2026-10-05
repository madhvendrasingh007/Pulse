export type EnergyProfile = { age: number; gender: "male" | "female"; heightCm: number; weightKg: number };
export type EnergySummary = { bmr: number; sedentaryTdee: number; exerciseBurn: number; totalBurn: number; caloriesConsumed: number; deficit: number; fatLossGrams: number; weeklyFatLossKg: number };

export function calculateEnergy(profile: EnergyProfile, caloriesConsumed = 0, exerciseBurn = 0): EnergySummary {
  const genderOffset = profile.gender === "male" ? 5 : -161;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + genderOffset;
  const sedentaryTdee = bmr * 1.2;
  const totalBurn = sedentaryTdee + Math.max(0, exerciseBurn);
  const deficit = totalBurn - Math.max(0, caloriesConsumed);
  return { bmr, sedentaryTdee, exerciseBurn: Math.max(0, exerciseBurn), totalBurn, caloriesConsumed, deficit, fatLossGrams: deficit / 7700 * 1000, weeklyFatLossKg: deficit * 7 / 7700 };
}
