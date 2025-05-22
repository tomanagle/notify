import { DB } from "../../db";
import { credentials } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { databaseQueryTimeHistogram } from "../../utils/metrics";
import { logger } from "../../utils/logger";
import {
  ProviderCredentials,
  CredentialResponse,
  SaveCredentialsResponse,
} from "./providers.schemas";

// Import the base provider classes
import { SMSProvider, EmailProvider, PushProvider } from "./providers.dto";

type ProviderClass =
  | (new (options: ProviderCredentials) => SMSProvider)
  | (new (options: ProviderCredentials) => EmailProvider)
  | (new (options: ProviderCredentials) => PushProvider);

export class ProviderRegistry {
  private providers = new Map<string, ProviderClass>();
  private db: DB;
  private logger = logger.child({ module: "ProviderRegistry" });

  constructor({ db }: { db: DB }) {
    this.db = db;
  }

  register(name: string, providerClass: ProviderClass) {
    this.providers.set(name, providerClass);
    this.logger.info(`Registered provider: ${name}`);
  }

  async getProvider(
    providerName: string,
    clientId?: string
  ): Promise<InstanceType<ProviderClass>> {
    const end = databaseQueryTimeHistogram.startTimer();
    try {
      const ProviderClass = this.providers.get(providerName);

      if (!ProviderClass) {
        throw new Error(`Provider ${providerName} not registered`);
      }

      let providerCredentials: ProviderCredentials | undefined;

      // Get credentials from db if clientId is provided
      if (clientId) {
        const providerCreds = await this.db.query.credentials.findFirst({
          where: (fields, { and, eq }) =>
            and(eq(fields.provider, providerName), eq(fields.key, clientId)),
        });

        if (!providerCreds) {
          throw new Error(
            `Credentials not found for provider ${providerName} with clientId ${clientId}`
          );
        }

        providerCredentials = providerCreds.options as ProviderCredentials;
        end({ operation: "get_provider_with_client_id", success: "true" });
      } else {
        // Get default credentials if no clientId specified
        const defaultCreds = await this.db.query.credentials.findFirst({
          where: (fields, { eq }) => eq(fields.provider, providerName),
        });

        if (defaultCreds) {
          providerCredentials = defaultCreds.options as ProviderCredentials;
        }

        end({
          operation: defaultCreds
            ? "get_provider_with_default_credentials"
            : "get_provider_without_credentials",
          success: "true",
        });
      }

      // Instantiate the provider with credentials
      return new ProviderClass({
        db: this.db,
        credentials: providerCredentials,
      });
    } catch (error) {
      end({ operation: "get_provider", success: "false" });
      logger.error({ providerName, clientId, error }, "Error getting provider");
      throw error;
    }
  }

  async saveCredentials(
    providerName: string,
    clientId: string,
    credentialData: ProviderCredentials
  ): Promise<SaveCredentialsResponse> {
    const end = databaseQueryTimeHistogram.startTimer();
    try {
      // Check if the provider is registered
      if (!this.providers.has(providerName)) {
        throw new Error(`Provider ${providerName} not registered`);
      }

      // Check if credentials already exist
      const existingCreds = await this.db.query.credentials.findFirst({
        where: (fields, { and, eq }) =>
          and(eq(fields.provider, providerName), eq(fields.key, clientId)),
      });

      if (existingCreds) {
        // Update existing credentials
        await this.db
          .update(credentials)
          .set({
            options: credentialData,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(credentials.provider, providerName),
              eq(credentials.key, clientId)
            )
          );

        end({ operation: "update_credentials", success: "true" });
        return { success: true, updated: true, id: existingCreds.id };
      }

      // Insert new credentials
      const result = await this.db
        .insert(credentials)
        .values({
          provider: providerName,
          key: clientId,
          options: credentialData,
        })
        .returning({ id: credentials.id });

      end({ operation: "insert_credentials", success: "true" });
      return { success: true, updated: false, id: result[0].id };
    } catch (error) {
      end({ operation: "save_credentials", success: "false" });
      logger.error(
        { providerName, clientId, error },
        "Error saving credentials"
      );
      throw error;
    }
  }

  redactOptions(options: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(options).map(([key, value]) => {
        const length = value.length;
        const redacted = "*".repeat(length);
        return [key, redacted];
      })
    );
  }

  async listCredentials(providerName?: string): Promise<CredentialResponse[]> {
    const end = databaseQueryTimeHistogram.startTimer();
    try {
      if (providerName) {
        const providerCreds = await this.db.query.credentials.findMany({
          where: (fields, { eq }) => eq(fields.provider, providerName),
        });

        end({ operation: "list_provider_credentials", success: "true" });
        return providerCreds.map((cred) => ({
          id: cred.id,
          provider: cred.provider,
          key: cred.key,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt,
          options: this.redactOptions(cred.options),
        }));
      }

      const allCreds = await this.db.query.credentials.findMany();

      end({ operation: "list_all_credentials", success: "true" });
      return allCreds.map((cred) => ({
        id: cred.id,
        provider: cred.provider,
        key: cred.key,
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt,
        options: this.redactOptions(cred.options),
      }));
    } catch (error) {
      end({ operation: "list_credentials", success: "false" });
      logger.error({ providerName, error }, "Error listing credentials");
      throw error;
    }
  }

  getRegisteredProviders(): string[] {
    const providers = Array.from(this.providers.keys());

    return providers;
  }
}
