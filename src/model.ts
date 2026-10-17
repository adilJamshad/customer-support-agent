import type { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import type { z } from "zod";
import { config } from "./config.ts";

export type ModelOverrides = {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
};

export const createModel = (overrides: ModelOverrides = {}) =>
  new ChatOpenAI({
    model: config.OMLX_MODEL,
    apiKey: config.OMLX_API_KEY,
    temperature: overrides.temperature ?? config.OMLX_TEMPERATURE,
    maxTokens: overrides.maxTokens ?? config.OMLX_MAX_TOKENS,
    timeout: overrides.timeout ?? config.REQUEST_TIMEOUT_MS,
    maxRetries: overrides.maxRetries ?? config.MAX_RETRIES,
    configuration: { baseURL: config.OMLX_BASE_URL },
  });

export const createStructuredModel = <TOut extends Record<string, unknown>>(
  schema: z.ZodType<TOut>,
  name: string,
  overrides: ModelOverrides = {},
) =>
  createModel(overrides).withStructuredOutput<TOut>(schema, {
    name,
    method: "functionCalling",
    includeRaw: true,
  });

export const extractReasoning = (message: BaseMessage): string | undefined => {
  const raw = message.additional_kwargs?.["reasoning_content"];
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
};

export const extractTokenCount = (message: BaseMessage): number | undefined => {
  const usage = (message as { usage_metadata?: { total_tokens?: number } })
    .usage_metadata;
  return usage?.total_tokens;
};
