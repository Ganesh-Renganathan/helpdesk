import { auth } from "../lib/auth";

type Session = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Locals {
      session: Session;
    }
  }
}
