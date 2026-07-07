import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { storage } from "./storage";
import { OpenAlexService } from "./services/openalexApi";
import { registerUserSchema, loginUserSchema, forgotPasswordSchema, resetPasswordSchema, type SafeUser, type UserRole } from "@shared/schema";
import { z } from "zod";
import { renderEmailHtml } from "./emailTemplates";

const router = Router();
const openalexService = new OpenAlexService();

// ─── Rate limiting ──────────────────────────────────────────────────────────
// Same in-memory per-IP sliding-window pattern already used in server/routes.ts
// for admin/public-write endpoints; kept local here to avoid a circular import
// (routes.ts imports authRouter from this file).
function createIpRateLimit(windowMs: number, maxRequests: number, label: string) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of Array.from(requests.entries())) {
      if (now > data.resetTime) requests.delete(ip);
    }
  }, 60 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || "unknown";
    const now = Date.now();

    const clientData = requests.get(clientIP);
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientIP, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (clientData.count >= maxRequests) {
      console.warn(`${label} rate limit exceeded for IP ${clientIP}`);
      return res.status(429).json({ message: "Too many attempts. Please try again later." });
    }

    clientData.count++;
    next();
  };
}

const loginRateLimit = createIpRateLimit(15 * 60 * 1000, 15, "Login");
const registerRateLimit = createIpRateLimit(15 * 60 * 1000, 8, "Registration");

// ─── Email helper ───────────────────────────────────────────────────────────

function createTransporter() {
  if (!process.env.SMTP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.scholar.name",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
    auth: {
      user: process.env.SMTP_USER || "noreply@scholar.name",
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
}

async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    // Surface this instead of silently no-op'ing: a missing SMTP_PASSWORD used to
    // look identical to a successfully-sent email in the logs — neither logged anything.
    console.error(`[auth] SMTP not configured (SMTP_PASSWORD unset) — email to ${to} ("${subject}") was not sent`);
    return;
  }
  const from = `"Scholar.name" <${process.env.SMTP_USER || "noreply@scholar.name"}>`;
  await transporter.sendMail({ from, to, subject, text, html });
}

async function sendSignupEmail(email: string, firstName: string, verificationToken: string): Promise<void> {
  const baseUrl = process.env.BASE_URL || "https://scholar.name";
  const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  await sendEmail(
    email,
    "Welcome to Scholar.name — please verify your email",
    [
      `Hi ${firstName},`,
      "",
      "Welcome to Scholar.name! Please verify your email address:",
      verifyUrl,
      "",
      "This link expires in 24 hours. If you didn't sign up, you can ignore this email.",
      "",
      "Once verified, log in to connect your OpenAlex profile and publish your portfolio.",
      "",
      "Log in at: https://scholar.name/dashboard/login",
      "",
      "The Scholar.name team",
    ].join("\n"),
    renderEmailHtml({
      preheader: "Please verify your email to activate your Scholar.name portfolio.",
      heading: `Welcome, ${firstName}!`,
      bodyHtml: `
        <p style="margin:0 0 14px;">Welcome to Scholar.name! Please verify your email address to activate your account.</p>
        <p style="margin:0;">This link expires in 24 hours. If you didn't sign up, you can ignore this email. Once verified, log in to connect your OpenAlex profile and publish your portfolio.</p>
      `,
      ctaLabel: "Verify my email",
      ctaUrl: verifyUrl,
    }),
  );
}

async function sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
  const baseUrl = process.env.BASE_URL || "https://scholar.name";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  await sendEmail(
    email,
    "Reset your Scholar.name password",
    [
      `Hi ${firstName},`,
      "",
      "You requested a password reset. Click the link below to set a new password:",
      resetUrl,
      "",
      "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
      "",
      "The Scholar.name team",
    ].join("\n"),
    renderEmailHtml({
      preheader: "Reset your Scholar.name password.",
      heading: `Reset your password, ${firstName}`,
      bodyHtml: `
        <p style="margin:0 0 14px;">You requested a password reset. Click the button below to set a new password.</p>
        <p style="margin:0;">This link expires in 1 hour. If you did not request a reset, you can safely ignore this email.</p>
      `,
      ctaLabel: "Reset my password",
      ctaUrl: resetUrl,
    }),
  );
}

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

