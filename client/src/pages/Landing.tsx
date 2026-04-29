import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Lock } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="text-secondary-foreground/40 hover:text-secondary-foreground"
          aria-label="Toggle theme"
          data-testid="btn-theme-toggle"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </Button>
      </div>

      {/* Centered gate */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo mark */}
        <div className="mb-8">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" aria-label="BankruptcyBet logo">
            <rect width="28" height="28" rx="6" fill="hsl(var(--primary) / 0.15)" />
            <path d="M8 7h6.5c2.2 0 3.5 1.2 3.5 2.8 0 1.1-.6 1.9-1.5 2.3C17.8 12.5 19 13.5 19 15c0 2-1.5 3.2-3.8 3.2H8V7z" fill="hsl(var(--primary))" />
            <rect x="10" y="9" width="3.5" height="2.5" rx="0.5" fill="hsl(var(--secondary))" />
            <rect x="10" y="13" width="4" height="2.8" rx="0.5" fill="hsl(var(--secondary))" />
            <path d="M21 8 L7 20" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          </svg>
        </div>

        {/* Site name */}
        <h1 className="text-xl font-semibold text-secondary-foreground mb-1 tracking-tight">
          <span className="text-primary">BB</span>et
        </h1>
        <p className="text-sm text-secondary-foreground/40 mb-10">
          bankruptcybets.com
        </p>

        {/* Lock icon */}
        <div className="mb-6 w-10 h-10 rounded-full border border-secondary-foreground/10 flex items-center justify-center">
          <Lock size={16} className="text-secondary-foreground/40" />
        </div>

        {/* Gate message */}
        <p className="text-sm text-secondary-foreground/50 mb-8 text-center max-w-xs">
          This platform is invite-only.<br />Request access to continue.
        </p>

        {/* CTAs */}
        {user ? (
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-10"
              data-testid="btn-open-dashboard"
            >
              Open Dashboard
            </Button>
          </Link>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <Link href="/request-access" className="w-full">
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                data-testid="btn-request-access"
              >
                Request Access
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-secondary-foreground/40 hover:text-secondary-foreground text-sm"
                data-testid="btn-login"
              >
                Already have an account? Log in
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-xs text-secondary-foreground/20">
        BankruptcyBet LLC · Delaware · © {new Date().getFullYear()}
      </div>
    </div>
  );
}
