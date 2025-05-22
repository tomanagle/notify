import z from "zod";
import zennv from "zennv";

const schema = z.object({
  PORT: z.number().default(1337),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
  METRICS_PREFIX: z.string().default("app_"),
});

export type Config = z.infer<typeof schema>;

export const config = zennv({
  schema: schema,
  dotenv: true,
});
