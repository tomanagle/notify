import { FastifyReply, FastifyRequest } from "fastify";
import { SaveCredentialsBody } from "./providers.schemas";
import { StatusCodes } from "http-status-codes";
import { httpError } from "../../utils/http";
import { logger } from "../../utils/logger";

export async function saveCredentialsHandler(
  request: FastifyRequest<{
    Params: { provider: string };
    Body: SaveCredentialsBody;
  }>,
  reply: FastifyReply
) {
  const { provider } = request.params;
  const { clientId, credentials } = request.body;

  try {
    const result = await request.providerRegistry.saveCredentials(
      provider,
      clientId,
      credentials
    );

    return reply.code(StatusCodes.OK).send(result);
  } catch (error) {
    logger.error(
      { provider, clientId, error },
      "Error saving provider credentials"
    );

    return httpError({
      reply,
      message: "Failed to save provider credentials",
      code: StatusCodes.BAD_REQUEST,
      cause: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function listCredentialsHandler(
  request: FastifyRequest<{
    Params: { provider?: string };
  }>,
  reply: FastifyReply
) {
  const { provider } = request.params;

  try {
    const credentials = await request.providerRegistry.listCredentials(
      provider
    );
    return reply.code(StatusCodes.OK).send({ items: credentials });
  } catch (error) {
    logger.error({ provider, error }, "Error listing provider credentials");

    return httpError({
      reply,
      message: "Failed to list provider credentials",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      cause: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function listProvidersHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const providers = request.providerRegistry.getRegisteredProviders();
    return reply.code(StatusCodes.OK).send(providers);
  } catch (error) {
    logger.error({ error }, "Error listing registered providers");

    return httpError({
      reply,
      message: "Failed to list registered providers",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      cause: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
