import { auth } from "../lib/auth";
import { Role } from "./enums";

type Session = typeof auth.$Infer.Session & {
  user: { role: Role };
};

declare global {
  namespace Express {
    interface Locals {
      session: Session;
    }
  }
}
