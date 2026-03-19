import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

function LoadingSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}

const SearchPage = lazy(() => import("@/pages/SearchPage").then((m) => ({ default: m.SearchPage })));
const MyRequestsPage = lazy(() => import("@/pages/MyRequestsPage").then((m) => ({ default: m.MyRequestsPage })));
const ComparePage = lazy(() => import("@/pages/ComparePage").then((m) => ({ default: m.ComparePage })));
const CreditsPage = lazy(() => import("@/pages/CreditsPage").then((m) => ({ default: m.CreditsPage })));
const NotificationPrefsPage = lazy(() => import("@/pages/NotificationPrefsPage").then((m) => ({ default: m.NotificationPrefsPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));

const OrgLayout = lazy(() => import("@/pages/org/OrgLayout").then((m) => ({ default: m.OrgLayout })));
const OrgOverviewPage = lazy(() => import("@/pages/org/OrgOverviewPage").then((m) => ({ default: m.OrgOverviewPage })));
const OrgNewsPage = lazy(() => import("@/pages/org/OrgNewsPage").then((m) => ({ default: m.OrgNewsPage })));
const OrgAnalysisPage = lazy(() => import("@/pages/org/OrgAnalysisPage").then((m) => ({ default: m.OrgAnalysisPage })));
const OrgGraphPage = lazy(() => import("@/pages/org/OrgGraphPage").then((m) => ({ default: m.OrgGraphPage })));
const OrgAnnualReportsPage = lazy(() => import("@/pages/org/OrgAnnualReportsPage").then((m) => ({ default: m.OrgAnnualReportsPage })));
const OrgChatPage = lazy(() => import("@/pages/org/OrgChatPage").then((m) => ({ default: m.OrgChatPage })));

const AdminOrgsPage = lazy(() => import("@/pages/admin/AdminOrgsPage").then((m) => ({ default: m.AdminOrgsPage })));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage })));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage })));
const AdminDataSourcesPage = lazy(() => import("@/pages/admin/AdminDataSourcesPage").then((m) => ({ default: m.AdminDataSourcesPage })));
const AdminSeedPage = lazy(() => import("@/pages/admin/AdminSeedPage").then((m) => ({ default: m.AdminSeedPage })));
const AdminPricingPage = lazy(() => import("@/pages/admin/AdminPricingPage").then((m) => ({ default: m.AdminPricingPage })));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<SearchPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="requests" element={<MyRequestsPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="credits" element={<CreditsPage />} />
          <Route path="settings/notifications" element={<NotificationPrefsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route path="org/:id" element={<OrgLayout />}>
            <Route index element={<OrgOverviewPage />} />
            <Route path="news" element={<OrgNewsPage />} />
            <Route path="analysis" element={<OrgAnalysisPage />} />
            <Route path="graph" element={<OrgGraphPage />} />
            <Route path="annual-reports" element={<OrgAnnualReportsPage />} />
            <Route path="chat" element={<OrgChatPage />} />
          </Route>

          <Route path="admin/organizations" element={<AdminOrgsPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/settings" element={<AdminSettingsPage />} />
          <Route path="admin/data-sources" element={<AdminDataSourcesPage />} />
          <Route path="admin/seed" element={<AdminSeedPage />} />
          <Route path="admin/pricing" element={<AdminPricingPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
