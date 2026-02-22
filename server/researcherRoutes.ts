import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import { storage } from "./storage";
import { OpenAlexService } from "./services/openalexApi";
import type { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";

const router = Router();
const openalexService = new OpenAlexService();

// Local file storage helper for when object storage is not configured
async function saveFileLocally(filename: string, buffer: Buffer): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public');
  const fullPath = path.join(publicDir, filename);
  const dir = path.dirname(fullPath);
  
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, buffer);
  
  return `/${filename}`;
}

async function deleteFileLocally(filename: string): Promise<void> {
  const publicDir = path.join(process.cwd(), 'public');
  const fullPath = path.join(publicDir, filename);
  try {
    await fs.unlink(fullPath);
  } catch (e) {
    // File may not exist, ignore
  }
}

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
  orcidUrl: z.string().nullable().optional(),
  googleScholarUrl: z.string().nullable().optional(),
  researchGateUrl: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  twitterUrl: z.string().nullable().optional(),
  // Phase 1 additions
  isPublic: z.boolean().optional(),
  cvUrl: z.string().nullable().optional(),
  selectedThemeId: z.string().nullable().optional(),
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

    const fileExtension = req.file.mimetype.split('/')[1];
    const filename = `uploads/profile-images/${user.tenantId}-profile-${Date.now()}.${fileExtension}`;
    let profileImageUrl: string;

    const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (storageBucketId) {
      // Use object storage (Replit)
      const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });
      const objectFilename = `public/profile-images/${user.tenantId}-profile-${Date.now()}.${fileExtension}`;

      const uploadResult = await objectStorage.uploadFromBytes(objectFilename, req.file.buffer);
      
      if (!uploadResult.ok) {
        console.error('Object storage upload error:', uploadResult.error);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }

      const publicPath = objectFilename.replace('public/', '');
      profileImageUrl = `/public-objects/${publicPath}`;
    } else {
      // Use local filesystem (A2 Hosting)
      profileImageUrl = await saveFileLocally(filename, req.file.buffer);
    }

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

// CV/Resume upload with PDF support
const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
});

router.post("/upload-cv", isAuthenticated, uploadDocument.single('cv'), async (req: Request, res: Response) => {
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

    // Determine file extension from mimetype
    let fileExtension = 'pdf';
    if (req.file.mimetype === 'application/msword') {
      fileExtension = 'doc';
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileExtension = 'docx';
    }

    const filename = `uploads/cv-documents/${user.tenantId}-cv-${Date.now()}.${fileExtension}`;
    let cvUrl: string;

    const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (storageBucketId) {
      // Use object storage (Replit)
      const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });
      const objectFilename = `public/cv-documents/${user.tenantId}-cv-${Date.now()}.${fileExtension}`;

      const uploadResult = await objectStorage.uploadFromBytes(objectFilename, req.file.buffer);
      
      if (!uploadResult.ok) {
        console.error('Object storage upload error:', uploadResult.error);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }

      const publicPath = objectFilename.replace('public/', '');
      cvUrl = `/public-objects/${publicPath}`;
    } else {
      // Use local filesystem (A2 Hosting)
      cvUrl = await saveFileLocally(filename, req.file.buffer);
    }

    await storage.updateTenantProfile(user.tenantId, {
      cvUrl: cvUrl,
    });

    res.json({ 
      message: "CV uploaded successfully",
      cvUrl: cvUrl,
    });
  } catch (error: any) {
    console.error("Error uploading CV:", error);
    res.status(500).json({ message: "Failed to upload CV" });
  }
});

// Delete CV
router.delete("/cv", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    await storage.updateTenantProfile(user.tenantId, {
      cvUrl: null,
    });

    res.json({ message: "CV removed successfully" });
  } catch (error: any) {
    console.error("Error removing CV:", error);
    res.status(500).json({ message: "Failed to remove CV" });
  }
});

// ==========================================
// PUBLICATION FEATURING
// ==========================================

// Get all publications for the researcher
router.get("/publications", isAuthenticated, async (req: Request, res: Response) => {
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
      return res.status(400).json({ message: "No OpenAlex ID configured", publications: [] });
    }

    const publications = await storage.getPublicationsByOpenalexId(tenant.profile.openalexId);
    res.json({ publications });
  } catch (error: any) {
    console.error("Error getting publications:", error);
    res.status(500).json({ message: "Failed to get publications" });
  }
});

// Toggle publication featured status
router.patch("/publications/:publicationId/feature", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const { publicationId } = req.params;
    const { isFeatured } = req.body;

    if (typeof isFeatured !== 'boolean') {
      return res.status(400).json({ message: "isFeatured must be a boolean" });
    }

    // C2: Verify publication belongs to this user's researcher profile
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    const pub = await storage.getPublicationById(publicationId);
    if (!pub || !tenant?.profile?.openalexId || pub.openalexId !== tenant.profile.openalexId) {
      return res.status(403).json({ message: "Not authorized to modify this publication" });
    }

    const publication = await storage.updatePublicationFeatured(publicationId, isFeatured);
    res.json({ publication });
  } catch (error: any) {
    console.error("Error updating publication featured status:", error);
    res.status(500).json({ message: "Failed to update publication" });
  }
});

