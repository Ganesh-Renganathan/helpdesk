import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

// Verify the shared secret sent in the Authorization header.
// Set INBOUND_EMAIL_SECRET in .env and configure your email provider
// to send `Authorization: Bearer <secret>` with every inbound webhook.
function verifySecret(authHeader: string | undefined): boolean {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

const inboundEmailSchema = z.object({
  from: z.email("Invalid sender email."),
  fromName: z.string().optional(),
  subject: z.string().min(1, "Subject is required."),
  // Prefer plain text; fall back to HTML if text is absent
  text: z.string().optional(),
  html: z.string().optional(),
});

router.post("/", async (req, res) => {
  if (!verifySecret(req.headers["authorization"])) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const result = inboundEmailSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid payload.";
    res.status(400).json({ error: message });
    return;
  }

  const { from, fromName, subject, text, html } = result.data;
  const body = text ?? html ?? "";

  if (!body.trim()) {
    res.status(400).json({ error: "Email body is empty." });
    return;
  }

  const ticket = await prisma.ticket.create({
    data: { fromEmail: from, fromName, subject, body },
    select: { id: true, subject: true, fromEmail: true, status: true, createdAt: true },
  });

  res.status(201).json({ ticket });
});

export default router;
