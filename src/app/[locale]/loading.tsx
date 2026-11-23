"use client";

import { usePathname } from "next/navigation";
import GlobalLoader from "@/components/GlobalLoader";

export default function Loading() {
  const locale = usePathname().split("/")[1];
  const message =
    locale === "en" ? "Loading page…" : "جارٍ تحميل الصفحة…";

  return <GlobalLoader message={message} />;
}
