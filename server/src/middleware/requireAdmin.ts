import { Request, Response, NextFunction } from "express";

export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (res.locals.session?.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
