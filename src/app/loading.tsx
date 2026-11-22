export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center bg-slate-50 text-emerald-800"
    >
      <span className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-sm border border-slate-200">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
        />
        جارٍ تحميل الصفحة...
      </span>
    </main>
  );
}
