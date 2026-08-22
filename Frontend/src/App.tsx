import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell/AppShell";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute/ProtectedRoute";
import { ComingSoonPage } from "@/pages/ComingSoon/ComingSoon";
import { DashboardPage } from "@/pages/Dashboard/Dashboard";
import { LoginPage } from "@/pages/Login/Login";
import { RegisterPage } from "@/pages/Register/Register";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trips/create" element={<ComingSoonPage title="Create Trip" />} />
          <Route path="/trips/:tripId" element={<ComingSoonPage title="Trip Details" />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
