"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Pill,
  Layers,
  RotateCcw,
  X,
  Minus,
  ShieldAlert,
  Camera,
  Images,
  ChevronDown,
  MessageCircle,
  Send,
} from "lucide-react";

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

const CATEGORIES = [
  "مسكنات الألم وخافضات الحرارة",
  "مسكنات ومضادات الالتهاب",
  "الحساسية، الأنف، والسعال",
  "الجهاز الهضمي والمعدة",
  "المضادات الحيوية ومضادات الفطريات",
  "المسالك البولية",
  "الفيتامينات والمكملات الغذائية",
  "الجلدية، الجروح، والرضاعة",
  "أدوية متخصصة ومستلزمات طبية",
];

const EMPTY_FORM = {
  name: "",
  activeIngredient: "",
  category: CATEGORIES[0],
  subCategory: "",
  usage: "",
  quantity: 1,
  expiryDate: "",
  status: "valid",
  rxRequired: false,
  notes: "",
};

interface ExtractedMedicine {
  name: string;
  activeIngredient: string;
  category: string;
  subCategory: string;
  usage: string;
  quantity: number;
  expiryDate: string;
  status: "valid" | "expired";
  rxRequired: boolean;
  notes: string;
  selected: boolean;
}

interface PharmacyChatMessage {
  role: "user" | "model";
  content: string;
}

const CHAT_SUGGESTIONS = [
  "ما الأدوية منتهية الصلاحية أو التي أوشكت على الانتهاء؟",
  "هل لدي مسكن أو مرخي عضل آمن للمرضع؟",
  "ما الأدوية المتوفرة للصداع أو الحرارة؟",
  "هل يوجد تكرار في المواد الفعالة بمخزوني؟",
];

const PAGE_SIZE_OPTIONS = [12, 24, 48];

