import type { Dictionary } from "@/i18n/dictionaries";
import { MEDICINE_CATEGORIES } from "@/lib/medicine/categories";

export function getCategoryLabel(
  category: string,
  dictionary: Dictionary
): string {
  const index = MEDICINE_CATEGORIES.indexOf(
    category as (typeof MEDICINE_CATEGORIES)[number]
  );
  return index < 0 ? category : dictionary.dashboard.categories[index];
}
