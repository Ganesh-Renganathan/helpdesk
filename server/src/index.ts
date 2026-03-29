import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "./lib/prisma";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/requireAuth";

const app = express();
const PORT = process.env.PORT ?? 8080;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.all("/api/auth/*", toNodeHandler(auth));

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", db: "connected" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json(res.locals.session);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
