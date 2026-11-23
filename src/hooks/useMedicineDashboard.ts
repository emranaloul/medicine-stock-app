"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  deleteMedicine as deleteMedicineRequest,
  fetchMedicines,
  restoreSeedInventory,
  saveMedicine,
  saveMedicineBatch,
  scanMedicineImage,
  updateMedicineQuantity,
} from "@/services/medicineService";
import { logoutUser } from "@/services/authService";
import { MEDICINE_CATEGORIES } from "@/lib/medicine/categories";
import type {
  ExtractedMedicine,
  InventoryScope,
  Medicine,
  MedicineFamily,
  MedicineFormData,
  PendingAction,
  PendingScope,
} from "@/types/medicine";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

const EMPTY_FORM: MedicineFormData = {
  name: "",
  activeIngredient: "",
  category: MEDICINE_CATEGORIES[0],
  subCategory: "",
  usage: "",
  quantity: 1,
  expiryDate: "",
  status: "valid",
  rxRequired: false,
  notes: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function compressImage(file: File, dictionary: Dictionary) {
  const objectUrl = URL.createObjectURL(file);
  return new Promise<{ mimeType: string; imageBase64: string }>(
    (resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error(dictionary.dashboard.errors.processImage));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve({
            mimeType: "image/jpeg",
            imageBase64: dataUrl.split(",")[1] || "",
          });
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(dictionary.dashboard.errors.readImage));
      };
      image.src = objectUrl;
    }
  );
}

