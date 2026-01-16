import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
  Trash2,
  Star,
  GripVertical,
  Plus,
  Edit2,
  History,
  Clock,
  XCircle,
} from "lucide-react";

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface TenantProfile {
  id: string;
  tenantId: string;
  openalexId: string | null;
  displayName: string | null;
  title: string | null;
  bio: string | null;
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
  // Phase 1 additions
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

export default function ResearcherDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [openalexIdInput, setOpenalexIdInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [googleScholarUrl, setGoogleScholarUrl] = useState("");
  const [orcidUrl, setOrcidUrl] = useState("");
  const [researchGateUrl, setResearchGateUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Phase 1: New state variables
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  // Phase 2: Section editing
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [sectionType, setSectionType] = useState("custom");

  const { data: userData, isLoading: userLoading } = useQuery<{ user: CurrentUser }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: tenantData, isLoading: tenantLoading } = useQuery<{ tenant: TenantData }>({
    queryKey: ["/api/researcher/my-tenant"],
    enabled: !!userData?.user,
  });

  const { data: authorData, isLoading: authorLoading, refetch: refetchAuthor } = useQuery<OpenAlexAuthor>({
    queryKey: ["/api/openalex/author", tenantData?.tenant?.profile?.openalexId],
    enabled: !!tenantData?.tenant?.profile?.openalexId,
  });

  // Phase 1: Fetch available themes
  const { data: themesData } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  // Phase 2: Fetch publications and sections
  const { data: publicationsData } = useQuery<{ publications: Publication[] }>({
    queryKey: ["/api/researcher/publications"],
    enabled: !!tenantData?.tenant?.profile?.openalexId,
  });

  const { data: sectionsData } = useQuery<{ sections: ProfileSection[] }>({
    queryKey: ["/api/researcher/sections"],
    enabled: !!tenantData?.tenant?.profile,
  });

  const { data: syncLogsData, refetch: refetchSyncLogs } = useQuery<{ logs: SyncLog[] }>({
    queryKey: ["/api/researcher/sync-logs"],
    enabled: !!tenantData?.tenant?.profile,
  });

  useEffect(() => {
    if (tenantData?.tenant?.profile) {
      const profile = tenantData.tenant.profile;
      setOpenalexIdInput(profile.openalexId || "");
      setDisplayName(profile.displayName || "");
      setTitle(profile.title || "");
      setBio(profile.bio || "");
      setWebsiteUrl(profile.websiteUrl || "");
      setTwitterUrl(profile.twitterUrl || "");
      setLinkedinUrl(profile.linkedinUrl || "");
      setGoogleScholarUrl(profile.googleScholarUrl || "");
      setOrcidUrl(profile.orcidUrl || "");
      setResearchGateUrl(profile.researchGateUrl || "");
      // Phase 1: Set new fields
      setIsPublic(profile.isPublic !== false); // Default to true
      setSelectedThemeId(profile.selectedThemeId || null);
    }
  }, [tenantData]);

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
      const response = await apiRequest("PATCH", "/api/researcher/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Saved!", description: "Your profile has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/my-tenant"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/researcher/sync");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Synced!", description: "Your profile data has been refreshed from OpenAlex." });
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/my-tenant"] });
      refetchAuthor();
    },
    onError: (error: any) => {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    },
  });

  const verifyOpenAlexMutation = useMutation({
    mutationFn: async (openalexId: string) => {
      const response = await fetch(`https://api.openalex.org/authors/${openalexId}`);
      if (!response.ok) throw new Error("Author not found in OpenAlex");
      return response.json();
    },
    onSuccess: async (data) => {
      toast({ title: "Author Found!", description: `${data.display_name} with ${data.works_count} publications` });
      await updateProfileMutation.mutateAsync({ openalexId: openalexIdInput });
      refetchAuthor();
    },
    onError: () => {
      toast({ title: "Not Found", description: "Could not find this author in OpenAlex. Check the ID.", variant: "destructive" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await fetch('/api/researcher/upload-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload photo');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Photo Updated!", description: "Your profile photo has been uploaded." });
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/my-tenant"] });
    },
    onError: (error: any) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  // Phase 1: CV Upload Mutation
  const uploadCvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await fetch('/api/researcher/upload-cv', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload CV');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "CV Uploaded!", description: "Your CV has been uploaded successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/my-tenant"] });
    },
    onError: (error: any) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  // Phase 1: Delete CV Mutation
  const deleteCvMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/researcher/cv");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "CV Removed", description: "Your CV has been removed from your profile." });
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/my-tenant"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Phase 1: Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("PATCH", "/api/auth/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Password Changed!", description: "Your password has been updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please choose an image under 5MB", variant: "destructive" });
        return;
      }
      uploadPhotoMutation.mutate(file);
    }
  };

  // Phase 1: Handle CV Upload
  const handleCvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please choose a document under 10MB", variant: "destructive" });
        return;
      }
      uploadCvMutation.mutate(file);
    }
  };

  // Phase 1: Handle Password Change
  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  // Phase 1: Handle Privacy Toggle
  const handlePrivacyToggle = async (newValue: boolean) => {
    setIsPublic(newValue);
    try {
      await updateProfileMutation.mutateAsync({ isPublic: newValue });
    } catch {
      setIsPublic(!newValue); // Revert on error
    }
  };

  // Phase 1: Handle Theme Change
  const handleThemeChange = async (themeId: string) => {
    setSelectedThemeId(themeId);
    try {
      await updateProfileMutation.mutateAsync({ selectedThemeId: themeId });
    } catch {
      // Revert on error
      setSelectedThemeId(tenantData?.tenant?.profile?.selectedThemeId || null);
    }
  };

  // Phase 2: Publication Feature Toggle
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ publicationId, isFeatured }: { publicationId: string; isFeatured: boolean }) => {
      const response = await apiRequest("PATCH", `/api/researcher/publications/${publicationId}/feature`, { isFeatured });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/publications"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Phase 2: Section CRUD Mutations
  const createSectionMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; sectionType: string }) => {
      const response = await apiRequest("POST", "/api/researcher/sections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Section Created!", description: "Your new section has been added." });
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/sections"] });
      setSectionTitle("");
      setSectionContent("");
      setSectionType("custom");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; content?: string; isVisible?: boolean }) => {
      const response = await apiRequest("PATCH", `/api/researcher/sections/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Section Updated!", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/sections"] });
      setEditingSectionId(null);
      setSectionTitle("");
      setSectionContent("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const response = await apiRequest("DELETE", `/api/researcher/sections/${sectionId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Section Deleted", description: "The section has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/researcher/sections"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayName || null,
        title: title || null,
        bio: bio || null,
        websiteUrl: websiteUrl || null,
        twitterUrl: twitterUrl || null,
        linkedinUrl: linkedinUrl || null,
        googleScholarUrl: googleScholarUrl || null,
        orcidUrl: orcidUrl || null,
        researchGateUrl: researchGateUrl || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading || tenantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!userData?.user) {
    navigate("/dashboard/login");
    return null;
  }

  const tenant = tenantData?.tenant;
  const profile = tenant?.profile;
  const primaryDomain = tenant?.domains?.find((d) => d.isPrimary) || tenant?.domains?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0B1F3A] to-[#233F5F] rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">My Portfolio</h1>
              <p className="text-sm text-slate-500">
                Welcome, {userData.user.firstName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {primaryDomain && (
              <a
                href={`https://${primaryDomain.hostname}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <Globe className="w-4 h-4" />
                {primaryDomain.hostname}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-slate-600 hover:text-slate-900"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {!profile?.openalexId ? (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Search className="w-5 h-5" />
                Connect Your OpenAlex Profile
              </CardTitle>
              <CardDescription className="text-orange-700">
                Enter your OpenAlex author ID to automatically import your publications, metrics, and research topics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={openalexIdInput}
                  onChange={(e) => setOpenalexIdInput(e.target.value)}
                  placeholder="e.g., A5023888391"
                  className="flex-1"
                  data-testid="input-openalex-id"
                />
                <Button
                  onClick={() => verifyOpenAlexMutation.mutate(openalexIdInput)}
                  disabled={!openalexIdInput || verifyOpenAlexMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-verify-openalex"
                >
                  {verifyOpenAlexMutation.isPending ? "Checking..." : "Connect"}
                </Button>
              </div>
              <p className="text-sm text-orange-600">
                Find your ID by searching your name on{" "}
                <a
                  href="https://openalex.org/authors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  OpenAlex Authors
                </a>
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Publications</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {authorData?.works_count?.toLocaleString() || "—"}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Citations</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {authorData?.cited_by_count?.toLocaleString() || "—"}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {tenant?.status === "active" ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-lg font-medium text-green-600">Live</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <span className="text-lg font-medium text-yellow-600">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-100 text-slate-700">
                  OpenAlex: {profile.openalexId}
                </Badge>
                {profile.lastSyncedAt && (
                  <span className="text-sm text-slate-500">
                    Last synced: {new Date(profile.lastSyncedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                data-testid="button-sync"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
            </div>
          </>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="flex flex-wrap justify-start gap-1 w-full lg:grid lg:grid-cols-6 lg:w-[720px] h-auto p-1">
            <TabsTrigger value="profile" data-testid="tab-profile" className="flex-1 min-w-[80px] text-xs sm:text-sm">
              <User className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="publications" data-testid="tab-publications" className="flex-1 min-w-[80px] text-xs sm:text-sm">
              <BookOpen className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Publications</span>
            </TabsTrigger>
            <TabsTrigger value="sections" data-testid="tab-sections" className="flex-1 min-w-[80px] text-xs sm:text-sm">
              <FileText className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sections</span>
            </TabsTrigger>
            <TabsTrigger value="sync" data-testid="tab-sync" className="flex-1 min-w-[80px] text-xs sm:text-sm">
              <History className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sync</span>
            </TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social" className="flex-1 min-w-[80px] text-xs sm:text-sm">
              <Globe className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings" className="flex-1 min-w-[80px] text-xs sm:text-sm">
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>
                  Upload a professional photo to personalize your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profile?.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0B1F3A] to-[#233F5F] flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPhotoMutation.isPending}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-colors"
                      data-testid="button-change-photo"
                    >
                      <Camera className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      data-testid="input-photo-file"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPhotoMutation.isPending}
                      data-testid="button-upload-photo"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <p className="text-sm text-slate-500 mt-2">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Customize how your name and biography appear on your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={authorData?.display_name || "Your Name"}
                    data-testid="input-display-name"
                  />
                  <p className="text-sm text-slate-500">
                    Leave blank to use your name from OpenAlex
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Professional Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Associate Professor of Computer Science"
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Biography</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell visitors about your research interests, background, and achievements..."
                    className="min-h-[150px]"
                    data-testid="input-bio"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-[#0B1F3A] hover:bg-[#1a3a5c]"
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phase 2: Publications Tab */}
          <TabsContent value="publications" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Featured Publications
                </CardTitle>
                <CardDescription>
                  Mark publications as featured to highlight them on your portfolio. Featured publications appear prominently at the top of your publications list.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!tenantData?.tenant?.profile?.openalexId ? (
                  <div className="text-center py-8 text-slate-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Connect your OpenAlex ID to manage publications</p>
                  </div>
                ) : !publicationsData?.publications?.length ? (
                  <div className="text-center py-8 text-slate-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No publications found. Try syncing your profile.</p>
                    <Button
                      onClick={() => syncMutation.mutate()}
                      variant="outline"
                      className="mt-4"
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-500 pb-2 border-b">
                      <span>{publicationsData.publications.filter(p => p.isFeatured).length} featured</span>
                      <span>{publicationsData.publications.length} total publications</span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto space-y-2">
                      {publicationsData.publications.map((pub) => (
                        <div
                          key={pub.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            pub.isFeatured ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <button
                            onClick={() => toggleFeaturedMutation.mutate({ publicationId: pub.id, isFeatured: !pub.isFeatured })}
                            className={`mt-1 transition-colors ${pub.isFeatured ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-400'}`}
                            disabled={toggleFeaturedMutation.isPending}
                          >
                            <Star className={`w-5 h-5 ${pub.isFeatured ? 'fill-current' : ''}`} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-slate-900 line-clamp-2">
                              {pub.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {pub.journal && <span>{pub.journal}</span>}
                              {pub.publicationYear && <span> • {pub.publicationYear}</span>}
                              {pub.citationCount > 0 && <span> • {pub.citationCount} citations</span>}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {pub.isOpenAccess && (
                                <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                  Open Access
                                </Badge>
                              )}
                              {pub.doi && (
                                <a
                                  href={`https://doi.org/${pub.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  DOI
                                </a>
                              )}
                              {/* PDF Upload/Download */}
                              {pub.pdfUrl ? (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={pub.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-600 hover:underline flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    PDF
                                  </a>
                                  <button
                                    onClick={async () => {
                                      if (confirm('Remove the uploaded PDF?')) {
                                        try {
                                          await apiRequest('DELETE', `/api/researcher/publications/${pub.id}/pdf`);
                                          toast({ title: "PDF removed", description: "Publication PDF has been deleted." });
                                          queryClient.invalidateQueries({ queryKey: ["/api/researcher/publications"] });
                                        } catch (error) {
                                          toast({ title: "Error", description: "Failed to remove PDF", variant: "destructive" });
                                        }
                                      }
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700"
                                    title="Remove PDF"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="text-xs text-slate-500 hover:text-blue-600 cursor-pointer flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  Upload PDF
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      if (file.size > 20 * 1024 * 1024) {
                                        toast({ title: "File too large", description: "PDF must be under 20MB", variant: "destructive" });
                                        return;
                                      }
                                      try {
                                        const formData = new FormData();
                                        formData.append('pdf', file);
                                        const response = await fetch(`/api/researcher/publications/${pub.id}/pdf`, {
                                          method: 'POST',
                                          body: formData,
                                          credentials: 'include',
                                        });
                                        if (!response.ok) throw new Error('Upload failed');
                                        toast({ title: "PDF uploaded", description: "Publication PDF has been saved." });
                                        queryClient.invalidateQueries({ queryKey: ["/api/researcher/publications"] });
                                      } catch (error) {
                                        toast({ title: "Error", description: "Failed to upload PDF", variant: "destructive" });
                                      }
                                      e.target.value = '';
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phase 2: Sections Tab */}
          <TabsContent value="sections" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Content Sections
                </CardTitle>
                <CardDescription>
                  Add custom sections to your portfolio such as Research Interests, Awards, Teaching, or any other content you want to showcase.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add New Section Form */}
                <div className="space-y-4 pb-6 border-b">
                  <h4 className="font-medium text-sm text-slate-900">
                    {editingSectionId ? 'Edit Section' : 'Add New Section'}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Section Title</label>
                      <Input
                        value={sectionTitle}
                        onChange={(e) => setSectionTitle(e.target.value)}
                        placeholder="e.g., Research Interests, Awards, Teaching"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Section Type</label>
                      <select
                        value={sectionType}
                        onChange={(e) => setSectionType(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                      >
                        <option value="custom">Custom</option>
                        <option value="research_interests">Research Interests</option>
                        <option value="awards">Awards & Honors</option>
                        <option value="teaching">Teaching</option>
                        <option value="grants">Grants & Funding</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Content</label>
                    <Textarea
                      value={sectionContent}
                      onChange={(e) => setSectionContent(e.target.value)}
                      placeholder="Enter your content here. You can use markdown for formatting..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingSectionId ? (
                      <>
                        <Button
                          onClick={() => {
                            updateSectionMutation.mutate({
                              id: editingSectionId,
                              title: sectionTitle,
                              content: sectionContent,
                            });
                          }}
                          disabled={!sectionTitle || !sectionContent || updateSectionMutation.isPending}
                          className="bg-[#0B1F3A] hover:bg-[#1a3a5c]"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingSectionId(null);
                            setSectionTitle("");
                            setSectionContent("");
                            setSectionType("custom");
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          createSectionMutation.mutate({
                            title: sectionTitle,
                            content: sectionContent,
                            sectionType,
                          });
                        }}
                        disabled={!sectionTitle || !sectionContent || createSectionMutation.isPending}
                        className="bg-[#0B1F3A] hover:bg-[#1a3a5c]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </Button>
                    )}
                  </div>
                </div>

                {/* Existing Sections List */}
                <div className="pt-6 space-y-3">
                  <h4 className="font-medium text-sm text-slate-900">Your Sections</h4>
                  {!sectionsData?.sections?.length ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No custom sections yet. Add one above!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sectionsData.sections.map((section) => (
                        <div
                          key={section.id}
                          className="flex items-start gap-3 p-4 rounded-lg border bg-white border-slate-200"
                        >
                          <GripVertical className="w-4 h-4 mt-1 text-slate-400 cursor-move" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-slate-900">{section.title}</h5>
                              <Badge variant="outline" className="text-xs">
                                {section.sectionType}
                              </Badge>
                              {!section.isVisible && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {section.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSectionId(section.id);
                                setSectionTitle(section.title);
                                setSectionContent(section.content);
                                setSectionType(section.sectionType);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                updateSectionMutation.mutate({
                                  id: section.id,
                                  isVisible: !section.isVisible,
                                });
                              }}
                            >
                              {section.isVisible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this section?')) {
                                  deleteSectionMutation.mutate(section.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Management Tab */}
          <TabsContent value="sync" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  OpenAlex Sync Management
                </CardTitle>
                <CardDescription>
                  View sync history and manually trigger data synchronization from OpenAlex
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Manual Sync Trigger */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                  <div>
                    <h4 className="font-medium text-slate-900">Sync Publications</h4>
                    <p className="text-sm text-slate-500">
                      Fetch latest publications and citations from OpenAlex
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/researcher/sync', {
                          method: 'POST',
                          credentials: 'include',
                        });
                        if (response.ok) {
                          toast({
                            title: "Sync started",
                            description: "Your publications are being synced from OpenAlex",
                          });
                          refetchSyncLogs();
                        } else {
                          throw new Error('Failed to start sync');
                        }
                      } catch (error) {
                        toast({
                          title: "Sync failed",
                          description: "Could not start sync. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </Button>
                </div>

                {/* Sync History */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Sync History</h4>
                  {!syncLogsData?.logs || syncLogsData.logs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No sync history yet</p>
                      <p className="text-sm">Click "Sync Now" to fetch your latest publications</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {syncLogsData.logs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-4 rounded-lg border ${
                            log.status === 'completed'
                              ? 'bg-green-50 border-green-200'
                              : log.status === 'failed'
                              ? 'bg-red-50 border-red-200'
                              : log.status === 'in_progress'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {log.status === 'completed' && (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                              {log.status === 'failed' && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              {log.status === 'in_progress' && (
                                <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                              )}
                              {log.status === 'pending' && (
                                <Clock className="w-5 h-5 text-slate-400" />
                              )}
                              <div>
                                <p className="font-medium text-slate-900 capitalize">
                                  {log.syncType.replace('_', ' ')} Sync
                                </p>
                                <p className="text-sm text-slate-500">
                                  Started: {new Date(log.startedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${
                                log.status === 'completed'
                                  ? 'text-green-700 border-green-300'
                                  : log.status === 'failed'
                                  ? 'text-red-700 border-red-300'
                                  : log.status === 'in_progress'
                                  ? 'text-blue-700 border-blue-300'
                                  : 'text-slate-700 border-slate-300'
                              }`}
                            >
                              {log.status}
                            </Badge>
                          </div>
                          {log.itemsProcessed !== null && (
                            <p className="text-sm text-slate-600 mt-2">
                              Processed: {log.itemsProcessed}
                              {log.itemsTotal ? ` / ${log.itemsTotal}` : ''} items
                            </p>
                          )}
                          {log.errorMessage && (
                            <p className="text-sm text-red-600 mt-2">
                              Error: {log.errorMessage}
                            </p>
                          )}
                          {log.completedAt && (
                            <p className="text-xs text-slate-400 mt-2">
                              Completed: {new Date(log.completedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                  Add links to your other profiles and websites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Personal Website</label>
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    type="url"
                    data-testid="input-website"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Twitter / X</label>
                  <Input
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/yourusername"
                    type="url"
                    data-testid="input-twitter"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">LinkedIn</label>
                  <Input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourusername"
                    type="url"
                    data-testid="input-linkedin"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Google Scholar</label>
                  <Input
                    value={googleScholarUrl}
                    onChange={(e) => setGoogleScholarUrl(e.target.value)}
                    placeholder="https://scholar.google.com/citations?user=..."
                    type="url"
                    data-testid="input-google-scholar"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">ORCID</label>
                  <Input
                    value={orcidUrl}
                    onChange={(e) => setOrcidUrl(e.target.value)}
                    placeholder="https://orcid.org/0000-0000-0000-0000"
                    type="url"
                    data-testid="input-orcid"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">ResearchGate</label>
                  <Input
                    value={researchGateUrl}
                    onChange={(e) => setResearchGateUrl(e.target.value)}
                    placeholder="https://www.researchgate.net/profile/Your-Name"
                    type="url"
                    data-testid="input-researchgate"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-[#0B1F3A] hover:bg-[#1a3a5c]"
                  data-testid="button-save-social"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6 space-y-6">
            {/* Profile Visibility Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isPublic ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                  Profile Visibility
                </CardTitle>
                <CardDescription>
                  Control who can see your research portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                  <div className="space-y-1">
                    <Label htmlFor="profile-visibility" className="text-base font-medium">
                      Public Profile
                    </Label>
                    <p className="text-sm text-slate-500">
                      {isPublic 
                        ? "Your portfolio is visible to everyone on the internet" 
                        : "Your portfolio is hidden from public view"}
                    </p>
                  </div>
                  <Switch
                    id="profile-visibility"
                    checked={isPublic}
                    onCheckedChange={handlePrivacyToggle}
                    disabled={updateProfileMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>

            {/* CV/Resume Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  CV / Resume
                </CardTitle>
                <CardDescription>
                  Upload your CV to allow visitors to download it from your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.cvUrl ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800">CV Uploaded</p>
                      <p className="text-sm text-green-600">Your CV is available for download on your portfolio</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={profile.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCvMutation.mutate()}
                        disabled={deleteCvMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-3">No CV uploaded yet</p>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => cvInputRef.current?.click()}
                      disabled={uploadCvMutation.isPending}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadCvMutation.isPending ? "Uploading..." : "Upload CV"}
                    </Button>
                    <p className="text-xs text-slate-500 mt-2">PDF, DOC, or DOCX. Max 10MB.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Theme Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Portfolio Theme
                </CardTitle>
                <CardDescription>
                  Choose a color theme for your research portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {themesData?.filter(t => t.isActive).map((theme) => {
                    const colors = theme.config as { colors: { primary: string; accent: string } };
                    const isSelected = selectedThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-6 h-6 rounded-full border border-slate-200" 
                            style={{ backgroundColor: colors.colors.primary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-slate-200" 
                            style={{ backgroundColor: colors.colors.accent }}
                          />
                        </div>
                        <p className="text-sm font-medium text-left">{theme.name}</p>
                        {isSelected && (
                          <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {(!themesData || themesData.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No themes available. Contact your administrator.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Account Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account and portfolio settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Preview Portfolio</label>
                  {profile?.openalexId ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-700">See how visitors will view your portfolio</span>
                      <a
                        href={`/researcher/${profile.openalexId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
                        data-testid="link-preview-portfolio"
                      >
                        Preview
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Connect your OpenAlex ID to preview your portfolio
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">QR Code</label>
                  {profile?.openalexId ? (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <QrCode className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-purple-700">Download a QR code linking to your portfolio</span>
                      <a
                        href={`/api/researcher/${profile.openalexId}/qr-code${primaryDomain ? `?url=https://${primaryDomain.hostname}` : ''}`}
                        download={`${profile.displayName || 'portfolio'}-qr-code.png`}
                        className="ml-auto bg-purple-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-purple-700 flex items-center gap-1"
                        data-testid="link-download-qr"
                      >
                        <Download className="w-3 h-3" />
                        Download QR
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Connect your OpenAlex ID to generate a QR code
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Your Domain</label>
                  {primaryDomain ? (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">{primaryDomain.hostname}</span>
                      <a
                        href={`https://${primaryDomain.hostname}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        Visit Site
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Your domain will be assigned by the administrator
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Plan</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Badge className="capitalize">{tenant?.plan}</Badge>
                    <span className="text-sm text-slate-500">
                      Contact support to change your plan
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">OpenAlex ID</label>
                  <div className="flex gap-2">
                    <Input
                      value={openalexIdInput}
                      onChange={(e) => setOpenalexIdInput(e.target.value)}
                      placeholder="e.g., A5023888391"
                      className="flex-1"
                      data-testid="input-change-openalex-id"
                    />
                    <Button
                      variant="outline"
                      onClick={() => verifyOpenAlexMutation.mutate(openalexIdInput)}
                      disabled={!openalexIdInput || verifyOpenAlexMutation.isPending}
                      data-testid="button-update-openalex"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={!currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending}
                  className="bg-[#0B1F3A] hover:bg-[#1a3a5c]"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
