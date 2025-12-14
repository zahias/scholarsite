import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./auth";
import type { PlanType, TenantStatus } from "@shared/schema";
import { getSyncLogs, forceSyncTenant, runScheduledSync } from "./services/syncScheduler";

const router = Router();

// Admin login schema
const adminLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// Admin login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Login failed" });
      }

      // Set session data
      req.session.userId = user.id;
      req.session.userRole = user.role;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ message: "Login failed" });
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        });
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

// Admin logout
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully" });
  });
});

// Get current admin user (for session check)
router.get("/me", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get admin user error:", error);
    return res.status(500).json({ message: "Failed to get user info" });
  }
});

const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  plan: z.enum(["starter", "professional", "institution"]).default("starter"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  notes: z.string().optional(),
});

const createDomainSchema = z.object({
  hostname: z.string().min(1, "Hostname is required"),
  isPrimary: z.boolean().default(false),
  isSubdomain: z.boolean().default(false),
});

const createTenantUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

router.get("/tenants", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const allTenants = await storage.getAllTenants();
    
    const tenantsWithDetails = await Promise.all(
      allTenants.map(async (tenant) => {
        const domainsList = await storage.getDomainsByTenant(tenant.id);
        const usersList = await storage.getUsersByTenant(tenant.id);
        const profile = await storage.getResearcherProfileByTenant(tenant.id);
        
        return {
          ...tenant,
          domains: domainsList,
          users: usersList,
          profile: profile || null,
        };
      })
    );

    return res.json({ tenants: tenantsWithDetails });
  } catch (error) {
    console.error("Get tenants error:", error);
    return res.status(500).json({ message: "Failed to fetch tenants" });
  }
});

router.get("/tenants/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const domainsList = await storage.getDomainsByTenant(tenant.id);
    const usersList = await storage.getUsersByTenant(tenant.id);
    const profile = await storage.getResearcherProfileByTenant(tenant.id);

    return res.json({
      tenant: {
        ...tenant,
        domains: domainsList,
        users: usersList,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error("Get tenant error:", error);
    return res.status(500).json({ message: "Failed to fetch tenant" });
  }
});

router.post("/tenants", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const validatedData = createTenantSchema.parse(req.body);

    const tenant = await storage.createTenant({
      ...validatedData,
      status: "pending" as TenantStatus,
      plan: validatedData.plan as PlanType,
      syncFrequency: validatedData.plan === "institution" ? "daily" : validatedData.plan === "professional" ? "weekly" : "monthly",
    });

    await storage.upsertResearcherProfile({
      tenantId: tenant.id,
      openalexId: undefined,
      displayName: validatedData.name,
      isPublic: false,
    });

    return res.status(201).json({
      message: "Tenant created successfully",
      tenant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create tenant error:", error);
    return res.status(500).json({ message: "Failed to create tenant" });
  }
});

router.patch("/tenants/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      plan: z.enum(["starter", "professional", "institution"]).optional(),
      status: z.enum(["active", "suspended", "cancelled", "pending"]).optional(),
      contactEmail: z.string().email().optional().nullable(),
      primaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      logoUrl: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      subscriptionStartDate: z.string().optional().nullable(),
      subscriptionEndDate: z.string().optional().nullable(),
    });

    const validatedData = updateSchema.parse(req.body);

    const updateData: any = { ...validatedData };
    if (validatedData.plan) {
      updateData.syncFrequency = validatedData.plan === "institution" ? "daily" : validatedData.plan === "professional" ? "weekly" : "monthly";
    }
    if (validatedData.subscriptionStartDate) {
      updateData.subscriptionStartDate = new Date(validatedData.subscriptionStartDate);
    }
    if (validatedData.subscriptionEndDate) {
      updateData.subscriptionEndDate = new Date(validatedData.subscriptionEndDate);
    }

    const tenant = await storage.updateTenant(req.params.id, updateData);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    return res.json({
      message: "Tenant updated",
      tenant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update tenant error:", error);
    return res.status(500).json({ message: "Failed to update tenant" });
  }
});

