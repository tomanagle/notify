import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { createCredentials } from "./credentials.service";
import { CreateCredentialsBody } from "./credentials.schema";
import { ZodError } from "zod";

export async function createCredentialsHandler(
  request: FastifyRequest<{ Body: CreateCredentialsBody }>,
  reply: FastifyReply
) {
  const { provider, key, options } = request.body;

  const validProvider = await request.providerRegistry.getProvider(provider);

  try {
    validProvider.validateCredentials(options);
  } catch (error: any) {
    return reply.status(400).send(error.message);
  }

  if (!validProvider) {
    return reply.status(400).send({ error: "Invalid provider" });
  }

  const credentials = await createCredentials(
    { provider, key, options },
    request.db
  );

  return reply.status(201).send({ id: credentials.id });
}
