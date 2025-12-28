import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Palette,
  Plus,
  Pencil,
  Trash2,
  Check,
  Star,
  Settings,
  Users,
  RefreshCw,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Theme, ThemeConfig } from "@shared/schema";

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const message = error.message;
    const splitIndex = message.indexOf(": ");
    if (splitIndex !== -1) {
      const maybeJson = message.slice(splitIndex + 2);
      try {
        const parsed = JSON.parse(maybeJson);
        if (parsed?.message) return parsed.message;
      } catch {
        return maybeJson;
      }
    }
    return message;
  }
  return fallback;
}

const defaultNewTheme: Partial<Theme> & { config: ThemeConfig } = {
  name: "",
  description: "",
  config: {
    colors: {
      primary: "#0B1F3A",
      primaryDark: "#061224",
      accent: "#F2994A",
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#1E293B",
      textMuted: "#64748B",
    },
  },
  isActive: true,
  isDefault: false,
};

interface TenantThemeInfo {
  id: string;
  name: string;
  currentThemeId: string | null;
  currentThemeName: string | null;
}

export default function AdminThemes() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [newTheme, setNewTheme] = useState(defaultNewTheme);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkApplyOpen, setIsBulkApplyOpen] = useState(false);
  const [selectedThemeForBulk, setSelectedThemeForBulk] = useState<Theme | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

  const { data: userData, isLoading: userLoading } = useQuery<{ user: CurrentUser }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: themesData, isLoading: themesLoading } = useQuery<Theme[]>({
    queryKey: ["/api/admin/themes"],
    enabled: !!userData?.user,
  });

  const createMutation = useMutation({
    mutationFn: async (theme: typeof newTheme) => {
      const payload = {
        ...theme,
        name: theme.name?.trim() || "",
      };
      return apiRequest("POST", "/api/admin/themes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      setIsCreateOpen(false);
      setNewTheme(defaultNewTheme);
      toast({ title: "Theme created", description: "The new theme has been created successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to create theme."), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      const payload = {
        ...theme,
        name: theme.name?.trim() || "",
      };
      return apiRequest("PATCH", `/api/admin/themes/${theme.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      setIsEditOpen(false);
      setEditingTheme(null);
      toast({ title: "Theme updated", description: "The theme has been updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to update theme."), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/themes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({ title: "Theme deleted", description: "The theme has been deleted." });
    },
    onError: (error) => {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to delete theme. Make sure no profiles are using it."), variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/themes/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({ title: "Default theme set", description: "The theme is now the default for new profiles." });
    },
    onError: (error) => {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to set default theme."), variant: "destructive" });
    },
  });

  const { data: tenantsData, isLoading: tenantsLoading, refetch: refetchTenants } = useQuery<TenantThemeInfo[]>({
    queryKey: ["/api/admin/themes/tenants"],
    enabled: !!userData?.user && isBulkApplyOpen,
  });

  const bulkApplyMutation = useMutation({
    mutationFn: async ({ themeId, tenantIds }: { themeId: string; tenantIds?: string[] }) => {
      return apiRequest("POST", `/api/admin/themes/${themeId}/apply-bulk`, { tenantIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes/tenants"] });
      setIsBulkApplyOpen(false);
      setSelectedThemeForBulk(null);
      setSelectedTenants([]);
      toast({ 
        title: "Theme applied", 
        description: data.message || "Theme has been applied to selected tenants." 
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to apply theme to tenants."), variant: "destructive" });
    },
  });

  const handleBulkApply = () => {
    if (!selectedThemeForBulk) return;
    bulkApplyMutation.mutate({
      themeId: selectedThemeForBulk.id,
      tenantIds: selectedTenants.length > 0 ? selectedTenants : undefined,
    });
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const selectAllTenants = () => {
    if (!tenantsData) return;
    setSelectedTenants(tenantsData.map(t => t.id));
  };

  const deselectAllTenants = () => {
    setSelectedTenants([]);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full bg-white/5" />
          <div className="grid gap-4">
            <Skeleton className="h-32 bg-white/5" />
            <Skeleton className="h-32 bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!userData?.user || userData.user.role !== "admin") {
    navigate("/admin/login");
    return null;
  }

  const themes = themesData || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Theme Management</h1>
              <p className="text-sm text-slate-400">Customize portfolio themes</p>
            </div>
          </div>
          <Link href="/admin">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10" data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-medium text-white">Available Themes</h2>
          <div className="flex items-center gap-2">
            <Dialog open={isBulkApplyOpen} onOpenChange={(open) => {
              setIsBulkApplyOpen(open);
              if (!open) {
                setSelectedThemeForBulk(null);
                setSelectedTenants([]);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" data-testid="button-bulk-apply">
                  <Users className="w-4 h-4 mr-2" />
                  Apply Theme to Sites
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Apply Theme to Sites</DialogTitle>
                  <DialogDescription>
                    Select a theme and apply it to all or selected sites. This will update the design across those sites.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Select Theme to Apply</Label>
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {themes.map((theme) => {
                        const config = theme.config as ThemeConfig;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => setSelectedThemeForBulk(theme)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              selectedThemeForBulk?.id === theme.id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-border hover:border-purple-500/50'
                            }`}
                            data-testid={`button-select-theme-${theme.id}`}
                          >
                            <div className="flex gap-1">
                              <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: config.colors.primary }} />
                              <div className="w-6 h-6 rounded border border-white/20 -ml-2" style={{ backgroundColor: config.colors.accent }} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium">{theme.name}</p>
                            </div>
                            {selectedThemeForBulk?.id === theme.id && (
                              <Check className="w-4 h-4 text-purple-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedThemeForBulk && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Select Sites</Label>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={selectAllTenants} className="text-xs h-7">
                            Select All
                          </Button>
                          <Button variant="ghost" size="sm" onClick={deselectAllTenants} className="text-xs h-7">
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Leave all unchecked to apply to ALL sites, or select specific sites.
                      </p>
                      {tenantsLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10" />
                          <Skeleton className="h-10" />
                        </div>
                      ) : tenantsData && tenantsData.length > 0 ? (
                        <div className="border rounded-lg max-h-48 overflow-y-auto">
                          {tenantsData.map((tenant) => (
                            <div
                              key={tenant.id}
                              className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
                            >
                              <Checkbox
                                id={`tenant-${tenant.id}`}
                                checked={selectedTenants.includes(tenant.id)}
                                onCheckedChange={() => toggleTenantSelection(tenant.id)}
                                data-testid={`checkbox-tenant-${tenant.id}`}
                              />
                              <label htmlFor={`tenant-${tenant.id}`} className="flex-1 cursor-pointer">
                                <p className="text-sm font-medium">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Current: {tenant.currentThemeName || 'Default theme'}
                                  {tenant.currentThemeId === selectedThemeForBulk.id && (
                                    <span className="ml-2 text-green-500">(Already using this theme)</span>
                                  )}
                                </p>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No sites found</p>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkApplyOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkApply}
                    disabled={!selectedThemeForBulk || bulkApplyMutation.isPending}
                    className="bg-purple-500 hover:bg-purple-600"
                    data-testid="button-confirm-bulk-apply"
                  >
                    {bulkApplyMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        Apply to {selectedTenants.length > 0 ? `${selectedTenants.length} Sites` : 'All Sites'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600" data-testid="button-create-theme">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Theme
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Theme</DialogTitle>
                <DialogDescription>
                  Define a new color theme for researcher portfolios.
                </DialogDescription>
              </DialogHeader>
              <ThemeForm
                theme={newTheme}
                onChange={(updated) => setNewTheme(updated)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createMutation.mutate(newTheme)}
                  disabled={!newTheme.name || createMutation.isPending}
                  data-testid="button-save-new-theme"
                >
                  {createMutation.isPending ? "Creating..." : "Create Theme"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {themesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 bg-white/5" />
            ))}
          </div>
        ) : themes.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <Palette className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No themes yet</h3>
              <p className="text-slate-400 mb-4">Create your first theme to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {themes.map((theme) => {
              const config = theme.config as ThemeConfig;
              return (
                <Card key={theme.id} className="bg-white/5 border-white/10" data-testid={`card-theme-${theme.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          <div
                            className="w-10 h-10 rounded-lg border-2 border-white/20"
                            style={{ backgroundColor: config.colors.primary }}
                          />
                          <div
                            className="w-10 h-10 rounded-lg border-2 border-white/20 -ml-3"
                            style={{ backgroundColor: config.colors.accent }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">{theme.name}</h3>
                            {theme.isDefault && (
                              <Badge className="bg-yellow-500/20 text-yellow-300">
                                <Star className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                            {!theme.isActive && (
                              <Badge className="bg-slate-500/20 text-slate-400">Inactive</Badge>
                            )}
                          </div>
                          {theme.description && (
                            <p className="text-sm text-slate-400">{theme.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!theme.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultMutation.mutate(theme.id)}
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                            data-testid={`button-set-default-${theme.id}`}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Dialog open={isEditOpen && editingTheme?.id === theme.id} onOpenChange={(open) => {
                          setIsEditOpen(open);
                          if (!open) setEditingTheme(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTheme(theme)}
                              className="text-slate-400 hover:text-white hover:bg-white/10"
                              data-testid={`button-edit-${theme.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Theme</DialogTitle>
                              <DialogDescription>
                                Update the theme colors and settings.
                              </DialogDescription>
                            </DialogHeader>
                            {editingTheme && (
                              <ThemeForm
                                theme={editingTheme}
                                onChange={(updated) => setEditingTheme(updated as Theme)}
                              />
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => editingTheme && updateMutation.mutate(editingTheme)}
                                disabled={updateMutation.isPending}
                                data-testid="button-save-edit-theme"
                              >
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        {!theme.isDefault && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                data-testid={`button-delete-${theme.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Theme</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{theme.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(theme.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

interface ThemeFormProps {
  theme: Partial<Theme> & { config: ThemeConfig };
  onChange: (theme: Partial<Theme> & { config: ThemeConfig }) => void;
}

function ThemeForm({ theme, onChange }: ThemeFormProps) {
  const updateColor = (colorKey: keyof ThemeConfig["colors"], value: string) => {
    onChange({
      ...theme,
      config: {
        ...theme.config,
        colors: {
          ...theme.config.colors,
          [colorKey]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Theme Name</Label>
          <Input
            id="name"
            value={theme.name || ""}
            onChange={(e) => onChange({ ...theme, name: e.target.value })}
            placeholder="e.g., Ocean Blue"
            data-testid="input-theme-name"
          />
        </div>
        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={theme.description || ""}
            onChange={(e) => onChange({ ...theme, description: e.target.value })}
            placeholder="e.g., A calm, professional blue theme"
            data-testid="input-theme-description"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <ColorInput
            label="Primary"
            value={theme.config.colors.primary}
            onChange={(v) => updateColor("primary", v)}
          />
          <ColorInput
            label="Primary Dark"
            value={theme.config.colors.primaryDark}
            onChange={(v) => updateColor("primaryDark", v)}
          />
          <ColorInput
            label="Accent"
            value={theme.config.colors.accent}
            onChange={(v) => updateColor("accent", v)}
          />
          <ColorInput
            label="Background"
            value={theme.config.colors.background}
            onChange={(v) => updateColor("background", v)}
          />
          <ColorInput
            label="Surface"
            value={theme.config.colors.surface}
            onChange={(v) => updateColor("surface", v)}
          />
          <ColorInput
            label="Text"
            value={theme.config.colors.text}
            onChange={(v) => updateColor("text", v)}
          />
          <ColorInput
            label="Text Muted"
            value={theme.config.colors.textMuted}
            onChange={(v) => updateColor("textMuted", v)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <Label htmlFor="isActive">Active</Label>
          <p className="text-xs text-muted-foreground">Show this theme in the theme picker</p>
        </div>
        <Switch
          id="isActive"
          checked={theme.isActive ?? true}
          onCheckedChange={(checked) => onChange({ ...theme, isActive: checked })}
          data-testid="switch-theme-active"
        />
      </div>

      <div className="p-4 rounded-lg border" style={{ backgroundColor: theme.config.colors.surface }}>
        <p className="text-sm font-medium" style={{ color: theme.config.colors.text }}>Preview</p>
        <div
          className="mt-2 p-3 rounded-md"
          style={{ backgroundColor: theme.config.colors.primary }}
        >
          <p className="text-white text-sm">Primary Background</p>
        </div>
        <p className="mt-2 text-xs" style={{ color: theme.config.colors.textMuted }}>
          Muted text example
        </p>
        <div
          className="mt-2 inline-block px-3 py-1 rounded-full text-white text-xs"
          style={{ backgroundColor: theme.config.colors.accent }}
        >
          Accent Badge
        </div>
      </div>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded border border-border cursor-pointer"
      />
      <div className="flex-1">
        <Label className="text-xs">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono"
        />
      </div>
    </div>
  );
}
