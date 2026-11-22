"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "تعذر تسجيل الدخول");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-bold text-emerald-900">تسجيل الدخول</h1>
        {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}
        <input disabled={loading} dir="ltr" type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100" />
        <input disabled={loading} dir="ltr" type="password" required placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100" />
        <button disabled={loading} className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 font-bold disabled:opacity-60">
          {loading ? <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />جارٍ تسجيل الدخول...</span> : "دخول"}
        </button>
        <button type="button" disabled={loading} onClick={() => router.push("/register")} className="w-full text-sm text-emerald-700 disabled:opacity-60">إنشاء حساب جديد</button>
      </form>
    </main>
  );
}
