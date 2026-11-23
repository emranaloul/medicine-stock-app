"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { MEDICINE_CATEGORIES } from "@/lib/medicine/categories";

export default function MedicineFilters({
  locale,
  dictionary,
  totalItems,
  resultCount,
  search,
  selectedCategory,
  selectedStatus,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: {
  locale: Locale;
  dictionary: Dictionary;
  totalItems: number;
  resultCount: number;
  search: string;
  selectedCategory: string;
  selectedStatus: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}) {
  const { dashboard } = dictionary;
  const number = new Intl.NumberFormat(locale);

  return (
    <section
      aria-labelledby="medicine-filter-title"
      className="border-b border-border bg-card px-5 py-5 sm:px-6"
    >
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="medicine-filter-title" className="font-bold text-foreground">
          {dashboard.searchAndFilter}
        </h2>
        <p className="text-xs text-muted-foreground">
          {dashboard.resultCount
            .replace("{shown}", number.format(resultCount))
            .replace("{total}", number.format(totalItems))}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(210px,0.65fr)_minmax(170px,0.5fr)]">
        <div className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={dashboard.searchPlaceholder}
            className="bg-background ps-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger aria-label={dashboard.filterByCategory}>
            <SelectValue placeholder={dashboard.filterByCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {dashboard.allCategories.replace(
                "{count}",
                number.format(totalItems)
              )}
            </SelectItem>
            {MEDICINE_CATEGORIES.map((category, index) => (
              <SelectItem key={category} value={category}>
                {dashboard.categories[index]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger aria-label={dashboard.filterByStatus}>
            <SelectValue placeholder={dashboard.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dashboard.allStatuses}</SelectItem>
            <SelectItem value="valid">{dashboard.validStatus}</SelectItem>
            <SelectItem value="expired">{dashboard.expiredStatus}</SelectItem>
            <SelectItem value="rx">{dashboard.prescriptionStatus}</SelectItem>
            <SelectItem value="out">{dashboard.outStatus}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
