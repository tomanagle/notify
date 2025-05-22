import { FastifyInstance } from "fastify";
import { createCredentialsHandler } from "./credentials.controller";
import { createCredentialsSchema } from "./credentials.schema";

export function credentialsRouter(server: FastifyInstance) {
  server.post("/", {
    schema: createCredentialsSchema,
    handler: createCredentialsHandler,
  });
}
