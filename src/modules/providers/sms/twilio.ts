import { SMSProvider } from "../providers.dto";
import { logger } from "../../../utils/logger";
import { z } from "zod";
import { Twilio } from "twilio";
import { providerCredentialsSchema } from "../providers.schemas";

const credentialsSchema = z.object({
  accountSid: z.string(),
  authToken: z.string(),
});

const sendSMSOptionsSchema = z.object({
  fromNumber: z.string(),
  toNumber: z.string(),
});

export class TwilioProvider extends SMSProvider {
  private logger = logger.child({ module: "TwilioProvider" });
  private client: Twilio;

  constructor(options: z.infer<typeof credentialsSchema>) {
    super(options);

    this.client = new Twilio(options.accountSid, options.authToken);
  }

  get credentialsSchema() {
    return credentialsSchema;
  }

  public optionsSchema = sendSMSOptionsSchema;

  public validateCredentials(credentials: object): void {
    this.credentialsSchema.parse(credentials);
  }

  public validateSendOptions(
    options: object
  ): z.infer<typeof this.optionsSchema> {
    const result = this.optionsSchema.parse(options);

    return result;
  }

  public getConversationKey(
    sendOptions: z.infer<typeof this.optionsSchema>
  ): string {
    return `outbound:${sendOptions.toNumber}-inbound:${sendOptions.fromNumber}`;
  }

  async send(
    message: string,
    sendOptions: z.infer<typeof this.optionsSchema>
  ): Promise<void> {
    try {
      this.logger.info(
        { to: sendOptions.toNumber, from: sendOptions.fromNumber },
        `Sending SMS via Twilio: ${message}`
      );
      return;
    } catch (error) {
      this.logger.error({ sendOptions, error }, "Error sending SMS via Twilio");
      throw error;
    }
  }
}
