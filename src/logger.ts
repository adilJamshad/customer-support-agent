import { createWriteStream, mkdirSync } from "node:fs";
import { join } from "node:path";
import pino, { type StreamEntry } from "pino";
import pretty from "pino-pretty";
import { config } from "./config.ts";

mkdirSync(config.LOG_DIR, { recursive: true });

const fileStream = createWriteStream(join(config.LOG_DIR, "agent.jsonl"), {
  flags: "a",
});

const consoleStream = config.LOG_PRETTY
  ? pretty({ colorize: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname" })
  : process.stdout;

const streams: StreamEntry[] = [
  { level: config.LOG_LEVEL, stream: fileStream },
  { level: config.LOG_LEVEL, stream: consoleStream },
];

export const logger = pino(
  { level: config.LOG_LEVEL, base: { app: "support-agent" } },
  pino.multistream(streams),
);

export type Logger = typeof logger;