export function useMedicineDashboard({
  locale,
  dictionary,
  initialMedicines,
  families,
}: {
  locale: Locale;
  dictionary: Dictionary;
  initialMedicines: Medicine[];
  families: MedicineFamily[];
}) {
  const [medicines, setMedicines] = useState(initialMedicines);
  const [scope, setScope] = useState<InventoryScope>("personal");
  const [activeFamilyId, setActiveFamilyId] = useState(families[0]?.id || "");
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    destructive: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMedicine[]>([]);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [pendingScope, setPendingScope] = useState<PendingScope | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [pendingMedicineIds, setPendingMedicineIds] = useState<Set<number>>(
    () => new Set()
  );
  const [copyingFamilyId, setCopyingFamilyId] = useState<string | null>(null);
  const [copiedFamilyId, setCopiedFamilyId] = useState<string | null>(null);

  const stats = useMemo(() => {
    let expired = 0;
    let rx = 0;
    let outOfStock = 0;
    for (const medicine of medicines) {
      if (medicine.status === "expired") expired += 1;
      if (medicine.rxRequired) rx += 1;
      if (medicine.quantity === 0) outOfStock += 1;
    }
    return { total: medicines.length, expired, rx, outOfStock };
  }, [medicines]);

  const duplicateGroups = useMemo(() => {
    const ingredients = new Map<string, Medicine[]>();
    for (const medicine of medicines) {
      const ingredient = medicine.activeIngredient
        .toLowerCase()
        .replace(/\d+\s*(mg|mcg|g|iu|%)/gi, "")
        .trim();
      if (
        !ingredient ||
        ingredient === "مكمل غذائي" ||
        ingredient === "تركيبة عشبية" ||
        ingredient === "خلاصات عشبية"
      ) {
        continue;
      }

      const group = ingredients.get(ingredient) ?? [];
      group.push(medicine);
      ingredients.set(ingredient, group);
    }
    return Array.from(ingredients.entries()).filter(([, items]) => items.length > 1);
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();
    return medicines.filter((medicine) => {
      if (selectedCategory !== "all" && medicine.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus === "expired" && medicine.status !== "expired") {
        return false;
      }
      if (selectedStatus === "valid" && medicine.status !== "valid") {
        return false;
      }
      if (selectedStatus === "rx" && !medicine.rxRequired) return false;
      if (selectedStatus === "out" && medicine.quantity > 0) return false;
      if (!query) return true;

      return (
        medicine.name.toLowerCase().includes(query) ||
        medicine.activeIngredient.toLowerCase().includes(query) ||
        medicine.usage.toLowerCase().includes(query) ||
        medicine.subCategory.toLowerCase().includes(query) ||
        medicine.notes.toLowerCase().includes(query)
      );
    });
  }, [medicines, search, selectedCategory, selectedStatus]);

  const pageCount = Math.max(1, Math.ceil(filteredMedicines.length / pageSize));
  const visiblePage = Math.min(currentPage, pageCount);
  const firstPage = Math.min(
    Math.max(1, visiblePage - 2),
    Math.max(1, pageCount - 4)
  );
  const pageNumbers = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => firstPage + index
  );
  const firstVisibleItem = filteredMedicines.length
    ? (visiblePage - 1) * pageSize + 1
    : 0;
  const lastVisibleItem = Math.min(
    visiblePage * pageSize,
    filteredMedicines.length
  );
  const paginatedMedicines = useMemo(() => {
    const start = (visiblePage - 1) * pageSize;
    return filteredMedicines.slice(start, start + pageSize);
  }, [filteredMedicines, pageSize, visiblePage]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  function showError(message: string) {
    setNotice({ message, destructive: true });
  }

  function selectStatus(status: string) {
    setSelectedStatus(status);
    setCurrentPage(1);
  }

  async function switchScope(
    nextScope: InventoryScope,
    familyId = activeFamilyId
  ) {
    if (scopeLoading || (scope === nextScope && activeFamilyId === familyId)) {
      return;
    }

    setScopeLoading(true);
    setPendingScope({ scope: nextScope, familyId });
    try {
      const nextMedicines = await fetchMedicines(
        nextScope,
        familyId,
        dictionary.dashboard.errors.loadInventory,
        dictionary
      );
      setMedicines(nextMedicines);
      setScope(nextScope);
      setActiveFamilyId(familyId);
      setCurrentPage(1);
    } catch (error) {
      showError(
        getErrorMessage(error, dictionary.dashboard.errors.switchInventory)
      );
    } finally {
      setScopeLoading(false);
      setPendingScope(null);
    }
  }

  async function logout() {
    setLogoutLoading(true);
    try {
      await logoutUser(dictionary.dashboard.errors.logout);
      window.location.href = `/${locale}/login`;
    } catch {
      showError(dictionary.dashboard.errors.logout);
      setLogoutLoading(false);
    }
  }

  async function refreshMedicines() {
    const refreshed = await fetchMedicines(
      scope,
      activeFamilyId,
      dictionary.dashboard.errors.refreshInventory,
      dictionary
    );
    setMedicines(refreshed);
  }

  async function handleQuantityChange(item: Medicine, delta: number) {
    if (pendingMedicineIds.has(item.id)) return;
    const nextQuantity = Math.max(0, item.quantity + delta);
    setPendingMedicineIds((current) => new Set(current).add(item.id));
    setMedicines((current) =>
      current.map((medicine) =>
        medicine.id === item.id
          ? { ...medicine, quantity: nextQuantity }
          : medicine
      )
    );

    try {
      await updateMedicineQuantity(
        item.id,
        nextQuantity,
        scope,
        activeFamilyId,
        dictionary.dashboard.errors.updateQuantity,
        dictionary
      );
    } catch (error) {
      setMedicines((current) =>
        current.map((medicine) =>
          medicine.id === item.id
            ? { ...medicine, quantity: item.quantity }
            : medicine
        )
      );
      showError(getErrorMessage(error, dictionary.dashboard.errors.updateQuantity));
    } finally {
      setPendingMedicineIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  function openAddModal() {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setIsFormOpen(true);
  }

  function openEditModal(item: Medicine) {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      activeIngredient: item.activeIngredient,
      category: item.category,
      subCategory: item.subCategory,
      usage: item.usage,
      quantity: item.quantity,
      expiryDate: item.expiryDate,
      status: item.status,
      rxRequired: item.rxRequired,
      notes: item.notes,
    });
    setIsFormOpen(true);
  }

  async function handleSaveForm(values: MedicineFormData) {
    if (loading || !values.name.trim()) return;
    setLoading(true);
    setPendingAction("save");
    try {
      const saved = await saveMedicine(
        values,
        editingId,
        scope,
        activeFamilyId,
        dictionary.dashboard.errors.saveMedicine,
        dictionary
      );
      setMedicines((current) =>
        editingId
          ? current.map((medicine) =>
              medicine.id === editingId ? saved : medicine
            )
          : [saved, ...current]
      );
      if (editingId === null) setCurrentPage(1);
      setIsFormOpen(false);
    } catch (error) {
      showError(getErrorMessage(error, dictionary.dashboard.errors.saveMedicine));
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  function requestDelete(id: number, name: string) {
    if (!pendingMedicineIds.has(id)) setDeleteTarget({ id, name });
  }

  async function confirmDelete() {
    if (!deleteTarget || pendingMedicineIds.has(deleteTarget.id)) return;
    const { id } = deleteTarget;
    const deletedItem = medicines.find((medicine) => medicine.id === id);
    setDeleteTarget(null);
    setPendingMedicineIds((current) => new Set(current).add(id));
    setMedicines((current) => current.filter((medicine) => medicine.id !== id));

    try {
      await deleteMedicineRequest(
        id,
        scope,
        activeFamilyId,
        dictionary.dashboard.errors.deleteMedicine,
        dictionary
      );
    } catch (error) {
      if (deletedItem) {
        setMedicines((current) =>
          current.some((medicine) => medicine.id === id)
            ? current
            : [...current, deletedItem]
        );
      }
      showError(getErrorMessage(error, dictionary.dashboard.errors.deleteMedicine));
    } finally {
      setPendingMedicineIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  async function resetSeed() {
    if (loading) return;
    setShowResetConfirm(false);
    setLoading(true);
    setPendingAction("reset");
    try {
      await restoreSeedInventory(
        scope,
        activeFamilyId,
        dictionary.dashboard.errors.restoreInventory,
        dictionary
      );
      await refreshMedicines();
    } catch (error) {
      showError(getErrorMessage(error, dictionary.dashboard.errors.restoreInventory));
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  async function copyInviteCode(family: MedicineFamily) {
    setCopyingFamilyId(family.id);
    setCopiedFamilyId(null);
    try {
      await navigator.clipboard.writeText(family.inviteCode);
      setCopiedFamilyId(family.id);
    } catch {
      showError(dictionary.dashboard.errors.copyInvite);
    } finally {
      setCopyingFamilyId(null);
    }
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file || scanning) return;
    setScanning(true);
    setExtractedItems([]);
    try {
      const image = await compressImage(file, dictionary);
      const items = await scanMedicineImage(
        image,
        scope,
        activeFamilyId,
        dictionary
      );
      setExtractedItems(items);
      if (items.length === 0) {
        setNotice({
          message: dictionary.dashboard.imageNotRecognized,
          destructive: false,
        });
      }
    } catch (error) {
      showError(getErrorMessage(error, dictionary.dashboard.errors.analyzeImage));
    } finally {
      setScanning(false);
    }
  }

  function updateExtractedItem(
    index: number,
    patch: Partial<ExtractedMedicine>
  ) {
    setExtractedItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  async function saveExtractedItems() {
    const selected = extractedItems
      .filter((item) => item.selected)
      .map(({ selected: _selected, ...item }) => item);
    if (loading || selected.length === 0) return;

    setLoading(true);
    setPendingAction("batch");
    try {
      await saveMedicineBatch(selected, scope, activeFamilyId, dictionary);
      setExtractedItems([]);
      await refreshMedicines();
    } catch (error) {
      showError(getErrorMessage(error, dictionary.dashboard.errors.saveScannedItems));
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  const deleteDescription =
    deleteTarget === null
      ? ""
      : dictionary.dashboard.deleteConfirm.replace("{name}", deleteTarget.name);

  return {
    inventory: {
      medicines,
      scope,
      activeFamilyId,
      scopeLoading,
      pendingScope,
      stats,
      duplicateGroups,
      filteredMedicines,
      paginatedMedicines,
      pageNumbers,
      pageCount,
      visiblePage,
      firstVisibleItem,
      lastVisibleItem,
      pendingMedicineIds,
    },
    filters: {
      search,
      selectedCategory,
      selectedStatus,
      pageSize,
      setSearch,
      setSelectedCategory,
      setPageSize,
      setCurrentPage,
      selectStatus,
    },
    dialogs: {
      showFamilyModal,
      setShowFamilyModal,
      showDuplicatesModal,
      setShowDuplicatesModal,
      showResetConfirm,
      setShowResetConfirm,
      notice,
      clearNotice: () => setNotice(null),
      deleteTarget,
      deleteDescription,
      closeDeleteDialog: () => setDeleteTarget(null),
      isFormOpen,
      setIsFormOpen,
      editingId,
      formData,
    },
    pending: {
      loading,
      pendingAction,
      scanning,
      extractedItems,
      logoutLoading,
      copyingFamilyId,
      copiedFamilyId,
    },
    actions: {
      switchScope,
      logout,
      handleQuantityChange,
      openAddModal,
      openEditModal,
      handleSaveForm,
      requestDelete,
      confirmDelete,
      resetSeed,
      copyInviteCode,
      handleImageUpload,
      updateExtractedItem,
      closeScanReview: () => setExtractedItems([]),
      saveExtractedItems,
    },
  };
}
