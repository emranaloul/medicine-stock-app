export interface Medicine {
  id: number;
  name: string;
  activeIngredient: string;
  category: string;
  subCategory: string;
  usage: string;
  quantity: number;
  expiryDate: string;
  status: string;
  rxRequired: boolean;
  notes: string;
}

export interface MedicineFormData {
  name: string;
  activeIngredient: string;
  category: string;
  subCategory: string;
  usage: string;
  quantity: number;
  expiryDate: string;
  status: string;
  rxRequired: boolean;
  notes: string;
}

export interface ExtractedMedicine extends MedicineFormData {
  status: "valid" | "expired";
  selected: boolean;
}

export interface MedicineFamily {
  id: string;
  name: string;
  inviteCode: string;
  role: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export type InventoryScope = "personal" | "family";

export interface PendingScope {
  scope: InventoryScope;
  familyId: string;
}

export type PendingAction = "save" | "reset" | "batch" | null;
