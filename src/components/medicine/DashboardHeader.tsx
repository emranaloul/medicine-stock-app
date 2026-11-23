"use client";

import { useRef } from "react";
import {
  Camera,
  ChevronDown,
  Images,
  LogOut,
  Pill,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type {
  InventoryScope,
  MedicineFamily,
  PendingAction,
  PendingScope,
} from "@/types/medicine";

export default function DashboardHeader({
  locale,
  dictionary,
  userName,
  families,
  scope,
  activeFamilyId,
  scopeLoading,
  pendingScope,
  scanning,
  loading,
  pendingAction,
  duplicateCount,
  logoutLoading,
  onManageFamily,
  onLogout,
  onScopeChange,
  onAddManual,
  onImageUpload,
  onReset,
  onShowDuplicates,
}: {
  locale: Locale;
  dictionary: Dictionary;
  userName: string;
  families: MedicineFamily[];
  scope: InventoryScope;
  activeFamilyId: string;
  scopeLoading: boolean;
  pendingScope: PendingScope | null;
  scanning: boolean;
  loading: boolean;
  pendingAction: PendingAction;
  duplicateCount: number;
  logoutLoading: boolean;
  onManageFamily: () => void;
  onLogout: () => void;
  onScopeChange: (scope: InventoryScope, familyId?: string) => void;
  onAddManual: () => void;
  onImageUpload: (file: File | undefined) => void;
  onReset: () => void;
  onShowDuplicates: () => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    onImageUpload(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  return (
    <header className="dash-header">
      <div className="mx-auto max-w-screen-2xl space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="dash-mark">
              <Pill aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#e7c4a4]">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                {dictionary.dashboard.brandOverline}
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                {dictionary.dashboard.title}
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-white/70">
                {dictionary.dashboard.subtitle}
              </p>
            </div>
          </div>

          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <LocaleSwitcher
              locale={locale}
              label={dictionary.locale.language}
              showIcon
              className="min-h-11 shrink-0 rounded-xl border-white/20 bg-transparent px-3 text-white/90 hover:bg-white/10 hover:text-white"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="group min-h-14 min-w-0 flex-1 justify-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-white shadow-lg shadow-black/10 backdrop-blur-md hover:bg-white/10 hover:text-white sm:w-64 sm:flex-none"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-200/15 bg-emerald-300/10 text-emerald-100">
                    <UserRound aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block text-xs font-medium text-emerald-100/70">
                      {dictionary.dashboard.welcome}
                    </span>
                    <span className="block truncate text-sm font-bold text-white">
                      {userName}
                    </span>
                  </span>
                  {logoutLoading ? (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                    />
                  ) : (
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-white/60 transition-transform group-data-[state=open]:rotate-180"
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[80] w-64 p-2">
                <DropdownMenuLabel className="px-3 py-2">
                  <span className="block text-xs font-normal text-muted-foreground">
                    {dictionary.dashboard.welcome}
                  </span>
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {userName}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {families.length > 0 && (
                  <>
                    <DropdownMenuItem onSelect={onManageFamily}>
                      <Users aria-hidden="true" />
                      {dictionary.dashboard.manageFamily}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onSelect={onLogout}
                  disabled={logoutLoading}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut aria-hidden="true" />
                  {logoutLoading
                    ? dictionary.dashboard.loggingOut
                    : dictionary.dashboard.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-fit max-w-full">
              <p className="mb-2 text-xs font-semibold tracking-wide text-white/65">
                {dictionary.dashboard.currentInventory}
              </p>
              <div className="dash-scope flex w-fit max-w-full flex-wrap gap-1 rounded-xl p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={scope === "personal" ? "secondary" : "ghost"}
                  aria-pressed={scope === "personal"}
                  onClick={() => onScopeChange("personal")}
                  disabled={scopeLoading}
                  className={
                    scope === "personal"
                      ? "min-h-11 bg-[#f6efe4] text-[#1c3338] hover:bg-white"
                      : "min-h-11 text-white/85 hover:bg-white/10 hover:text-white"
                  }
                >
                  {pendingScope?.scope === "personal"
                    ? dictionary.common.loading
                    : dictionary.dashboard.personalInventory}
                </Button>
                {families.map((family) => (
                  <Button
                    key={family.id}
                    type="button"
                    size="sm"
                    variant={
                      scope === "family" && activeFamilyId === family.id
                        ? "secondary"
                        : "ghost"
                    }
                    aria-pressed={
                      scope === "family" && activeFamilyId === family.id
                    }
                    onClick={() => onScopeChange("family", family.id)}
                    disabled={scopeLoading}
                    className={
                      scope === "family" && activeFamilyId === family.id
                        ? "min-h-11 min-w-0 max-w-full truncate bg-[#f6efe4] text-[#1c3338] hover:bg-white"
                        : "min-h-11 min-w-0 max-w-full truncate text-white/85 hover:bg-white/10 hover:text-white"
                    }
                  >
                    {pendingScope?.scope === "family" &&
                    pendingScope.familyId === family.id
                      ? dictionary.common.loading
                      : family.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <div className="col-span-2 sm:col-span-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      disabled={scanning}
                      className="dash-header-action w-full sm:w-auto"
                    >
                      <Plus aria-hidden="true" className="h-4 w-4" />
                      {dictionary.dashboard.addMedicine}
                      <ChevronDown aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="z-[80] w-64"
                  >
                    <DropdownMenuItem onSelect={onAddManual}>
                      <Plus aria-hidden="true" className="h-4 w-4 text-primary" />
                      {dictionary.dashboard.manualEntry}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={scanning}
                      onSelect={() => cameraInputRef.current?.click()}
                    >
                      <Camera aria-hidden="true" className="h-4 w-4 text-sky-600" />
                      {dictionary.dashboard.scanWithAi}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={scanning}
                      onSelect={() => imageInputRef.current?.click()}
                    >
                      <Images aria-hidden="true" className="h-4 w-4 text-slate-600" />
                      {dictionary.dashboard.uploadImage}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label={dictionary.dashboard.scanWithAi}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={scanning}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  aria-label={dictionary.dashboard.uploadImage}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={scanning}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={onShowDuplicates}
                className="min-h-11 bg-[#f0c36a] text-[#3d2a08] hover:bg-[#e7b44e]"
              >
                <ShieldAlert aria-hidden="true" className="h-4 w-4" />
                {dictionary.dashboard.duplicates.replace(
                  "{count}",
                  new Intl.NumberFormat(locale).format(duplicateCount)
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={loading}
                title={dictionary.dashboard.restoreStockTitle}
                className="min-h-11 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                {pendingAction === "reset" ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                ) : (
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                )}
                {pendingAction === "reset"
                  ? dictionary.dashboard.restoringStock
                  : dictionary.dashboard.restoreStock}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
