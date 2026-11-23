"use client";

import { type FormikErrors, useFormik } from "formik";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/dictionaries";
import type { MedicineFormData } from "@/types/medicine";
import { MEDICINE_CATEGORIES } from "@/lib/medicine/categories";

function validate(
  values: MedicineFormData,
  dictionary: Dictionary
): FormikErrors<MedicineFormData> {
  const schema = z.object({
    name: z.string().trim().min(1, dictionary.dashboard.medicineName),
    activeIngredient: z.string(),
    category: z.string(),
    subCategory: z.string(),
    usage: z.string(),
    quantity: z.number().min(0),
    expiryDate: z.string(),
    status: z.enum(["valid", "expired"]),
    rxRequired: z.boolean(),
    notes: z.string(),
  });
  const result = schema.safeParse(values);
  if (result.success) return {};

  return result.error.issues.reduce<FormikErrors<MedicineFormData>>(
    (errors, issue) => {
      if (issue.path[0] === "name" && !errors.name) {
        errors.name = issue.message;
      }
      if (issue.path[0] === "quantity" && !errors.quantity) {
        errors.quantity = issue.message;
      }
      return errors;
    },
    {}
  );
}

export default function MedicineFormDialog({
  dictionary,
  open,
  editing,
  initialValues,
  saving,
  onOpenChange,
  onSave,
}: {
  dictionary: Dictionary;
  open: boolean;
  editing: boolean;
  initialValues: MedicineFormData;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: MedicineFormData) => void;
}) {
  const { dashboard } = dictionary;
  const formik = useFormik<MedicineFormData>({
    initialValues,
    enableReinitialize: true,
    validate: (values) => validate(values, dictionary),
    onSubmit: (values) => onSave({ ...values, name: values.name.trim() }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={dictionary.common.close}
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? dashboard.editTitle : dashboard.newTitle}
          </DialogTitle>
        </DialogHeader>
        <form
          noValidate
          onSubmit={formik.handleSubmit}
          className="space-y-4 text-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="medicine-name">{dashboard.productName}</Label>
            <Input
              id="medicine-name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder={dashboard.productNamePlaceholder}
              aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
              disabled={saving}
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-sm text-destructive">{formik.errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicine-ingredient">
                {dashboard.activeIngredient}
              </Label>
              <Input
                id="medicine-ingredient"
                name="activeIngredient"
                value={formik.values.activeIngredient}
                onChange={formik.handleChange}
                placeholder={dashboard.ingredientPlaceholder}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-quantity">{dashboard.quantityPack}</Label>
              <Input
                id="medicine-quantity"
                name="quantity"
                type="number"
                min={0}
                value={formik.values.quantity}
                onChange={(event) =>
                  formik.setFieldValue(
                    "quantity",
                    Math.max(0, Number(event.target.value))
                  )
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicine-category">{dashboard.mainCategory}</Label>
              <Select
                value={formik.values.category}
                onValueChange={(category) =>
                  formik.setFieldValue("category", category)
                }
                disabled={saving}
              >
                <SelectTrigger id="medicine-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDICINE_CATEGORIES.map((category, index) => (
                    <SelectItem key={category} value={category}>
                      {dashboard.categories[index]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-subcategory">{dashboard.subCategory}</Label>
              <Input
                id="medicine-subcategory"
                name="subCategory"
                value={formik.values.subCategory}
                onChange={formik.handleChange}
                placeholder={dashboard.subCategoryPlaceholder}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine-usage">{dashboard.generalUse}</Label>
            <Input
              id="medicine-usage"
              name="usage"
              value={formik.values.usage}
              onChange={formik.handleChange}
              placeholder={dashboard.usagePlaceholder}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicine-status">{dashboard.expiryStatus}</Label>
              <Select
                value={formik.values.status}
                onValueChange={(status) =>
                  formik.setFieldValue("status", status)
                }
                disabled={saving}
              >
                <SelectTrigger id="medicine-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valid">{dashboard.validOption}</SelectItem>
                  <SelectItem value="expired">
                    {dashboard.expiredOption}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-expiry">
                {dashboard.expiryDateOptional}
              </Label>
              <Input
                id="medicine-expiry"
                name="expiryDate"
                value={formik.values.expiryDate}
                onChange={formik.handleChange}
                placeholder={dashboard.expiryDatePlaceholder}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="medicine-rx"
              checked={formik.values.rxRequired}
              onCheckedChange={(checked) =>
                formik.setFieldValue("rxRequired", checked === true)
              }
              disabled={saving}
            />
            <Label htmlFor="medicine-rx">{dashboard.prescriptionOnly}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine-notes">{dashboard.additionalNotes}</Label>
            <Textarea
              id="medicine-notes"
              name="notes"
              rows={2}
              value={formik.values.notes}
              onChange={formik.handleChange}
              placeholder={dashboard.notesPlaceholder}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {dictionary.common.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? dashboard.saving : dictionary.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
