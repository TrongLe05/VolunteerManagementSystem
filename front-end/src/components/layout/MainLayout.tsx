import { useEffect } from "react";
import { Outlet } from "react-router";
import Navbar from "./Navbar";
import { dashboardSignalR } from "@/services/dashboardSignalR";

export const MainLayout = () => {
  useEffect(() => {
    dashboardSignalR.start();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
