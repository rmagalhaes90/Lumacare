export const FREE_THEME_IDS = ["calm", "midnight"];
export const FREE_BREATH_IDS = ["box"];
export const FREE_HABIT_LIMIT = 3;
export const FREE_INSIGHT_LIMIT = 1;

export const ENTITLEMENT_ID = "premium";
export const PRODUCT_MONTHLY = "lumacare_plus_monthly";
export const PRODUCT_YEARLY = "lumacare_plus_yearly";

export function canAddHabit(habits, isPremium) {
  if (isPremium) return true;
  return (habits?.length || 0) < FREE_HABIT_LIMIT;
}

export function canUseTheme(themeId, profile, isPremium) {
  if (isPremium) return true;
  if (FREE_THEME_IDS.includes(themeId)) return true;
  return (profile?.keptThemeIds || []).includes(themeId);
}

export function canUseBreath(id, profile, isPremium) {
  if (isPremium) return true;
  if (FREE_BREATH_IDS.includes(id)) return true;
  return (profile?.usedBreathIds || []).includes(id);
}
