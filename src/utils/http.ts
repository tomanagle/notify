import { FastifyReply } from "fastify";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

export function httpError({
  reply,
  message,
  code,
  cause,
}: {
  reply: FastifyReply;
  message: string;
  code: StatusCodes;
  cause?: string;
}) {
  return reply.status(code).send({
    message,
    cause,
  });
}

export const httpErrorSchema = z.object({
  message: z.string(),
  cause: z.string().optional(),
});

// Create a schema for ZodError
const zodErrorSchema = z.object({
  issues: z.array(z.any()),
  errors: z.array(z.any()),
  name: z.literal("ZodError"),
});

export const errorResponses = {
  404: httpErrorSchema,
  400: z.union([zodErrorSchema, httpErrorSchema]),
  401: httpErrorSchema,
  500: httpErrorSchema,
};
