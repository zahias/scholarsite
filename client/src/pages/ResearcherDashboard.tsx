import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
  AlertCircle,
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
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    if (tenantData?.tenant?.profile) {
      const profile = tenantData.tenant.profile;
      setOpenalexIdInput(profile.openalexId || "");
      setDisplayName(profile.displayName || "");
      setTitle(profile.title || "");
      setBio(profile.bio || "");
      const social = profile.socialLinks || {};
      setWebsiteUrl(social.website || "");
      setTwitterUrl(social.twitter || "");
      setLinkedinUrl(social.linkedin || "");
      setGoogleScholarUrl(social.googleScholar || "");
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (websiteUrl) socialLinks.website = websiteUrl;
      if (twitterUrl) socialLinks.twitter = twitterUrl;
      if (linkedinUrl) socialLinks.linkedin = linkedinUrl;
      if (googleScholarUrl) socialLinks.googleScholar = googleScholarUrl;

      await updateProfileMutation.mutateAsync({
        displayName: displayName || null,
        title: title || null,
        bio: bio || null,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
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
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">
              <Globe className="w-4 h-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
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
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account and portfolio settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
