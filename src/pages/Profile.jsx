import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

const navItems = [
  { name: "Learning Progress", path: "/profile" },
  { name: "Profile Settings", path: "/profile/profile-settings" },
  { name: "Subscription", path: "/profile/subscription" },
];

const Profile = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FDEBD0] via-[#F1E5D5] to-[#FDEBD0]">
      <DashboardNavbar />

      <div className="p-6">
        <div className="flex justify-start items-center mt-[90px] mb-1">
          <div className="flex flex-wrap gap-3 sm:gap-4 ml-[30px]">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end
                className={({ isActive }) =>
                  `
                    text-center
                    px-4 py-2
                    font-medium 
                    rounded-md 
                    transition-all duration-200 
                    hover:scale-105
                    min-w-[130px]

                    border border-gray-400/80
                    shadow-md shadow-gray-400/40

                    ${
                      isActive
                        ? "bg-[#870022] text-white"
                        : "bg-white text-black"
                    }
                  `
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default Profile;
