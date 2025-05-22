import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  Medium,
  SendEmailOptions,
  SendPushOptions,
  SendSMSOptions,
} from "../modules/providers/providers.schemas";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$default(() => randomUUID()),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  ...timestamps,
});

export const messageDirection = pgEnum("message_direction", [
  "inbound",
  "outbound",
]);
export const messageMedium = pgEnum("message_medium", ["sms", "email", "push"]);
type MediumOptionsMap = {
  sms: SendSMSOptions;
  email: SendEmailOptions;
  push: SendPushOptions;
};

export type MessageMediumOptions = MediumOptionsMap[keyof MediumOptionsMap];

export const messages = pgTable("messages", {
  id: integer("id").generatedAlwaysAsIdentity(),
  provider: text("provider").notNull(),
  credentialsId: text("credentials_id")
    .references(() => credentials.id)
    .notNull(),
  medium: messageMedium("medium").notNull(),
  sendOptions: jsonb("send_options").notNull().$type<Record<string, string>>(), // additional options for the provider for example, fromNumber, toNumber, etc.
  body: text("body").notNull(),
  direction: messageDirection("direction").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  error: text("error"),
  retries: integer("retries").notNull().default(0),
  correlationId: text("correlation_id").notNull().unique(),
  customerKey: text("customer_key"),
  conversationId: text("conversation_id"),
  ...timestamps,
});

export type Message = typeof messages.$inferSelect;

export const credentials = pgTable("credentials", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // example: twilio, sendgrid, mailgun
  key: text("key").notNull().unique(), // unique name for the credential
  options: jsonb("options").notNull().$type<Record<string, string>>(),
  ...timestamps,
});

export const templates = pgTable("templates", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  content: text("content").notNull(),
  engine: text("engine").notNull().default("hbs"),
  ...timestamps,
});
