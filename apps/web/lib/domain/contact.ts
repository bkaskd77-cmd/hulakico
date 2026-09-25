import { z } from "zod";

export const CONTACT_TOPICS = [
  { value: "GENERAL", label: "General question" },
  { value: "SHIPMENT", label: "Help with a shipment" },
  { value: "BUSINESS", label: "Business account" },
  { value: "PARTNERSHIP", label: "Carrier or partner enquiry" },
] as const;

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  topic: z.enum(["GENERAL", "SHIPMENT", "BUSINESS", "PARTNERSHIP"]),
  reference: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