export default function MedicineDashboard({
  initialMedicines,
  user,
  families,
}: {
  initialMedicines: Medicine[];
  user: { id: string; name: string; email: string };
  families: Array<{
    id: string;
    name: string;
    inviteCode: string;
    role: string;
    members: Array<{ id: string; name: string; email: string; role: string }>;
  }>;
}) {
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [scope, setScope] = useState<"personal" | "family">("personal");
  const [activeFamilyId, setActiveFamilyId] = useState(families[0]?.id || "");
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const addMenuButtonRef = useRef<HTMLButtonElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Modal state for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "reset" | "batch" | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMedicine[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<PharmacyChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [pendingScope, setPendingScope] = useState<{
    scope: "personal" | "family";
    familyId: string;
  } | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [pendingMedicineIds, setPendingMedicineIds] = useState<Set<number>>(
    () => new Set()
  );
  const [copyingFamilyId, setCopyingFamilyId] = useState<string | null>(null);
  const [copiedFamilyId, setCopiedFamilyId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = medicines.length;
    const expired = medicines.filter((m) => m.status === "expired").length;
    const rx = medicines.filter((m) => m.rxRequired).length;
    const outOfStock = medicines.filter((m) => m.quantity === 0).length;
    return { total, expired, rx, outOfStock };
  }, [medicines]);

  // Detect duplicate active ingredients
  const duplicateGroups = useMemo(() => {
    const map = new Map<string, Medicine[]>();
    medicines.forEach((m) => {
      const base = m.activeIngredient
        .toLowerCase()
        .replace(/\d+\s*(mg|mcg|g|iu|%)/gi, "")
        .trim();
      if (
        !base ||
        base === "مكمل غذائي" ||
        base === "تركيبة عشبية" ||
        base === "خلاصات عشبية"
      ) {
        return;
      }
      const list = map.get(base) || [];
      list.push(m);
      map.set(base, list);
    });
    return Array.from(map.entries()).filter(([, items]) => items.length > 1);
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus === "expired" && item.status !== "expired") {
        return false;
      }
      if (selectedStatus === "valid" && item.status !== "valid") {
        return false;
      }
      if (selectedStatus === "rx" && !item.rxRequired) {
        return false;
      }
      if (selectedStatus === "out" && item.quantity > 0) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.activeIngredient.toLowerCase().includes(q) ||
          item.usage.toLowerCase().includes(q) ||
          item.subCategory.toLowerCase().includes(q) ||
          item.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [medicines, selectedCategory, selectedStatus, search]);

  const pageCount = Math.max(1, Math.ceil(filteredMedicines.length / pageSize));
  const visiblePage = Math.min(currentPage, pageCount);
  const firstPage = Math.min(Math.max(1, visiblePage - 2), Math.max(1, pageCount - 4));
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

  useEffect(() => {
    if (!showChat || !chatMessagesContainerRef.current) return;
    chatMessagesContainerRef.current.scrollTop =
      chatMessagesContainerRef.current.scrollHeight;
  }, [chatMessages, chatLoading, chatStreaming, showChat]);

  useEffect(() => {
    if (!showAddMenu) return;

    function handlePointerDown(event: MouseEvent) {
      if (event.target instanceof Node && !addMenuRef.current?.contains(event.target)) {
        setShowAddMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowAddMenu(false);
        addMenuButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAddMenu]);

  function scopeHeaders() {
    return {
      "x-pharmacy-scope": scope,
      "x-family-id": scope === "family" ? activeFamilyId : "",
    };
  }

  function selectStatus(status: string) {
    setSelectedStatus(status);
    setCurrentPage(1);
  }

  async function switchScope(nextScope: "personal" | "family", familyId = activeFamilyId) {
    if (scopeLoading || (scope === nextScope && activeFamilyId === familyId)) return;
    setScopeLoading(true);
    setPendingScope({ scope: nextScope, familyId });
    try {
      const res = await fetch("/api/medicines", {
        headers: {
          "x-pharmacy-scope": nextScope,
          "x-family-id": nextScope === "family" ? familyId : "",
        },
      });
      if (!res.ok) throw new Error("تعذر تحميل المخزون المحدد");
      setMedicines(await res.json());
      setScope(nextScope);
      setActiveFamilyId(familyId);
      setCurrentPage(1);
      setChatMessages([]);
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تبديل المخزون.");
    } finally {
      setScopeLoading(false);
      setPendingScope(null);
    }
  }

  async function logout() {
    setLogoutLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("تعذر تسجيل الخروج");
      window.location.href = "/login";
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تسجيل الخروج.");
      setLogoutLoading(false);
    }
  }

  async function sendChatMessage(rawMessage = chatInput) {
    const message = rawMessage.trim();
    if (!message || chatLoading) return;

    const history = chatMessages;
    let assistantMessageStarted = false;
    let assistantAnswer = "";
    setChatMessages((current) => [...current, { role: "user", content: message }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/ask-pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...scopeHeaders() },
        body: JSON.stringify({ message, history }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "تعذر الحصول على إجابة");
      }
      if (!res.body) throw new Error("تعذر قراءة إجابة المساعد.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        let chunkResult: ReadableStreamReadResult<Uint8Array>;
        try {
          chunkResult = await reader.read();
        } catch {
          throw new Error("تعذر الاتصال بمساعد الصيدلية.");
        }
        const { done, value } = chunkResult;
        const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
        if (chunk) {
          assistantAnswer += chunk;
          if (!assistantMessageStarted) {
            assistantMessageStarted = true;
            setChatStreaming(true);
            setChatMessages((current) => [
              ...current,
              { role: "model", content: assistantAnswer },
            ]);
          } else {
            setChatMessages((current) => {
              const lastIndex = current.length - 1;
              if (lastIndex < 0 || current[lastIndex].role !== "model") {
                return [...current, { role: "model", content: assistantAnswer }];
              }
              return [
                ...current.slice(0, lastIndex),
                { ...current[lastIndex], content: assistantAnswer },
              ];
            });
          }
        }
        if (done) break;
      }
      if (!assistantAnswer.trim()) {
        throw new Error("لم أتمكن من إنشاء إجابة. حاول مرة أخرى.");
      }
    } catch (error) {
      const errorMessage = assistantMessageStarted
        ? "تعذر إكمال الإجابة بسبب انقطاع الاتصال."
        : error instanceof Error
          ? error.message
          : "تعذر الاتصال بمساعد الصيدلية.";
      setChatMessages((current) => {
        const lastIndex = current.length - 1;
        if (assistantMessageStarted && lastIndex >= 0 && current[lastIndex].role === "model") {
          return [
            ...current.slice(0, lastIndex),
            {
              ...current[lastIndex],
              content: `${assistantAnswer}\n\n${errorMessage}`,
            },
          ];
        }
        return [...current, { role: "model", content: errorMessage }];
      });
    } finally {
      setChatLoading(false);
      setChatStreaming(false);
    }
  }

  async function refreshMedicines() {
    const res = await fetch("/api/medicines", { headers: scopeHeaders() });
    if (!res.ok) throw new Error("تعذر تحديث المخزون");
    setMedicines(await res.json());
  }

  async function handleQuantityChange(item: Medicine, delta: number) {
    if (pendingMedicineIds.has(item.id)) return;
    const nextQty = Math.max(0, item.quantity + delta);
    setPendingMedicineIds((current) => new Set(current).add(item.id));
    setMedicines((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, quantity: nextQty } : m))
    );
    try {
      const res = await fetch(`/api/medicines/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...scopeHeaders() },
        body: JSON.stringify({ quantity: nextQty }),
      });
      if (!res.ok) throw new Error("تعذر تحديث الكمية");
    } catch (error) {
      setMedicines((prev) =>
        prev.map((medicine) =>
          medicine.id === item.id ? { ...medicine, quantity: item.quantity } : medicine
        )
      );
      alert(error instanceof Error ? error.message : "تعذر تحديث الكمية.");
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
    setFormData(EMPTY_FORM);
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

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !formData.name.trim()) return;
    setLoading(true);
    setPendingAction("save");
    try {
      if (editingId) {
        const res = await fetch(`/api/medicines/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...scopeHeaders() },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "تعذر تحديث الدواء");
        setMedicines((prev) =>
          prev.map((m) => (m.id === editingId ? data : m))
        );
      } else {
        const res = await fetch("/api/medicines", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...scopeHeaders() },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "تعذر إضافة الدواء");
        setMedicines((prev) => [data, ...prev]);
        setCurrentPage(1);
      }
      setIsFormOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر حفظ الدواء.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (pendingMedicineIds.has(id)) return;
    if (!confirm(`هل أنت متأكد من حذف "${name}" من المخزون؟`)) return;
    const deletedItem = medicines.find((medicine) => medicine.id === id);
    setPendingMedicineIds((current) => new Set(current).add(id));
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    try {
      const res = await fetch(`/api/medicines/${id}`, {
        method: "DELETE",
        headers: scopeHeaders(),
      });
      if (!res.ok) throw new Error("تعذر حذف الدواء");
    } catch (error) {
      if (deletedItem) {
        setMedicines((current) =>
          current.some((medicine) => medicine.id === id)
            ? current
            : [...current, deletedItem]
        );
      }
      alert(error instanceof Error ? error.message : "تعذر حذف الدواء.");
    } finally {
      setPendingMedicineIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleResetSeed() {
    if (loading) return;
    if (
      !confirm(
        "هل تريد إعادة ضبط قاعدة البيانات واستعادة المخزون الأصلي (71 صنفاً)؟"
      )
    )
      return;
    setLoading(true);
    setPendingAction("reset");
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: scopeHeaders(),
      });
      if (!res.ok) throw new Error("تعذر استعادة المخزون الأصلي");
      await refreshMedicines();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر استعادة المخزون.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  async function copyInviteCode(family: (typeof families)[number]) {
    setCopyingFamilyId(family.id);
    setCopiedFamilyId(null);
    try {
      await navigator.clipboard.writeText(family.inviteCode);
      setCopiedFamilyId(family.id);
    } catch {
      alert("تعذر نسخ الرمز. يمكنك تحديده ونسخه يدوياً.");
    } finally {
      setCopyingFamilyId(null);
    }
  }

  async function compressImage(file: File) {
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("تعذر قراءة الصورة"));
        element.src = objectUrl;
      });

      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("تعذر معالجة الصورة");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      return {
        mimeType: "image/jpeg",
        imageBase64: dataUrl.split(",")[1] || "",
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file || scanning) return;
    setScanning(true);
    setExtractedItems([]);
    try {
      const image = await compressImage(file);
      const res = await fetch("/api/scan-medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...scopeHeaders() },
        body: JSON.stringify(image),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر تحليل الصورة");

      const normalized = (Array.isArray(data.items) ? data.items : []).map(
        (item: Partial<ExtractedMedicine>) => ({
          name: String(item.name || "").trim(),
          activeIngredient: String(item.activeIngredient || "").trim(),
          category: CATEGORIES.includes(String(item.category || ""))
            ? String(item.category)
            : CATEGORIES[8],
          subCategory: String(item.subCategory || "عام").trim(),
          usage: String(item.usage || "").trim(),
          quantity: Math.max(0, Number(item.quantity ?? 1)),
          expiryDate: String(item.expiryDate || "").trim(),
          status: item.status === "expired" ? "expired" : "valid",
          rxRequired: Boolean(item.rxRequired),
          notes: String(item.notes || "").trim(),
          selected: true,
        })
      );
      setExtractedItems(normalized);
      if (normalized.length === 0) {
        alert("لم يتم العثور على أدوية واضحة في الصورة.");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تحليل الصورة.");
    } finally {
      setScanning(false);
    }
  }

  function updateExtractedItem(index: number, patch: Partial<ExtractedMedicine>) {
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
      const res = await fetch("/api/medicines/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...scopeHeaders() },
        body: JSON.stringify({ items: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "تعذر حفظ العناصر");
      }
      setExtractedItems([]);
      await refreshMedicines();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر حفظ العناصر.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-800 text-white shadow-lg">
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-inner">
                <Pill className="h-7 w-7 text-emerald-100" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">صيدليتي المنزلية</h1>
                <p className="mt-1 text-sm text-emerald-100">
                  إدارة مخزون الأدوية والمستلزمات الطبية وتنبيهات الصلاحية
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:justify-start">
              <div className="min-w-0">
                <p className="text-xs text-emerald-200">مرحباً</p>
                <p className="truncate text-sm font-semibold">{user.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {families.length > 0 && (
                  <button
                    onClick={() => setShowFamilyModal(true)}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                  >
                    إدارة العائلة
                  </button>
                )}
                <button
                  onClick={logout}
                  disabled={logoutLoading}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20 disabled:opacity-60"
                >
                  {logoutLoading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  {logoutLoading ? "جارٍ الخروج..." : "تسجيل الخروج"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-inner backdrop-blur-sm sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="w-fit max-w-full">
                <p className="mb-2 text-xs font-semibold tracking-wide text-emerald-100">
                  المخزون الحالي
                </p>
                <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-xl bg-emerald-950/35 p-1">
                  <button
                    onClick={() => switchScope("personal")}
                    disabled={scopeLoading}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                      scope === "personal" ? "bg-white text-emerald-950 shadow" : "text-emerald-50 hover:bg-white/10"
                    }`}
                  >
                    {pendingScope?.scope === "personal" ? "جارٍ التحميل..." : "صيدليتي الخاصة"}
                  </button>
                  {families.map((family) => (
                    <button
                      key={family.id}
                      onClick={() => switchScope("family", family.id)}
                      disabled={scopeLoading}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                        scope === "family" && activeFamilyId === family.id
                          ? "bg-white text-emerald-950 shadow"
                          : "text-emerald-50 hover:bg-white/10"
                      }`}
                    >
                      {pendingScope?.scope === "family" && pendingScope.familyId === family.id
                        ? "جارٍ التحميل..."
                        : family.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <div ref={addMenuRef} className="relative col-span-2 inline-flex min-h-11 w-full sm:col-span-1 sm:w-auto">
                  <div className="inline-flex w-full rounded-xl shadow-sm sm:w-auto">
                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        openAddModal();
                      }}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-s-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50 sm:flex-none"
                    >
                      <Plus className="h-4 w-4" />
                      إضافة دواء
                    </button>
                    <button
                      ref={addMenuButtonRef}
                      type="button"
                      onClick={() => setShowAddMenu((open) => !open)}
                      aria-label="خيارات إضافة دواء"
                      aria-haspopup="menu"
                      aria-expanded={showAddMenu}
                      className="inline-flex min-h-11 items-center justify-center rounded-e-xl border-s border-emerald-200 bg-white px-2 text-emerald-950 transition hover:bg-emerald-50"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  {showAddMenu && (
                    <div
                      role="menu"
                      aria-label="خيارات إضافة دواء"
                      className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-xl"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowAddMenu(false);
                          openAddModal();
                        }}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition hover:bg-slate-100"
                      >
                        <Plus className="h-4 w-4 text-emerald-700" />
                        إضافة يدوية
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={scanning}
                        onClick={() => {
                          setShowAddMenu(false);
                          cameraInputRef.current?.click();
                        }}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Camera className="h-4 w-4 text-sky-600" />
                        تصوير دواء بالذكاء الاصطناعي
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={scanning}
                        onClick={() => {
                          setShowAddMenu(false);
                          imageInputRef.current?.click();
                        }}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Images className="h-4 w-4 text-slate-600" />
                        رفع صورة
                      </button>
                    </div>
                  )}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    aria-label="تصوير دواء بالذكاء الاصطناعي"
                    className="hidden"
                    onChange={(event) => {
                      void handleImageUpload(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                    disabled={scanning}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="رفع صورة"
                    className="hidden"
                    onChange={(event) => {
                      void handleImageUpload(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                    disabled={scanning}
                  />
                </div>
                <button
                  onClick={() => setShowDuplicatesModal(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
                >
                  <ShieldAlert className="h-4 w-4" />
                  التكرار ({duplicateGroups.length})
                </button>
                <button
                  onClick={handleResetSeed}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20 disabled:opacity-60"
                  title="إعادة تحميل البيانات الأولية"
                >
                  {pendingAction === "reset" ? (
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {pendingAction === "reset" ? "جارٍ الاستعادة..." : "استعادة المخزون"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => selectStatus("all")}
            className={`text-right p-4 rounded-xl border bg-white shadow-sm transition ${
              selectedStatus === "all"
                ? "ring-2 ring-emerald-600 border-emerald-600"
                : "border-slate-200 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-sm">
              <span>إجمالي الأصناف</span>
              <Layers className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.total}
            </p>
          </button>

          <button
            onClick={() => selectStatus("expired")}
            className={`text-right p-4 rounded-xl border bg-white shadow-sm transition ${
              selectedStatus === "expired"
                ? "ring-2 ring-red-600 border-red-600"
                : "border-slate-200 hover:border-red-300"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-sm">
              <span>منتهي الصلاحية</span>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.expired}
            </p>
          </button>

          <button
            onClick={() => selectStatus("rx")}
            className={`text-right p-4 rounded-xl border bg-white shadow-sm transition ${
              selectedStatus === "rx"
                ? "ring-2 ring-amber-600 border-amber-600"
                : "border-slate-200 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-sm">
              <span>يُصرف بوصفة طبية</span>
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600 mt-2">{stats.rx}</p>
          </button>

          <button
            onClick={() => selectStatus("out")}
            className={`text-right p-4 rounded-xl border bg-white shadow-sm transition ${
              selectedStatus === "out"
                ? "ring-2 ring-slate-600 border-slate-600"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-sm">
              <span>نفد من المخزون (0)</span>
              <CheckCircle2 className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-3xl font-bold text-slate-700 mt-2">
              {stats.outOfStock}
            </p>
          </button>
        </div>

        {/* Expired Alert Banner */}
        {stats.expired > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900">
                  تنبيه: يوجد {stats.expired} دواء منتهي الصلاحية في مخزونك!
                </h3>
                <p className="text-sm text-red-700">
                  يُرجى التخلص من الأدوية المنتهية الصلاحية فوراً وحذفها من
                  القائمة لضمان السلامة.
                </p>
              </div>
            </div>
            <button
              onClick={() => selectStatus("expired")}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shrink-0"
            >
              عرض المنتهي فقط
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-bold text-slate-900">البحث والتصفية</h2>
            <p className="text-xs text-slate-500">
              {filteredMedicines.length} نتيجة من أصل {medicines.length} صنف
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(210px,0.65fr)_minmax(170px,0.5fr)]">
          <div className="relative min-w-0">
            <Search className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ابحث باسم الدواء، المادة الفعالة (مثل Paracetamol)، أو الاستخدام..."
              className="w-full pr-10 pl-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="تصفية حسب الفئة"
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">جميع الفئات العلاجية ({medicines.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => selectStatus(e.target.value)}
            aria-label="تصفية حسب الحالة"
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">جميع الحالات</option>
            <option value="valid">صالح للاستخدام</option>
            <option value="expired">منتهي الصلاحية ⚠️</option>
            <option value="rx">بوصفة طبية 📋</option>
            <option value="out">نفد من المخزون (0)</option>
          </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200 md:hidden">
            {paginatedMedicines.map((item) => {
              const isExpired = item.status === "expired";
              const isPending = pendingMedicineIds.has(item.id);
              return (
                <article key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      <p dir="ltr" className="mt-1 break-words text-right text-sm text-slate-600">
                        {item.activeIngredient || "المادة الفعالة غير محددة"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {isExpired && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-800">
                          منتهي {item.expiryDate && `(${item.expiryDate})`}
                        </span>
                      )}
                      {item.rxRequired && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                          بوصفة طبية
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">الفئة</p>
                      <p className="mt-1 font-medium text-slate-800">{item.category}</p>
                      {item.subCategory && (
                        <p className="mt-0.5 text-xs text-slate-500">{item.subCategory}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">الاستخدام</p>
                      <p className="mt-1 text-slate-700">{item.usage || "غير محدد"}</p>
                    </div>
                    {item.notes && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">ملاحظات</p>
                        <p className="mt-1 text-slate-700">{item.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                      <button
                        onClick={() => handleQuantityChange(item, -1)}
                        disabled={isPending}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        aria-label={`إنقاص كمية ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className={`min-w-8 text-center font-bold ${item.quantity === 0 ? "text-red-600" : "text-slate-900"}`}>
                        {isPending ? (
                          <span aria-label="جارٍ تحديث الكمية" className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                        ) : item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item, 1)}
                        disabled={isPending}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        aria-label={`زيادة كمية ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                      <button
                        onClick={() => openEditModal(item)}
                        disabled={isPending}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                        aria-label={`تعديل ${item.name}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={isPending}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        aria-label={`حذف ${item.name}`}
                      >
                        {isPending ? (
                          <span aria-label="جارٍ الحذف" className="block h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            {filteredMedicines.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-slate-500">
                لا توجد أدوية مطابقة لخيارات البحث أو التصفية الحالية.
              </p>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1050px] text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs uppercase">
                  <th className="py-3.5 px-4 font-bold">الدواء / المنتج</th>
                  <th className="py-3.5 px-4 font-bold">المادة الفعالة</th>
                  <th className="py-3.5 px-4 font-bold">الفئة</th>
                  <th className="py-3.5 px-4 font-bold">الاستخدام العام</th>
                  <th className="py-3.5 px-4 font-bold text-center">الكمية</th>
                  <th className="py-3.5 px-4 font-bold">الحالة والملاحظات</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      لا توجد أدوية مطابقة لخيارات البحث أو التصفية الحالية.
                    </td>
                  </tr>
                ) : (
                  paginatedMedicines.map((item) => {
                    const isExpired = item.status === "expired";
                    return (
                      <tr
                        key={item.id}
                        className={`transition ${
                          isExpired
                            ? "bg-red-50/70 hover:bg-red-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex flex-col gap-1">
                            <span>{item.name}</span>
                            <div className="flex flex-wrap gap-1">
                              {isExpired && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                  منتهي الصلاحية{" "}
                                  {item.expiryDate && `(${item.expiryDate})`}
                                </span>
                              )}
                              {item.rxRequired && (
                                <span className="inline-flex items-center text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                  بوصفة طبية
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium" dir="ltr">
                          <span className="block text-right">
                            {item.activeIngredient}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md">
                            {item.category}
                          </span>
                          <span className="block text-xs text-slate-500 mt-1">
                            {item.subCategory}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          {item.usage}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                            <button
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={pendingMedicineIds.has(item.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                              title="إنقاص الكمية"
                              aria-label={`إنقاص كمية ${item.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`min-w-[2rem] text-center font-bold ${
                                item.quantity === 0
                                  ? "text-red-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {pendingMedicineIds.has(item.id) ? (
                                <span aria-label="جارٍ تحديث الكمية" className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                              ) : item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item, 1)}
                              disabled={pendingMedicineIds.has(item.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                              title="زيادة الكمية"
                              aria-label={`زيادة كمية ${item.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                          {item.notes}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                            <button
                              onClick={() => openEditModal(item)}
                              disabled={pendingMedicineIds.has(item.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                              title="تعديل"
                              aria-label={`تعديل ${item.name}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              disabled={pendingMedicineIds.has(item.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                              title="حذف"
                              aria-label={`حذف ${item.name}`}
                            >
                              {pendingMedicineIds.has(item.id) ? (
                                <span aria-label="جارٍ الحذف" className="block h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span>
                عرض {firstVisibleItem}–{lastVisibleItem} من {filteredMedicines.length}
              </span>
              <label className="inline-flex items-center gap-2">
                <span className="text-xs text-slate-500">لكل صفحة</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  aria-label="عدد الأصناف في الصفحة"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>
            <nav aria-label="التنقل بين صفحات الأدوية" className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={visiblePage === 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                السابق
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  aria-current={page === visiblePage ? "page" : undefined}
                  aria-label={`الصفحة ${page}`}
                  className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                    page === visiblePage
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                disabled={visiblePage === pageCount}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                التالي
              </button>
            </nav>
          </div>
        </div>
      </main>

      {scanning && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-6 py-5 shadow-xl flex items-center gap-3 text-slate-800">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            جاري تحليل الصورة واستخراج الدواء...
          </div>
        </div>
      )}

      {extractedItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">مراجعة العناصر المستخرجة</h2>
                <p className="text-sm text-slate-500 mt-1">عدّل أو ألغِ تحديد أي عنصر قبل الحفظ في المخزون الحالي.</p>
              </div>
              <button
                onClick={() => setExtractedItems([])}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {extractedItems.map((item, index) => (
                <div key={index} className={`grid grid-cols-1 md:grid-cols-[auto_1.2fr_1fr_1fr_auto] gap-3 items-end border rounded-xl p-3 ${item.selected ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-slate-50"}`}>
                  <label className="flex items-center gap-2 md:self-center">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(event) => updateExtractedItem(index, { selected: event.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-sm font-semibold">حفظ</span>
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    اسم الدواء
                    <input
                      value={item.name}
                      onChange={(event) => updateExtractedItem(index, { name: event.target.value })}
                      className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    المادة الفعالة
                    <input
                      value={item.activeIngredient}
                      onChange={(event) => updateExtractedItem(index, { activeIngredient: event.target.value })}
                      className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    الفئة
                    <select
                      value={CATEGORIES.includes(item.category) ? item.category : CATEGORIES[8]}
                      onChange={(event) => updateExtractedItem(index, { category: event.target.value })}
                      className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    الكمية
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(event) => updateExtractedItem(index, { quantity: Math.max(0, Number(event.target.value)) })}
                      className="mt-1 w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <button
                onClick={() => setExtractedItems([])}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={saveExtractedItems}
                disabled={loading || !extractedItems.some((item) => item.selected)}
                className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold disabled:opacity-50"
              >
                {pendingAction === "batch" ? "جاري الحفظ..." : `حفظ المحدد (${extractedItems.filter((item) => item.selected).length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
          <section className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b bg-violet-800 px-5 py-4 text-white">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MessageCircle className="h-5 w-5" />
                  اسأل صيدليتي
                </h2>
                <p className="mt-1 text-xs text-violet-100">
                  الإجابات مبنية على {scope === "family" ? "مخزون العائلة" : "مخزونك الشخصي"}
                </p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                aria-label="إغلاق المساعد"
                className="rounded-lg p-2 hover:bg-violet-700"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div
              ref={chatMessagesContainerRef}
              className="flex-1 space-y-3 overflow-y-auto p-4"
            >
              {chatMessages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    اسأل عن الأدوية الموجودة أو الصلاحية أو تكرار المواد الفعالة.
                  </p>
                  {CHAT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      disabled={chatLoading}
                      onClick={() => sendChatMessage(suggestion)}
                      className="block w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-right text-sm text-violet-900 hover:bg-violet-100 disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {chatMessages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "mr-auto bg-emerald-700 text-white"
                      : "ml-auto border border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {chatLoading && (
                <div className="ml-auto flex max-w-[90%] items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                  {chatStreaming ? "جارٍ كتابة الإجابة..." : "جارٍ البحث في المخزون..."}
                </div>
              )}
            </div>

            <div className="border-t bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
              معلومات المخزون لا تؤكد ملاءمة الدواء أو سلامته. لا تعتمد على المساعد للتشخيص أو الجرعات أو التداخلات؛ استشر طبيباً أو صيدلياً.
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendChatMessage();
              }}
              className="flex items-end gap-2 border-t p-4"
            >
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendChatMessage();
                  }
                }}
                maxLength={1000}
                rows={2}
                placeholder="اكتب سؤالك..."
                className="min-h-11 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                aria-label="إرسال السؤال"
                className="rounded-xl bg-violet-700 p-3 text-white hover:bg-violet-800 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </section>
        </div>
      )}

      {!showChat && (
        <button
          type="button"
          onClick={() => setShowChat(true)}
          aria-label="اسأل صيدليتي"
          className="fixed bottom-5 right-5 z-40 inline-flex min-h-14 items-center gap-2 rounded-full bg-violet-600 px-5 text-sm font-bold text-white shadow-xl ring-4 ring-violet-100/70 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-violet-300 sm:bottom-7 sm:right-7"
        >
          <MessageCircle className="h-5 w-5" />
          اسأل صيدليتي
        </button>
      )}

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "تعديل بيانات الدواء" : "إضافة دواء أو مستلزم جديد"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  اسم المنتج / الدواء *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="مثال: Panadol Extra"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    المادة الفعالة
                  </label>
                  <input
                    type="text"
                    value={formData.activeIngredient}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        activeIngredient: e.target.value,
                      })
                    }
                    placeholder="مثال: Paracetamol 500 mg"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    الكمية (عبوة / شريط)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    الفئة الرئيسية
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    الفئة الفرعية
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, subCategory: e.target.value })
                    }
                    placeholder="مثال: باراسيتامول"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  الاستخدام العام
                </label>
                <input
                  type="text"
                  value={formData.usage}
                  onChange={(e) =>
                    setFormData({ ...formData, usage: e.target.value })
                  }
                  placeholder="مثال: مسكن للألم وخافض للحرارة"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    حالة الصلاحية
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="valid">صالح للاستخدام</option>
                    <option value="expired">منتهي الصلاحية ⚠️</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    تاريخ الانتهاء (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    placeholder="مثال: 2027-10"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="rxRequired"
                  type="checkbox"
                  checked={formData.rxRequired}
                  onChange={(e) =>
                    setFormData({ ...formData, rxRequired: e.target.checked })
                  }
                  className="rounded text-emerald-600"
                />
                <label htmlFor="rxRequired" className="text-slate-700">
                  يُصرف بوصفة طبية فقط
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ملاحظات إضافية
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="تعليمات الجرعة أو ملاحظات التخزين..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  {pendingAction === "save" ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Family Members Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">إدارة أفراد العائلة</h2>
              <button
                onClick={() => setShowFamilyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {families
              .filter((family) =>
                scope === "family" ? family.id === activeFamilyId : true
              )
              .map((family) => (
                <div key={family.id} className="space-y-4">
                  <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div>
                      <div className="text-xs text-slate-500">رمز الدعوة</div>
                      <div dir="ltr" className="font-bold text-emerald-900">
                        {family.inviteCode}
                      </div>
                    </div>
                    <button
                      onClick={() => copyInviteCode(family)}
                      disabled={copyingFamilyId === family.id}
                      className="inline-flex min-w-20 items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm disabled:opacity-60"
                    >
                      {copyingFamilyId === family.id ? (
                        <>
                          <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          جارٍ النسخ...
                        </>
                      ) : copiedFamilyId === family.id ? "تم النسخ" : "نسخ"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {family.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <div className="font-semibold">{member.name}</div>
                          <div dir="ltr" className="text-xs text-slate-500 text-right">{member.email}</div>
                        </div>
                        <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                          {member.role === "ADMIN" ? "مسؤول" : "عضو"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Duplicate Ingredients Modal */}
      {showDuplicatesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  تنبيهات تكرار المواد الفعالة
                </h2>
              </div>
              <button
                onClick={() => setShowDuplicatesModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              الأدوية التالية تشترك في نفس المادة الفعالة بأسماء تجارية مختلفة.
              تجنب تناول أكثر من دواء من نفس المجموعة معاً لتفادي الجرعات
              الزائدة:
            </p>

            <div className="space-y-3">
              {duplicateGroups.map(([ingredient, items]) => (
                <div
                  key={ingredient}
                  className="border border-amber-200 bg-amber-50/50 rounded-xl p-3.5"
                >
                  <div className="font-bold text-amber-900 text-sm uppercase mb-2">
                    المادة الفعالة: {ingredient} ({items.length} منتجات)
                  </div>
                  <ul className="space-y-1 text-sm text-slate-800">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-amber-100"
                      >
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-xs text-slate-500">
                          الكمية: {item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
