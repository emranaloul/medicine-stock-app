"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizeApiError } from "@/i18n/errors";

interface PharmacyChatMessage {
  role: "user" | "model";
  content: string;
}

export default function PharmacyAssistant({
  open,
  scope,
  familyId,
  locale,
  dictionary,
  onClose,
}: {
  open: boolean;
  scope: "personal" | "family";
  familyId: string;
  locale: Locale;
  dictionary: Dictionary;
  onClose: () => void;
}) {
  const [chatMessages, setChatMessages] = useState<PharmacyChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScopeRef = useRef({ scope, familyId });

  useEffect(() => {
    if (
      previousScopeRef.current.scope !== scope ||
      previousScopeRef.current.familyId !== familyId
    ) {
      setChatMessages([]);
      previousScopeRef.current = { scope, familyId };
    }
  }, [scope, familyId]);

  useEffect(() => {
    if (!open || !chatMessagesContainerRef.current) return;
    chatMessagesContainerRef.current.scrollTop =
      chatMessagesContainerRef.current.scrollHeight;
  }, [chatMessages, chatLoading, chatStreaming, open]);

  async function sendChatMessage(rawMessage = chatInput) {
    const message = rawMessage.trim();
    if (!message || chatLoading) return;

    const history = chatMessages;
    let assistantMessageStarted = false;
    let assistantAnswer = "";
    setChatMessages((current) => [...current, { role: "user", content: message }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/ask-pharmacy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
          "x-pharmacy-scope": scope,
          "x-family-id": scope === "family" ? familyId : "",
        },
        body: JSON.stringify({ message, history, locale }),
      });
      if (!res.ok) {
        const data: unknown = await res.json();
        const parsed = z.object({ error: z.string().optional() }).safeParse(data);
        throw new Error(
          parsed.success && parsed.data.error
            ? localizeApiError(parsed.data.error, dictionary)
            : dictionary.assistant.errors.answer
        );
      }
      if (!res.body) throw new Error(dictionary.assistant.errors.readAnswer);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        let chunkResult: ReadableStreamReadResult<Uint8Array>;
        try {
          chunkResult = await reader.read();
        } catch {
          throw new Error(dictionary.assistant.errors.connection);
        }
        const { done, value } = chunkResult;
        const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
        if (chunk) {
          assistantAnswer += chunk;
          if (!assistantMessageStarted) {
            assistantMessageStarted = true;
            setChatStreaming(true);
            setChatMessages((current) => [
              ...current,
              { role: "model", content: assistantAnswer },
            ]);
          } else {
            setChatMessages((current) => {
              const lastIndex = current.length - 1;
              if (lastIndex < 0 || current[lastIndex].role !== "model") {
                return [...current, { role: "model", content: assistantAnswer }];
              }
              return [
                ...current.slice(0, lastIndex),
                { ...current[lastIndex], content: assistantAnswer },
              ];
            });
          }
        }
        if (done) break;
      }
      if (!assistantAnswer.trim()) {
        throw new Error(dictionary.assistant.errors.emptyAnswer);
      }
    } catch (error) {
      const errorMessage = assistantMessageStarted
        ? dictionary.assistant.errors.incomplete
        : error instanceof Error
          ? error.message
          : dictionary.assistant.errors.connection;
      setChatMessages((current) => {
        const lastIndex = current.length - 1;
        if (assistantMessageStarted && lastIndex >= 0 && current[lastIndex].role === "model") {
          return [
            ...current.slice(0, lastIndex),
            {
              ...current[lastIndex],
              content: `${assistantAnswer}\n\n${errorMessage}`,
            },
          ];
        }
        return [...current, { role: "model", content: errorMessage }];
      });
    } finally {
      setChatLoading(false);
      setChatStreaming(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        closeLabel={dictionary.assistant.close}
        closeClassName="bg-white/10 text-white opacity-100 hover:bg-white/20 focus:ring-white/80 focus:ring-offset-0 data-[state=open]:bg-white/10 data-[state=open]:text-white"
        className="fixed left-auto end-0 top-0 grid h-dvh w-full max-w-xl translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl sm:rounded-s-3xl"
      >
        <header className="bg-[hsl(196,36%,11%)] px-5 py-5 pe-16 text-[hsl(40,40%,96%)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold">
                {dictionary.assistant.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-white/70">
                {scope === "family"
                  ? dictionary.assistant.scopeFamily
                  : dictionary.assistant.scopePersonal}
              </DialogDescription>
            </div>
          </div>
        </header>

        <div
          ref={chatMessagesContainerRef}
          className="flex min-h-0 flex-col gap-3 overflow-y-auto bg-muted/40 p-4 sm:p-5"
        >
          {chatMessages.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {dictionary.assistant.intro}
              </p>
              <div className="space-y-2">
                {dictionary.assistant.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    disabled={chatLoading}
                    onClick={() => void sendChatMessage(suggestion)}
                    variant="outline"
                    className="h-auto min-h-11 w-full justify-start whitespace-normal rounded-2xl border-border bg-card px-4 py-3 text-start text-sm leading-5 text-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {chatMessages.map((message, index) => (
            <div
              key={`${index}-${message.role}`}
              dir="auto"
              className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                message.role === "user"
                  ? "ms-auto rounded-ee-md bg-primary text-primary-foreground"
                  : "me-auto rounded-es-md border border-border/70 bg-card text-foreground"
              }`}
            >
              {message.content}
            </div>
          ))}
          {chatLoading && (
            <div className="me-auto flex max-w-[90%] items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
              />
              {chatStreaming
                ? dictionary.assistant.loadingAnswer
                : dictionary.assistant.loadingSearch}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 border-t border-amber-200/80 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{dictionary.assistant.safetyNotice}</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendChatMessage();
          }}
          className="flex items-end gap-2 border-t border-border/80 bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <Textarea
            value={chatInput}
            dir="auto"
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendChatMessage();
              }
            }}
            maxLength={1000}
            rows={2}
            placeholder={dictionary.assistant.questionPlaceholder}
            className="min-h-11 max-h-32 flex-1 resize-none rounded-xl border-border/80 px-3 py-2 text-sm"
          />
          <Button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            aria-label={dictionary.assistant.send}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl"
          >
            <Send aria-hidden="true" className="h-5 w-5" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
