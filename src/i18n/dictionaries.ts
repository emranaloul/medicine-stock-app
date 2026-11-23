import "server-only";
import type { Locale } from "./config";

const dictionaries = {
  en: () => import("./messages/en.json").then((module) => module.default),
  ar: () => import("./messages/ar.json").then((module) => module.default),
};

export type Dictionary = typeof import("./messages/en.json");

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
