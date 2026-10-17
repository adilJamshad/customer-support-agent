import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ClassificationSchema, type Ticket } from "../../domain/schemas.ts";
import {
  createStructuredModel,
  extractReasoning,
  extractTokenCount,
} from "../../model.ts";
import { logger } from "../../logger.ts";
import type { AgentState } from "../state.ts";

const SYSTEM_PROMPT = `You triage incoming customer support tickets.

Assign exactly one category:
- billing: invoices, charges, refunds, payment methods, plan pricing, VAT or tax details
- technical: errors, crashes, API failures, outages, bugs, degraded performance
- account: login, passwords, access, permissions, security concerns, cancellation, data export
- shipping: physical deliveries, tracking, wrong or damaged items, returns
- feedback: praise, feature requests, general opinions with no problem to solve
- other: spam, sales pitches, empty or unintelligible messages, anything that fits nothing above

Assign exactly one urgency:
- critical: active outage, security incident, data loss, or money already lost with no workaround
- high: customer is blocked right now and has no workaround
- medium: real problem with a workaround, or a deadline that is near but not now
- low: question, request, or comment with no time pressure

Assign exactly one sentiment, based only on the customer's tone:
- positive: pleased or appreciative
- neutral: matter of fact
- frustrated: visibly annoyed or repeating themselves
- angry: hostile, threatening to leave, demanding escalation

Rules:
- Judge urgency by business impact, not by how loudly the customer writes.
- A sales pitch or marketing email is category other, urgency low, sentiment neutral.
- An empty or contentless message is category other, urgency low.
- Suspected unauthorized access is category account and urgency critical.
- Classify the ticket in whatever language it is written in.
- rationale must be one sentence naming the specific evidence you used.`;

const formatTicket = (ticket: Ticket) =>
  [
    `Channel: ${ticket.channel}`,
    `Subject: ${ticket.subject}`,
    "",
    ticket.body,
  ].join("\n");

const classifier = createStructuredModel(
  ClassificationSchema,
  "classify_ticket",
  { temperature: 0 },
);

export const classifyNode = async (
  state: AgentState,
): Promise<Partial<AgentState>> => {
  const startedAt = Date.now();
  const { ticket } = state;

  try {
    const { parsed, raw } = await classifier.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(formatTicket(ticket)),
    ]);

    const latencyMs = Date.now() - startedAt;
    const reasoning = extractReasoning(raw);

    logger.info(
      { ticketId: ticket.id, classification: parsed, latencyMs },
      "classified ticket",
    );

    return {
      classification: parsed,
      trace: [
        {
          node: "classify",
          at: new Date().toISOString(),
          summary: `${parsed.category}/${parsed.urgency}/${parsed.sentiment}`,
          reasoning,
          latencyMs,
          tokens: extractTokenCount(raw),
        },
      ],
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);

    logger.error(
      { ticketId: ticket.id, err: message, latencyMs },
      "classification failed, falling back",
    );

    return {
      classification: {
        category: "other",
        urgency: "medium",
        sentiment: "neutral",
        rationale: `Automatic classification failed: ${message}`,
      },
      trace: [
        {
          node: "classify",
          at: new Date().toISOString(),
          summary: "classification failed, fell back to other/medium",
          latencyMs,
        },
      ],
    };
  }
};
