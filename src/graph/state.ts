import type { BaseMessage } from "@langchain/core/messages";
import { messagesStateReducer } from "@langchain/langgraph";
import { withLangGraph } from "@langchain/langgraph/zod";
import { z } from "zod";
import {
  ClassificationSchema,
  TicketSchema,
  type Classification,
} from "../domain/schemas.ts";

export const TraceEventSchema = z.object({
  node: z.string(),
  at: z.string(),
  summary: z.string(),
  reasoning: z.string().optional(),
  latencyMs: z.number().optional(),
  tokens: z.number().optional(),
});

export type TraceEvent = z.infer<typeof TraceEventSchema>;

const messagesChannel = withLangGraph(z.custom<BaseMessage[]>(), {
  reducer: {
    schema: z.custom<BaseMessage[] | BaseMessage>(),
    fn: messagesStateReducer,
  },
  default: (): BaseMessage[] => [],
});

const traceChannel = withLangGraph(z.array(TraceEventSchema), {
  reducer: {
    schema: z.array(TraceEventSchema),
    fn: (existing: TraceEvent[], update: TraceEvent[]) =>
      existing.concat(update),
  },
  default: (): TraceEvent[] => [],
});

const classificationChannel = withLangGraph(ClassificationSchema.nullable(), {
  default: (): Classification | null => null,
});

export const AgentStateSchema = z.object({
  ticket: TicketSchema,
  messages: messagesChannel,
  classification: classificationChannel,
  trace: traceChannel,
});

export type AgentState = z.infer<typeof AgentStateSchema>;
