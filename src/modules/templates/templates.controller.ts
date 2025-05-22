import { FastifyReply, FastifyRequest } from "fastify";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "./templates.service";
import {
  CreateTemplateBody,
  GetTemplateParams,
  UpdateTemplateBody,
} from "./templates.schema";

export async function createTemplateHandler(
  request: FastifyRequest<{ Body: CreateTemplateBody }>,
  reply: FastifyReply
) {
  const { name, content, engine } = request.body;

  const template = await createTemplate({ name, content, engine }, request.db);

  return reply.status(201).send({ id: template.id });
}

export async function getTemplateHandler(
  request: FastifyRequest<{ Params: GetTemplateParams }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  const template = await getTemplate(id, request.db);

  if (!template) {
    return reply.status(404).send({ error: "Template not found" });
  }

  return reply.send(template);
}

export async function listTemplatesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const templates = await listTemplates(request.db);

  return reply.send({ items: templates });
}

export async function updateTemplateHandler(
  request: FastifyRequest<{
    Params: GetTemplateParams;
    Body: UpdateTemplateBody;
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const updateData = request.body;

  // Verify template exists
  const existingTemplate = await getTemplate(id, request.db);
  if (!existingTemplate) {
    return reply.status(404).send({ error: "Template not found" });
  }

  const updatedTemplate = await updateTemplate(id, updateData, request.db);

  return reply.send(updatedTemplate);
}

export async function deleteTemplateHandler(
  request: FastifyRequest<{ Params: GetTemplateParams }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  // Verify template exists
  const existingTemplate = await getTemplate(id, request.db);
  if (!existingTemplate) {
    return reply.status(404).send({ error: "Template not found" });
  }

  await deleteTemplate(id, request.db);

  return reply.status(204).send();
}
