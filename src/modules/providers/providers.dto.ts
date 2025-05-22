import { z } from "zod";
import { Medium, ProviderCredentials } from "./providers.schemas";

export abstract class NotificationProvider {
  abstract readonly medium: Medium;
  protected credentials?: ProviderCredentials;

  constructor(options: ProviderCredentials) {
    this.credentials = options;
  }

  abstract optionsSchema: z.ZodSchema<unknown>;

  abstract validateCredentials(credentials: object): void;
  abstract validateSendOptions(
    sendOptions: object
  ): z.infer<typeof this.optionsSchema>;

  abstract send(
    message: string,
    sendOptions: z.infer<typeof this.optionsSchema>
  ): Promise<void>;

  abstract getConversationKey(
    sendOptions: z.infer<typeof this.optionsSchema>
  ): string;
}

export abstract class SMSProvider extends NotificationProvider {
  readonly medium = "sms" as const;
}

export abstract class EmailProvider extends NotificationProvider {
  readonly medium = "email" as const;
}

export abstract class PushProvider extends NotificationProvider {
  readonly medium = "push" as const;
}