// Upload PDF for a publication
router.post("/publications/:publicationId/upload-pdf", isAuthenticated, uploadDocument.single('pdf'), async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const { publicationId } = req.params;

    // C2: Verify publication belongs to this user's researcher profile
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    const pub = await storage.getPublicationById(publicationId);
    if (!pub || !tenant?.profile?.openalexId || pub.openalexId !== tenant.profile.openalexId) {
      return res.status(403).json({ message: "Not authorized to modify this publication" });
    }

    const filename = `uploads/publication-pdfs/${user.tenantId}-${publicationId}-${Date.now()}.pdf`;
    let pdfUrl: string;

    const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (storageBucketId) {
      // Use object storage (Replit)
      const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });
      const objectFilename = `public/publication-pdfs/${user.tenantId}-${publicationId}-${Date.now()}.pdf`;

      const uploadResult = await objectStorage.uploadFromBytes(objectFilename, req.file.buffer);
      
      if (!uploadResult.ok) {
        console.error('Object storage upload error:', uploadResult.error);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }

      const publicPath = objectFilename.replace('public/', '');
      pdfUrl = `/public-objects/${publicPath}`;
    } else {
      // Use local filesystem (A2 Hosting)
      pdfUrl = await saveFileLocally(filename, req.file.buffer);
    }

    const publication = await storage.updatePublicationPdf(publicationId, pdfUrl);

    res.json({ 
      message: "PDF uploaded successfully",
      publication,
    });
  } catch (error: any) {
    console.error("Error uploading publication PDF:", error);
    res.status(500).json({ message: "Failed to upload PDF" });
  }
});

// Delete publication PDF
router.delete("/publications/:publicationId/pdf", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const { publicationId } = req.params;

    // C2: Verify publication belongs to this user's researcher profile
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    const pub = await storage.getPublicationById(publicationId);
    if (!pub || !tenant?.profile?.openalexId || pub.openalexId !== tenant.profile.openalexId) {
      return res.status(403).json({ message: "Not authorized to modify this publication" });
    }

    const publication = await storage.updatePublicationPdf(publicationId, null);

    res.json({ message: "PDF removed successfully", publication });
  } catch (error: any) {
    console.error("Error removing publication PDF:", error);
    res.status(500).json({ message: "Failed to remove PDF" });
  }
});

// ==========================================
// PROFILE SECTIONS CRUD
// ==========================================

// Get all profile sections
router.get("/sections", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const sections = await storage.getProfileSections(profile.id);
    res.json({ sections });
  } catch (error: any) {
    console.error("Error getting profile sections:", error);
    res.status(500).json({ message: "Failed to get profile sections" });
  }
});

// Create profile section
router.post("/sections", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { title, content, sectionType, sortOrder, isVisible } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const section = await storage.createProfileSection({
      profileId: profile.id,
      title,
      content,
      sectionType: sectionType || 'custom',
      sortOrder: sortOrder || 0,
      isVisible: isVisible !== false,
    });

    res.json({ section });
  } catch (error: any) {
    console.error("Error creating profile section:", error?.message || error);
    console.error("Error stack:", error?.stack);
    res.status(500).json({ message: "Failed to create profile section", error: error?.message });
  }
});

// Update profile section
router.patch("/sections/:sectionId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { sectionId } = req.params;

    // C2: Verify section belongs to this user's profile
    const existingSection = await storage.getProfileSectionById(sectionId);
    if (!existingSection || existingSection.profileId !== profile.id) {
      return res.status(403).json({ message: "Not authorized to modify this section" });
    }

    const { title, content, sectionType, sortOrder, isVisible } = req.body;

    const section = await storage.updateProfileSection(sectionId, {
      title,
      content,
      sectionType,
      sortOrder,
      isVisible,
    });

    res.json({ section });
  } catch (error: any) {
    console.error("Error updating profile section:", error);
    res.status(500).json({ message: "Failed to update profile section" });
  }
});

// Delete profile section
router.delete("/sections/:sectionId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { sectionId } = req.params;

    // C2: Verify section belongs to this user's profile
    const existingSection = await storage.getProfileSectionById(sectionId);
    if (!existingSection || existingSection.profileId !== profile.id) {
      return res.status(403).json({ message: "Not authorized to delete this section" });
    }

    await storage.deleteProfileSection(sectionId);

    res.json({ message: "Section deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting profile section:", error);
    res.status(500).json({ message: "Failed to delete profile section" });
  }
});

// Reorder profile sections
router.post("/sections/reorder", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { sectionIds } = req.body;

    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({ message: "sectionIds must be an array" });
    }

    // C2: Verify all sections belong to this user's profile
    const userSections = await storage.getProfileSections(profile.id);
    const userSectionIds = new Set(userSections.map(s => s.id));
    const unauthorized = sectionIds.filter((id: string) => !userSectionIds.has(id));
    if (unauthorized.length > 0) {
      return res.status(403).json({ message: "Not authorized to reorder these sections" });
    }

    await storage.reorderProfileSections(sectionIds);

    res.json({ message: "Sections reordered successfully" });
  } catch (error: any) {
    console.error("Error reordering sections:", error);
    res.status(500).json({ message: "Failed to reorder sections" });
  }
});

// ==========================================
// SYNC LOGS
// ==========================================

// Get sync logs for the researcher
router.get("/sync-logs", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }

    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const logs = await storage.getSyncLogs(profile.id);
    res.json({ logs });
  } catch (error: any) {
    console.error("Error getting sync logs:", error);
    res.status(500).json({ message: "Failed to get sync logs" });
  }
});

export default router;
