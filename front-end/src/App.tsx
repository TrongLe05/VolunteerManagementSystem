import { Login } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { Route, Routes } from "react-router";
import Home from "./pages/Home";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { MyRegistrationsPage } from "./pages/MyRegistrationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminLayout } from "./components/layout/admin/AdminLayout";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminActivitiesPage } from "./pages/admin/AdminActivitiesPage";
import { AdminActivityAttendancePage } from "./pages/admin/AdminActivityAttendancePage";
import { AdminCampaignsPage } from "./pages/admin/AdminCampaignsPage";
import { AdminOrganizationsPage } from "./pages/admin/AdminOrganizationsPage";
import { AdminVolunteersPage } from "./pages/admin/AdminVolunteersPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { MainLayout } from "./components/layout/MainLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { ChangePasswordPage } from "./pages/auth/ChangePasswordPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { VerifyOtpPage } from "./pages/auth/VerifyOtpPage";
import { DetailActivitiesPage } from "./pages/DetailActivitiesPage";

function App() {
  return (
    <Routes>
      {/* 1. Phân hệ Khách & Tình nguyện viên (MainLayout có Navbar) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/activities">
          <Route index element={<ActivitiesPage />} />
          <Route path=":id" element={<DetailActivitiesPage />} />
        </Route>
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/my-registrations" element={<MyRegistrationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/account" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 2. Phân hệ Quản trị riêng biệt có Sidebar (AdminLayout) */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["SUPER_ADMIN", "ORGANIZATION_ADMIN"]}
          />
        }
      >
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="activities" element={<AdminActivitiesPage />} />
          <Route
            path="activities/:id/attendance"
            element={<AdminActivityAttendancePage />}
          />
          <Route path="campaigns" element={<AdminCampaignsPage />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="volunteers" element={<AdminVolunteersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      {/* 3. Phân hệ Xác thực (Auth) */}
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

export default App;
