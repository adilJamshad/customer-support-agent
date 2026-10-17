import { z } from "zod";

export const TicketChannelSchema = z.enum(["email", "chat", "phone", "web"]);

export const TicketSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  channel: TicketChannelSchema,
  subject: z.string(),
  body: z.string(),
  createdAt: z.string(),
});

export const CategorySchema = z.enum([
  "billing",
  "technical",
  "account",
  "shipping",
  "feedback",
  "other",
]);

export const UrgencySchema = z.enum(["low", "medium", "high", "critical"]);

export const SentimentSchema = z.enum([
  "positive",
  "neutral",
  "frustrated",
  "angry",
]);

export const ClassificationSchema = z.object({
  category: CategorySchema,
  urgency: UrgencySchema,
  sentiment: SentimentSchema,
  rationale: z.string(),
});

export type Ticket = z.infer<typeof TicketSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Urgency = z.infer<typeof UrgencySchema>;
export type Sentiment = z.infer<typeof SentimentSchema>;
export type Classification = z.infer<typeof ClassificationSchema>;
