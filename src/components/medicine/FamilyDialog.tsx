"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import type { InventoryScope, MedicineFamily } from "@/types/medicine";

export default function FamilyDialog({
  dictionary,
  open,
  families,
  scope,
  activeFamilyId,
  copyingFamilyId,
  copiedFamilyId,
  onOpenChange,
  onCopy,
}: {
  dictionary: Dictionary;
  open: boolean;
  families: MedicineFamily[];
  scope: InventoryScope;
  activeFamilyId: string;
  copyingFamilyId: string | null;
  copiedFamilyId: string | null;
  onOpenChange: (open: boolean) => void;
  onCopy: (family: MedicineFamily) => void;
}) {
  const { dashboard } = dictionary;
  const visibleFamilies = families.filter((family) =>
    scope === "family" ? family.id === activeFamilyId : true
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={dictionary.common.close}
        className="max-h-[85vh] max-w-lg overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{dashboard.familyMembers}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {visibleFamilies.map((family) => (
            <section key={family.id} className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {dashboard.inviteCodeLabel}
                  </div>
                  <div dir="ltr" className="mt-1 font-mono text-lg font-bold tracking-wider text-foreground">
                    {family.inviteCode}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onCopy(family)}
                  disabled={copyingFamilyId === family.id}
                >
                  {copyingFamilyId === family.id ? (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    />
                  ) : copiedFamilyId === family.id ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Copy aria-hidden="true" className="h-4 w-4" />
                  )}
                  {copyingFamilyId === family.id
                    ? dashboard.copying
                    : copiedFamilyId === family.id
                      ? dashboard.copied
                      : dashboard.copy}
                </Button>
              </div>
              <div className="space-y-2">
                {family.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {member.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{member.name}</div>
                        <div
                          dir="ltr"
                          className="truncate text-start text-xs text-muted-foreground"
                        >
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-foreground">
                      {member.role === "ADMIN"
                        ? dashboard.roleAdmin
                        : dashboard.roleMember}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
