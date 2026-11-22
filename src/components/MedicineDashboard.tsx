"use client";

import React, { useState, useMemo } from "react";
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

export default function MedicineDashboard({
  initialMedicines,
}: {
  initialMedicines: Medicine[];
}) {
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  // Modal state for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

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

  async function refreshMedicines() {
    const res = await fetch("/api/medicines");
    if (res.ok) {
      const data = await res.json();
      setMedicines(data);
    }
  }

  async function handleQuantityChange(item: Medicine, delta: number) {
    const nextQty = Math.max(0, item.quantity + delta);
    setMedicines((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, quantity: nextQty } : m))
    );
    await fetch(`/api/medicines/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: nextQty }),
    });
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
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/medicines/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setMedicines((prev) =>
            prev.map((m) => (m.id === editingId ? updated : m))
          );
        }
      } else {
        const res = await fetch("/api/medicines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const created = await res.json();
          setMedicines((prev) => [created, ...prev]);
        }
      }
      setIsFormOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`هل أنت متأكد من حذف "${name}" من المخزون؟`)) return;
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/medicines/${id}`, { method: "DELETE" });
  }

  async function handleResetSeed() {
    if (
      !confirm(
        "هل تريد إعادة ضبط قاعدة البيانات واستعادة المخزون الأصلي (71 صنفاً)؟"
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        await refreshMedicines();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-700 p-3 rounded-xl">
                <Pill className="w-7 h-7 text-emerald-100" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">صيدليتي المنزلية</h1>
                <p className="text-emerald-100 text-sm">
                  إدارة مخزون الأدوية والمستلزمات الطبية وتنبيهات الصلاحية
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowDuplicatesModal(true)}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-sm transition"
              >
                <ShieldAlert className="w-4 h-4" />
                تنبيهات التكرار ({duplicateGroups.length})
              </button>
              <button
                onClick={handleResetSeed}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2.5 rounded-lg text-sm transition"
                title="إعادة تحميل البيانات الأولية"
              >
                <RotateCcw className="w-4 h-4" />
                استعادة المخزون الأصلي
              </button>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-lg text-sm shadow transition"
              >
                <Plus className="w-4 h-4" />
                إضافة دواء جديد
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedStatus("all")}
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
            onClick={() => setSelectedStatus("expired")}
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
            onClick={() => setSelectedStatus("rx")}
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
            onClick={() => setSelectedStatus("out")}
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
              onClick={() => setSelectedStatus("expired")}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shrink-0"
            >
              عرض المنتهي فقط
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الدواء، المادة الفعالة (مثل Paracetamol)، أو الاستخدام..."
              className="w-full pr-10 pl-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">جميع الحالات</option>
            <option value="valid">صالح للاستخدام</option>
            <option value="expired">منتهي الصلاحية ⚠️</option>
            <option value="rx">بوصفة طبية 📋</option>
            <option value="out">نفد من المخزون (0)</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
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
                  filteredMedicines.map((item) => {
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
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item, -1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="إنقاص الكمية"
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
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item, 1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="زيادة الكمية"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                          {item.notes}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      </main>

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
                  {loading ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
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
