import { z } from "zod";
import { supportedLocales } from "@/i18n/config";

export const feedbackSchema = z.object({
  kind: z.enum(["idea", "problem"]),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  name: z.string().trim().max(80).default(""),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]).default(""),
  locale: z.enum(supportedLocales),
  website: z.string().max(0).default(""),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
