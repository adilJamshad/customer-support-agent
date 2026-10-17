import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { TicketSchema, type Ticket } from "../domain/schemas.ts";

const ticketsPath = fileURLToPath(new URL("./tickets.json", import.meta.url));

export const loadTickets = async (): Promise<Ticket[]> => {
  const raw = await readFile(ticketsPath, "utf8");
  return z.array(TicketSchema).parse(JSON.parse(raw));
};

export const loadTicket = async (id: string): Promise<Ticket> => {
  const tickets = await loadTickets();
  const match = tickets.find((t) => t.id === id);
  if (!match) {
    throw new Error(
      `Unknown ticket "${id}". Available: ${tickets.map((t) => t.id).join(", ")}`,
    );
  }
  return match;
};
