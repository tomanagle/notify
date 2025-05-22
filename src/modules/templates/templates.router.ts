import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  createTemplateHandler,
  deleteTemplateHandler,
  getTemplateHandler,
  listTemplatesHandler,
  updateTemplateHandler,
} from "./templates.controller";
import {
  createTemplateSchema,
  deleteTemplateSchema,
  getTemplateSchema,
  listTemplatesSchema,
  updateTemplateSchema,
} from "./templates.schema";

export function templatesRouter(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>();

  router.post("/", {
    schema: createTemplateSchema,
    handler: createTemplateHandler,
  });

  router.get("/:id", {
    schema: getTemplateSchema,
    handler: getTemplateHandler,
  });

  router.get("/", {
    schema: listTemplatesSchema,
    handler: listTemplatesHandler,
  });

  router.patch("/:id", {
    schema: updateTemplateSchema,
    handler: updateTemplateHandler,
  });

  router.delete("/:id", {
    schema: deleteTemplateSchema,
    handler: deleteTemplateHandler,
  });
}