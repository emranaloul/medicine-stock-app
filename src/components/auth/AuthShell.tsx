import { Pill, ShieldCheck, Sparkles } from "lucide-react";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function AuthShell({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-shell relative isolate flex min-h-dvh items-center overflow-hidden px-3 py-4 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-40 top-1/4 h-96 w-96 rounded-full bg-[#d6b38d]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-40 -top-32 h-96 w-96 rounded-full bg-[#91a9ad]/30 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#d9d2c5] bg-[#fbf8f1] shadow-[0_32px_100px_-40px_rgba(18,30,38,0.28)] lg:min-h-[44rem] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#121726] p-10 text-white lg:flex xl:p-14">
          <div
            aria-hidden="true"
            className="auth-brand-glow pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.8)_0.7px,transparent_0.7px)] [background-size:22px_22px]"
          />

          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner">
              <Pill aria-hidden="true" className="h-6 w-6 text-[#f4dfc5]" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#e7c4a4]">
                {dictionary.dashboard.brandOverline}
              </p>
              <p className="font-bold">{dictionary.dashboard.title}</p>
            </div>
          </div>

          <div className="relative my-12">
            <p className="mb-3 text-sm font-semibold text-[#e7c4a4]">
              {dictionary.dashboard.brandOverline}
            </p>
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              {dictionary.dashboard.title}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#f5efe5]/80">
              {dictionary.dashboard.subtitle}
            </p>

            <div
              aria-hidden="true"
              className="relative mx-auto mt-12 max-w-sm rounded-[2rem] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/25 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d3a56f]/15 text-[#f0d7b6]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="h-2 w-16 rounded-full bg-white/15" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <span className="flex h-24 items-center justify-center rounded-2xl bg-white/[0.07]">
                  <span className="h-10 w-4 rotate-45 rounded-full bg-[#c89461]/85" />
                </span>
                <span className="flex h-24 items-center justify-center rounded-2xl bg-white/[0.07]">
                  <span className="h-4 w-10 -rotate-12 rounded-full bg-[#8da2a3]/80" />
                </span>
                <span className="flex h-24 items-center justify-center rounded-2xl bg-white/[0.07]">
                  <span className="h-10 w-4 -rotate-45 rounded-full bg-[#d5a26f]/90" />
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="h-2 flex-1 rounded-full bg-white/15" />
                <span className="h-2 w-1/3 rounded-full bg-[#e7c4a4]/50" />
              </div>
              <Sparkles className="absolute -end-4 -top-4 h-9 w-9 rounded-xl border border-white/15 bg-[#a66e45] p-2 text-[#fff5e8] shadow-lg" />
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col bg-[#fbf8f1]/95 p-5 sm:p-9 lg:justify-center lg:p-12">
          <div className="mb-8 flex items-center justify-between gap-4 lg:mb-10 lg:justify-end">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1d3036] text-[#e7c4a4]">
                <Pill aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="truncate text-sm font-bold text-[#1d3036]">
                {dictionary.dashboard.title}
              </span>
            </div>
            <LocaleSwitcher
              locale={locale}
              label={dictionary.locale.language}
            />
          </div>

          <div className="mx-auto w-full max-w-md">{children}</div>

          <p className="mx-auto mt-auto w-full max-w-md pt-8 text-center text-xs leading-5 text-muted-foreground lg:text-start">
            {dictionary.metadata.description}
          </p>
        </section>
      </div>
    </main>
  );
}
