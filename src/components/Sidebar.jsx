import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Gamepad2,
  BookMarked,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={22} />, path: "/dashboardlayout" },
    { name: "Quiz Game", icon: <Gamepad2 size={22} />, path: "/dashboardlayout/quiz-game" },
    { name: "Bookmarks", icon: <BookMarked size={22} />, path: "/dashboardlayout/bookmarks" },
    { name: "Word Helper", icon: <FileText size={22} />, path: "/dashboardlayout/word-helper" },
  ];

  useEffect(() => {
    const current = menuItems.find((m) => m.path === location.pathname);
    if (current) setActive(current.name);
    else if (location.pathname === "/") setActive("Dashboard");
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <>
      <div className="md:hidden fixed top-21 left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-black focus:outline-none bg-white rounded-md" // Added white background and rounded only for mobile
        >
          {isOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      <aside
        className={`fixed top-11 left-0 h-[calc(100vh-2rem)] w-56 bg-white border-r border-gray-200 shadow-md flex flex-col justify-between transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0`}
      >
        <div className="flex flex-col mt-20 space-y-2">
          {menuItems.map((item, index) => {
            const isActive = active === item.name;

            return (
              <React.Fragment key={item.name}>
                <button
                  onClick={() => {
                    setActive(item.name);
                    setIsOpen(false);
                    if (item.path) navigate(item.path);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 text-[17px] font-semibold rounded-md mx-4
                    ${isActive ? "bg-[#870022] text-white" : "text-black"}`}
                  style={{ width: "85%" }}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </button>

                {index < menuItems.length - 1 && (
                  <div className="border-b border-black/20 mx-6 my-1"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="mb-12 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-[17px] font-semibold rounded-md mx-4 text-black"
            style={{ width: "85%" }}
          >
            <LogOut
              size={22}
              className="transform scale-x-[-1]"
            />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
