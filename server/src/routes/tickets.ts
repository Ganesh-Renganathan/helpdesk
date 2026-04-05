import { Router } from "express";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      subject: true,
      fromEmail: true,
      fromName: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ tickets });
});

router.get("/:id", requireAuth, async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      subject: true,
      fromEmail: true,
      fromName: true,
      body: true,
      status: true,
      createdAt: true,
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  res.json({ ticket });
});

const polishSchema = z.object({
  draft: z.string().min(1, "Draft reply is required."),
});

router.post("/:id/polish", requireAuth, async (req, res) => {
  const result = polishSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    select: { subject: true, body: true },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content:
            "You are a professional customer support agent. When given a draft reply, improve it to be clear, empathetic, and professional. Return only the improved reply — no explanations, no preamble.",
        },
        {
          role: "user",
          content: `Ticket subject: ${ticket.subject}\n\nCustomer message:\n${ticket.body}\n\nDraft reply:\n${result.data.draft}`,
        },
      ],
    });
    res.json({ polished: text });
  } catch (err: any) {
    const message = err?.message ?? "Failed to polish reply.";
    res.status(502).json({ error: message });
  }
});

export default router;
