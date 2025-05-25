import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { config } from "../config";

export async function setupDB(url: string | undefined = config.DATABASE_URL) {
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log({ url });

  const client = postgres(url, {
    max: 20,
  });

  const db = drizzle(client, {
    schema,
  });

  return { client, db };
}

export async function ping(db: DB) {
  return db.execute(sql`SELECT 1`);
}

export type Transaction = Parameters<
  Parameters<Awaited<ReturnType<typeof setupDB>>["db"]["transaction"]>[0]
>[0];

export type DB = Awaited<ReturnType<typeof setupDB>>["db"] | Transaction;

export type Client = Awaited<ReturnType<typeof setupDB>>["client"];

export async function teardownDB(client: Client) {
  await client.end();
}
