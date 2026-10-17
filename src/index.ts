import { parseArgs } from "node:util";
import { loadTicket, loadTickets } from "./fixtures/load.ts";
import { buildGraph } from "./graph/index.ts";
import type { Ticket } from "./domain/schemas.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    all: { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    reasoning: { type: "boolean", default: false },
  },
});

const graph = buildGraph();

const runOne = async (ticket: Ticket) => {
  const result = await graph.invoke({ ticket });
  const c = result.classification;

  console.log(`\n${ticket.id}  ${ticket.subject}`);
  if (!c) {
    console.log("  no classification produced");
    return;
  }
  console.log(
    `  ${c.category.padEnd(9)} ${c.urgency.padEnd(8)} ${c.sentiment.padEnd(10)}`,
  );
  console.log(`  ${c.rationale}`);

  const event = result.trace.at(-1);
  if (event) {
    console.log(`  ${event.latencyMs}ms  ${event.tokens ?? "?"} tokens`);
    if (values.reasoning && event.reasoning) {
      console.log(`  reasoning: ${event.reasoning}`);
    }
  }
};

if (values.list) {
  const tickets = await loadTickets();
  for (const t of tickets) console.log(`${t.id}  ${t.subject}`);
} else if (values.all) {
  const tickets = await loadTickets();
  const startedAt = Date.now();
  for (const ticket of tickets) await runOne(ticket);
  console.log(`\n${tickets.length} tickets in ${Date.now() - startedAt}ms`);
} else {
  const id = positionals[0];
  if (!id) {
    console.error("usage: npm start -- <ticket-id> | --all | --list");
    process.exit(1);
  }
  await runOne(await loadTicket(id));
}
