import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import type { Request, Response } from "express";

const router = Router();

function isAuthenticated(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

router.get("/my-tenant", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const tenant = await storage.getTenantWithDetails(user.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json({ tenant });
  } catch (error: any) {
    console.error("Error getting tenant:", error);
    res.status(500).json({ message: "Failed to get tenant" });
  }
});

const updateProfileSchema = z.object({
  openalexId: z.string().optional(),
  displayName: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  customCss: z.string().nullable().optional(),
  socialLinks: z.record(z.string()).nullable().optional(),
  featuredWorks: z.array(z.string()).nullable().optional(),
});

router.patch("/profile", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validation.error.errors 
      });
    }

    const profile = await storage.updateTenantProfile(user.tenantId, validation.data);
    res.json({ profile });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.post("/sync", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const tenant = await storage.getTenantWithDetails(user.tenantId);
    if (!tenant?.profile?.openalexId) {
      return res.status(400).json({ message: "No OpenAlex ID configured" });
    }

    const profile = await storage.updateTenantProfile(user.tenantId, {
      lastSyncedAt: new Date(),
    });

    res.json({ profile, message: "Sync completed" });
  } catch (error: any) {
    console.error("Error syncing profile:", error);
    res.status(500).json({ message: "Failed to sync profile" });
  }
});

export default router;
