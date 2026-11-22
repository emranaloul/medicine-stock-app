"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState<"create" | "join" | null>(null);

  async function familyAction(action: "create" | "join") {
    if (loadingAction !== null) return;
    setError("");
    setLoadingAction(action);
    try {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "create" ? { action, name } : { action, inviteCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "تعذر تنفيذ طلب الانضمام");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <h1 className="text-2xl font-bold text-emerald-900">إعداد صيدلية العائلة</h1>
        {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}
        <div className="space-y-2 border rounded-xl p-4">
          <h2 className="font-bold">إنشاء صيدلية عائلية</h2>
          <input required placeholder="اسم العائلة" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <button disabled={loadingAction !== null} onClick={() => familyAction("create")} className="w-full rounded-lg bg-emerald-700 text-white py-2.5 font-bold disabled:opacity-60">
            {loadingAction === "create" ? <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />جارٍ إنشاء العائلة...</span> : "إنشاء العائلة"}
          </button>
        </div>
        <div className="space-y-2 border rounded-xl p-4">
          <h2 className="font-bold">الانضمام برمز دعوة</h2>
          <input dir="ltr" placeholder="رمز الدعوة" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <button disabled={loadingAction !== null} onClick={() => familyAction("join")} className="w-full rounded-lg bg-slate-700 text-white py-2.5 font-bold disabled:opacity-60">
            {loadingAction === "join" ? <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />جارٍ الانضمام...</span> : "انضمام للعائلة"}
          </button>
        </div>
        <button disabled={loadingAction !== null} onClick={() => router.push("/")} className="w-full text-sm text-slate-600 disabled:opacity-60">التخطي واستخدام الصيدلية الخاصة فقط</button>
      </div>
    </main>
  );
}
