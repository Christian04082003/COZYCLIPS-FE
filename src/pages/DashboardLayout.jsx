import React from "react";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import { Outlet } from "react-router-dom";
import StreakWidget from "../components/StreakWidget";

const DashboardLayout = () => {
  return (
    <>
      <StreakWidget />

      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex-1 md:ml-56 h-full overflow-hidden">
          <DashboardNavbar />

          <div className="h-full overflow-hidden">
            <div className="w-full h-full overflow-hidden">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
