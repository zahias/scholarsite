import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { isAdmin, isAuthenticated } from "./auth";
import { z } from "zod";
import type { UserRole } from "@shared/schema";

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
    const allUsers = await storage.getAllUsers();
    const admins = allUsers.filter(u => u.role === "admin");
    const researchers = allUsers.filter(u => u.role === "researcher");
    const activeUsers = allUsers.filter(u => u.isActive);
    
    return res.json({
      stats: {
        totalUsers: allUsers.length,
        adminCount: admins.length,
        researcherCount: researchers.length,
        activeUserCount: activeUsers.length,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ message: "Failed to get stats" });
  }
});

// Comprehensive analytics endpoint
router.get("/analytics", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const [allUsers, allTenants] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllTenants(),
    ]);

    // User breakdown
    const usersByRole = {
      admin: allUsers.filter(u => u.role === "admin").length,
      researcher: allUsers.filter(u => u.role === "researcher").length,
    };

    const activeUsers = allUsers.filter(u => u.isActive).length;
    const inactiveUsers = allUsers.length - activeUsers;

    // Tenant breakdown
    const tenantsByStatus = {
      active: allTenants.filter(t => t.status === "active").length,
      pending: allTenants.filter(t => t.status === "pending").length,
      suspended: allTenants.filter(t => t.status === "suspended").length,
      cancelled: allTenants.filter(t => t.status === "cancelled").length,
    };

    const tenantsByPlan = {
      starter: allTenants.filter(t => t.plan === "starter").length,
      professional: allTenants.filter(t => t.plan === "professional").length,
      institution: allTenants.filter(t => t.plan === "institution").length,
    };

    // Calculate growth - users/tenants created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersThisMonth = allUsers.filter(u => 
      u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo
    ).length;

    const newTenantsThisMonth = allTenants.filter(t => 
      t.createdAt && new Date(t.createdAt) >= thirtyDaysAgo
    ).length;

    // Tenants with OpenAlex connected
    const tenantsWithOpenAlex = allTenants.filter(t => {
      // This would need to check the profile, but we don't have that data here
      return true; // Placeholder
    }).length;

    return res.json({
      analytics: {
        users: {
          total: allUsers.length,
          byRole: usersByRole,
          active: activeUsers,
          inactive: inactiveUsers,
          newThisMonth: newUsersThisMonth,
        },
        tenants: {
          total: allTenants.length,
          byStatus: tenantsByStatus,
          byPlan: tenantsByPlan,
          newThisMonth: newTenantsThisMonth,
        },
        overview: {
          totalUsers: allUsers.length,
          totalTenants: allTenants.length,
          activeTenants: tenantsByStatus.active,
          activeUsers: activeUsers,
        },
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return res.status(500).json({ message: "Failed to get analytics" });
  }
});

export const adminRouter = router;
