import { eq, InferInsertModel } from "drizzle-orm";
import { DB } from "../../db";
import { credentials } from "../../db/schema";

export async function getCredentials(
  props: { credentialsKey: string } | { provider: string },
  db: DB
) {
  if ("credentialsKey" in props) {
    const { credentialsKey } = props;
    const creds = await db.query.credentials.findFirst({
      where: eq(credentials.key, credentialsKey),
    });

    return creds;
  }

  if ("provider" in props) {
    const { provider } = props;
    const creds = await db.query.credentials.findFirst({
      where: eq(credentials.provider, provider),
    });

    return creds;
  }
}

export async function createCredentials(
  props: InferInsertModel<typeof credentials>,
  db: DB
) {
  const creds = await db.insert(credentials).values(props).returning({
    id: credentials.id,
  });

  return creds[0];
}
