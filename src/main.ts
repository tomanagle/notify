import { config } from "./config";
import { ping, setupDB } from "./db";
import { ProviderRegistry } from "./modules/providers/providers";
import { TwilioProvider } from "./modules/providers/sms/twilio";
import { QueueService } from "./modules/queue/queue.service";
import { logger } from "./utils/logger";
import { prom } from "./utils/metrics";
import { buildServer } from "./utils/server";

const { PORT, HOST } = config;

async function main() {
  const { db } = await setupDB(config.DATABASE_URL);
  const log = logger.child({ module: "main" });

  const ctx = new AbortController();

  ctx.signal.addEventListener("abort", () => {
    console.log("abort");
  });

  try {
    await ping(db);
    log.info("database connected");
  } catch (e) {
    log.error(e, "ping failed");
    process.exit(1);
  }

  const providerRegistry = new ProviderRegistry({ db });

  providerRegistry.register("twilio", TwilioProvider);

  const queueController = new AbortController();

  const queue = new QueueService({
    db,
    providerRegistry,
    controller: queueController,
    ctx: ctx.signal,
  });

  queue.startProcessing();

  const server = await buildServer({
    db,
    queue,
    providerRegistry,
  });

  try {
    await server.listen({ port: PORT, host: HOST });
  } catch (err) {
    log.error(err);
    process.exit(1);
  }

  log.info(config, "using config");

  await server.ready();

  await queue.queueUnprocessedMessages();

  prom.collectDefaultMetrics({
    prefix: config.METRICS_PREFIX,
  });

  const signals = ["SIGINT", "SIGTERM"];

  for (const signal of signals) {
    process.on(signal, async () => {
      // console.log("flushing queue");
      // await queue.flush();
      // console.log("flushed queue");

      queueController.abort();
      console.log("aborted queue");
      server.close();
      console.log("closed server");
      process.exit(0);
    });
  }
}

main();
