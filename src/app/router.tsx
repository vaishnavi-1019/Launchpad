import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RouteErrorPage } from "@/components/RouteErrorPage";
import { RouteLoadingFallback } from "@/components/RouteLoadingFallback";

export const router = createBrowserRouter([
  {
    path: "*",
    HydrateFallback: RouteLoadingFallback,
    lazy: async () => {
      const { NotFoundPage } = await import("@/components/NotFoundPage");
      return { Component: NotFoundPage };
    },
  },
  {
    path: "/auth",
    HydrateFallback: RouteLoadingFallback,
    lazy: async () => {
      const { AuthPage } = await import("@/features/auth/pages/AuthPage");
      return { Component: AuthPage };
    },
  },
  {
    path: "/",
    errorElement: <RouteErrorPage />,
    HydrateFallback: RouteLoadingFallback,
    lazy: async () => {
      const { DashboardLayout } = await import("@/components/layout/DashboardLayout");
      return { Component: DashboardLayout };
    },
    children: [
      {
        index: true,
        lazy: async () => {
          const { DashboardPage } = await import("@/features/dashboard/pages/DashboardPage");
          return { Component: DashboardPage };
        },
      },
      {
        path: "applications/:id",
        lazy: async () => {
          const { ApplicationDetailsPage } = await import(
            "@/features/applications/pages/ApplicationDetailsPage"
          );
          return { Component: ApplicationDetailsPage };
        },
      },
      {
        path: "applications",
        lazy: async () => {
          const { ApplicationsPage } = await import(
            "@/features/applications/pages/ApplicationsPage"
          );
          return { Component: ApplicationsPage };
        },
      },
      {
        path: "job-discovery",
        lazy: async () => {
          const { JobDiscoveryPage } = await import(
            "@/features/job-discovery/pages/JobDiscoveryPage"
          );
          return { Component: JobDiscoveryPage };
        },
      },
      {
        path: "match-analyzer",
        lazy: async () => {
          const { MatchAnalyzerPage } = await import(
            "@/features/match-analyzer/pages/MatchAnalyzerPage"
          );
          return { Component: MatchAnalyzerPage };
        },
      },
      {
        path: "interview-prep",
        lazy: async () => {
          const { InterviewPrepPage } = await import(
            "@/features/interview-prep/pages/InterviewPrepPage"
          );
          return { Component: InterviewPrepPage };
        },
      },
      {
        path: "skill-gap",
        lazy: async () => {
          const { SkillGapPage } = await import(
            "@/features/skill-gap/pages/SkillGapPage"
          );
          return { Component: SkillGapPage };
        },
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: "settings/profile",
            lazy: async () => {
              const { ProfileSettingsPage } = await import(
                "@/features/profile/pages/ProfileSettingsPage"
              );
              return { Component: ProfileSettingsPage };
            },
          },
          {
            path: "supabase-applications",
            lazy: async () => {
              const { SupabaseApplicationsPage } = await import(
                "@/features/applications/pages/SupabaseApplicationsPage"
              );
              return { Component: SupabaseApplicationsPage };
            },
          },
          {
            path: "supabase-check",
            lazy: async () => {
              const { SupabaseCheckPage } = await import(
                "@/features/supabase-check/pages/SupabaseCheckPage"
              );
              return { Component: SupabaseCheckPage };
            },
          },
        ],
      },
    ],
  },
]);
