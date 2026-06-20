import Groq from "groq-sdk";
import { env } from "../../config/env";
import { ApiError } from "../../utils/apiError";
import { logger } from "../logger";

let client: Groq | null = null;

/** Whether AI features are configured (a Groq API key is present). */
export function aiEnabled(): boolean {
  return Boolean(env.GROQ_API_KEY);
}

function getClient(): Groq {
  if (!aiEnabled()) {
    throw new ApiError(503, "AI features are not configured on this server.");
  }
  if (!client) {
    client = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return client;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AiUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  model: string;
}

/**
 * Calls Groq and returns the assistant's text plus token usage.
 * Throws ApiError(503) when AI is not configured and ApiError(502) on upstream failure.
 */
export async function chatText(opts: ChatOptions): Promise<{ text: string; usage: AiUsage }> {
  const groq = getClient();
  const model = opts.model ?? env.GROQ_MODEL;
  try {
    const completion = await groq.chat.completions.create({
      model,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens,
      messages: opts.messages as Groq.Chat.ChatCompletionMessageParam[],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return {
      text,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
        model,
      },
    };
  } catch (error) {
    logger.warn("Groq chatText failed", { model, error: (error as Error).message });
    throw new ApiError(502, "The AI service is temporarily unavailable. Please try again.");
  }
}

/**
 * Calls Groq forcing a JSON object response and parses it.
 * The caller's prompt MUST instruct the model to return JSON.
 */
export async function chatJSON<T>(opts: ChatOptions): Promise<{ data: T; usage: AiUsage }> {
  const groq = getClient();
  const model = opts.model ?? env.GROQ_MODEL;
  try {
    const completion = await groq.chat.completions.create({
      model,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens,
      response_format: { type: "json_object" },
      messages: opts.messages as Groq.Chat.ChatCompletionMessageParam[],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    let data: T;
    try {
      data = JSON.parse(raw) as T;
    } catch {
      logger.warn("Groq chatJSON returned non-JSON", { model });
      throw new ApiError(502, "The AI service returned an unexpected response. Please try again.");
    }
    return {
      data,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
        model,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.warn("Groq chatJSON failed", { model, error: (error as Error).message });
    throw new ApiError(502, "The AI service is temporarily unavailable. Please try again.");
  }
}

export type { AiUsage, ChatMessage };
