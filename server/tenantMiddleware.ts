import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { Tenant, Domain } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      domain?: Domain;
      isMarketingSite?: boolean;
    }
  }
}

const MARKETING_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "scholarsite.com",
  "www.scholarsite.com",
];

export async function tenantResolver(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const host = req.hostname || req.headers.host || "";
    const hostname = host.split(":")[0].toLowerCase();

    if (
      MARKETING_DOMAINS.includes(hostname) ||
      hostname.endsWith(".replit.dev") ||
      hostname.endsWith(".replit.app") ||
      hostname.endsWith(".repl.co")
    ) {
      req.isMarketingSite = true;
      return next();
    }

    const domain = await storage.getDomainByHostname(hostname);

    if (!domain) {
      req.isMarketingSite = true;
      return next();
    }

    const tenant = await storage.getTenant(domain.tenantId);

    if (!tenant || tenant.status === "cancelled" || tenant.status === "suspended") {
      req.isMarketingSite = true;
      return next();
    }

    req.tenant = tenant;
    req.domain = domain;
    req.isMarketingSite = false;

    next();
  } catch (error) {
    console.error("Tenant resolution error:", error);
    req.isMarketingSite = true;
    next();
  }
}

export function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.tenant) {
    return res.status(404).json({ message: "Site not found" });
  }
  next();
}

export function requireMarketingSite(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isMarketingSite) {
    return res.redirect("/");
  }
  next();
}
