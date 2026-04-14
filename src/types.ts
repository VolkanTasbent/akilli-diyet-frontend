export type Gender = 'MALE' | 'FEMALE'

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'ACTIVE'
  | 'VERY_ACTIVE'

export type DietGoal = 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_MUSCLE'

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

export type UserResponse = {
  id: number
  email: string
  displayName: string
  heightCm: number | null
  weightKg: number | null
  age: number | null
  gender: Gender | null
  activityLevel: ActivityLevel | null
  dietGoal: DietGoal | null
  targetWeightKg: number | null
  goalDurationWeeks: number | null
  city: string | null
  studentMode: boolean | null
  dailyWaterGoalMl: number | null
}

export type AuthResponse = {
  token: string
  user: UserResponse
}

export type FoodResponse = {
  id: number
  name: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  tablespoonGrams: number | null
  custom: boolean
  /** Günlükte kullanılıyorsa silinemez */
  usedInLogs?: boolean
}

export type FoodLogResponseDto = {
  id: number
  date: string
  mealType: MealType
  foodId: number
  foodName: string
  grams: number
  note: string | null
  caloriesEstimate: number
}

export type DailyTargetsDto = {
  bmr: number
  tdee: number
  targetCalories: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
  suggestedDailyDeficit: number | null
  explanationTr: string
}

export type MealMacroDto = {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export type DailyTaskDto = {
  id: string
  labelTr: string
  done: boolean
}

export type TrendDayDto = {
  date: string
  calories: number
  exerciseCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
  weightKg: number | null
  sleepHours: number | null
}

export type TrendRangeDto = {
  from: string
  to: string
  targetCalories: number
  targetProteinG: number
  targetWeightKg: number | null
  days: TrendDayDto[]
}

export type WeeklyScoreDto = {
  score: number
  periodLabelTr: string
  hintsTr: string[]
}

export type ExerciseLogResponseDto = {
  id: number
  date: string
  caloriesBurned: number
  label: string | null
}

export type DailySummaryDto = {
  date: string
  consumedCalories: number
  exerciseCaloriesBurned: number
  netEnergyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  targets: DailyTargetsDto
  waterMl: number
  waterGoalMl: number
  sleepHours: number | null
  caloriesRemaining: number
  byMeal: Record<MealType, MealMacroDto>
  logStreakDays: number
  dailyTasks: DailyTaskDto[]
  coachMessagesTr: string[]
  suggestionsTr: string[]
}
