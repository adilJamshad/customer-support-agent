import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createModel } from "./model.ts";
import { logger } from "./logger.ts";

const model = createModel({ temperature: 0, maxTokens: 512 });

const basic = await model.invoke([new HumanMessage("Reply with exactly: pong")]);
logger.info(
  {
    content: basic.content,
    additional_kwargs: basic.additional_kwargs,
    usage: basic.usage_metadata,
  },
  "1/3 basic chat",
);

const getTicket = tool(
  async ({ ticket_id }: { ticket_id: string }) =>
    `Ticket ${ticket_id}: customer cannot log in, status open`,
  {
    name: "get_ticket",
    description: "Fetch a support ticket by its id",
    schema: z.object({ ticket_id: z.string().describe("Ticket id, e.g. T-1042") }),
  },
);

const withTools = model.bindTools([getTicket]);
const toolRes = await withTools.invoke([
  new HumanMessage("Look up ticket T-1042 for me."),
]);
logger.info({ tool_calls: toolRes.tool_calls }, "2/3 tool calling");

const Classification = z.object({
  category: z.enum(["billing", "technical", "account", "other"]),
  urgency: z.enum(["low", "medium", "high"]),
  summary: z.string(),
});

const classifier = model.withStructuredOutput(Classification, {
  name: "classify_ticket",
  method: "functionCalling",
});
const structured = await classifier.invoke([
  new HumanMessage(
    "Ticket: 'I was charged twice for my subscription this month and need a refund urgently.'",
  ),
]);
logger.info({ structured }, "3/3 structured output");

logger.info("smoke passed");
