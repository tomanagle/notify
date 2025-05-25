import { config } from "./config";
import { logger } from "./utils/logger";
import { prom } from "./utils/metrics";
import { buildServer } from "./utils/server";

const { PORT, HOST } = config;

async function main() {
  const log = logger.child({ module: "main" });

  const ctx = new AbortController();

  ctx.signal.addEventListener("abort", () => {
    log.info("Signal received, aborting");
  });

  const { server, queue } = await buildServer({
    signal: ctx.signal,
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
      ctx.abort();
      server.close();
      process.exit(0);
    });
  }
}

main();
