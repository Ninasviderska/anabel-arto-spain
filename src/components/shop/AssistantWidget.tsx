import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME =
  "¡Hola! Soy tu asistente de Anabel Arto 💜 Puedo ayudarte con tallas, dudas sobre productos, el estado de tu pedido o el envío. ¿En qué te ayudo?";
const CHIPS = ["¿Qué talla necesito?", "Estado de mi pedido", "Envíos y devoluciones", "¿Qué hay disponible en mi talla?"];
const SEEN_KEY = "aa-assistant-seen";

/** Renders plain text with clickable internal links (/es/...) and URLs. */
function RichText({ text }: { text: string }) {
  const parts = text.replace(/\*\*/g, "").split(/(https?:\/\/\S+|\/es\/[\w\-/]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\/es\//.test(p) ? (
          <Link key={i} to={p} className="underline underline-offset-2">{p.includes("guia-de-tallas") ? "Guía de tallas" : "Ver producto"}</Link>
        ) : /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" className="underline underline-offset-2">{p}</a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chipsUsed, setChipsUsed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) setBadge(true);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, loading]);

  function toggle() {
    setOpen((o) => !o);
    if (badge) {
      localStorage.setItem(SEEN_KEY, "1");
      setBadge(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setChipsUsed(true);
    setLoading(true);
    try {
      const res = await fetch("/api/public/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20) }),
      });
      const json = (await res.json()) as { reply?: string; error?: string };
      const reply =
        json.reply ||
        (json.error === "not_configured"
          ? "La asistente aún no está disponible. Escríbenos a orders@anabelarto.es y te ayudamos encantadas."
          : "Ahora mismo no puedo responder. Inténtalo de nuevo en un momento o escríbenos a orders@anabelarto.es.");
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Ha habido un problema de conexión. Inténtalo de nuevo, por favor." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <section
          aria-label="Asistente de Anabel Arto"
          className="flex h-[min(34rem,calc(100vh-7rem))] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-md border border-border bg-background shadow-xl"
        >
          <header className="flex items-center justify-between border-b border-border bg-cream-deep px-4 py-3">
            <div>
              <p className="font-display text-lg leading-none">Anabel Arto</p>
              <p className="mt-1 text-[0.65rem] tracking-[0.18em] uppercase text-muted-foreground">Asistente virtual</p>
            </div>
            <button type="button" onClick={toggle} aria-label="Cerrar chat" className="rounded-sm p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm leading-relaxed">
            <p className="whitespace-pre-line text-foreground">{WELCOME}</p>
            {!chipsUsed && (
              <div className="flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setInput(c);
                      setChipsUsed(true);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-primary/30 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] whitespace-pre-line rounded-md bg-primary px-3 py-2 text-primary-foreground">
                  {m.content}
                </div>
              ) : (
                <p key={i} className="max-w-[95%] whitespace-pre-line text-foreground">
                  <RichText text={m.content} />
                </p>
              ),
            )}
            {loading && <p className="animate-pulse text-muted-foreground">Escribiendo…</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-end gap-2 border-t border-border p-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Pregúntame sobre tallas, productos, pedidos..."
              className="max-h-28 min-h-10 flex-1 resize-none rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Enviar">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        {badge && !open && <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-background bg-gold" />}
      </button>
    </div>
  );
}
