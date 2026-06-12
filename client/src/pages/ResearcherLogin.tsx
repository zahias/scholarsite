import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import GlobalNav from "@/components/GlobalNav";
import SEO from "@/components/SEO";
import { Lock, Mail, GraduationCap } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function ResearcherLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user.role === "admin") {
        toast({
          title: "Admin Account",
          description: "Redirecting to admin panel...",
        });
        navigate("/admin");
        return;
      }
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.firstName}`,
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="auth-page-shell">
      <SEO
        title="Sign In — Scholar.name"
        description="Sign in to manage your academic portfolio on Scholar.name."
        url="https://scholar.name/dashboard/login"
        type="website"
      />
      <GlobalNav mode="auth" />
      <div className="auth-center">
      <Card className="auth-card">
        <CardHeader className="text-center">
          <div className="auth-mark">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="auth-title">Scholar.name</h1>
          <CardDescription className="auth-copy">
            Sign in to manage your academic portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@university.edu"
                          className="pl-10"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <a href="/forgot-password" className="text-xs text-slate-500 hover:underline">Forgot password?</a>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant="nav-cta"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Need an account?{" "}
            <a href="/contact" className="font-medium text-primary-container underline decoration-secondary-container underline-offset-2">
              Contact us
            </a>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