router.post("/register", registerRateLimit, async (req: Request, res: Response) => {
  try {
    const validatedData = registerUserSchema.parse(req.body);

    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (validatedData.openalexId) {
      const claimedProfile = await storage.getResearcherProfileByOpenalexId(validatedData.openalexId);
      if (claimedProfile && claimedProfile.tenantId) {
        return res.status(400).json({ message: "This researcher profile is already registered. Try logging in instead." });
      }
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await storage.createUser({
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: "researcher",
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: verificationExpiry,
    });

    // Send welcome/verification email asynchronously (non-blocking)
    sendSignupEmail(validatedData.email, validatedData.firstName, verificationToken).catch((err) =>
      console.error("[auth] Failed to send signup email:", err)
    );

    const tenant = await storage.createTrialTenant(user.id, validatedData.firstName, validatedData.lastName || "", validatedData.email, {
      openalexId: validatedData.openalexId,
      affiliation: validatedData.affiliation,
    });

    if (validatedData.openalexId) {
      openalexService.syncResearcherData(validatedData.openalexId)
        .then(() => storage.updateTenantProfile(tenant.id, { lastSyncedAt: new Date() }))
        .catch((err) => console.error("[auth] Failed to sync OpenAlex data after signup:", err));
    }

    // Set session data directly (session.regenerate can cause issues with some session stores)
    req.session.userId = user.id;
    req.session.userRole = user.role as UserRole;
    req.session.isAuthenticated = true;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error after register:", err);
        return res.status(500).json({ message: "Registration failed" });
      }
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

router.post("/login", loginRateLimit, async (req: Request, res: Response) => {
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

    // Set session data directly - regenerate can cause issues with some session stores
    req.session.userId = user.id;
    req.session.userRole = user.role as UserRole;
    req.session.isAuthenticated = true;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
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
      profileImageUrl: z.string().url().optional().nullable().or(z.literal("")),
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

    // Use session.save (not regenerate) — regenerate fails with pg session store in production
    req.session.userId = userId;
    req.session.userRole = user.role as UserRole;
    req.session.isAuthenticated = true;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error after password change:", err);
        return res.status(500).json({ message: "Failed to update password" });
      }
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

// ─── Forgot password ────────────────────────────────────────────────────────

router.post("/forgot-password", registerRateLimit, async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await storage.getUserByEmail(email);

    // Always respond 200 to prevent email enumeration
    if (!user || !user.isActive) {
      return res.json({ message: "If that email is registered, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await storage.createPasswordResetToken(user.id, token, expiresAt);

    sendPasswordResetEmail(email, user.firstName || "there", token).catch((err) =>
      console.error("[auth] Failed to send password reset email:", err)
    );

    return res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
});

// ─── Reset password ──────────────────────────────────────────────────────────

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const resetToken = await storage.getPasswordResetToken(token);
    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }
    if (resetToken.usedAt) {
      return res.status(400).json({ message: "This reset link has already been used." });
    }
    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(resetToken.userId, { passwordHash: newPasswordHash });
    await storage.markPasswordResetTokenUsed(token);

    return res.json({ message: "Password updated successfully. You can now log in." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

// ─── Send/resend verification email ─────────────────────────────────────────

router.post("/send-verification", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerifiedAt) return res.json({ message: "Email already verified." });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await storage.setEmailVerificationToken(user.id, token, expiresAt);

    sendSignupEmail(user.email, user.firstName || "there", token).catch((err) =>
      console.error("[auth] Failed to send verification email:", err)
    );

    return res.json({ message: "Verification email sent." });
  } catch (error) {
    console.error("Send verification error:", error);
    return res.status(500).json({ message: "Failed to send verification email" });
  }
});

// ─── Verify email ────────────────────────────────────────────────────────────

router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const user = await storage.verifyEmailWithToken(token);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    return res.json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Failed to verify email" });
  }
});

export const authRouter = router;
