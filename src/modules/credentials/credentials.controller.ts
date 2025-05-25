import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { createCredentials } from "./credentials.service";
import { CreateCredentialsBody } from "./credentials.schema";
import { StatusCodes } from "http-status-codes";

export async function createCredentialsHandler(
  request: FastifyRequest<{ Body: CreateCredentialsBody }>,
  reply: FastifyReply
) {
  const { provider, key, options } = request.body;

  const validProvider = await request.providerRegistry.getProvider(provider);

  try {
    validProvider.validateCredentials(options);
  } catch (error: unknown) {
    return reply
      .status(StatusCodes.BAD_REQUEST)
      .send(error instanceof Error ? error.message : "Unknown error");
  }

  if (!validProvider) {
    return reply
      .status(StatusCodes.BAD_REQUEST)
      .send({ error: "Invalid provider" });
  }

  const credentials = await createCredentials(
    { provider, key, options },
    request.db
  );

  return reply.status(StatusCodes.CREATED).send({ id: credentials.id });
}
