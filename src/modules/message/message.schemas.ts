import { z } from "zod";
import { errorResponses } from "../../utils/http";

const createMessageBodyBase = z.object({
  // credentialsKey: z.string(), // if they want to specify a set of credentials to use
  // medium: z.enum(["email", "sms", "push"]),
  // options: z.discriminatedUnion("medium", [
  //   sendSMSOptionsSchema,
  //   sendEmailOptionsSchema,
  //   sendPushOptionsSchema,
  // ]),
  credentialsKey: z.string(),
  customerKey: z.string().optional(),
  // credentialsResolver: z.union([
  //   z.object({
  //     credentialsKey: z.string(),
  //   }),
  //   z.object({
  //     provider: z.string(),
  //   }),
  // ]),
  sendOptions: z.record(z.string(), z.string()),
  templateVariables: z.record(z.string(), z.string()).default({}),
});

const messageWithBody = z
  .object({
    body: z.string(),
  })
  .extend(createMessageBodyBase.shape);

const messageWithTemplate = z
  .object({
    templateId: z.string(),
    variables: z.record(z.string(), z.string()).default({}), // used to populate the template
  })
  .extend(createMessageBodyBase.shape);

export const createMessageBody = z.union([
  messageWithBody,
  messageWithTemplate,
]);

export type CreateMessageBody = z.infer<typeof createMessageBody>;

export const createMessageResponse = z.object({
  message: z.string(),
});

export const createMessageSchema = {
  tags: ["messages"],
  body: z.any(),
  response: {
    201: z.object({
      id: z.number(),
      body: z.string(),
      credentialsId: z.string(),
      medium: z.string(),
      provider: z.string(),
      direction: z.string(),
      correlationId: z.string(),
    }),
    ...errorResponses,
  },
} as const;
