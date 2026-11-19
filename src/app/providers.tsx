import type { PropsWithChildren } from "react";
import { ApplicationsProvider } from "@/features/applications/ApplicationsProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <ApplicationsProvider>{children}</ApplicationsProvider>
    </AuthProvider>
  );
}
