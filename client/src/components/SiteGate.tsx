// SiteGate removed — access is now controlled by admin-approved accounts.
// This component is a passthrough so the app renders normally.
import React from "react";
export default function SiteGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
