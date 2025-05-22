import { z } from "zod";
import { errorResponses } from "../../utils/http";

// Common types
export const mediumEnum = z.enum(["sms", "email", "push"]);
export type Medium = z.infer<typeof mediumEnum>;

// Credential schemas
export const providerCredentialsSchema = z.any();
export type ProviderCredentials = z.infer<typeof providerCredentialsSchema>;

export const saveCredentialsBodySchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  credentials: providerCredentialsSchema,
});
export type SaveCredentialsBody = z.infer<typeof saveCredentialsBodySchema>;

export const saveCredentialsResponseSchema = z.object({
  success: z.boolean(),
  updated: z.boolean(),
  id: z.string(),
});
export type SaveCredentialsResponse = z.infer<
  typeof saveCredentialsResponseSchema
>;

export const credentialResponseSchema = z.object({
  id: z.string(),
  provider: z.string(),
  key: z.string(),
  options: z.record(z.string(), z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CredentialResponse = z.infer<typeof credentialResponseSchema>;

// SMS Provider schemas
export const sendSMSOptionsSchema = z.object({
  medium: z.literal("sms").default("sms"),
  fromNumber: z.string(),
  toNumber: z.string(),
  message: z.string(),
});

export type SendSMSOptions = z.infer<typeof sendSMSOptionsSchema>;

// Email Provider schemas
export const sendEmailOptionsSchema = z.object({
  medium: z.literal("email").default("email"),
  fromEmail: z.string().email(),
  toEmail: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

export type SendEmailOptions = z.infer<typeof sendEmailOptionsSchema>;

// Push Provider schemas
export const sendPushOptionsSchema = z.object({
  medium: z.literal("push").default("push"),
  to: z.string(),
  title: z.string(),
  body: z.string(),
});
export type SendPushOptions = z.infer<typeof sendPushOptionsSchema>;

export const testProviderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type TestProviderResponse = z.infer<typeof testProviderResponseSchema>;

// API Endpoint schemas
export const saveCredentialsSchema = {
  tags: ["providers"],
  params: z.object({
    provider: z.string(),
  }),
  body: saveCredentialsBodySchema,
  response: {
    200: saveCredentialsResponseSchema,
    ...errorResponses,
  },
} as const;

export const listCredentialsSchema = {
  tags: ["providers"],
  params: z.object({
    provider: z.string().optional(),
  }),
  response: {
    200: z.object({
      items: z.array(credentialResponseSchema),
    }),
    ...errorResponses,
  },
} as const;

export const listProvidersSchema = {
  tags: ["providers"],
  response: {
    200: z.array(z.string()),
    ...errorResponses,
  },
} as const;
