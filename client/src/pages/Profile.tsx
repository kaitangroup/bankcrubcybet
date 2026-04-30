import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { User, KeyRound, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(6, "At least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      reset();
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Account info */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground mb-1">Account</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and security settings</p>
        </div>

        <Card className="mb-6 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <User size={14} />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium text-foreground" data-testid="text-profile-name">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground" data-testid="text-profile-email">{user?.email}</span>
            </div>
            {user?.firm && (
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Firm</span>
                <span className="text-sm font-medium text-foreground">{user.firm}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">BB$ Balance</span>
              <span className="text-sm font-mono font-bold text-primary" data-testid="text-profile-balance">
                BB${user?.bbBalance?.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <KeyRound size={14} />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex items-center gap-2 py-4 text-green-600 dark:text-green-400">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Password changed successfully.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Your current password"
                    {...register("currentPassword")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-current-password"
                  />
                  {errors.currentPassword && <p className="text-xs text-destructive mt-1">{errors.currentPassword.message}</p>}
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="At least 6 characters"
                    {...register("newPassword")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-new-password"
                  />
                  {errors.newPassword && <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat new password"
                    {...register("confirmPassword")}
                    className="mt-1 bg-background border-input"
                    data-testid="input-confirm-password"
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  disabled={mutation.isPending}
                  data-testid="btn-change-password"
                >
                  {mutation.isPending ? "Updating…" : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
