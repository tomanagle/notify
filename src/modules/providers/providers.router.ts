import { FastifyInstance } from "fastify";
import {
  saveCredentialsHandler,
  listCredentialsHandler,
  listProvidersHandler,
} from "./providers.controller";
import {
  saveCredentialsSchema,
  listCredentialsSchema,
  listProvidersSchema,
  testProviderSchema,
} from "./providers.schemas";
import { ZodTypeProvider } from "fastify-type-provider-zod";

export async function providerRouter(server: FastifyInstance) {
  server.withTypeProvider<ZodTypeProvider>().post("/credentials/:provider", {
    schema: saveCredentialsSchema,
    handler: saveCredentialsHandler,
  });

  server.withTypeProvider<ZodTypeProvider>().get("/credentials", {
    schema: listCredentialsSchema,
    handler: listCredentialsHandler,
  });

  server.withTypeProvider<ZodTypeProvider>().get("/credentials/:provider", {
    schema: listCredentialsSchema,
    handler: listCredentialsHandler,
  });

  server.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: listProvidersSchema,
    handler: listProvidersHandler,
  });
}
