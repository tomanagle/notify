import { z } from "zod";
import { errorResponses } from "../../utils/http";

const engines = ["hbs"] as const;

export const createTemplateBodySchema = z.object({
  name: z.string(),
  content: z.string(),
  engine: z.enum(engines).default("hbs"),
});

export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>;

export const createTemplateResponse = z.object({
  id: z.string(),
});

export const createTemplateSchema = {
  tags: ["templates"],
  body: createTemplateBodySchema,
  response: {
    201: createTemplateResponse,
    ...errorResponses,
  },
};

export const getTemplateParamsSchema = z.object({
  id: z.string(),
});

export type GetTemplateParams = z.infer<typeof getTemplateParamsSchema>;

const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  engine: z.enum(engines),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const templateResponseSchema = z.object({
  items: z.array(templateSchema),
});

export const getTemplateSchema = {
  tags: ["templates"],
  params: getTemplateParamsSchema,
  response: {
    200: templateSchema,
    ...errorResponses,
  },
};

export const listTemplatesSchema = {
  tags: ["templates"],
  response: {
    200: templateResponseSchema,
    ...errorResponses,
  },
};

export const updateTemplateBodySchema = z.object({
  name: z.string().optional(),
  content: z.string().optional(),
  engine: z.enum(engines).optional(),
});

export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>;

export const updateTemplateSchema = {
  tags: ["templates"],
  params: getTemplateParamsSchema,
  body: updateTemplateBodySchema,
  response: {
    200: templateResponseSchema,
    ...errorResponses,
  },
};

export const deleteTemplateSchema = {
  tags: ["templates"],
  params: getTemplateParamsSchema,
  response: {
    204: z.null(),
    ...errorResponses,
  },
};
