import { FastifyReply, FastifyRequest } from "fastify";
import handlebars from "handlebars";
import { createMessageBody, CreateMessageBody } from "./message.schemas";
import { InferInsertModel } from "drizzle-orm";
import { messages } from "../../db/schema";
import { getCredentials } from "../credentials/credentials.service";
import { getTemplate } from "../templates/templates.service";
import { createMessage } from "./message.service";

export async function createMessageHandler(
  request: FastifyRequest<{ Body: CreateMessageBody }>,
  reply: FastifyReply
) {
  const payload = createMessageBody.safeParse(request.body);

  request.log.info({ payload }, "Creating message");

  if (!payload.success) {
    return reply.status(400).send(payload.error.message);
  }

  try {
    const { credentialsKey } = payload.data;

    const creds = await getCredentials({ credentialsKey }, request.db);

    if (!creds) {
      return reply.status(400).send({
        message: "Credentials not found",
        cause: credentialsKey,
      });
    }

    const provider = await request.providerRegistry.getProvider(creds.provider);

    let body = "";

    if ("body" in request.body) {
      body = request.body.body;
    }

    if ("templateId" in request.body) {
      const { templateId, templateVariables } = request.body;
      const template = await getTemplate(templateId, request.db);

      if (!template) {
        throw new Error(`Template not found for id: ${templateId}`);
      }

      const templateEngine = handlebars.compile(template.content);

      const renderedTemplate = templateEngine(templateVariables);

      body = renderedTemplate;
    }

    try {
      provider.validateSendOptions(payload.data.sendOptions);
    } catch (error: unknown) {
      request.log.error({ error }, "Error validating send options");
      return reply
        .status(400)
        .send(error instanceof Error ? error.message : "Unknown error");
    }

    const messagePayload: InferInsertModel<typeof messages> = {
      credentialsId: creds.id,
      medium: provider.medium,
      provider: creds.provider,
      direction: "outbound",
      body,
      sendOptions: payload.data.sendOptions,
      correlationId: request.id,
    };

    const insertResult = await createMessage(messagePayload, request.db);

    request.log.info({ messageId: insertResult.id }, "Message created");

    await request.queue.enqueue({
      messageId: insertResult.id,
    });

    return reply.status(201).send(insertResult);
  } catch (error) {
    request.log.error({ error }, "Error creating message");
    return reply.status(500).send(error);
  }
}
