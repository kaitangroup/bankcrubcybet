import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import SiteGate from "@/components/SiteGate";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RequestAccess from "@/pages/RequestAccess";
import Admin from "@/pages/Admin";
import Dashboard from "@/pages/Dashboard";
import Portfolio from "@/pages/Portfolio";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/request-access" component={RequestAccess} />
        <Route path="/admin" component={Admin} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/portfolio" component={Portfolio} />
        <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SiteGate>
            <AppRouter />
            <Toaster />
          </SiteGate>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
