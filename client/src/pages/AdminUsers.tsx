import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Key,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "admin" | "researcher";
  isActive: boolean;
  tenantId: string | null;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function AdminUsers() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "researcher">("researcher");

  // Edit user dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "researcher">("researcher");
  const [editIsActive, setEditIsActive] = useState(true);

  // Reset password dialog state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

  const { data: userData } = useQuery<{ user: CurrentUser }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: usersData, isLoading } = useQuery<{ users: UserData[] }>({
    queryKey: ["/api/admin/users"],
    enabled: !!userData?.user,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User Created", description: "The user has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; firstName?: string; lastName?: string; role?: string; isActive?: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User Updated", description: "The user has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, { newPassword });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Password Reset", description: "The password has been reset successfully." });
      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setResetNewPassword("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User Deleted", description: "The user has been deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetCreateForm = () => {
    setNewEmail("");
    setNewPassword("");
    setNewFirstName("");
    setNewLastName("");
    setNewRole("researcher");
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditDialogOpen(true);
  };

  const filteredUsers = (usersData?.users || []).filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.firstName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.lastName?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: usersData?.users?.length || 0,
    admins: usersData?.users?.filter((u) => u.role === "admin").length || 0,
    researchers: usersData?.users?.filter((u) => u.role === "researcher").length || 0,
    active: usersData?.users?.filter((u) => u.isActive).length || 0,
  };

  if (!userData?.user || userData.user.role !== "admin") {
    navigate("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">User Management</h1>
              <p className="text-sm text-slate-400">Manage platform users and permissions</p>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new user to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newRole} onValueChange={(v: "admin" | "researcher") => setNewRole(v)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="researcher">Researcher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-slate-600 text-slate-300">
                  Cancel
                </Button>
                <Button
                  onClick={() => createUserMutation.mutate({ email: newEmail, password: newPassword, firstName: newFirstName, lastName: newLastName, role: newRole })}
                  disabled={!newEmail || !newPassword || newPassword.length < 8 || createUserMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-slate-400">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.admins}</p>
                  <p className="text-xs text-slate-400">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.researchers}</p>
                  <p className="text-xs text-slate-400">Researchers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                  <p className="text-xs text-slate-400">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px] bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="researcher">Researcher</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 bg-white/5" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                <p className="text-slate-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === "admin" ? "bg-purple-500/20" : "bg-blue-500/20"}`}>
                            {user.role === "admin" ? (
                              <Shield className="w-4 h-4 text-purple-400" />
                            ) : (
                              <User className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={user.role === "admin" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem onClick={() => handleEditUser(user)} className="text-slate-300 focus:bg-white/10 focus:text-white">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setResetPasswordUser(user);
                                setResetPasswordDialogOpen(true);
                              }}
                              className="text-slate-300 focus:bg-white/10 focus:text-white"
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingUser(user);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                              disabled={user.id === userData?.user?.id}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update user information for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editRole}
                onValueChange={(v: "admin" | "researcher") => setEditRole(v)}
                disabled={editingUser?.id === userData?.user?.id}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="researcher">Researcher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {editingUser?.id === userData?.user?.id && (
                <p className="text-xs text-slate-500">You cannot change your own role</p>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <Label>Account Active</Label>
                <p className="text-xs text-slate-400">Inactive users cannot log in</p>
              </div>
              <Switch
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
                disabled={editingUser?.id === userData?.user?.id}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingUser &&
                updateUserMutation.mutate({
                  id: editingUser.id,
                  firstName: editFirstName,
                  lastName: editLastName,
                  role: editRole,
                  isActive: editIsActive,
                })
              }
              disabled={updateUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Set a new password for {resetPasswordUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() =>
                resetPasswordUser &&
                resetPasswordMutation.mutate({ id: resetPasswordUser.id, newPassword: resetNewPassword })
              }
              disabled={resetNewPassword.length < 8 || resetPasswordMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete {deletingUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() => deletingUser && deleteUserMutation.mutate(deletingUser.id)}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
