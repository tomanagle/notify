import { type DB } from "../../db";
import { credentials, messages } from "../../db/schema";
import { ProviderRegistry } from "../providers/providers";
import { eq, isNull } from "drizzle-orm";
import {
  getMessageForUpdate,
  getPendingMessagesForUpdate,
} from "../message/message.service";
import { logger } from "../../utils/logger";

type QueueServiceOptions = {
  db: DB;
  providerRegistry: ProviderRegistry;
  controller: AbortController;
  signal: AbortSignal;
  pollInterval?: number;
};

export class QueueService {
  private db: DB;
  private providerRegistry: ProviderRegistry;
  private processing = false;
  private pollInterval = 1000; // 1 second
  private processingTimeout?: NodeJS.Timeout;
  private messages: Array<number> = [];

  private logger = logger.child({ module: "QueueService" });

  private signal: AbortSignal;

  constructor(options: QueueServiceOptions) {
    this.db = options.db;
    this.providerRegistry = options.providerRegistry;
    this.pollInterval = options.pollInterval ?? this.pollInterval;
    this.signal = options.signal;
  }

  async enqueue({ messageId }: { messageId: number }) {
    if (this.signal.aborted) {
      throw new Error("Queue processing aborted");
    }

    this.messages.push(messageId);

    return true;
  }

  startProcessing() {
    if (this.processing) {
      return;
    }

    this.processing = true;
    this.processQueue(this.pollInterval);
  }

  stopProcessing() {
    this.processing = false;
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
  }

  private async processQueue(interval?: number) {
    if (this.signal.aborted) {
      this.logger.info("Queue processing aborted");
      return;
    }

    try {
      for (let i = 0; i < this.messages.length; i++) {
        /*
         * remove the message from the queue and process it
         * if the processing fails, it will get put back on the queue
         */
        const message = this.messages[i];
        this.messages.splice(i, 1);

        await this.processMessage(message);
      }
    } catch (error) {
      this.logger.error("Error processing queue:", error);
      throw error;
    }

    // Continue processing after the poll interval

    if (interval) {
      this.processingTimeout = setTimeout(
        () => this.processQueue(interval),
        interval
      );
    }
  }

  private async processMessage(messageId: number) {
    await this.db.transaction(async (tx) => {
      const message = await getMessageForUpdate({
        id: messageId,
        db: tx,
      });

      if (!message) {
        this.logger.info(`Message not found: ${messageId}`);
        return;
      }

      if (message.sentAt) {
        this.logger.debug(`Message already sent: ${messageId}`);
        return;
      }

      try {
        const creds = await tx.query.credentials.findFirst({
          where: eq(credentials.id, message.credentialsId),
        });

        if (!creds) {
          throw new Error(
            `Credentials not found for provider: ${message.provider}`
          );
        }

        // Get the provider instance
        const provider = await this.providerRegistry.getProvider(
          message.provider
        );

        // Send the message based on medium type
        switch (provider.medium) {
          case "sms": {
            const options = provider.validateSendOptions(message.sendOptions);

            await provider.send(message.body, options);
            break;
          }
          case "email": {
            throw new Error("Not implemented");
            // const options = getOptions<"email">(message);

            // await provider.send({
            //   ...options,
            // });
            break;
          }
          case "push":
            throw new Error("Not implemented");
            // {
            //   const options = getOptions<"push">(message);

            //   await (provider as PushProvider).send({
            //     ...options,
            //   });
            // }

            break;
          default:
            throw new Error(`Unsupported medium: ${message.medium}`) as never;
        }

        // Update message as sent
        await tx
          .update(messages)
          .set({ sentAt: new Date() })
          .where(eq(messages.id, message.id));
      } catch (error) {
        this.logger.error("Error processing message:", error);

        await tx.rollback();

        await this.db
          .update(messages)
          .set({
            error: error instanceof Error ? error.message : String(error),
            retries: message.retries + 1,
          })
          .where(eq(messages.id, message.id));
      }
    });
  }

  async dequeue() {
    // Method to manually dequeue and process a single message
    const message = await this.db.query.messages.findFirst({
      where: (fields, { isNull }) => isNull(fields.sentAt),
      orderBy: (fields, { asc }) => [asc(fields.createdAt)],
    });

    if (message) {
      // await this.processMessage(message);
      this.logger.info("Dequeued message:", message.id);
      return { processed: true, id: message.id };
    }

    return { processed: false };
  }

  async flush() {
    // Process all pending messages
    const pendingMessages = await getPendingMessagesForUpdate({ db: this.db });

    console.log({ pendingMessages });

    for (const message of pendingMessages) {
      this.logger.info("Flushing message:", message.id);
      await this.processMessage(message.id);
    }

    return { flushed: pendingMessages.length };
  }

  async queueUnprocessedMessages() {
    const pendingMessages = await this.db.query.messages.findMany({
      where: isNull(messages.sentAt),
      orderBy: (fields, { asc }) => [asc(fields.createdAt)],
    });

    for (const message of pendingMessages) {
      this.enqueue({ messageId: message.id });
    }
  }
}
