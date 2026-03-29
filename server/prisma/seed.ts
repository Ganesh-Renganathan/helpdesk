import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Role } from "../src/types/enums";

import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Same config and format as Better Auth's internal hashPassword
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2,
  }) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_EMAIL!;
  const password = process.env.SEED_PASSWORD!;
  const name = process.env.SEED_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error("SEED_EMAIL and SEED_PASSWORD must be set in .env");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists, skipping.`);
    return;
  }

  const id = crypto.randomUUID().replace(/-/g, "");
  const hashed = await hashPassword(password);

  await prisma.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: true,
      role: Role.admin,
      accounts: {
        create: {
          id: crypto.randomUUID().replace(/-/g, ""),
          accountId: id,
          providerId: "credential",
          password: hashed,
        },
      },
    },
  });

  console.log(`Created admin user: ${email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
