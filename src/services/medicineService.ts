import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizeApiError } from "@/i18n/errors";
import type {
  ExtractedMedicine,
  InventoryScope,
  Medicine,
  MedicineFormData,
} from "@/types/medicine";
import { MEDICINE_CATEGORIES } from "@/lib/medicine/categories";

const errorResponseSchema = z.object({
  error: z.string().optional(),
});

const medicineSchema = z.object({
  id: z.number(),
  name: z.string(),
  activeIngredient: z.string(),
  category: z.string(),
  subCategory: z.string(),
  usage: z.string(),
  quantity: z.number(),
  expiryDate: z.string(),
  status: z.string(),
  rxRequired: z.boolean(),
  notes: z.string(),
});

const medicinesSchema = z.array(medicineSchema);

const scanResponseSchema = z.object({
  items: z
    .array(
      z
        .object({
          name: z.string().optional(),
          activeIngredient: z.string().optional(),
          category: z.string().optional(),
          subCategory: z.string().optional(),
          usage: z.string().optional(),
          quantity: z.union([z.number(), z.string()]).optional(),
          expiryDate: z.string().optional(),
          status: z.string().optional(),
          rxRequired: z.boolean().optional(),
          notes: z.string().optional(),
        })
        .passthrough()
    )
    .optional(),
});

function scopeHeaders(scope: InventoryScope, familyId: string) {
  return {
    "x-pharmacy-scope": scope,
    "x-family-id": scope === "family" ? familyId : "",
  };
}

function getLocalizedError(
  message: string | undefined,
  fallback: string,
  dictionary: Dictionary
): string {
  if (!message) return fallback;
  const localized = localizeApiError(message, dictionary);
  return localized === dictionary.common.genericError ? fallback : localized;
}

async function throwResponseError(
  response: Response,
  fallback: string,
  dictionary: Dictionary
): Promise<never> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(fallback);
  }

  const parsed = errorResponseSchema.safeParse(data);
  throw new Error(
    getLocalizedError(
      parsed.success ? parsed.data.error : undefined,
      fallback,
      dictionary
    )
  );
}

async function readResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
  fallback: string,
  dictionary: Dictionary
): Promise<T> {
  if (!response.ok) {
    return throwResponseError(response, fallback, dictionary);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(fallback);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error(fallback);
  return parsed.data;
}

export async function fetchMedicines(
  scope: InventoryScope,
  familyId: string,
  fallback: string,
  dictionary: Dictionary
): Promise<Medicine[]> {
  const response = await fetch("/api/medicines", {
    headers: scopeHeaders(scope, familyId),
  });
  return readResponse(response, medicinesSchema, fallback, dictionary);
}

export async function updateMedicineQuantity(
  id: number,
  quantity: number,
  scope: InventoryScope,
  familyId: string,
  fallback: string,
  dictionary: Dictionary
): Promise<void> {
  const response = await fetch(`/api/medicines/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...scopeHeaders(scope, familyId),
    },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) {
    return throwResponseError(response, fallback, dictionary);
  }
}

export async function saveMedicine(
  values: MedicineFormData,
  id: number | null,
  scope: InventoryScope,
  familyId: string,
  fallback: string,
  dictionary: Dictionary
): Promise<Medicine> {
  const response = await fetch(
    id ? `/api/medicines/${id}` : "/api/medicines",
    {
      method: id ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...scopeHeaders(scope, familyId),
      },
      body: JSON.stringify(values),
    }
  );
  return readResponse(response, medicineSchema, fallback, dictionary);
}

export async function deleteMedicine(
  id: number,
  scope: InventoryScope,
  familyId: string,
  fallback: string,
  dictionary: Dictionary
): Promise<void> {
  const response = await fetch(`/api/medicines/${id}`, {
    method: "DELETE",
    headers: scopeHeaders(scope, familyId),
  });
  if (!response.ok) {
    return throwResponseError(response, fallback, dictionary);
  }
}

export async function restoreSeedInventory(
  scope: InventoryScope,
  familyId: string,
  fallback: string,
  dictionary: Dictionary
): Promise<void> {
  const response = await fetch("/api/seed", {
    method: "POST",
    headers: scopeHeaders(scope, familyId),
  });
  if (!response.ok) {
    return throwResponseError(response, fallback, dictionary);
  }
}

export async function scanMedicineImage(
  image: { mimeType: string; imageBase64: string },
  scope: InventoryScope,
  familyId: string,
  dictionary: Dictionary
): Promise<ExtractedMedicine[]> {
  const response = await fetch("/api/scan-medicines", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...scopeHeaders(scope, familyId),
    },
    body: JSON.stringify(image),
  });
  const { items = [] } = await readResponse(
    response,
    scanResponseSchema,
    dictionary.dashboard.errors.analyzeImage,
    dictionary
  );

  return items.map((item) => {
    const category = item.category ?? "";
    const quantity = Number(item.quantity ?? 1);
    return {
      name: String(item.name ?? "").trim(),
      activeIngredient: String(item.activeIngredient ?? "").trim(),
      category: MEDICINE_CATEGORIES.includes(
        category as (typeof MEDICINE_CATEGORIES)[number]
      )
        ? category
        : MEDICINE_CATEGORIES[8],
      subCategory: String(
        item.subCategory || dictionary.common.general
      ).trim(),
      usage: String(item.usage ?? "").trim(),
      quantity: Number.isFinite(quantity) ? Math.max(0, quantity) : 1,
      expiryDate: String(item.expiryDate ?? "").trim(),
      status: item.status === "expired" ? "expired" : "valid",
      rxRequired: Boolean(item.rxRequired),
      notes: String(item.notes ?? "").trim(),
      selected: true,
    };
  });
}

export async function saveMedicineBatch(
  items: MedicineFormData[],
  scope: InventoryScope,
  familyId: string,
  dictionary: Dictionary
): Promise<void> {
  const response = await fetch("/api/medicines/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...scopeHeaders(scope, familyId),
    },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) {
    return throwResponseError(
      response,
      dictionary.dashboard.errors.saveScannedItems,
      dictionary
    );
  }
}
