import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";

export default function AssistantLauncher({
  dictionary,
  onClick,
}: {
  dictionary: Dictionary;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label={dictionary.assistant.open}
      className="fixed bottom-5 end-5 z-40 min-h-14 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/25 ring-4 ring-background transition hover:bg-primary/90 sm:bottom-7 sm:end-7"
    >
      <MessageCircle aria-hidden="true" className="h-5 w-5" />
      {dictionary.assistant.open}
    </Button>
  );
}