router.delete("/tenants/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    await storage.deleteTenant(req.params.id);

    return res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Delete tenant error:", error);
    return res.status(500).json({ message: "Failed to delete tenant" });
  }
});

router.post("/tenants/:id/domains", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const validatedData = createDomainSchema.parse(req.body);

    const existingDomain = await storage.getDomainByHostname(validatedData.hostname);
    if (existingDomain) {
      return res.status(400).json({ message: "Domain already exists" });
    }

    if (validatedData.isPrimary) {
      const existingDomains = await storage.getDomainsByTenant(req.params.id);
      for (const d of existingDomains) {
        if (d.isPrimary) {
          await storage.updateDomain(d.id, { isPrimary: false });
        }
      }
    }

    const domain = await storage.createDomain({
      tenantId: req.params.id,
      ...validatedData,
    });

    return res.status(201).json({
      message: "Domain added",
      domain,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Add domain error:", error);
    return res.status(500).json({ message: "Failed to add domain" });
  }
});

router.delete("/tenants/:tenantId/domains/:domainId", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const domain = await storage.getDomain(req.params.domainId);
    if (!domain || domain.tenantId !== req.params.tenantId) {
      return res.status(404).json({ message: "Domain not found" });
    }

    await storage.deleteDomain(req.params.domainId);

    return res.json({ message: "Domain deleted" });
  } catch (error) {
    console.error("Delete domain error:", error);
    return res.status(500).json({ message: "Failed to delete domain" });
  }
});

router.post("/tenants/:id/users", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const validatedData = createTenantUserSchema.parse(req.body);

    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    const user = await storage.createUser({
      tenantId: req.params.id,
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: "researcher",
      isActive: true,
    });

    const { passwordHash: _, ...safeUser } = user;

    return res.status(201).json({
      message: "User created",
      user: safeUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create tenant user error:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
});

router.patch("/tenants/:id/profile", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const updateProfileSchema = z.object({
      openalexId: z.string().optional().nullable(),
    });

    const validatedData = updateProfileSchema.parse(req.body);

    const profile = await storage.updateTenantProfile(req.params.id, {
      openalexId: validatedData.openalexId || null,
    });

    return res.json({
      message: "Profile updated",
      profile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

router.post("/tenants/:id/activate", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const domainsList = await storage.getDomainsByTenant(req.params.id);
    if (domainsList.length === 0) {
      return res.status(400).json({ message: "Add at least one domain before activating" });
    }

    const usersList = await storage.getUsersByTenant(req.params.id);
    if (usersList.length === 0) {
      return res.status(400).json({ message: "Create at least one user before activating" });
    }

    const updatedTenant = await storage.updateTenant(req.params.id, {
      status: "active" as TenantStatus,
      subscriptionStartDate: new Date(),
    });

    return res.json({
      message: "Tenant activated",
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error("Activate tenant error:", error);
    return res.status(500).json({ message: "Failed to activate tenant" });
  }
});

// Sync management endpoints
router.get("/sync/logs", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const logs = getSyncLogs();
    return res.json({ logs });
  } catch (error) {
    console.error("Get sync logs error:", error);
    return res.status(500).json({ message: "Failed to get sync logs" });
  }
});

router.post("/sync/run", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await runScheduledSync();
    return res.json({
      message: "Scheduled sync completed",
      stats,
    });
  } catch (error) {
    console.error("Run sync error:", error);
    return res.status(500).json({ message: "Failed to run sync" });
  }
});

router.post("/tenants/:id/sync", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const log = await forceSyncTenant(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    return res.json({
      message: log.status === 'success' ? 'Sync completed successfully' : log.message,
      log,
    });
  } catch (error) {
    console.error("Force sync error:", error);
    return res.status(500).json({ message: "Failed to sync tenant" });
  }
});

export default router;
