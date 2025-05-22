import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { version } from "../../package.json";
import { config } from "../config";
import { prom, reqReplyTime } from "./metrics";
import { DB, ping } from "../db";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { messageRouter } from "../modules/message/message.router";
import { QueueService } from "../modules/queue/queue.service";
import { ProviderRegistry } from "../modules/providers/providers";
import { credentialsRouter } from "../modules/credentials/credentials.router";
import { templatesRouter } from "../modules/templates/templates.router";
import { randomUUID } from "crypto";
import { providerRouter } from "../modules/providers/providers.router";

declare module "fastify" {
  interface FastifyRequest {
    db: DB;
    queue: QueueService;
    providerRegistry: ProviderRegistry;
  }

  interface FastifyInstance {}
}

export async function buildServer({
  db,
  queue,
  providerRegistry,
}: {
  db: DB;
  queue: QueueService;
  providerRegistry: ProviderRegistry;
}) {
  const fastify = Fastify({
    logger: true,
    genReqId(req) {
      return randomUUID();
    },
    requestTimeout: 5_000,
  });

  // Add schema validator and serializer
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Fix: Use getter/setter for reference types
  fastify.decorateRequest("db", {
    getter: () => db,
  });

  fastify.decorateRequest("queue", {
    getter: () => queue,
  });

  fastify.decorateRequest("providerRegistry", {
    getter: () => providerRegistry,
  });

  fastify.addHook("onResponse", reqReplyTime);

  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Notify API",
        description: "API",
        version,
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {},
      },
    },
    // transform: jsonSchemaTransform,
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

  fastify.after(() => {
    fastify.register(messageRouter, { prefix: "/v1/messages" });
    fastify.register(credentialsRouter, { prefix: "/v1/credentials" });
    fastify.register(templatesRouter, { prefix: "/v1/templates" });
    fastify.register(providerRouter, { prefix: "/v1/providers" });

    fastify.get("/docs.json", async () => {
      return fastify.swagger();
    });

    fastify.get("/metrics", async (_, reply) => {
      reply.header("Content-Type", prom.register.contentType);

      return prom.register.metrics();
    });

    fastify.get("/healthcheck", async () => {
      return { server: "ok", db: (await ping(db)) ? "ok" : "failed" };
    });
  });

  return fastify;
}
