import OpenAI from "openai";

export const OPENROUTER_MODELS = [
  "nvidia/nemotron-3.5-lightning:free",
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3.8-27b:free",
  "nvidia/nemotron-3-super:free",
] as const;

const REQUEST_TIMEOUT_MS = 12_000;

export const openRouterTools = [
  { name: "lookupCustomer", description: "Look up a customer profile using the customer ID.", parameters: { type: "object", properties: { customerId: { type: "string", description: "The customer ID." } }, required: ["customerId"], additionalProperties: false } },
  { name: "getCustomerOrders", description: "Get all orders belonging to a customer. MUST be used when the customer asks what orders they have or asks to see their orders.", parameters: { type: "object", properties: { customerId: { type: "string", description: "The customer ID." } }, required: ["customerId"], additionalProperties: false } },
  { name: "lookupOrder", description: "Look up a specific e-commerce order using its order ID.", parameters: { type: "object", properties: { orderId: { type: "string", description: "The order ID." } }, required: ["orderId"], additionalProperties: false } },
  { name: "checkRefundEligibility", description: "Check the strict refund policy for an order. MUST be called before discussing or processing a refund.", parameters: { type: "object", properties: { orderId: { type: "string", description: "The order ID." } }, required: ["orderId"], additionalProperties: false } },
  { name: "processRefund", description: "Process a refund only after the customer has explicitly confirmed the refund. customerConfirmation MUST be true.", parameters: { type: "object", properties: { orderId: { type: "string" }, customerId: { type: "string" }, customerConfirmation: { type: "boolean" }, amount: { type: "number" }, reason: { type: "string" } }, required: ["orderId", "customerId", "customerConfirmation"], additionalProperties: false } },
].map((tool) => ({ type: "function" as const, function: { ...tool, strict: false } }));

export type OpenRouterAttempt = { model: string; attempt: number; error: string };
export class OpenRouterAllModelsFailedError extends Error {
  constructor(readonly attempts: OpenRouterAttempt[]) {
    super("All OpenRouter models failed");
    this.name = "OpenRouterAllModelsFailedError";
  }
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/sk-or-v1-[\w-]+/gi, "[REDACTED]")
    .replace(/OPENROUTER_API_KEY\s*[:=]\s*\S+/gi, "OPENROUTER_API_KEY=[REDACTED]");
}

function isTransient(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const message = safeError(error).toLowerCase();
  const transientText = /timeout|timed out|rate.?limit|quota|provider|model.{0,30}(unavailable|not found|overload)|temporar|overload|502|503|504/.test(message);
  if (error instanceof OpenAI.APIError) {
    const status = error.status;
    if (status === 401 || status === 403 || status === 422) return false;
    if (status === 400) return transientText;
    return status === 408 || status === 409 || status === 429 || status === 404 || (status !== undefined && status >= 500) || transientText;
  }
  return name.includes("Timeout") || name.includes("Connection") ||
    transientText;
}

export async function callOpenRouter(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  onEvent: (type: "request" | "error" | "fallback", details: { model: string; attempt: number; error?: string; nextModel?: string }) => Promise<void>,
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const client = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1", timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
  const attempts: OpenRouterAttempt[] = [];
  for (let index = 0; index < OPENROUTER_MODELS.length; index++) {
    const model = OPENROUTER_MODELS[index];
    const attempt = index + 1;
    await onEvent("request", { model, attempt });
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        tools: openRouterTools,
        tool_choice: "auto",
        temperature: 0.1,
      });
      return { response, model, attempt };
    } catch (error) {
      const errorMessage = safeError(error);
      attempts.push({ model, attempt, error: errorMessage });
      await onEvent("error", { model, attempt, error: errorMessage });
      if (!isTransient(error) || index === OPENROUTER_MODELS.length - 1) break;
      await onEvent("fallback", { model, attempt, nextModel: OPENROUTER_MODELS[index + 1] });
    }
  }
  throw new OpenRouterAllModelsFailedError(attempts);
}
