import type { Dictionary } from "@/i18n/dictionaries";

export default function ScanProgressDialog({
  open,
  dictionary,
}: {
  open: boolean;
  dictionary: Dictionary;
}) {
  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[hsl(196,36%,8%)]/55 p-4 backdrop-blur-[3px]"
    >
      <div className="flex max-w-md items-center gap-4 rounded-3xl border border-border bg-card px-6 py-5 text-foreground shadow-2xl">
        <span
          aria-hidden="true"
          className="h-6 w-6 shrink-0 animate-spin rounded-full border-[3px] border-primary border-t-transparent"
        />
        <span className="text-sm font-medium leading-6">
          {dictionary.dashboard.analyzingImage}
        </span>
      </div>
    </div>
  );
}
