import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const ADMIN_KEY = "bb-admin-2026";

interface AccessRequest {
  id: number;
  name: string;
  email: string;
  firm: string;
  role: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

export default function Admin() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [keyError, setKeyError] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  function checkKey() {
    if (key.trim() === ADMIN_KEY) { setAuthed(true); setKeyError(""); }
    else setKeyError("Incorrect admin key.");
  }

  const { data: requests = [], isLoading } = useQuery<AccessRequest[]>({
    queryKey: ["admin-requests"],
    enabled: authed,
    queryFn: async () => {
      const res = await fetch("/api/admin/requests", { headers: { "x-admin-key": ADMIN_KEY } });
      return res.json();
    },
    refetchInterval: 30000,
  });

  const approveMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST", headers: { "x-admin-key": ADMIN_KEY },
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-requests"] }); toast({ title: "Approved" }); },
  });

  const denyMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/requests/${id}/deny`, {
        method: "POST", headers: { "x-admin-key": ADMIN_KEY },
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-requests"] }); toast({ title: "Denied" }); },
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
          <div className="w-full max-w-xs text-center space-y-4">
            <h1 className="text-xl font-bold">Admin Access</h1>
            <Input
              type="password"
              placeholder="Admin key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkKey()}
              autoFocus
            />
            {keyError && <p className="text-xs text-destructive">{keyError}</p>}
            <Button onClick={checkKey} className="w-full">Enter</Button>
          </div>
        </div>
      </div>
    );
  }

  const pending = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Access Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pending.length} pending · {reviewed.length} reviewed
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-requests"] })}>
            Refresh
          </Button>
        </div>

        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

        {/* Pending */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Pending Review
            </h2>
            <div className="space-y-3">
              {pending.map(r => (
                <div key={r.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.firm} · {r.role}</p>
                      <p className="text-sm text-primary mt-0.5">{r.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(r.createdAt)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => approveMut.mutate(r.id)}
                        disabled={approveMut.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => denyMut.mutate(r.id)}
                        disabled={denyMut.isPending}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No pending requests</p>
            <p className="text-sm mt-1">New requests will appear here automatically.</p>
          </div>
        )}

        {/* Reviewed */}
        {reviewed.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Previously Reviewed
            </h2>
            <div className="space-y-2">
              {reviewed.map(r => (
                <div key={r.id} className="border border-border rounded-lg p-3 bg-card flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm text-foreground">{r.name} · <span className="text-muted-foreground">{r.firm}</span></p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </div>
                  <Badge variant={r.status === "approved" ? "default" : "destructive"}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
