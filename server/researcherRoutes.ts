import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import { storage } from "./storage";
import { OpenAlexService } from "./services/openalexApi";
import type { Request, Response } from "express";

const router = Router();
const openalexService = new OpenAlexService();

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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

    // Actually fetch data from OpenAlex and cache it
    await openalexService.syncResearcherData(tenant.profile.openalexId);

    // Update the last synced timestamp
    const profile = await storage.updateTenantProfile(user.tenantId, {
      lastSyncedAt: new Date(),
    });

    res.json({ profile, message: "Sync completed - your data has been refreshed from OpenAlex" });
  } catch (error: any) {
    console.error("Error syncing profile:", error);
    res.status(500).json({ message: "Failed to sync profile" });
  }
});

router.post("/upload-photo", isAuthenticated, uploadImage.single('photo'), async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!storageBucketId) {
      return res.status(500).json({ message: "Object storage not configured" });
    }

    const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });
    
    const fileExtension = req.file.mimetype.split('/')[1];
    const filename = `public/profile-images/${user.tenantId}-profile-${Date.now()}.${fileExtension}`;

    const uploadResult = await objectStorage.uploadFromBytes(filename, req.file.buffer);
    
    if (!uploadResult.ok) {
      console.error('Object storage upload error:', uploadResult.error);
      return res.status(500).json({ message: "Failed to upload file to storage" });
    }

    const publicPath = filename.replace('public/', '');
    const profileImageUrl = `/public-objects/${publicPath}`;

    await storage.updateTenantProfile(user.tenantId, {
      profileImageUrl: profileImageUrl,
    });

    res.json({ 
      message: "Profile photo uploaded successfully",
      profileImageUrl: profileImageUrl,
    });
  } catch (error: any) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({ message: "Failed to upload profile photo" });
  }
});

export default router;
