import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const DashboardNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is logged in
  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
    const token = authData.token;
    const isAtRoot = location.pathname === "/";
    
    if (isAtRoot) {
      // Reset auth and coins when at root
      localStorage.removeItem("czc_auth");
      localStorage.removeItem("token");
      localStorage.removeItem("coins");
      setIsLoggedIn(false);
      setCoinBalance(0);
    } else if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [location.pathname]);

  // Fetch coin balance from backend (only if logged in and not at root)
  const fetchCoinBalance = async () => {
    const isAtRoot = location.pathname === "/";
    if (isAtRoot) return;

    try {
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      let token = authData.token;
      
      if (!token && authData) {
        token = authData;
      }
      if (!token) {
        token = localStorage.getItem("token");
      }
      
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      console.log("Fetching coin balance from backend...");
      const response = await fetch("https://czc-eight.vercel.app/api/user/coins", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Coin balance response:", data);
        if (data.success && data.coins !== undefined) {
          console.log("Setting navbar coin balance to:", data.coins);
          setCoinBalance(data.coins);
          localStorage.setItem("coins", String(data.coins));
        } else {
          console.warn("Invalid coin balance response format:", data);
        }
      } else {
        console.error("Failed to fetch coin balance:", response.status);
      }
    } catch (error) {
      console.error("Error fetching coin balance:", error);
    }
  };

  // Listen for coin updates from other components
  useEffect(() => {
    const isAtRoot = location.pathname === "/";
    
    // Only fetch if not at root
    if (!isAtRoot) {
      fetchCoinBalance();
    }

    // Listen for custom coinUpdate events
    const handleCoinUpdate = (event) => {
      if (event.detail && event.detail.coins !== undefined) {
        setCoinBalance(event.detail.coins);
      } else if (!isAtRoot) {
        // Refetch from backend if no detail provided
        fetchCoinBalance();
      }
    };

    window.addEventListener("coinUpdate", handleCoinUpdate);

    // Also listen for storage changes (in case of multi-tab)
    const handleStorageChange = (e) => {
      if (e.key === "coins") {
        setCoinBalance(parseInt(e.newValue) || 0);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("coinUpdate", handleCoinUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [location.pathname]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard" },
    { id: "library", label: "Library", path: "/library" },
    { id: "challenges", label: "Challenges", path: "/challenges" },
    { id: "leaderboard", label: "Leaderboard", path: "/leaderboard" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("czc_auth");
    localStorage.removeItem("token");
    localStorage.removeItem("coins");
    navigate("/login");
    setIsOpen(false);
  };

  return (
    <nav className="bg-[#870022] text-white flex items-center justify-between fixed top-0 left-0 w-full z-50 shadow-md py-2 px-4 sm:px-8 md:px-16 lg:px-24">
      <img 
        src="/logo.png" 
        alt="Logo" 
        className="h-12 cursor-pointer" 
        onClick={() => navigate("/dashboard")}
      />

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-9 font-medium ml-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`text-lg pb-1 transition border-b-2 ${
              location.pathname === item.path
                ? "border-white"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            {item.label}
          </button>
        ))}
        
        {/* Coin Balance Display - Only show if logged in */}
        {isLoggedIn && (
          <div className="flex items-center gap-2 bg-white text-[#870022] px-4 py-1.5 rounded-full font-bold">
            <span className="text-yellow-500 text-xl">🪙</span>
            <span>{coinBalance}</span>
          </div>
        )}

        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="bg-white text-black font-semibold px-6 py-0.5 rounded-md hover:bg-gray-300 transition"
          >
            Logout
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden ml-auto" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-[60px] right-0 bg-[#870022] w-2/3 p-5 rounded-bl-xl shadow-lg flex flex-col items-center text-center md:hidden">
          {/* Coin Balance - Mobile - Only show if logged in */}
          {isLoggedIn && (
            <div className="flex items-center gap-2 bg-white text-[#870022] px-4 py-2 rounded-full font-bold mb-4">
              <span className="text-yellow-500 text-xl">🪙</span>
              <span>{coinBalance}</span>
            </div>
          )}

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              className={`text-lg py-2 w-full ${
                location.pathname === item.path ? "text-gray-300" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
          
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="mt-5 bg-white text-black font-semibold px-5 py-2 rounded-md hover:bg-gray-300"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default DashboardNavbar;