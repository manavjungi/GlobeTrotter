import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell/AppShell";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute/ProtectedRoute";
import { CreateTripPage } from "@/pages/CreateTrip/CreateTrip";
import { DashboardPage } from "@/pages/Dashboard/Dashboard";
import { MyTripsPage } from "@/pages/MyTrips/MyTrips";
import { LoginPage } from "@/pages/Login/Login";
import { RegisterPage } from "@/pages/Register/Register";
import { TripDetailsPage } from "@/pages/TripDetails/TripDetails";

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
          <Route path="/trips" element={<MyTripsPage />} />
          <Route path="/trips/create" element={<CreateTripPage />} />
          <Route path="/trips/:tripId/edit" element={<CreateTripPage />} />
          <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
