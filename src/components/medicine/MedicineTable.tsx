"use client";

import { Edit3, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Medicine } from "@/types/medicine";
import { getCategoryLabel } from "./category-label";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

export default function MedicineTable({
  locale,
  dictionary,
  items,
  totalItems,
  pendingMedicineIds,
  firstVisibleItem,
  lastVisibleItem,
  pageSize,
  pageNumbers,
  visiblePage,
  pageCount,
  onPageSizeChange,
  onPageChange,
  onQuantityChange,
  onEdit,
  onDelete,
}: {
  locale: Locale;
  dictionary: Dictionary;
  items: Medicine[];
  totalItems: number;
  pendingMedicineIds: Set<number>;
  firstVisibleItem: number;
  lastVisibleItem: number;
  pageSize: number;
  pageNumbers: number[];
  visiblePage: number;
  pageCount: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  onQuantityChange: (medicine: Medicine, delta: number) => void;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: number, name: string) => void;
}) {
  const { dashboard } = dictionary;
  const number = new Intl.NumberFormat(locale);

  function quantityControls(item: Medicine) {
    const pending = pendingMedicineIds.has(item.id);
    const buttonClass = "h-11 w-11";
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onQuantityChange(item, -1)}
          disabled={pending}
          className={`${buttonClass} text-foreground`}
          title={dashboard.decreaseQuantity.replace("{name}", item.name)}
          aria-label={dashboard.decreaseQuantity.replace("{name}", item.name)}
        >
          <Minus aria-hidden="true" className="h-4 w-4" />
        </Button>
        <span
          className={`min-w-8 text-center font-bold tabular-nums ${
            item.quantity === 0 ? "text-destructive" : "text-foreground"
          }`}
        >
          {pending ? (
            <span
              role="status"
              aria-label={dashboard.updatingQuantity}
              className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
            />
          ) : (
            number.format(item.quantity)
          )}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onQuantityChange(item, 1)}
          disabled={pending}
          className={`${buttonClass} text-foreground`}
          title={dashboard.increaseQuantity.replace("{name}", item.name)}
          aria-label={dashboard.increaseQuantity.replace("{name}", item.name)}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  function itemActions(item: Medicine) {
    const pending = pendingMedicineIds.has(item.id);
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onEdit(item)}
          disabled={pending}
          aria-label={dashboard.editMedicine.replace("{name}", item.name)}
          title={dashboard.editMedicine.replace("{name}", item.name)}
          className="h-11 w-11 text-muted-foreground hover:bg-secondary hover:text-primary"
        >
          <Edit3 aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onDelete(item.id, item.name)}
          disabled={pending}
          aria-label={dashboard.deleteMedicine.replace("{name}", item.name)}
          title={dashboard.deleteMedicine.replace("{name}", item.name)}
          className="h-11 w-11 text-muted-foreground hover:bg-rose-50 hover:text-destructive"
        >
          {pending ? (
            <span
              aria-hidden="true"
              className="block h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent"
            />
          ) : (
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-label={dashboard.medicine}
      className="bg-card"
    >
      <div className="divide-y divide-border md:hidden">
        {items.length > 0 ? (
          items.map((item) => {
            const isExpired = item.status === "expired";
            return (
              <article key={item.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground">{item.name}</h3>
                    <p dir="auto" className="mt-1 break-words text-sm text-muted-foreground">
                      {item.activeIngredient || dashboard.activeIngredientUnknown}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {isExpired && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-800">
                        {dashboard.expiredBadge}
                        {item.expiryDate && ` (${item.expiryDate})`}
                      </span>
                    )}
                    {item.rxRequired && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                        {dashboard.prescriptionStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{dashboard.category}</p>
                    <p className="mt-1 font-medium text-foreground">
                      {getCategoryLabel(item.category, dictionary)}
                    </p>
                    {item.subCategory && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.subCategory}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{dashboard.usage}</p>
                    <p className="mt-1 text-foreground/80">
                      {item.usage || dictionary.common.notSpecified}
                    </p>
                  </div>
                  {item.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">{dashboard.notes}</p>
                      <p className="mt-1 text-foreground/80">{item.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  {quantityControls(item)}
                  {itemActions(item)}
                </div>
              </article>
            );
          })
        ) : (
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">
            {dashboard.noMatchingItems}
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1050px]">
          <TableHeader>
            <TableRow className="bg-muted/70 hover:bg-muted/70">
              <TableHead>{dashboard.medicine}</TableHead>
              <TableHead>{dashboard.activeIngredient}</TableHead>
              <TableHead>{dashboard.category}</TableHead>
              <TableHead>{dashboard.generalUse}</TableHead>
              <TableHead className="text-center">{dashboard.quantity}</TableHead>
              <TableHead>{dashboard.statusAndNotes}</TableHead>
              <TableHead className="text-center">{dashboard.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-16 text-center text-muted-foreground"
                >
                  {dashboard.noMatchingItems}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isExpired = item.status === "expired";
                return (
                  <TableRow
                    key={item.id}
                    className={
                      isExpired
                        ? "border-s-4 border-s-rose-500 bg-rose-50/70 hover:bg-rose-50"
                        : "hover:bg-muted/40"
                    }
                  >
                    <TableCell className="font-bold text-foreground">
                      <div className="flex flex-col gap-1">
                        <span>{item.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                              {dashboard.expiredBadge}
                              {item.expiryDate && ` (${item.expiryDate})`}
                            </span>
                          )}
                          {item.rxRequired && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              {dashboard.prescriptionStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell dir="auto" className="font-medium text-foreground/80">
                      {item.activeIngredient || dashboard.activeIngredientUnknown}
                    </TableCell>
                    <TableCell>
                      <span className="inline-block rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {getCategoryLabel(item.category, dictionary)}
                      </span>
                      {item.subCategory && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {item.subCategory}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">
                      {item.usage || dictionary.common.notSpecified}
                    </TableCell>
                    <TableCell className="text-center">
                      {quantityControls(item)}
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">
                      {item.notes || dictionary.common.notSpecified}
                    </TableCell>
                    <TableCell className="text-center">{itemActions(item)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>
            {dashboard.itemsRange
              .replace("{first}", number.format(firstVisibleItem))
              .replace("{last}", number.format(lastVisibleItem))
              .replace("{count}", number.format(totalItems))}
          </span>
          <label className="inline-flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{dashboard.perPage}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger
                className="h-9 w-20"
                aria-label={dashboard.itemsPerPage}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {number.format(size)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <nav
          aria-label={dashboard.pagination}
          className="flex items-center gap-1"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(visiblePage - 1)}
            disabled={visiblePage === 1}
          >
            {dashboard.previous}
          </Button>
          {pageNumbers.map((page) => (
            <Button
              key={page}
              type="button"
              variant={page === visiblePage ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(page)}
              aria-current={page === visiblePage ? "page" : undefined}
              aria-label={dashboard.page.replace(
                "{page}",
                number.format(page)
              )}
            >
              {number.format(page)}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(visiblePage + 1)}
            disabled={visiblePage === pageCount}
          >
            {dashboard.next}
          </Button>
        </nav>
      </div>
    </section>
  );
}
