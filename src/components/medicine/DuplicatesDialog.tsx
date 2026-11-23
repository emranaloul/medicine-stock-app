"use client";

import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Medicine } from "@/types/medicine";

export default function DuplicatesDialog({
  locale,
  dictionary,
  open,
  groups,
  onOpenChange,
}: {
  locale: Locale;
  dictionary: Dictionary;
  open: boolean;
  groups: Array<[string, Medicine[]]>;
  onOpenChange: (open: boolean) => void;
}) {
  const { dashboard } = dictionary;
  const number = new Intl.NumberFormat(locale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={dictionary.common.close}
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert aria-hidden="true" className="h-5 w-5 text-amber-600" />
            {dashboard.duplicateAlerts}
          </DialogTitle>
          <DialogDescription>
            {dashboard.duplicateDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {groups.length === 0 ? (
            <p className="rounded-2xl border border-border bg-secondary p-4 text-sm font-medium text-foreground">
              {dashboard.noDuplicates}
            </p>
          ) : (
            groups.map(([ingredient, items]) => (
              <section
                key={ingredient}
                className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-sm"
              >
                <h3 className="mb-2 text-sm font-bold text-amber-900">
                  {dashboard.activeIngredientLabel}: {ingredient} (
                  {dashboard.productsCount.replace(
                    "{count}",
                    number.format(items.length)
                  )}
                  )
                </h3>
                <ul className="space-y-1 text-sm text-slate-800">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white px-3 py-2"
                    >
                      <span className="font-semibold">{item.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {dashboard.quantityLabel.replace(
                          "{count}",
                          number.format(item.quantity)
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
