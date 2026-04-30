import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, LogOut, LayoutDashboard, Briefcase, UserCircle } from "lucide-react";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      logout();
      navigate("/");
    },
    onError: () => {
      // Even if server call fails, clear local state
      logout();
      navigate("/");
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" data-testid="link-logo">
          <span className="flex items-center gap-2 cursor-pointer">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="BankruptcyBet logo" className="shrink-0">
              <rect width="28" height="28" rx="6" fill="hsl(var(--secondary))" />
              <path d="M8 7h6.5c2.2 0 3.5 1.2 3.5 2.8 0 1.1-.6 1.9-1.5 2.3C17.8 12.5 19 13.5 19 15c0 2-1.5 3.2-3.8 3.2H8V7z" fill="hsl(var(--primary))" />
              <rect x="10" y="9" width="3.5" height="2.5" rx="0.5" fill="hsl(var(--secondary))" />
              <rect x="10" y="13" width="4" height="2.8" rx="0.5" fill="hsl(var(--secondary))" />
              <path d="M21 8 L7 20" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            </svg>
            <span className="font-semibold text-sm text-foreground hidden sm:block">
              <span className="text-primary">BB</span>et
            </span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm gap-1.5 ${location === "/dashboard" ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="link-dashboard"
                >
                  <LayoutDashboard size={14} />
                  Markets
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm gap-1.5 ${location === "/portfolio" ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="link-portfolio"
                >
                  <Briefcase size={14} />
                  Portfolio
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-1 ml-1 px-2 py-1 rounded bg-primary/10 border border-primary/20">
                <span className="text-xs text-muted-foreground">BB$</span>
                <span className="text-xs font-mono font-bold text-primary" data-testid="text-balance">
                  {user.bbBalance.toLocaleString()}
                </span>
              </div>
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm gap-1.5 ${location === "/profile" ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="link-profile"
                  title="Account & Password"
                >
                  <UserCircle size={14} />
                  <span className="hidden sm:block">{user.name.split(" ")[0]}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="text-muted-foreground hover:text-foreground ml-1"
                title="Log out"
                data-testid="btn-logout"
              >
                <LogOut size={14} />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-login">
                  Log in
                </Button>
              </Link>
              <Link href="/request-access">
                <Button size="sm" className="text-sm bg-primary text-primary-foreground hover:bg-primary/90" data-testid="link-request-access">
                  Request Access
                </Button>
              </Link>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground ml-1"
            data-testid="btn-theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
