import { z } from "zod";
import { errorResponses } from "../../utils/http";
import { sendSMSOptionsSchema, sendEmailOptionsSchema, sendPushOptionsSchema, mediumEnum } from "../providers/providers.schemas";

// Enqueue message schema
export const enqueueMessageBodySchema = z.object({
  provider: z.string(),
  medium: mediumEnum,
  options: z.union([
    sendSMSOptionsSchema, 
    sendEmailOptionsSchema, 
    sendPushOptionsSchema
  ]),
  clientId: z.string().optional()
});
export type EnqueueMessageBody = z.infer<typeof enqueueMessageBodySchema>;

export const enqueueMessageResponseSchema = z.object({
  id: z.number()
});
export type EnqueueMessageResponse = z.infer<typeof enqueueMessageResponseSchema>;

export const enqueueMessageSchema = {
  tags: ["queue"],
  body: enqueueMessageBodySchema,
  response: {
    200: enqueueMessageResponseSchema,
    ...errorResponses
  }
} as const;

// Get message status
export const messageStatusSchema = z.object({
  id: z.number(),
  provider: z.string(),
  medium: mediumEnum,
  body: z.string(),
  sentAt: z.date().nullable(),
  error: z.string().nullable(),
  retries: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type MessageStatus = z.infer<typeof messageStatusSchema>;

export const getMessageStatusSchema = {
  tags: ["queue"],
  params: z.object({
    id: z.number()
  }),
  response: {
    200: messageStatusSchema,
    ...errorResponses
  }
} as const;

// List pending messages
export const listMessagesResponseSchema = z.array(messageStatusSchema);
export type ListMessagesResponse = z.infer<typeof listMessagesResponseSchema>;

export const listMessagesSchema = {
  tags: ["queue"],
  querystring: z.object({
    limit: z.number().optional().default(100),
    offset: z.number().optional().default(0),
    status: z.enum(["pending", "sent", "failed", "all"]).optional().default("all")
  }),
  response: {
    200: listMessagesResponseSchema,
    ...errorResponses
  }
} as const;

// Dequeue response
export const dequeueResponseSchema = z.object({
  processed: z.boolean(),
  id: z.number().optional()
});
export type DequeueResponse = z.infer<typeof dequeueResponseSchema>;

export const dequeueSchema = {
  tags: ["queue"],
  response: {
    200: dequeueResponseSchema,
    ...errorResponses
  }
} as const;

// Flush response
export const flushResponseSchema = z.object({
  flushed: z.number()
});
export type FlushResponse = z.infer<typeof flushResponseSchema>;

export const flushSchema = {
  tags: ["queue"],
  response: {
    200: flushResponseSchema,
    ...errorResponses
  }
} as const;