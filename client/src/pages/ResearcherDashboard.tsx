import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GlobalFooter from "@/components/GlobalFooter";
import type { Theme } from "@shared/schema";
import {
  User,
  Globe,
  LogOut,
  Save,
  ExternalLink,
  BookOpen,
  Award,
  BarChart3,
  Palette,
  Settings,
  RefreshCw,
  Search,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  QrCode,
  Download,
  FileText,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Trash2,
  Star,
  GripVertical,
  Plus,
  Edit2,
  History,
  Clock,
  XCircle,
} from "lucide-react";

// ───── Types ─────

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerifiedAt: string | null;
}

interface TenantProfile {
  id: string;
  tenantId: string;
  openalexId: string | null;
  displayName: string | null;
  title: string | null;
  bio: string | null;
  lastName: string | null;
  customCss: string | null;
  socialLinks: Record<string, string> | null;
  featuredWorks: string[] | null;
  lastSyncedAt: string | null;
  profileImageUrl: string | null;
  orcidUrl: string | null;
  googleScholarUrl: string | null;
  researchGateUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  isPublic: boolean;
  cvUrl: string | null;
  selectedThemeId: string | null;
}

interface Domain {
  id: string;
  hostname: string;
  isPrimary: boolean;
}

interface TenantData {
  id: string;
  name: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  domains: Domain[];
  profile: TenantProfile | null;
}

interface Publication {
  id: string;
  openalexId: string;
  workId: string;
  title: string;
  authorNames: string | null;
  journal: string | null;
  publicationYear: number | null;
  citationCount: number;
  doi: string | null;
  isOpenAccess: boolean;
  publicationType: string | null;
  isFeatured: boolean;
  pdfUrl: string | null;
}

interface ProfileSection {
  id: string;
  profileId: string;
  title: string;
  content: string;
  sectionType: string;
  sortOrder: number;
  isVisible: boolean;
}

