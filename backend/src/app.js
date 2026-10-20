import express from "express";
import { loadConfig } from "./config.js";
import { initSchema, openDatabase } from "./db/connection.js";
import { createRepository } from "./db/repository.js";
import { createHealthRouter } from "./routes/health.js";
import { createSessionsRouter } from "./routes/sessions.js";
import { createEventsRouter } from "./routes/events.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

/**
 * Create an Express app.
 * @param {{ config?: object, databasePath?: string }} [options]
 */
export function createApp(options = {}) {
  const config = options.config || loadConfig();
  const databasePath = options.databasePath || config.databasePath;

  const db = openDatabase(databasePath);
  initSchema(db);
  const repo = createRepository(db);

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.locals.config = config;
  app.locals.db = db;
  app.locals.repo = repo;

  app.use(createHealthRouter());
  app.use(createSessionsRouter());
  app.use(createEventsRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.closeDatabase = () => {
    db.close();
  };

  return app;
}
