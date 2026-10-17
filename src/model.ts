import { ChatOpenAI } from "@langchain/openai";
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
