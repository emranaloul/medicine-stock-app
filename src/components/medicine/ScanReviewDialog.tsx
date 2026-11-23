"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { ExtractedMedicine } from "@/types/medicine";
import { MEDICINE_CATEGORIES } from "@/lib/medicine/categories";

export default function ScanReviewDialog({
  locale,
  dictionary,
  items,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  locale: Locale;
  dictionary: Dictionary;
  items: ExtractedMedicine[];
  saving: boolean;
  onChange: (index: number, patch: Partial<ExtractedMedicine>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { dashboard } = dictionary;
  const selectedCount = items.filter((item) => item.selected).length;

  return (
    <Dialog
      open={items.length > 0}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        closeLabel={dictionary.common.close}
        className="max-h-[90vh] max-w-5xl overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{dashboard.reviewScannedItems}</DialogTitle>
          <DialogDescription>{dashboard.reviewScannedHint}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={`grid grid-cols-1 items-end gap-3 rounded-2xl border p-4 shadow-sm transition-colors md:grid-cols-[auto_1.2fr_1fr_1fr_auto] ${
                item.selected
                  ? "border-primary/40 bg-secondary/80"
                  : "border-border/70 bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 md:self-center">
                <Checkbox
                  id={`scan-selected-${index}`}
                  checked={item.selected}
                  onCheckedChange={(checked) =>
                    onChange(index, { selected: checked === true })
                  }
                />
                <Label
                  htmlFor={`scan-selected-${index}`}
                  className="cursor-pointer text-sm font-semibold"
                >
                  {dashboard.includeItem}
                </Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`scan-name-${index}`}>
                  {dashboard.medicineName}
                </Label>
                <Input
                  id={`scan-name-${index}`}
                  value={item.name}
                  onChange={(event) =>
                    onChange(index, { name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`scan-ingredient-${index}`}>
                  {dashboard.activeIngredient}
                </Label>
                <Input
                  id={`scan-ingredient-${index}`}
                  value={item.activeIngredient}
                  onChange={(event) =>
                    onChange(index, { activeIngredient: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`scan-category-${index}`}>
                  {dashboard.mainCategory}
                </Label>
                <Select
                  value={
                    MEDICINE_CATEGORIES.includes(
                      item.category as (typeof MEDICINE_CATEGORIES)[number]
                    )
                      ? item.category
                      : MEDICINE_CATEGORIES[8]
                  }
                  onValueChange={(category) => onChange(index, { category })}
                >
                  <SelectTrigger id={`scan-category-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICINE_CATEGORIES.map((category, categoryIndex) => (
                      <SelectItem key={category} value={category}>
                        {dashboard.categories[categoryIndex]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`scan-quantity-${index}`}>
                  {dashboard.quantity}
                </Label>
                <Input
                  id={`scan-quantity-${index}`}
                  type="number"
                  min={0}
                  value={item.quantity}
                  className="w-24"
                  onChange={(event) =>
                    onChange(index, {
                      quantity: Math.max(0, Number(event.target.value)),
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {dictionary.common.cancel}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || selectedCount === 0}
          >
            {saving
              ? dashboard.saving
              : dashboard.saveSelected.replace(
                  "{count}",
                  new Intl.NumberFormat(locale).format(selectedCount)
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
