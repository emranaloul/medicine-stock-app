"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLocale, type Locale } from "@/i18n/config";

export default function LocaleSwitcher({
  locale,
  label,
  className,
  showIcon = false,
}: {
  locale: Locale;
  label: string;
  className?: string;
  showIcon?: boolean;
}) {
  const pathname = usePathname();
  const nextLocale = locale === "ar" ? "en" : "ar";
  const segments = pathname.split("/");
  const localizedPath = isLocale(segments[1] ?? "")
    ? `/${[nextLocale, ...segments.slice(2)].join("/")}`
    : `/${[nextLocale, ...segments.slice(1)].join("/")}`;
  const languageLabel = nextLocale === "ar" ? "العربية" : "English";

  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      aria-label={label}
      className={className}
    >
      <Link href={localizedPath || `/${nextLocale}`} hrefLang={nextLocale}>
        {showIcon && (
          <Languages
            aria-hidden="true"
            className="h-4 w-4 text-[#e7c4a4]"
          />
        )}
        {languageLabel}
      </Link>
    </Button>
  );
}
