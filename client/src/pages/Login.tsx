import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, user } = useAuth();

  // If already logged in, redirect immediately
  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Login failed");
      return body;
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      // navigate is triggered by the useEffect above once user state updates
    },
    onError: (err: any) => {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Log in to your BankruptcyBet account</p>
          </div>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-login-email"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-login-password"
                  />
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  disabled={mutation.isPending}
                  data-testid="btn-login-submit"
                >
                  {mutation.isPending ? "Logging in…" : "Log In"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                No account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-to-register">
                  Sign up free
                </Link>
              </p>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Demo platform only. No real money. CFTC approval pending.
          </p>
        </div>
      </div>
    </div>
  );
}
