import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar/Navbar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <Navbar />
      <Outlet />
    </div>
  );
}
