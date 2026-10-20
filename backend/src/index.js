import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = createApp({ config });

const server = app.listen(config.appPort, config.appHost, () => {
  console.info(
    "backend_started",
    `host=${config.appHost}`,
    `port=${config.appPort}`,
    `env=${config.appEnv}`,
    `db=${config.databasePath}`,
    `bootstrap=${config.devConsentBootstrapEnabled}`,
  );
});

function shutdown(signal) {
  console.info("backend_stopping", signal);
  server.close(() => {
    app.closeDatabase();
    console.info("backend_stopped");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
