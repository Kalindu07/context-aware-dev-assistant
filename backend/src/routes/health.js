import { Router } from "express";
import { ping } from "../db/connection.js";

export function createHealthRouter() {
  const router = Router();

  router.get("/health", (req, res) => {
    const dbOk = ping(req.app.locals.db);
    res.status(200).json({
      status: dbOk ? "ok" : "degraded",
      app: req.app.locals.config.appName,
      env: req.app.locals.config.appEnv,
      db: dbOk ? "ok" : "error",
    });
  });

  return router;
}
