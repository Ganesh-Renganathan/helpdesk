import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "./lib/prisma";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/requireAuth";
import usersRouter from "./routes/users";
import ticketsRouter from "./routes/tickets";
import inboundEmailRouter from "./routes/inbound-email";

const app = express();
const PORT = process.env.PORT ?? 8080;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
});

app.all("/api/auth/*", authLimiter, toNodeHandler(auth));

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", db: "connected" });
});

app.get("/api/me", requireAuth, (_req, res) => {
  res.json({ user: res.locals.session.user });
});

app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/inbound-email", inboundEmailRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
