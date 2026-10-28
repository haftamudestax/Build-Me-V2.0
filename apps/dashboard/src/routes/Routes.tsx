import { Navigate, Route, Routes as RouterRoutes } from "react-router-dom";

import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { RoleRoute } from "../features/auth/components/RoleRoute";
import { LoginForm } from "../features/auth/components/LoginForm";
import { RegisterForm } from "../features/auth/components/RegisterForm";
import { ForgotPasswordForm } from "../features/auth/components/ForgotPasswordForm";
import { ResetPasswordForm } from "../features/auth/components/ResetPasswordForm";

import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";
import PublicLayout from "../layouts/PublicLayout/PublicLayout";

import { AnalyticsOverviewPage } from "../pages/analytics/AnalyticsOverviewPage";
import { NavbarAnalyticsPage } from "../pages/analytics/NavbarAnalyticsPage";
import { HeroAnalyticsPage } from "../pages/analytics/HeroAnalyticsPage";
import { DeliveryProjectAnalyticsPage } from "../pages/analytics/DeliveryProjectAnalyticsPage";
import { MentorMeAnalyticsPage } from "../pages/analytics/MentorMeAnalyticsPage";

function LoginPage() {
  return <LoginForm />;
}

function RegisterPage() {
  return <RegisterForm />;
}

function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

function DashboardHomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome to your Build Me dashboard.</p>
    </section>
  );
}

function UsersPage() {
  return <h1 className="text-2xl font-bold">User management</h1>;
}

function UnauthorizedPage() {
  return (
    <section className="space-y-2" role="alert">
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p>You do not have permission to access this page.</p>
    </section>
  );
}

function NotFoundPage() {
  return <h1 className="text-2xl font-bold">Page not found</h1>;
}

export default function AppRoutes() {
  return (
    <RouterRoutes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordForm />} />
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHomePage />} />

          <Route
            element={<RoleRoute allowedRoles={["admin", "super_admin"]} />}
          >
            <Route path="/dashboard/users" element={<UsersPage />} />

            <Route
              path="/dashboard/analytics"
              element={<AnalyticsOverviewPage />}
            />
            <Route
              path="/dashboard/analytics/navbar"
              element={<NavbarAnalyticsPage />}
            />
            <Route
              path="/dashboard/analytics/hero"
              element={<HeroAnalyticsPage />}
            />
            <Route
              path="/dashboard/analytics/delivery-project"
              element={<DeliveryProjectAnalyticsPage />}
            />
            <Route
              path="/dashboard/analytics/mentor-me"
              element={<MentorMeAnalyticsPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </RouterRoutes>
  );
}
