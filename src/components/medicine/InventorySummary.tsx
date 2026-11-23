"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Layers,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function InventorySummary({
  locale,
  dictionary,
  stats,
  selectedStatus,
  onSelectStatus,
}: {
  locale: Locale;
  dictionary: Dictionary;
  stats: { total: number; expired: number; rx: number; outOfStock: number };
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}) {
  const { dashboard } = dictionary;
  const number = new Intl.NumberFormat(locale);
  const statCards = [
    {
      status: "all",
      label: dashboard.totalItems,
      detail: dashboard.inCurrentInventory,
      value: stats.total,
      icon: Layers,
      iconClasses: "bg-primary/10 text-primary",
      classes: "dash-stat--total",
    },
    {
      status: "expired",
      label: dashboard.expiredItems,
      detail: dashboard.needsReview,
      value: stats.expired,
      icon: AlertTriangle,
      iconClasses: "bg-rose-100 text-rose-800",
      classes: "dash-stat--expired",
    },
    {
      status: "rx",
      label: dashboard.prescriptionItems,
      detail: dashboard.requiresPrescription,
      value: stats.rx,
      icon: FileText,
      iconClasses: "bg-amber-100 text-amber-900",
      classes: "dash-stat--prescription",
    },
    {
      status: "out",
      label: dashboard.outOfStock,
      detail: dashboard.needsRestock,
      value: stats.outOfStock,
      icon: CheckCircle2,
      iconClasses: "bg-stone-200 text-stone-700",
      classes: "dash-stat--out",
    },
  ];

  return (
    <>
      <section aria-labelledby="inventory-summary-title" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-primary">
              {dashboard.overview}
            </p>
            <h2
              id="inventory-summary-title"
              className="mt-1 text-2xl font-bold tracking-tight text-foreground"
            >
              {dashboard.inventorySummary}
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            {dashboard.filterHint}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {statCards.map(
            ({ status, label, detail, value, icon: Icon, iconClasses, classes }) => {
              const selected = selectedStatus === status;

              return (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  onClick={() => onSelectStatus(status)}
                  aria-pressed={selected}
                  className={`dash-stat ${classes} h-auto min-h-40 flex-col items-stretch justify-between rounded-2xl border-border p-5 text-start whitespace-normal text-foreground shadow-sm hover:bg-card`}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {label}
                    </span>
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClasses}`}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                  </span>
                  <span className="mt-5 text-4xl font-bold tabular-nums tracking-tight text-foreground">
                    {number.format(value)}
                  </span>
                  <span className="mt-1 block w-full text-xs font-medium text-muted-foreground">
                    {detail}
                  </span>
                </Button>
              );
            }
          )}
        </div>
      </section>

      {stats.expired > 0 && (
        <Alert className="flex flex-col rounded-2xl border-rose-200 bg-rose-50 text-rose-950 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AlertTitle>
              {dashboard.expiredAlertTitle.replace(
                "{count}",
                number.format(stats.expired)
              )}
            </AlertTitle>
            <AlertDescription>
              {dashboard.expiredAlertDescription}
            </AlertDescription>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onSelectStatus("expired")}
            className="shrink-0"
          >
            {dashboard.showExpiredOnly}
          </Button>
        </Alert>
      )}
    </>
  );
}
