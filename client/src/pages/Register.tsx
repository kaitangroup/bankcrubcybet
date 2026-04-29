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
import { ArrowRight, Lock } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword: _, ...payload } = data;
      const res = await apiRequest("POST", "/api/auth/register", payload);
      return res.json();
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({
        title: "Account created!",
        description: `Welcome, ${data.user.name}! You start with BB$50,000.`,
      });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="w-full max-w-sm">
          {/* Access Required Banner */}
          <Link href="/request-access">
            <div
              className="flex items-center justify-between mb-5 px-4 py-3 rounded-lg border border-primary/40 bg-primary/8 cursor-pointer hover:bg-primary/12 transition-colors group"
              data-testid="banner-request-access"
            >
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-primary shrink-0" />
                <span className="text-sm text-primary font-medium">
                  Need access? Request it here
                </span>
              </div>
              <ArrowRight size={14} className="text-primary group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your email must be pre-approved to register
            </p>
          </div>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Smith"
                    {...register("name")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-register-name"
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-register-email"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    {...register("password")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-register-password"
                  />
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    {...register("confirmPassword")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-register-confirm"
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  disabled={mutation.isPending}
                  data-testid="btn-register-submit"
                >
                  {mutation.isPending ? "Creating account…" : "Create Account"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-to-login">
                  Log in
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
