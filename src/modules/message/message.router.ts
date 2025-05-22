import { FastifyInstance } from "fastify";
import { createMessageHandler } from "./message.controller";
import { createMessageSchema } from "./message.schemas";
import { ZodTypeProvider } from "fastify-type-provider-zod";

export function messageRouter(server: FastifyInstance) {
  server.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: createMessageSchema,
    handler: createMessageHandler,
  });
}
