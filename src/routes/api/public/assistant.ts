import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SIZE_TABLES, SYSTEM_PROMPT, TOOLS, lookupOrder, searchProducts } from "@/lib/assistant.server";

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(30),
});

type Msg = Record<string, unknown>;

export const Route = createFileRoute("/api/public/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["OPENAI_API_KEY"];
        if (!apiKey) return Response.json({ error: "not_configured" }, { status: 503 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

        const messages: Msg[] = [
          { role: "system", content: `${SYSTEM_PROMPT}\n\n${SIZE_TABLES}` },
          ...parsed.data.messages,
        ];

        for (let step = 0; step < 5; step++) {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: "gpt-4.1-mini", messages, tools: TOOLS }),
          });
          if (!res.ok) {
            console.error("OpenAI error", res.status, await res.text());
            return Response.json({ error: res.status === 429 ? "busy" : "upstream" }, { status: 502 });
          }
          const json = (await res.json()) as { choices: { message: Msg & { tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[] };
          const msg = json.choices[0]!.message;
          if (!msg.tool_calls?.length) return Response.json({ reply: String(msg.content ?? "") });
          messages.push(msg);
          for (const call of msg.tool_calls) {
            let result: unknown;
            try {
              const args = JSON.parse(call.function.arguments || "{}");
              result =
                call.function.name === "search_products"
                  ? await searchProducts(String(args.query ?? ""))
                  : call.function.name === "lookup_order"
                    ? await lookupOrder(String(args.order_number ?? ""), String(args.email ?? ""))
                    : { error: "unknown_tool" };
            } catch {
              result = { error: "tool_failed" };
            }
            messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
          }
        }
        return Response.json({ error: "upstream" }, { status: 502 });
      },
    },
  },
});