interface SyncLog {
  id: string;
  tenantId: string | null;
  profileId: string | null;
  syncType: string;
  status: string;
  itemsProcessed: number;
  itemsTotal: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface OpenAlexAuthor {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  affiliations?: Array<{ institution: { display_name: string } }>;
  topics?: Array<{ display_name: string }>;
}

interface AuthorSearchResult {
  id: string;
  display_name: string;
  hint: string;
  works_count: number;
  cited_by_count: number;
}

interface SearchResponse {
  results: AuthorSearchResult[];
}

// ───── Consolidated profile form state ─────

interface ProfileFormState {
  displayName: string;
  title: string;
  bio: string;
  websiteUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  googleScholarUrl: string;
  orcidUrl: string;
  researchGateUrl: string;
}

const emptyProfileForm: ProfileFormState = {
  displayName: "",
  title: "",
  bio: "",
  websiteUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  googleScholarUrl: "",
  orcidUrl: "",
  researchGateUrl: "",
};

// ───── Component ─────

export default function ResearcherDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Consolidated profile form (CODE-1: replaces 9 separate useState hooks)
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const updateField = useCallback(
    (field: keyof ProfileFormState, value: string) =>
      setProfileForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const [openalexIdInput, setOpenalexIdInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OpenAlex author search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorSearchResult | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  // Section editing
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [sectionType, setSectionType] = useState("custom");

  // ───── Queries ─────

  const { data: userData, isLoading: userLoading } = useQuery<{
    user: CurrentUser;
  }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: tenantData, isLoading: tenantLoading } = useQuery<{
    tenant: TenantData;
  } | null>({
    queryKey: ["/api/researcher/my-tenant"],
    enabled: !!userData?.user,
    queryFn: async () => {
      const res = await fetch("/api/researcher/my-tenant", { credentials: "include" });
      if (res.status === 401 || res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
  });

  const {
    data: authorData,
    refetch: refetchAuthor,
  } = useQuery<OpenAlexAuthor>({
    queryKey: [
      "/api/openalex/author",
      tenantData?.tenant?.profile?.openalexId,
    ],
    enabled: !!tenantData?.tenant?.profile?.openalexId,
  });

  const { data: themesData } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
    enabled: activeTab === "settings",
  });

  // PERF-1: Lazy-load per active tab
  const { data: publicationsData } = useQuery<{
    publications: Publication[];
  }>({
    queryKey: ["/api/researcher/publications"],
    enabled:
      !!tenantData?.tenant?.profile?.openalexId &&
      activeTab === "publications",
  });

  const { data: sectionsData } = useQuery<{ sections: ProfileSection[] }>({
    queryKey: ["/api/researcher/sections"],
    enabled: !!tenantData?.tenant?.profile && activeTab === "sections",
  });

  const { data: syncLogsData, refetch: refetchSyncLogs } = useQuery<{
    logs: SyncLog[];
  }>({
    queryKey: ["/api/researcher/sync-logs"],
    enabled: !!tenantData?.tenant?.profile && activeTab === "sync",
  });

  // ───── Populate form from server data ─────

  useEffect(() => {
    if (tenantData?.tenant?.profile) {
      const p = tenantData.tenant.profile;
      setProfileForm({
        displayName: p.displayName || "",
        title: p.title || "",
        bio: p.bio || "",
        websiteUrl: p.websiteUrl || "",
        twitterUrl: p.twitterUrl || "",
        linkedinUrl: p.linkedinUrl || "",
        googleScholarUrl: p.googleScholarUrl || "",
        orcidUrl: p.orcidUrl || "",
        researchGateUrl: p.researchGateUrl || "",
      });
      setOpenalexIdInput(p.openalexId || "");
      setIsPublic(p.isPublic !== false);
      setSelectedThemeId(p.selectedThemeId || null);
    }
  }, [tenantData]);

  // ───── OpenAlex name search ─────

  // Pre-fill OpenAlex connect card if user selected an author during signup
  useEffect(() => {
    if (tenantData !== undefined && !tenantData?.tenant?.profile?.openalexId) {
      const pending = localStorage.getItem("pendingOpenalexConnect");
      if (pending) {
        try {
          const parsed = JSON.parse(pending) as AuthorSearchResult;
          handleSelectAuthor(parsed);
        } catch {
          localStorage.removeItem("pendingOpenalexConnect");
        }
      }
    }
  }, [tenantData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: isSearching } = useQuery<SearchResponse>({
    queryKey: ["/api/openalex/autocomplete", debouncedQuery],
    queryFn: async () => {
      const response = await fetch(
        `/api/openalex/autocomplete?q=${encodeURIComponent(debouncedQuery)}`
      );
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelectAuthor = useCallback((author: AuthorSearchResult) => {
    setSelectedAuthor(author);
    setOpenalexIdInput(author.id);
    setSearchQuery("");
    setShowResults(false);
  }, []);

  // ───── Mutations ─────

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      navigate("/dashboard/login");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<TenantProfile>) => {
      const response = await apiRequest(
        "PATCH",
        "/api/researcher/profile",
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Saved!",
        description: "Your profile has been updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/my-tenant"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/researcher/sync");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Synced!",
        description:
          "Your profile data has been refreshed from OpenAlex.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/my-tenant"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/publications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/sync-logs"],
      });
      refetchAuthor();
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const connectOpenAlexMutation = useMutation({
    mutationFn: async (authorId: string) => {
      const response = await apiRequest(
        "PATCH",
        "/api/researcher/profile",
        { openalexId: authorId },
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Connected!",
        description: "Your OpenAlex profile has been linked. Syncing publications...",
      });
      setSelectedAuthor(null);
      localStorage.removeItem("pendingOpenalexConnect");
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/my-tenant"],
      });
      refetchAuthor();
      // Auto-trigger a sync after connecting
      syncMutation.mutate();
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/send-verification");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Verification email sent", description: "Check your inbox and click the link to verify your email." });
    },
    onError: () => {
      toast({ title: "Failed to send email", description: "Please try again later.", variant: "destructive" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await fetch("/api/researcher/upload-photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload photo");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo Updated!",
        description: "Your profile photo has been uploaded.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/my-tenant"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadCvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("cv", file);
      const response = await fetch("/api/researcher/upload-cv", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload CV");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "CV Uploaded!",
        description: "Your CV has been uploaded successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/my-tenant"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCvMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/researcher/cv");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "CV Removed",
        description: "Your CV has been removed from your profile.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/my-tenant"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await apiRequest("PATCH", "/api/auth/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed!",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({
      publicationId,
      isFeatured,
    }: {
      publicationId: string;
      isFeatured: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/researcher/publications/${publicationId}/feature`,
        { isFeatured },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/publications"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // FUNC-1: Fixed endpoint — server registers /upload-pdf not /pdf
  const uploadPubPdfMutation = useMutation({
    mutationFn: async ({
      publicationId,
      file,
    }: {
      publicationId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("pdf", file);
      const response = await fetch(
        `/api/researcher/publications/${publicationId}/upload-pdf`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "PDF uploaded",
        description: "Publication PDF has been saved.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/publications"],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload PDF",
        variant: "destructive",
      });
    },
  });

  const deletePubPdfMutation = useMutation({
    mutationFn: async (publicationId: string) => {
      await apiRequest(
        "DELETE",
        `/api/researcher/publications/${publicationId}/pdf`,
      );
    },
    onSuccess: () => {
      toast({
        title: "PDF removed",
        description: "Publication PDF has been deleted.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/publications"],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove PDF",
        variant: "destructive",
      });
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      sectionType: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/researcher/sections",
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section Created!",
        description: "Your new section has been added.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/sections"],
      });
      setSectionTitle("");
      setSectionContent("");
      setSectionType("custom");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      content?: string;
      isVisible?: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/researcher/sections/${id}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section Updated!",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/sections"],
      });
      setEditingSectionId(null);
      setSectionTitle("");
      setSectionContent("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/researcher/sections/${sectionId}`,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section Deleted",
        description: "The section has been removed.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/researcher/sections"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ───── Handlers ─────

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        displayName: profileForm.displayName || null,
        title: profileForm.title || null,
        bio: profileForm.bio || null,
        websiteUrl: profileForm.websiteUrl || null,
        twitterUrl: profileForm.twitterUrl || null,
        linkedinUrl: profileForm.linkedinUrl || null,
        googleScholarUrl: profileForm.googleScholarUrl || null,
        orcidUrl: profileForm.orcidUrl || null,
        researchGateUrl: profileForm.researchGateUrl || null,
      } as Partial<TenantProfile>);
    } finally {
      setIsSaving(false);
    }
  }, [profileForm, updateProfileMutation]);

  const handlePhotoUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please choose an image under 5MB",
            variant: "destructive",
          });
          return;
        }
        uploadPhotoMutation.mutate(file);
      }
    },
    [toast, uploadPhotoMutation],
  );

  const handleCvUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please choose a document under 10MB",
            variant: "destructive",
          });
          return;
        }
        uploadCvMutation.mutate(file);
      }
    },
    [toast, uploadCvMutation],
  );

  const handlePasswordChange = useCallback(() => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  }, [
    currentPassword,
    newPassword,
    confirmPassword,
    toast,
    changePasswordMutation,
  ]);

  const handlePrivacyToggle = useCallback(
    async (newValue: boolean) => {
      setIsPublic(newValue);
      try {
        await updateProfileMutation.mutateAsync({ isPublic: newValue });
      } catch {
        setIsPublic(!newValue);
      }
    },
    [updateProfileMutation],
  );

  const handleThemeChange = useCallback(
    async (themeId: string) => {
      setSelectedThemeId(themeId);
      try {
        await updateProfileMutation.mutateAsync({
          selectedThemeId: themeId,
        });
      } catch {
        setSelectedThemeId(
          tenantData?.tenant?.profile?.selectedThemeId || null,
        );
      }
    },
    [updateProfileMutation, tenantData],
  );

  // ───── Style constants ─────

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 13px", fontSize: 14, fontFamily: "inherit",
    borderRadius: 9, border: "1px solid rgba(11,31,58,.14)", outline: "none",
    color: "#171C1F", background: "#fff", boxSizing: "border-box",
    transition: "border-color .15s",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 14, border: "1px solid rgba(11,31,58,.08)",
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "20px 24px 16px", borderBottom: "1px solid rgba(11,31,58,.06)",
  };

  const cardBodyStyle: React.CSSProperties = { padding: "20px 24px" };

  const cardTitleStyle: React.CSSProperties = {
    fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 500,
    color: "#0B1F3A", display: "flex", alignItems: "center", gap: 8, margin: 0,
  };

  const cardDescStyle: React.CSSProperties = {
    fontSize: 13.5, color: "#75777E", marginTop: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, color: "#0B1F3A", fontWeight: 500,
    display: "block", marginBottom: 6,
  };

  const btnPrimary = (disabled?: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 18px",
    background: disabled ? "rgba(255,199,46,.45)" : "#FFC72E",
    color: "#6F5400", border: "none", borderRadius: 9, fontSize: 14,
    fontWeight: 700, fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
  });

  const btnGhost = (disabled?: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 16px", background: "#fff", color: "#44474D",
    border: "1px solid rgba(11,31,58,.14)", borderRadius: 9, fontSize: 13.5,
    fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  const btnIcon = (danger?: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, background: "transparent",
    color: danger ? "#EF4444" : "#44474D",
    border: "none", borderRadius: 7, cursor: "pointer",
  });

  const chip = (color?: "green" | "amber" | "red" | "blue"): React.CSSProperties => {
    const map = {
      green: { background: "rgba(5,150,105,.1)", border: "1px solid rgba(5,150,105,.2)", color: "#065f46" },
      amber: { background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", color: "#92400e" },
      red: { background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#b91c1c" },
      blue: { background: "rgba(37,99,235,.1)", border: "1px solid rgba(37,99,235,.2)", color: "#1d4ed8" },
    };
    const base: React.CSSProperties = {
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500,
    };
    return color ? { ...base, ...map[color] } : {
      ...base,
      background: "rgba(11,31,58,.06)", border: "1px solid rgba(11,31,58,.1)", color: "#44474D",
    };
  };

  // ───── Loading / Auth guard ─────

  if (userLoading || tenantLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4F8", padding: "32px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 72, borderRadius: 14, background: "rgba(11,31,58,.06)", animation: "pulse 2s infinite" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 100, borderRadius: 14, background: "rgba(11,31,58,.06)", animation: "pulse 2s infinite" }} />
            ))}
          </div>
          <div style={{ height: 400, borderRadius: 14, background: "rgba(11,31,58,.06)", animation: "pulse 2s infinite" }} />
        </div>
      </div>
    );
  }

  if (!userData?.user) {
    navigate("/dashboard/login");
    return null;
  }

  if (!tenantLoading && !tenantData?.tenant) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 440, width: "100%", ...cardStyle, padding: "48px 40px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(11,31,58,.08)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <BookOpen size={28} style={{ color: "#0B1F3A" }} />
          </div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 500, color: "#0B1F3A", margin: "0 0 10px" }}>
            Activate your portfolio
          </h1>
          <p style={{ fontSize: 15, color: "#44474D", lineHeight: 1.6, margin: "0 0 28px" }}>
            Choose a plan to publish your Scholar.name portfolio and start showcasing your research.
          </p>
          <a href="/pricing" style={{ ...btnPrimary(), display: "inline-flex", textDecoration: "none" }}>
            View plans &amp; pricing
          </a>
        </div>
      </div>
    );
  }

  const tenant = tenantData?.tenant;
  const profile = tenant?.profile;
  const primaryDomain =
    tenant?.domains?.find((d) => d.isPrimary) || tenant?.domains?.[0];

  // ───── Tab definitions ─────
  const tabs = [
    { value: "profile", icon: User, label: "Profile" },
    { value: "publications", icon: BookOpen, label: "Publications" },
    { value: "sections", icon: FileText, label: "Sections" },
    { value: "sync", icon: History, label: "Sync" },
    { value: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", flexDirection: "column" }}>

      {/* ═══════ Header ═══════ */}
      <header style={{ background: "#fff", borderBottom: "1px solid rgba(11,31,58,.08)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: "#0B1F3A", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <BookOpen size={16} style={{ color: "#FFC72E" }} />
            </span>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 500, color: "#0B1F3A", letterSpacing: "-0.01em" }}>
              Scholar<span style={{ color: "#FFC72E" }}>.name</span>
            </span>
          </a>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {primaryDomain && (
              <a
                href={`https://${primaryDomain.hostname}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "none" }}
                className="dash-domain-link"
              >
                <Globe size={14} />
                {primaryDomain.hostname}
                <ExternalLink size={11} />
              </a>
            )}
            <style>{`
              @media (min-width: 640px) {
                .dash-domain-link { display: inline-flex !important; align-items: center; gap: 5px; font-size: 13px; color: #75777E; text-decoration: none; padding: 6px 10px; border-radius: 7px; border: 1px solid rgba(11,31,58,.1); }
                .dash-domain-link:hover { border-color: rgba(11,31,58,.2); color: #44474D; }
              }
            `}</style>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", color: "#44474D", border: "1px solid rgba(11,31,58,.12)", borderRadius: 8, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer" }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Email verification banner */}
      {userData.user && !userData.user.emailVerifiedAt && (
        <div style={{ background: "#FFF8E1", borderBottom: "1px solid #FFD600", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "#5D4037" }}>
            ✉️ Please verify your email address to secure your account.
          </span>
          <button
            onClick={() => resendVerificationMutation.mutate()}
            disabled={resendVerificationMutation.isPending}
            style={{ fontSize: 13, fontWeight: 600, color: "#0B1F3A", background: "transparent", border: "1px solid #0B1F3A", borderRadius: 6, padding: "3px 12px", cursor: "pointer" }}
          >
            {resendVerificationMutation.isPending ? "Sending…" : "Resend verification email"}
          </button>
        </div>
      )}

      {/* Trial countdown banner */}
      {tenant?.plan === "free" && tenant?.trialEndsAt && (() => {
        const trialEnd = new Date(tenant.trialEndsAt!);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) {
          return (
            <div style={{ background: "#FFF3E0", borderBottom: "1px solid #FF9800", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: "#E65100", fontWeight: 600 }}>
                🔔 Your free trial has ended. Choose a plan to keep your portfolio live.
              </span>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
                style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "#E65100", border: "none", borderRadius: 6, padding: "4px 14px", cursor: "pointer" }}
              >
                Choose a plan →
              </button>
            </div>
          );
        }
        if (daysLeft <= 7) {
          return (
            <div style={{ background: "#FFF8E1", borderBottom: "1px solid #FFC72E", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: "#5D4037" }}>
                ⏳ <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> left in your free trial.
              </span>
              <button
                onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
                style={{ fontSize: 13, fontWeight: 600, color: "#0B1F3A", background: "#FFC72E", border: "none", borderRadius: 6, padding: "4px 14px", cursor: "pointer" }}
              >
                Upgrade now →
              </button>
            </div>
          );
        }
        return (
          <div style={{ background: "rgba(11,31,58,.04)", borderBottom: "1px solid rgba(11,31,58,.08)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#44474D" }}>
              🎉 Free trial active — <strong>{daysLeft} days</strong> remaining.
            </span>
            <button
              onClick={() => { window.scrollTo(0, 0); navigate("/contact"); }}
              style={{ fontSize: 12, color: "#0B1F3A", background: "transparent", border: "1px solid rgba(11,31,58,.25)", borderRadius: 5, padding: "2px 10px", cursor: "pointer" }}
            >
              Upgrade
            </button>
          </div>
        );
      })()}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* ═══════ Personalized Greeting ═══════ */}
        <div>
          <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            Welcome back,{" "}
            <em>
              {profile?.displayName
                ? profile.displayName.split(" ").slice(-1)[0]
                : userData.user.firstName}.
            </em>
          </h2>
          <p style={{ fontSize: 14, color: "#75777E", margin: 0 }}>
            {authorData?.cited_by_count
              ? `Your portfolio has ${authorData.cited_by_count.toLocaleString()} total citations across ${authorData.works_count?.toLocaleString() || "your"} publications.`
              : "Your research portfolio is ready to grow."}
          </p>
        </div>

        {/* ═══════ Profile Completion Card ═══════ */}
        {(() => {
          const steps = [
            { done: !!profile?.openalexId, label: "Connect OpenAlex", href: "#openalex" },
            { done: !!(profile as any)?.bio, label: "Write your bio", href: "#profile" },
            { done: !!(profile as any)?.photoUrl, label: "Upload a photo", href: "#profile" },
            { done: !!(tenant?.domains && tenant.domains.length > 1), label: "Add a custom domain", href: "/dashboard/domains" },
          ];
          const score = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
          const nextStep = steps.find((s) => !s.done);
          return (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(11,31,58,.08)", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#75777E", fontWeight: 600 }}>Profile Completion</span>
                <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600, color: "#0B1F3A" }}>{score}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(11,31,58,.08)", overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", borderRadius: 99, background: "#FFC72E", width: `${score}%`, transition: "width .5s ease" }} />
              </div>
              {score < 100 && nextStep ? (
                <p style={{ fontSize: 13, color: "#75777E", margin: 0 }}>
                  Next:{" "}
                  <a href={nextStep.href} style={{ color: "#0B1F3A", fontWeight: 600, textDecoration: "none" }}>
                    {nextStep.label}
                  </a>
                  {" "}→ reach {Math.min(score + 25, 100)}%
                </p>
              ) : score === 100 ? (
                <p style={{ fontSize: 13, color: "#059669", fontWeight: 600, margin: 0 }}>Profile complete ✓</p>
              ) : null}
            </div>
          );
        })()}

        {/* ═══════ OpenAlex Connect OR Stats ═══════ */}
        {!profile?.openalexId ? (
          <div style={cardStyle} id="openalex">
            <div style={{ ...cardHeaderStyle, background: "rgba(251,191,36,.06)" }}>
              <div style={{ ...cardTitleStyle, fontSize: 17 }}>
                <Search size={17} style={{ color: "#B87A0A" }} />
                Connect Your OpenAlex Profile
              </div>
              <div style={cardDescStyle}>
                Search for your name to find and connect your OpenAlex author profile. This will import your publications, citations, and research topics automatically.
              </div>
            </div>
            <div style={cardBodyStyle}>
              {/* Name search */}
              <div style={{ position: "relative", marginBottom: 16 }} ref={searchRef}>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#75777E", pointerEvents: "none" }} />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); setSelectedAuthor(null); }}
                    onFocus={() => setShowResults(true)}
                    style={{ ...inputStyle, paddingLeft: 36 }}
                    data-testid="input-openalex-search"
                  />
                </div>

                {/* Dropdown results */}
                {showResults && debouncedQuery.length >= 2 && (
                  <div style={{ position: "absolute", zIndex: 50, width: "100%", marginTop: 4, background: "#fff", border: "1px solid rgba(11,31,58,.12)", borderRadius: 10, boxShadow: "0 8px 24px -8px rgba(11,31,58,.15)", maxHeight: 260, overflowY: "auto" }}>
                    {isSearching ? (
                      <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5, color: "#75777E" }}>
                        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        Searching...
                      </div>
                    ) : searchResults?.results?.length ? (
                      searchResults.results.map((author) => (
                        <button
                          key={author.id}
                          style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(11,31,58,.06)", cursor: "pointer", fontFamily: "inherit" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FA")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          onClick={() => handleSelectAuthor(author)}
                        >
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#0B1F3A", margin: "0 0 2px" }}>{author.display_name}</p>
                          <p style={{ fontSize: 12.5, color: "#75777E", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{author.hint}</p>
                          <p style={{ fontSize: 12, color: "#75777E", margin: 0 }}>
                            {author.works_count.toLocaleString()} works &middot; {author.cited_by_count.toLocaleString()} citations
                          </p>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: "16px", fontSize: 13.5, color: "#75777E", textAlign: "center" }}>
                        No researchers found for &ldquo;{debouncedQuery}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected author card */}
              {selectedAuthor && (
                <div style={{ border: "1px solid rgba(11,31,58,.1)", borderRadius: 10, padding: "16px", background: "#F8F9FA", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(11,31,58,.08)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <BookOpen size={18} style={{ color: "#0B1F3A" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#0B1F3A", margin: "0 0 2px" }}>{selectedAuthor.display_name}</p>
                      <p style={{ fontSize: 13, color: "#75777E", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedAuthor.hint}</p>
                      <div style={{ display: "flex", gap: 12, fontSize: 12.5, color: "#75777E" }}>
                        <span>{selectedAuthor.works_count.toLocaleString()} works</span>
                        <span>{selectedAuthor.cited_by_count.toLocaleString()} citations</span>
                      </div>
                    </div>
                    <button
                      onClick={() => connectOpenAlexMutation.mutate(selectedAuthor.id)}
                      disabled={connectOpenAlexMutation.isPending}
                      style={btnPrimary(connectOpenAlexMutation.isPending)}
                      data-testid="button-connect-openalex"
                    >
                      {connectOpenAlexMutation.isPending ? (
                        <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Connecting…</>
                      ) : "Connect"}
                    </button>
                  </div>
                </div>
              )}

              {!selectedAuthor && (
                <p style={{ fontSize: 13.5, color: "#75777E" }}>
                  Type your name above to search OpenAlex&apos;s database of researchers and their publications.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="dash-stats-grid">
              <style>{`@media (max-width: 560px) { .dash-stats-grid { grid-template-columns: 1fr !important; } }`}</style>
              {[
                { label: "Publications", value: authorData?.works_count?.toLocaleString() || "—", icon: BookOpen, iconBg: "rgba(37,99,235,.1)", iconColor: "#2563EB" },
                { label: "Citations", value: authorData?.cited_by_count?.toLocaleString() || "—", icon: BarChart3, iconBg: "rgba(5,150,105,.1)", iconColor: "#059669" },
                { label: "Status", value: tenant?.status === "active" ? "Live" : "Pending", icon: Award, iconBg: "rgba(139,92,246,.1)", iconColor: "#7c3aed" },
              ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
                <div key={label} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(11,31,58,.08)", padding: "20px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 13, color: "#75777E", margin: "0 0 4px" }}>{label}</p>
                      {label === "Status" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {tenant?.status === "active"
                            ? <><CheckCircle size={18} style={{ color: "#059669" }} /><span style={{ fontSize: 18, fontWeight: 600, color: "#059669", fontFamily: "'Newsreader', serif" }}>Live</span></>
                            : <><AlertCircle size={18} style={{ color: "#d97706" }} /><span style={{ fontSize: 18, fontWeight: 600, color: "#d97706", fontFamily: "'Newsreader', serif" }}>Pending</span></>
                          }
                        </div>
                      ) : (
                        <p style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: 0 }}>{value}</p>
                      )}
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: iconBg, display: "grid", placeItems: "center" }}>
                      <Icon size={22} style={{ color: iconColor }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* OpenAlex Badge Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ ...chip(), fontFamily: "monospace", fontSize: 11.5 }}>
                  {profile.openalexId}
                </span>
                {profile.lastSyncedAt && (
                  <span style={{ fontSize: 12.5, color: "#75777E" }}>
                    Last synced: {new Date(profile.lastSyncedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                style={btnGhost(syncMutation.isPending)}
                data-testid="button-sync"
              >
                <RefreshCw size={13} style={{ animation: syncMutation.isPending ? "spin 1s linear infinite" : "none" }} />
                Refresh Data
              </button>
            </div>
          </>
        )}

        {/* ═══════ Tabs ═══════ */}
        <div>
          {/* Tab bar */}
          <div style={{ borderBottom: "1px solid rgba(11,31,58,.1)", marginBottom: 0, overflowX: "auto" }}>
            <div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>
              {tabs.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  data-testid={`tab-${value}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "12px 20px",
                    background: "none", border: "none",
                    borderBottom: activeTab === value ? "2px solid #FFC72E" : "2px solid transparent",
                    color: activeTab === value ? "#0B1F3A" : "#75777E",
                    fontSize: 14, fontWeight: activeTab === value ? 600 : 400,
                    fontFamily: "inherit", cursor: "pointer", flexShrink: 0, transition: "color .15s",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════ Profile Tab ═══════ */}
          {activeTab === "profile" && (
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Photo Upload */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><Camera size={17} style={{ color: "#B87A0A" }} /> Profile Photo</div>
                  <div style={cardDescStyle}>Upload a professional photo to personalize your portfolio</div>
                </div>
                <div style={cardBodyStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {profile?.profileImageUrl ? (
                        <img src={profile.profileImageUrl} alt="Your profile photo" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(11,31,58,.08)" }} />
                      ) : (
                        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#0B1F3A", display: "grid", placeItems: "center" }}>
                          <User size={36} style={{ color: "#FFC72E" }} />
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadPhotoMutation.isPending}
                        style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, background: "#fff", borderRadius: "50%", border: "1px solid rgba(11,31,58,.14)", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,.1)" }}
                        aria-label="Change profile photo"
                        data-testid="button-change-photo"
                      >
                        <Camera size={13} style={{ color: "#44474D" }} />
                      </button>
                    </div>
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" aria-label="Upload profile photo" data-testid="input-photo-file" style={{ display: "none" }} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadPhotoMutation.isPending}
                        style={btnGhost(uploadPhotoMutation.isPending)}
                        data-testid="button-upload-photo"
                      >
                        <Upload size={13} />
                        {uploadPhotoMutation.isPending ? "Uploading…" : "Upload Photo"}
                      </button>
                      <p style={{ fontSize: 12.5, color: "#75777E", marginTop: 8 }}>JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><User size={17} style={{ color: "#B87A0A" }} /> Profile Information</div>
                  <div style={cardDescStyle}>Customize how your name and biography appear on your portfolio</div>
                </div>
                <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label htmlFor="display-name" style={labelStyle}>Display Name</label>
                    <input
                      id="display-name"
                      value={profileForm.displayName}
                      onChange={(e) => updateField("displayName", e.target.value)}
                      placeholder={authorData?.display_name || "Your Name"}
                      style={inputStyle}
                      data-testid="input-display-name"
                      onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                      onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                    />
                    <p style={{ fontSize: 12.5, color: "#75777E", marginTop: 5 }}>Leave blank to use your name from OpenAlex</p>
                  </div>
                  <div>
                    <label htmlFor="professional-title" style={labelStyle}>Professional Title</label>
                    <input
                      id="professional-title"
                      value={profileForm.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g., Associate Professor of Computer Science"
                      style={inputStyle}
                      data-testid="input-title"
                      onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                      onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                    />
                  </div>
                  <div>
                    <label htmlFor="biography" style={labelStyle}>Biography</label>
                    <textarea
                      id="biography"
                      value={profileForm.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      placeholder="Tell visitors about your research interests, background, and achievements..."
                      style={{ ...inputStyle, minHeight: 140, resize: "vertical" } as React.CSSProperties}
                      data-testid="input-bio"
                      onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                      onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><Globe size={17} style={{ color: "#B87A0A" }} /> Social &amp; Academic Links</div>
                  <div style={cardDescStyle}>Add links to your other profiles and websites</div>
                </div>
                <div style={{ ...cardBodyStyle }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="social-links-grid">
                    <style>{`@media (max-width: 560px) { .social-links-grid { grid-template-columns: 1fr !important; } }`}</style>
                    {[
                      { id: "website-url", field: "websiteUrl" as const, label: "Personal Website", placeholder: "https://yourwebsite.com", testId: "input-website" },
                      { id: "twitter-url", field: "twitterUrl" as const, label: "Twitter / X", placeholder: "https://twitter.com/yourusername", testId: "input-twitter" },
                      { id: "linkedin-url", field: "linkedinUrl" as const, label: "LinkedIn", placeholder: "https://linkedin.com/in/yourusername", testId: "input-linkedin" },
                      { id: "google-scholar-url", field: "googleScholarUrl" as const, label: "Google Scholar", placeholder: "https://scholar.google.com/citations?user=...", testId: "input-google-scholar" },
                      { id: "orcid-url", field: "orcidUrl" as const, label: "ORCID", placeholder: "https://orcid.org/0000-0000-0000-0000", testId: "input-orcid" },
                      { id: "researchgate-url", field: "researchGateUrl" as const, label: "ResearchGate", placeholder: "https://www.researchgate.net/profile/Your-Name", testId: "input-researchgate" },
                    ].map(({ id, field, label, placeholder, testId }) => (
                      <div key={id}>
                        <label htmlFor={id} style={labelStyle}>{label}</label>
                        <input
                          id={id}
                          value={profileForm[field]}
                          onChange={(e) => updateField(field, e.target.value)}
                          placeholder={placeholder}
                          type="url"
                          style={inputStyle}
                          data-testid={testId}
                          onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                          onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  style={btnPrimary(isSaving)}
                  data-testid="button-save-profile"
                >
                  <Save size={14} />
                  {isSaving ? "Saving…" : "Save All Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ═══════ Publications Tab ═══════ */}
          {activeTab === "publications" && (
            <div style={{ marginTop: 20 }}>
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><Star size={17} style={{ color: "#B87A0A" }} /> Featured Publications</div>
                  <div style={cardDescStyle}>Mark publications as featured to highlight them on your portfolio. Featured publications appear prominently at the top.</div>
                </div>
                <div style={cardBodyStyle}>
                  {!tenantData?.tenant?.profile?.openalexId ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#75777E" }}>
                      <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                      <p style={{ fontSize: 14 }}>Connect your OpenAlex ID to manage publications</p>
                    </div>
                  ) : !publicationsData?.publications?.length ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#75777E" }}>
                      <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                      <p style={{ fontSize: 14, marginBottom: 14 }}>No publications found. Try syncing your profile.</p>
                      <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} style={btnGhost(syncMutation.isPending)}>
                        <RefreshCw size={13} style={{ animation: syncMutation.isPending ? "spin 1s linear infinite" : "none" }} />
                        Sync Now
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#75777E", paddingBottom: 12, borderBottom: "1px solid rgba(11,31,58,.07)", marginBottom: 12 }}>
                        <span>{publicationsData.publications.filter(p => p.isFeatured).length} featured</span>
                        <span>{publicationsData.publications.length} total</span>
                      </div>
                      <div style={{ maxHeight: 520, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                        {publicationsData.publications.map((pub) => (
                          <div
                            key={pub.id}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10,
                              border: pub.isFeatured ? "1px solid rgba(255,199,46,.4)" : "1px solid rgba(11,31,58,.08)",
                              background: pub.isFeatured ? "rgba(255,199,46,.05)" : "#F8F9FA",
                            }}
                          >
                            <button
                              onClick={() => toggleFeaturedMutation.mutate({ publicationId: pub.id, isFeatured: !pub.isFeatured })}
                              disabled={toggleFeaturedMutation.isPending}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0", color: pub.isFeatured ? "#FFC72E" : "rgba(11,31,58,.2)", transition: "color .15s", flexShrink: 0, marginTop: 2 }}
                              aria-pressed={pub.isFeatured}
                              aria-label={pub.isFeatured ? `Unfeature "${pub.title}"` : `Feature "${pub.title}"`}
                            >
                              <Star size={18} style={{ fill: pub.isFeatured ? "#FFC72E" : "none" }} />
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ fontSize: 13.5, fontWeight: 600, color: "#0B1F3A", margin: "0 0 3px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {pub.title}
                              </h4>
                              <p style={{ fontSize: 12.5, color: "#75777E", margin: "0 0 8px" }}>
                                {pub.journal && <span>{pub.journal}</span>}
                                {pub.publicationYear && <span> &middot; {pub.publicationYear}</span>}
                                {pub.citationCount > 0 && <span> &middot; {pub.citationCount} citations</span>}
                              </p>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                {pub.isOpenAccess && (
                                  <span style={{ ...chip("green"), fontSize: 11 }}>Open Access</span>
                                )}
                                {pub.doi && (
                                  <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <ExternalLink size={11} /> DOI
                                  </a>
                                )}
                                {/* FUNC-1: Fixed PDF upload/delete endpoints */}
                                {pub.pdfUrl ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <a href={pub.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#059669", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                      <FileText size={11} /> PDF
                                    </a>
                                    <button
                                      onClick={() => deletePubPdfMutation.mutate(pub.id)}
                                      disabled={deletePubPdfMutation.isPending}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex", padding: "0 2px" }}
                                      aria-label={`Remove PDF for "${pub.title}"`}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ) : (
                                  <label style={{ fontSize: 12, color: "#75777E", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#2563EB")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "#75777E")}
                                  >
                                    <Upload size={11} /> Upload PDF
                                    <input
                                      type="file" accept=".pdf"
                                      style={{ display: "none" }}
                                      aria-label={`Upload PDF for "${pub.title}"`}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        // FUNC-2: Aligned to 10MB server limit
                                        if (file.size > 10 * 1024 * 1024) {
                                          toast({ title: "File too large", description: "PDF must be under 10MB", variant: "destructive" });
                                          return;
                                        }
                                        uploadPubPdfMutation.mutate({ publicationId: pub.id, file });
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report publication issue */}
            {tenantData?.tenant?.profile?.openalexId && (
              <div className="flex items-center justify-end">
                <a
                  href={`/contact?subject=publication-issue&openalexId=${tenantData.tenant.profile.openalexId}`}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Report a publication data issue →
                </a>
              </div>
            )}
          </TabsContent>

          {/* ═══════ Sections Tab ═══════ */}
          {activeTab === "sections" && (
            <div style={{ marginTop: 20 }}>
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><FileText size={17} style={{ color: "#B87A0A" }} /> Content Sections</div>
                  <div style={cardDescStyle}>Add custom sections to your portfolio such as Research Interests, Awards, Teaching, or any other content.</div>
                </div>
                <div style={cardBodyStyle}>
                  {/* Add / Edit Form */}
                  <div style={{ paddingBottom: 20, borderBottom: "1px solid rgba(11,31,58,.07)", marginBottom: 20 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0B1F3A", margin: "0 0 14px" }}>
                      {editingSectionId ? "Edit Section" : "Add New Section"}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }} className="section-form-grid">
                      <style>{`@media (max-width: 560px) { .section-form-grid { grid-template-columns: 1fr !important; } }`}</style>
                      <div>
                        <label htmlFor="section-title" style={labelStyle}>Section Title</label>
                        <input
                          id="section-title"
                          value={sectionTitle}
                          onChange={(e) => setSectionTitle(e.target.value)}
                          placeholder="e.g., Research Interests, Awards, Teaching"
                          style={inputStyle}
                          onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                          onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                        />
                      </div>
                      <div>
                        <label htmlFor="section-type" style={labelStyle}>Section Type</label>
                        <select
                          id="section-type"
                          value={sectionType}
                          onChange={(e) => setSectionType(e.target.value)}
                          style={{ ...inputStyle, cursor: "pointer" }}
                          onFocus={e => ((e.target as HTMLSelectElement).style.borderColor = "#FFC72E")}
                          onBlur={e => ((e.target as HTMLSelectElement).style.borderColor = "rgba(11,31,58,.14)")}
                        >
                          <option value="custom">Custom</option>
                          <option value="research_interests">Research Interests</option>
                          <option value="awards">Awards &amp; Honors</option>
                          <option value="teaching">Teaching</option>
                          <option value="grants">Grants &amp; Funding</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label htmlFor="section-content" style={labelStyle}>Content</label>
                      <textarea
                        id="section-content"
                        value={sectionContent}
                        onChange={(e) => setSectionContent(e.target.value)}
                        placeholder="Enter your content here. You can use markdown for formatting..."
                        style={{ ...inputStyle, minHeight: 100, resize: "vertical" } as React.CSSProperties}
                        onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                        onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {editingSectionId ? (
                        <>
                          <button
                            onClick={() => updateSectionMutation.mutate({ id: editingSectionId, title: sectionTitle, content: sectionContent })}
                            disabled={!sectionTitle || !sectionContent || updateSectionMutation.isPending}
                            style={btnPrimary(!sectionTitle || !sectionContent || updateSectionMutation.isPending)}
                          >
                            <Save size={13} />
                            Save Changes
                          </button>
                          <button
                            onClick={() => { setEditingSectionId(null); setSectionTitle(""); setSectionContent(""); setSectionType("custom"); }}
                            style={btnGhost()}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => createSectionMutation.mutate({ title: sectionTitle, content: sectionContent, sectionType })}
                          disabled={!sectionTitle || !sectionContent || createSectionMutation.isPending}
                          style={btnPrimary(!sectionTitle || !sectionContent || createSectionMutation.isPending)}
                        >
                          <Plus size={13} />
                          Add Section
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Existing Sections */}
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px" }}>Your Sections</p>
                    {!sectionsData?.sections?.length ? (
                      <div style={{ textAlign: "center", padding: "36px 0", color: "#75777E" }}>
                        <FileText size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                        <p style={{ fontSize: 14 }}>No custom sections yet. Add one above!</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {sectionsData.sections.map((section) => (
                          <div key={section.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 14px", borderRadius: 10, border: "1px solid rgba(11,31,58,.08)", background: "#F8F9FA" }}>
                            <GripVertical size={15} style={{ color: "#75777E", marginTop: 2, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                <h5 style={{ fontSize: 14, fontWeight: 600, color: "#0B1F3A", margin: 0 }}>{section.title}</h5>
                                <span style={chip()}>{section.sectionType}</span>
                                {!section.isVisible && <span style={chip("amber")}>Hidden</span>}
                              </div>
                              <p style={{ fontSize: 13, color: "#75777E", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {section.content}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                              <button
                                style={btnIcon()}
                                aria-label={`Edit "${section.title}"`}
                                onClick={() => { setEditingSectionId(section.id); setSectionTitle(section.title); setSectionContent(section.content); setSectionType(section.sectionType); }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                style={btnIcon()}
                                aria-label={section.isVisible ? `Hide "${section.title}"` : `Show "${section.title}"`}
                                onClick={() => updateSectionMutation.mutate({ id: section.id, isVisible: !section.isVisible })}
                              >
                                {section.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                              <button
                                style={btnIcon(true)}
                                aria-label={`Delete "${section.title}"`}
                                onClick={() => { if (confirm("Are you sure you want to delete this section?")) deleteSectionMutation.mutate(section.id); }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ Sync Tab ═══════ */}
          {activeTab === "sync" && (
            <div style={{ marginTop: 20 }}>
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><History size={17} style={{ color: "#B87A0A" }} /> OpenAlex Sync Management</div>
                  <div style={cardDescStyle}>View sync history and manually trigger data synchronization from OpenAlex</div>
                </div>
                <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* FUNC-3: Fixed — uses syncMutation instead of duplicate raw fetch */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "#F8F9FA", borderRadius: 10, border: "1px solid rgba(11,31,58,.08)" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#0B1F3A", margin: "0 0 3px" }}>Sync Publications</p>
                      <p style={{ fontSize: 13, color: "#75777E", margin: 0 }}>Fetch latest publications and citations from OpenAlex</p>
                    </div>
                    <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} style={btnPrimary(syncMutation.isPending)}>
                      <RefreshCw size={13} style={{ animation: syncMutation.isPending ? "spin 1s linear infinite" : "none" }} />
                      {syncMutation.isPending ? "Syncing…" : "Sync Now"}
                    </button>
                  </div>

                  {/* Sync History */}
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px" }}>Sync History</p>
                    {!syncLogsData?.logs || syncLogsData.logs.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "36px 0", color: "#75777E", borderRadius: 10, border: "1px dashed rgba(11,31,58,.12)", background: "#F8F9FA" }}>
                        <History size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p style={{ fontSize: 14, margin: "0 0 4px" }}>No sync history yet</p>
                        <p style={{ fontSize: 13, margin: 0 }}>Click &ldquo;Sync Now&rdquo; to fetch your latest publications</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {syncLogsData.logs.map((log) => {
                          const statusColor = log.status === "completed" ? "green" : log.status === "failed" ? "red" : log.status === "in_progress" ? "blue" : undefined;
                          return (
                            <div key={log.id} style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(11,31,58,.08)", background: "#F8F9FA" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  {log.status === "completed" && <CheckCircle2 size={17} style={{ color: "#059669", flexShrink: 0 }} />}
                                  {log.status === "failed" && <XCircle size={17} style={{ color: "#EF4444", flexShrink: 0 }} />}
                                  {log.status === "in_progress" && <Clock size={17} style={{ color: "#2563EB", flexShrink: 0, animation: "pulse 2s infinite" }} />}
                                  {log.status === "pending" && <Clock size={17} style={{ color: "#75777E", flexShrink: 0 }} />}
                                  <div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0B1F3A", margin: "0 0 2px", textTransform: "capitalize" }}>
                                      {log.syncType.replace("_", " ")} Sync
                                    </p>
                                    <p style={{ fontSize: 12.5, color: "#75777E", margin: 0 }}>
                                      Started: {new Date(log.startedAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <span style={chip(statusColor)}>{log.status}</span>
                              </div>
                              {log.itemsProcessed !== null && (
                                <p style={{ fontSize: 12.5, color: "#75777E", marginTop: 8 }}>
                                  Processed: {log.itemsProcessed}{log.itemsTotal ? ` / ${log.itemsTotal}` : ""} items
                                </p>
                              )}
                              {log.errorMessage && (
                                <p style={{ fontSize: 12.5, color: "#b91c1c", marginTop: 6 }}>Error: {log.errorMessage}</p>
                              )}
                              {log.completedAt && (
                                <p style={{ fontSize: 12, color: "#75777E", marginTop: 4 }}>
                                  Completed: {new Date(log.completedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ Settings Tab ═══════ */}
          {activeTab === "settings" && (
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Profile Visibility */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}>
                    {isPublic ? <Eye size={17} style={{ color: "#059669" }} /> : <EyeOff size={17} style={{ color: "#75777E" }} />}
                    Profile Visibility
                  </div>
                  <div style={cardDescStyle}>Control who can see your research portfolio</div>
                </div>
                <div style={cardBodyStyle}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F8F9FA", borderRadius: 10, border: "1px solid rgba(11,31,58,.08)" }}>
                    <div>
                      <label htmlFor="profile-visibility" style={{ fontSize: 14, fontWeight: 600, color: "#0B1F3A", cursor: "pointer" }}>
                        Public Profile
                      </label>
                      <p style={{ fontSize: 13, color: "#75777E", margin: "3px 0 0" }}>
                        {isPublic ? "Your portfolio is visible to everyone on the internet" : "Your portfolio is hidden from public view"}
                      </p>
                    </div>
                    {/* Custom toggle pill */}
                    <button
                      id="profile-visibility"
                      role="switch"
                      aria-checked={isPublic}
                      onClick={() => handlePrivacyToggle(!isPublic)}
                      disabled={updateProfileMutation.isPending}
                      style={{ width: 44, height: 24, borderRadius: 12, background: isPublic ? "#FFC72E" : "rgba(11,31,58,.2)", border: "none", cursor: updateProfileMutation.isPending ? "not-allowed" : "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}
                    >
                      <div style={{ position: "absolute", top: 2, left: isPublic ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s" }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* CV Upload */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><FileText size={17} style={{ color: "#B87A0A" }} /> CV / Resume</div>
                  <div style={cardDescStyle}>Upload your CV to allow visitors to download it from your portfolio</div>
                </div>
                <div style={cardBodyStyle}>
                  {profile?.cvUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "rgba(5,150,105,.06)", borderRadius: 10, border: "1px solid rgba(5,150,105,.2)" }}>
                      <FileText size={28} style={{ color: "#059669", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#065f46", margin: "0 0 2px" }}>CV Uploaded</p>
                        <p style={{ fontSize: 13, color: "#059669", margin: 0 }}>Your CV is available for download on your portfolio</p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnPrimary(), fontSize: 13, padding: "7px 14px", textDecoration: "none" }}>
                          <ExternalLink size={12} /> View
                        </a>
                        <button onClick={() => deleteCvMutation.mutate()} disabled={deleteCvMutation.isPending} style={{ ...btnGhost(deleteCvMutation.isPending), color: "#EF4444", border: "1px solid rgba(239,68,68,.3)" }} aria-label="Remove CV">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: "2px dashed rgba(11,31,58,.12)", borderRadius: 10, padding: "32px 24px", textAlign: "center" }}>
                      <FileText size={36} style={{ color: "#75777E", opacity: 0.4, marginBottom: 10 }} />
                      <p style={{ fontSize: 14, color: "#75777E", margin: "0 0 14px" }}>No CV uploaded yet</p>
                      <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} style={{ display: "none" }} aria-label="Upload CV file" />
                      <button onClick={() => cvInputRef.current?.click()} disabled={uploadCvMutation.isPending} style={btnGhost(uploadCvMutation.isPending)}>
                        <Upload size={13} />
                        {uploadCvMutation.isPending ? "Uploading…" : "Upload CV"}
                      </button>
                      <p style={{ fontSize: 12.5, color: "#75777E", marginTop: 8 }}>PDF, DOC, or DOCX. Max 10MB.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Selection */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><Palette size={17} style={{ color: "#B87A0A" }} /> Portfolio Theme</div>
                  <div style={cardDescStyle}>Choose a color theme for your research portfolio</div>
                </div>
                <div style={cardBodyStyle}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }} className="theme-grid">
                    <style>{`@media (max-width: 480px) { .theme-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
                    {themesData?.filter((t) => t.isActive).map((theme) => {
                      const colors = theme.config as { colors: { primary: string; accent: string } };
                      const isSelected = selectedThemeId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeChange(theme.id)}
                          aria-pressed={isSelected}
                          aria-label={`Select ${theme.name} theme`}
                          style={{ position: "relative", padding: "14px 12px", borderRadius: 11, border: isSelected ? "2px solid #FFC72E" : "1px solid rgba(11,31,58,.1)", background: isSelected ? "rgba(255,199,46,.06)" : "#F8F9FA", cursor: "pointer", textAlign: "left", transition: "border .15s, background .15s", fontFamily: "inherit" }}
                        >
                          <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: colors.colors.primary, border: "1px solid rgba(0,0,0,.08)" }} />
                            <div style={{ width: 14, height: 14, borderRadius: "50%", background: colors.colors.accent, border: "1px solid rgba(0,0,0,.08)", marginTop: 3 }} />
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#0B1F3A", margin: 0 }}>{theme.name}</p>
                          {isSelected && <CheckCircle size={15} style={{ position: "absolute", top: 10, right: 10, color: "#B87A0A" }} />}
                        </button>
                      );
                    })}
                  </div>
                  {(!themesData || themesData.length === 0) && (
                    <p style={{ fontSize: 13.5, color: "#75777E", textAlign: "center", padding: "16px 0" }}>No themes available. Contact your administrator.</p>
                  )}
                </div>
              </div>

              {/* Account Settings */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><Settings size={17} style={{ color: "#B87A0A" }} /> Account Settings</div>
                  <div style={cardDescStyle}>Manage your account and portfolio settings</div>
                </div>
                <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: 0 }}>
                  {/* Preview Portfolio */}
                  <div style={{ paddingBottom: 18 }}>
                    <p style={{ ...labelStyle, marginBottom: 8 }}>Preview Portfolio</p>
                    {profile?.openalexId ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(37,99,235,.05)", borderRadius: 9, border: "1px solid rgba(37,99,235,.15)" }}>
                        <ExternalLink size={15} style={{ color: "#2563EB", flexShrink: 0 }} />
                        <span style={{ fontSize: 13.5, color: "#1d4ed8", flex: 1 }}>See how visitors will view your portfolio</span>
                        <a href={`/researcher/${profile.openalexId}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 13, color: "#fff", background: "#2563EB", padding: "6px 14px", borderRadius: 7, textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                          data-testid="link-preview-portfolio"
                        >
                          Preview <ExternalLink size={11} />
                        </a>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13.5, color: "#75777E" }}>Connect your OpenAlex ID to preview your portfolio</p>
                    )}
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid rgba(11,31,58,.07)", margin: "0 0 18px" }} />

                  {/* QR Code */}
                  <div style={{ paddingBottom: 18 }}>
                    <p style={{ ...labelStyle, marginBottom: 8 }}>QR Code</p>
                    {profile?.openalexId ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(139,92,246,.05)", borderRadius: 9, border: "1px solid rgba(139,92,246,.15)" }}>
                        <QrCode size={15} style={{ color: "#7c3aed", flexShrink: 0 }} />
                        <span style={{ fontSize: 13.5, color: "#6d28d9", flex: 1 }}>Download a QR code linking to your portfolio</span>
                        <a
                          href={`/api/researcher/${profile.openalexId}/qr-code${primaryDomain ? `?url=https://${primaryDomain.hostname}` : ""}`}
                          download={`${profile.displayName || "portfolio"}-qr-code.png`}
                          style={{ fontSize: 13, color: "#fff", background: "#7c3aed", padding: "6px 14px", borderRadius: 7, textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                          data-testid="link-download-qr"
                        >
                          <Download size={11} /> Download QR
                        </a>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13.5, color: "#75777E" }}>Connect your OpenAlex ID to generate a QR code</p>
                    )}
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid rgba(11,31,58,.07)", margin: "0 0 18px" }} />

                  {/* Domain */}
                  <div style={{ paddingBottom: 18 }}>
                    <p style={{ ...labelStyle, marginBottom: 8 }}>Your Domain</p>
                    {primaryDomain ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", borderRadius: 9, border: "1px solid rgba(11,31,58,.08)" }}>
                        <Globe size={15} style={{ color: "#44474D", flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0B1F3A", flex: 1 }}>{primaryDomain.hostname}</span>
                        <a href={`https://${primaryDomain.hostname}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563EB", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          Visit Site <ExternalLink size={11} />
                        </a>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13.5, color: "#75777E" }}>Your domain will be assigned by the administrator</p>
                    )}
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid rgba(11,31,58,.07)", margin: "0 0 18px" }} />

                  {/* Plan */}
                  <div style={{ paddingBottom: 18 }}>
                    <p style={{ ...labelStyle, marginBottom: 8 }}>Plan</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", borderRadius: 9, border: "1px solid rgba(11,31,58,.08)" }}>
                      <span style={{ ...chip(), textTransform: "capitalize" }}>{tenant?.plan}</span>
                      <span style={{ fontSize: 13, color: "#75777E" }}>Contact support to change your plan</span>
                    </div>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid rgba(11,31,58,.07)", margin: "0 0 18px" }} />

                  {/* OpenAlex ID */}
                  <div>
                    <p style={{ ...labelStyle, marginBottom: 8 }}>OpenAlex ID</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FA", borderRadius: 9, border: "1px solid rgba(11,31,58,.08)" }}>
                      <span style={{ ...chip(), fontFamily: "monospace", fontSize: 11.5 }}>{profile?.openalexId || "Not connected"}</span>
                      <span style={{ fontSize: 13, color: "#75777E" }}>To change your OpenAlex profile, contact support</span>
                    </div>
                  </div>
                </div>
              </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-red-600">Cancel Subscription</Label>
                  <p className="text-sm text-muted-foreground">
                    Your profile stays active until the end of the current billing period. This cannot be undone automatically.
                  </p>
                  <a
                    href={`mailto:support@scholar.name?subject=Cancel%20subscription&body=Please%20cancel%20my%20subscription%20for%20account%20${encodeURIComponent(userData?.user?.email || "")}.`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-3 py-2 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Request cancellation →
                  </a>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>OpenAlex ID</Label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Badge variant="outline" className="font-mono text-xs">
                      {profile?.openalexId || "Not connected"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      To change your OpenAlex profile, contact support
                    </span>
                  </div>
                </div>
                <div style={{ ...cardBodyStyle, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label htmlFor="current-password" style={labelStyle}>Current Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        style={{ ...inputStyle, paddingRight: 40 }}
                        onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                        onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#75777E" }}
                        aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new-password" style={labelStyle}>New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                        style={{ ...inputStyle, paddingRight: 40 }}
                        onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                        onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#75777E" }}
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" style={labelStyle}>Confirm New Password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = "#FFC72E")}
                      onBlur={e => (e.target.style.borderColor = "rgba(11,31,58,.14)")}
                    />
                  </div>

                  <div>
                    <button
                      onClick={handlePasswordChange}
                      disabled={!currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending}
                      style={btnPrimary(!currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending)}
                    >
                      <Lock size={13} />
                      {changePasswordMutation.isPending ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <GlobalFooter mode="app" />
    </div>
  );
}
