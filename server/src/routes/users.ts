import { Router } from "express";
import { scrypt, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, derived) => (err ? reject(err) : resolve(derived as Buffer))
    );
  });
  return `${salt}:${key.toString("hex")}`;
}

const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters."),
  email: z.email("A valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input.";
    res.status(400).json({ error: message });
    return;
  }
  const { name, email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use." });
    return;
  }

  const id = crypto.randomUUID().replace(/-/g, "");
  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: true,
      accounts: {
        create: {
          id: crypto.randomUUID().replace(/-/g, ""),
          accountId: id,
          providerId: "credential",
          password: hashed,
        },
      },
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json({ user });
});

export default router;
