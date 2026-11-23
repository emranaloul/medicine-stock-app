import type { Dictionary } from "./dictionaries";

export function localizeApiError(
  message: string,
  dictionary: Dictionary
): string {
  const translation =
    dictionary.apiErrors[message as keyof typeof dictionary.apiErrors];
  return translation ?? dictionary.common.genericError;
}
