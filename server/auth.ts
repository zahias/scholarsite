import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema, type SafeUser, type UserRole } from "@shared/schema";
import { z } from "zod";

const router = Router();

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: UserRole;
    isAuthenticated?: boolean;
  }
}

function toSafeUser(user: any): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser as SafeUser;
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId && req.session?.isAuthenticated) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId && req.session?.isAuthenticated && req.session?.userRole === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
}

export async function getCurrentUser(req: Request): Promise<SafeUser | null> {
  if (!req.session?.userId) {
    return null;
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isActive) {
    return null;
  }
  return toSafeUser(user);
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const validatedData = registerUserSchema.parse(req.body);

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
      role: "researcher",
    });

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Registration failed" });
      }
      
      req.session.userId = user.id;
      req.session.userRole = user.role as UserRole;
      req.session.isAuthenticated = true;

      return res.status(201).json({
        message: "Registration successful",
        user: toSafeUser(user),
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = loginUserSchema.parse(req.body);

    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    if (user.passwordHash === "NEEDS_RESET") {
      return res.status(403).json({ 
        message: "Password reset required. Please contact administrator.",
        requiresReset: true 
      });
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      
      req.session.userId = user.id;
      req.session.userRole = user.role as UserRole;
      req.session.isAuthenticated = true;

      return res.json({
        message: "Login successful",
        user: toSafeUser(user),
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

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

router.get("/me", async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Failed to get user info" });
  }
});

router.patch("/profile", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    const updateSchema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      profileImageUrl: z.string().url().optional().nullable(),
    });

    const validatedData = updateSchema.parse(req.body);

    const updatedUser = await storage.updateUser(userId, validatedData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Profile updated",
      user: toSafeUser(updatedUser),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

router.patch("/password", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;

    const passwordSchema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });

    const { currentPassword, newPassword } = passwordSchema.parse(req.body);

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(userId, { passwordHash: newPasswordHash });

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error after password change:", err);
      }
      req.session.userId = userId;
      req.session.userRole = user.role as UserRole;
      req.session.isAuthenticated = true;
      return res.json({ message: "Password updated successfully" });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Password update error:", error);
    return res.status(500).json({ message: "Failed to update password" });
  }
});

export const authRouter = router;
