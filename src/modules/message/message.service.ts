import { eq, InferInsertModel, InferSelectModel, isNull } from "drizzle-orm";
import { DB } from "../../db";
import { messages } from "../../db/schema";
import { SendPushOptions } from "../providers/providers.schemas";
import { SendEmailOptions } from "../providers/providers.schemas";
import { SendSMSOptions } from "../providers/providers.schemas";

export async function createMessage(
  message: InferInsertModel<typeof messages>,
  db: DB
) {
  const insertResult = await db.insert(messages).values(message).returning();

  return insertResult[0];
}

export async function getPendingMessagesForUpdate({ db }: { db: DB }) {
  const pendingMessages = await db
    .select({
      id: messages.id,
    })
    .from(messages)
    .where(isNull(messages.sentAt))
    .for("update", {
      skipLocked: true,
    });

  return pendingMessages;
}

export async function getMessageForUpdate({ id, db }: { id: number; db: DB }) {
  const message = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id))
    .for("update", {
      skipLocked: true,
    });

  if (!message.length) {
    throw new Error(`Message not found: ${id}`);
  }

  return message[0];
}

export async function getMessage({ id, db }: { id: number; db: DB }) {
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, id),
  });

  if (!message) {
    throw new Error(`Message not found: ${id}`);
  }

  return message;
}
