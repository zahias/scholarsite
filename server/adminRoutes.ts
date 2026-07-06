import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { isAdmin, isAuthenticated } from "./auth";
import { z } from "zod";
import type { UserRole } from "@shared/schema";
import { db } from "./db";
import { users, tenants } from "@shared/schema";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/users", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    return res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Failed to get users" });
  }
});

router.get("/users/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { passwordHash, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Failed to get user" });
  }
});

router.patch("/users/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const updateSchema = z.object({
      email: z.string().email().optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      role: z.enum(["admin", "researcher"]).optional(),
      isActive: z.boolean().optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    if (req.params.id === req.session.userId && validatedData.role && validatedData.role !== "admin") {
      return res.status(400).json({ message: "Cannot demote yourself" });
    }

    if (req.params.id === req.session.userId && validatedData.isActive === false) {
      return res.status(400).json({ message: "Cannot deactivate yourself" });
    }

    const updatedUser = await storage.updateUser(req.params.id, validatedData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { passwordHash, ...safeUser } = updatedUser;
    return res.json({
      message: "User updated",
      user: safeUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
});

router.post("/users/:id/reset-password", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const passwordSchema = z.object({
      newPassword: z.string().min(8),
    });

    const { newPassword } = passwordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updatedUser = await storage.updateUser(req.params.id, { passwordHash });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

router.delete("/users/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    if (req.params.id === req.session.userId) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await storage.deleteUser(req.params.id);
    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

router.post("/users", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const createSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      role: z.enum(["admin", "researcher"]).default("researcher"),
    });

    const validatedData = createSchema.parse(req.body);

    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    const user = await storage.createUser({
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: validatedData.role as UserRole,
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
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
});

router.get("/stats", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const statsQuery = await db.select({
      totalUsers: sql<number>`count(*)`,
      adminCount: sql<number>`count(*) filter (where ${users.role} = 'admin')`,
      researcherCount: sql<number>`count(*) filter (where ${users.role} = 'researcher')`,
      activeUserCount: sql<number>`count(*) filter (where ${users.isActive} = true)`,
    }).from(users);

    return res.json({
      stats: {
        totalUsers: Number(statsQuery[0].totalUsers) || 0,
        adminCount: Number(statsQuery[0].adminCount) || 0,
        researcherCount: Number(statsQuery[0].researcherCount) || 0,
        activeUserCount: Number(statsQuery[0].activeUserCount) || 0,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ message: "Failed to get stats" });
  }
});

router.get("/legacy-profile-audit", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      SELECT
        rp.id,
        rp.openalex_id AS "openalexId",
        rp.display_name AS "displayName",
        rp.email,
        rp.tenant_id AS "tenantId",
        CASE
          WHEN rp.tenant_id IS NULL THEN 'missing_tenant_link'
          WHEN t.id IS NULL THEN 'missing_tenant'
          WHEN d.domain_count = 0 THEN 'missing_domain'
          ELSE 'linked'
        END AS issue
      FROM researcher_profiles rp
      LEFT JOIN tenants t ON t.id = rp.tenant_id
      LEFT JOIN LATERAL (
        SELECT count(*)::integer AS domain_count
        FROM domains
        WHERE domains.tenant_id = rp.tenant_id
      ) d ON true
      WHERE rp.tenant_id IS NULL OR t.id IS NULL OR d.domain_count = 0
      ORDER BY rp.created_at ASC NULLS FIRST, rp.id ASC
    `);
    const records = (result as any).rows || result;
    const summary = records.reduce((counts: Record<string, number>, record: any) => {
      counts[record.issue] = (counts[record.issue] || 0) + 1;
      return counts;
    }, {});
    return res.json({ summary, records });
  } catch (error) {
    console.error("Legacy profile audit error:", error);
    return res.status(500).json({ message: "Failed to audit legacy profiles" });
  }
});

// Comprehensive analytics endpoint
router.get("/analytics", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const [userStatsList, tenantStatsList] = await Promise.all([
      db.select({
        total: sql<number>`count(*)`,
        admin: sql<number>`count(*) filter (where ${users.role} = 'admin')`,
        researcher: sql<number>`count(*) filter (where ${users.role} = 'researcher')`,
        active: sql<number>`count(*) filter (where ${users.isActive} = true)`,
        newThisMonth: sql<number>`count(*) filter (where ${users.createdAt} >= now() - interval '30 days')`,
      }).from(users),

      db.select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${tenants.status} = 'active')`,
        pending: sql<number>`count(*) filter (where ${tenants.status} = 'pending')`,
        suspended: sql<number>`count(*) filter (where ${tenants.status} = 'suspended')`,
        cancelled: sql<number>`count(*) filter (where ${tenants.status} = 'cancelled')`,
        starter: sql<number>`count(*) filter (where ${tenants.plan} = 'starter')`,
        professional: sql<number>`count(*) filter (where ${tenants.plan} = 'professional')`,
        institution: sql<number>`count(*) filter (where ${tenants.plan} = 'institution')`,
        newThisMonth: sql<number>`count(*) filter (where ${tenants.createdAt} >= now() - interval '30 days')`,
      }).from(tenants),
    ]);

    const userStats = userStatsList[0];
    const tenantStats = tenantStatsList[0];

    return res.json({
      analytics: {
        users: {
          total: Number(userStats.total) || 0,
          byRole: {
            admin: Number(userStats.admin) || 0,
            researcher: Number(userStats.researcher) || 0,
          },
          active: Number(userStats.active) || 0,
          inactive: (Number(userStats.total) || 0) - (Number(userStats.active) || 0),
          newThisMonth: Number(userStats.newThisMonth) || 0,
        },
        tenants: {
          total: Number(tenantStats.total) || 0,
          byStatus: {
            active: Number(tenantStats.active) || 0,
            pending: Number(tenantStats.pending) || 0,
            suspended: Number(tenantStats.suspended) || 0,
            cancelled: Number(tenantStats.cancelled) || 0,
          },
          byPlan: {
            starter: Number(tenantStats.starter) || 0,
            professional: Number(tenantStats.professional) || 0,
            institution: Number(tenantStats.institution) || 0,
          },
          newThisMonth: Number(tenantStats.newThisMonth) || 0,
        },
        overview: {
          totalUsers: Number(userStats.total) || 0,
          totalTenants: Number(tenantStats.total) || 0,
          activeTenants: Number(tenantStats.active) || 0,
          activeUsers: Number(userStats.active) || 0,
        },
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return res.status(500).json({ message: "Failed to get analytics" });
  }
});

router.get("/payments", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const payments = await storage.getAllPayments();
    return res.json({ payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return res.status(500).json({ message: "Failed to get payments" });
  }
});

const paymentStatusSchema = z.object({
  status: z.enum(["pending", "completed", "failed", "refunded", "cancelled"]),
});

// Manual override for stuck payments (e.g. a MontyPay webhook that never arrived).
// Reuses the same provisioning path the webhook uses, so marking "completed" here
// has the identical effect as a real successful webhook callback.
router.patch("/payments/:orderNumber/status", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = paymentStatusSchema.parse(req.body);
    const { orderNumber } = req.params;

    const existing = await storage.getPaymentByOrderNumber(orderNumber);
    if (!existing) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = await storage.updatePaymentStatus(orderNumber, status);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (status === "completed" && !payment.tenantId) {
      const tenant = await storage.provisionTenantFromPayment(payment.id);
      return res.json({ message: "Payment marked completed and tenant provisioned", payment, tenant });
    }

    return res.json({ message: "Payment status updated", payment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid status", errors: error.errors });
    }
    console.error("Update payment status error:", error);
    return res.status(500).json({ message: "Failed to update payment status" });
  }
});

export const adminRouter = router;
