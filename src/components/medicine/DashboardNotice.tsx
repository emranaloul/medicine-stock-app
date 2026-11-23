"use client";

import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";

export default function DashboardNotice({
  dictionary,
  notice,
  onClose,
}: {
  dictionary: Dictionary;
  notice: { message: string; destructive: boolean } | null;
  onClose: () => void;
}) {
  if (!notice) return null;

  return (
    <div className="fixed end-4 top-4 z-[90] w-[min(100%-2rem,24rem)]">
      <Alert
        variant={notice.destructive ? "destructive" : "default"}
        role={notice.destructive ? "alert" : "status"}
        className={`border-s-4 bg-card shadow-xl ${
          notice.destructive ? "border-s-destructive" : "border-s-primary"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <AlertTitle>
              {notice.destructive
                ? dictionary.common.errorTitle
                : dictionary.common.noticeTitle}
            </AlertTitle>
            <AlertDescription>{notice.message}</AlertDescription>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-11 w-11 shrink-0"
            aria-label={dictionary.common.close}
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
