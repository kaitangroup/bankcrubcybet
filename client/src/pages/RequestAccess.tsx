import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const schema = z.object({
  name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  firm: z.string().min(1, "Firm or organization required"),
  role: z.string().min(1, "Your role or title required"),
});
type FormData = z.infer<typeof schema>;

export default function RequestAccess() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", firm: "", role: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/access-request", data);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      return json;
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: any) => {
      toast({ title: "Could not submit request", description: err.message, variant: "destructive" });
    },
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
          <div className="w-full max-w-sm text-center">
            <div className="text-4xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Request Received</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your request has been sent to Roland Gary Jones, Esq. for review.
              You will be contacted at the email you provided once your access is approved.
            </p>
            <p className="text-xs text-muted-foreground">
              Already approved?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Create your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Request Access</h1>
            <p className="text-sm text-muted-foreground mt-1">
              BankruptcyBet is invitation-only. Submit your information for review.
            </p>
          </div>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
                  <Input id="name" type="text" placeholder="Jane Smith" {...register("name")}
                    className="mt-1 bg-background border-input" />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Work Email</Label>
                  <Input id="email" type="email" placeholder="you@firm.com" {...register("email")}
                    className="mt-1 bg-background border-input" />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="firm" className="text-xs text-muted-foreground">Firm / Organization</Label>
                  <Input id="firm" type="text" placeholder="Ares Capital, Blue Owl, etc." {...register("firm")}
                    className="mt-1 bg-background border-input" />
                  {errors.firm && <p className="text-xs text-destructive mt-1">{errors.firm.message}</p>}
                </div>
                <div>
                  <Label htmlFor="role" className="text-xs text-muted-foreground">Your Role / Title</Label>
                  <Input id="role" type="text" placeholder="Credit Risk Officer, Portfolio Manager…" {...register("role")}
                    className="mt-1 bg-background border-input" />
                  {errors.role && <p className="text-xs text-destructive mt-1">{errors.role.message}</p>}
                </div>
                <Button type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  disabled={mutation.isPending}>
                  {mutation.isPending ? "Submitting…" : "Request Access"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
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
