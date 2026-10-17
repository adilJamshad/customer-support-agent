import { z } from "zod";

const boolish = z
  .enum(["true", "false", "1", "0"])
  .default("false")
  .transform((v) => v === "true" || v === "1");

const envSchema = z
  .object({
    OMLX_BASE_URL: z.string().min(1),
    OMLX_API_KEY: z.string().min(1),
    OMLX_MODEL: z.string().min(1),
    OMLX_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
    OMLX_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
    REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
    MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),

    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
    LOG_DIR: z.string().min(1).default("./logs"),
    LOG_PRETTY: boolish,

    LANGSMITH_TRACING: boolish,
    LANGSMITH_API_KEY: z.string().optional(),
    LANGSMITH_PROJECT: z.string().min(1).default("support-agent"),
  })
  .refine((c) => !c.LANGSMITH_TRACING || Boolean(c.LANGSMITH_API_KEY), {
    message: "LANGSMITH_API_KEY must be set when LANGSMITH_TRACING is enabled",
    path: ["LANGSMITH_API_KEY"],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`,
  );
  console.error(`Invalid environment configuration:\n${lines.join("\n")}`);
  process.exit(1);
}

export const config = parsed.data;

export type Config = typeof config;

if (!config.LANGSMITH_TRACING) {
  delete process.env.LANGSMITH_API_KEY;
  delete process.env.LANGCHAIN_API_KEY;
  process.env.LANGSMITH_TRACING = "false";
}
