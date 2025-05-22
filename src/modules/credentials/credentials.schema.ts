import { z } from "zod";
import { errorResponses } from "../../utils/http";

export const createCredentialsBodySchema = z.object({
  provider: z.string(),
  key: z.string(),
  options: z.record(z.string(), z.string()),
});

export type CreateCredentialsBody = z.infer<typeof createCredentialsBodySchema>;

export const createCredentialsResponse = z.object({
  id: z.string(),
});

export const createCredentialsSchema = {
  tags: ["credentials"],
  body: createCredentialsBodySchema,
  response: {
    201: createCredentialsResponse,
    ...errorResponses,
  },
};
