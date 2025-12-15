import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Globe, User, CheckCircle, Save, BookOpen } from "lucide-react";

const tenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  plan: z.enum(["starter", "professional", "institution"]),
  contactEmail: z.string().email().optional().or(z.literal("")),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  notes: z.string().optional(),
});

const domainSchema = z.object({
  hostname: z.string().min(1, "Domain is required"),
  isPrimary: z.boolean().default(false),
  isSubdomain: z.boolean().default(false),
});

const userSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type TenantForm = z.infer<typeof tenantSchema>;

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  contactEmail: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  notes: string | null;
  domains: Array<{ id: string; hostname: string; isPrimary: boolean; isSubdomain: boolean }>;
  users: Array<{ id: string; email: string; firstName: string; lastName: string }>;
  profile: { id: string; openalexId: string | null } | null;
}

export default function TenantFormPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/tenants/:id");
  const { toast } = useToast();
  const isNew = params?.id === "new";
  const tenantId = isNew ? null : params?.id;

  const [newDomain, setNewDomain] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [openalexId, setOpenalexId] = useState("");

  const { data: tenantData, isLoading } = useQuery<{ tenant: Tenant }>({
    queryKey: ["/api/admin/tenants", tenantId],
    enabled: !!tenantId,
  });

  const tenant = tenantData?.tenant;

  const form = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      plan: "starter",
      contactEmail: "",
      primaryColor: "#0B1F3A",
      accentColor: "#F2994A",
      notes: "",
    },
    values: tenant
      ? {
          name: tenant.name,
          plan: tenant.plan as "starter" | "professional" | "institution",
          contactEmail: tenant.contactEmail || "",
          primaryColor: tenant.primaryColor || "#0B1F3A",
          accentColor: tenant.accentColor || "#F2994A",
          notes: tenant.notes || "",
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: TenantForm) => {
      const response = await apiRequest("POST", "/api/admin/tenants", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Customer created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      navigate(`/admin/tenants/${data.tenant.id}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TenantForm) => {
      const response = await apiRequest("PATCH", `/api/admin/tenants/${tenantId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addDomainMutation = useMutation({
    mutationFn: async (hostname: string) => {
      const response = await apiRequest("POST", `/api/admin/tenants/${tenantId}/domains`, {
        hostname,
        isPrimary: !tenant?.domains?.length,
        isSubdomain: hostname.includes("scholarname"),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Domain added" });
      setNewDomain("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      await apiRequest("DELETE", `/api/admin/tenants/${tenantId}/domains/${domainId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Domain removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const response = await apiRequest("POST", `/api/admin/tenants/${tenantId}/users`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User created" });
      setNewUser({ email: "", password: "", firstName: "", lastName: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/tenants/${tenantId}/activate`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer activated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newOpenalexId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/tenants/${tenantId}/profile`, {
        openalexId: newOpenalexId || null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "OpenAlex ID updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants", tenantId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Sync openalexId state when tenant data loads
  const currentOpenalexId = tenant?.profile?.openalexId || "";
  useEffect(() => {
    if (currentOpenalexId) {
      setOpenalexId(currentOpenalexId);
    }
  }, [currentOpenalexId]);

  const onSubmit = (data: TenantForm) => {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-white/5 rounded"></div>
            <div className="h-96 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? "New Customer" : tenant?.name}
            </h1>
            {!isNew && tenant && (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={
                    tenant.status === "active"
                      ? "bg-green-500/20 text-green-300"
                      : tenant.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-slate-500/20 text-slate-300"
                  }
                >
                  {tenant.status}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-300">{tenant.plan}</Badge>
              </div>
            )}
          </div>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Customer Details</CardTitle>
            <CardDescription className="text-slate-400">
              Basic information about this customer site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Site Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Dr. John Smith Portfolio"
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="starter">Starter ($9/mo)</SelectItem>
                            <SelectItem value="professional">Professional ($19/mo)</SelectItem>
                            <SelectItem value="institution">Institution ($49/mo)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="contact@example.com"
                            className="bg-white/5 border-white/10 text-white"
                            data-testid="input-contact-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Internal notes about this customer..."
                          className="bg-white/5 border-white/10 text-white min-h-[80px]"
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isNew ? "Create Customer" : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {!isNew && tenant && (
          <>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Domains
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Custom domains for this customer's site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="text-white">{domain.hostname}</span>
                      {domain.isPrimary && (
                        <Badge className="bg-green-500/20 text-green-300">Primary</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDomainMutation.mutate(domain.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      data-testid={`button-delete-domain-${domain.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="drsmith.scholarname.com or dr-smith.com"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-new-domain"
                  />
                  <Button
                    onClick={() => newDomain && addDomainMutation.mutate(newDomain)}
                    disabled={!newDomain || addDomainMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600"
                    data-testid="button-add-domain"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Users
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Login credentials for this customer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                ))}

                <Separator className="bg-white/10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="First name"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-new-user-firstname"
                  />
                  <Input
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Last name"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-new-user-lastname"
                  />
                  <Input
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    type="email"
                    placeholder="Email"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-new-user-email"
                  />
                  <Input
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    type="password"
                    placeholder="Password (min 8 chars)"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-new-user-password"
                  />
                </div>
                <Button
                  onClick={() =>
                    newUser.email &&
                    newUser.password &&
                    newUser.firstName &&
                    newUser.lastName &&
                    addUserMutation.mutate(newUser)
                  }
                  disabled={
                    !newUser.email ||
                    !newUser.password ||
                    !newUser.firstName ||
                    !newUser.lastName ||
                    addUserMutation.isPending
                  }
                  className="bg-blue-500 hover:bg-blue-600"
                  data-testid="button-add-user"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add User
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  OpenAlex Profile
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Link this customer to their OpenAlex researcher profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                  <span className="text-slate-400 text-sm">Current:</span>
                  <span className="text-white font-mono">
                    {tenant.profile?.openalexId || "Not set"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={openalexId}
                    onChange={(e) => setOpenalexId(e.target.value)}
                    placeholder="A1234567890 (OpenAlex Author ID)"
                    className="bg-white/5 border-white/10 text-white font-mono"
                    data-testid="input-openalexid"
                  />
                  <Button
                    onClick={() => updateProfileMutation.mutate(openalexId)}
                    disabled={updateProfileMutation.isPending}
                    className="bg-purple-500 hover:bg-purple-600"
                    data-testid="button-update-openalexid"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Find the OpenAlex ID by searching on openalex.org. The ID starts with "A" followed by numbers.
                </p>
              </CardContent>
            </Card>

            {tenant.status === "pending" && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">Ready to activate?</h3>
                      <p className="text-slate-400">
                        Make sure you've added at least one domain and one user.
                      </p>
                    </div>
                    <Button
                      onClick={() => activateMutation.mutate()}
                      disabled={
                        tenant.domains.length === 0 ||
                        tenant.users.length === 0 ||
                        activateMutation.isPending
                      }
                      className="bg-green-500 hover:bg-green-600"
                      data-testid="button-activate"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate Customer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
