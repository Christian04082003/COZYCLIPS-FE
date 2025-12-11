import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import coinIcon from "../assets/coins.png";
import defaultAvatar from "../assets/dafault.webp";

const DashboardNavbar = ({ profileImage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Home");
  const [savedImage, setSavedImage] = useState(null);
  const [coins, setCoins] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", path: "/dashboardlayout" },
    { name: "Library", path: "/library" },
    { name: "Challenges", path: "/challenges" },
    { name: "Shop", path: "/shop" }
  ];

  useEffect(() => {
    const current = navItems.find((item) => item.path === location.pathname);
    setActiveItem(current ? current.name : null);
  }, [location.pathname]);

  useEffect(() => {
    if (profileImage) {
      setSavedImage(profileImage);
      localStorage.setItem("profileImage", profileImage);
    } else {
      const stored = localStorage.getItem("profileImage");
      if (stored) setSavedImage(stored);
    }
  }, [profileImage]);

  useEffect(() => {
    const storedCoins = localStorage.getItem("coins");
    if (storedCoins) setCoins(parseInt(storedCoins, 10));
    
    // Fetch profile data (coins and avatar) from Firestore
    const fetchProfileFromFirestore = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
        const token = authData.token || authData?.data?.token || authData?.user?.token;
        const user = authData?.user || authData?.data?.user || authData?.data || authData;
        const userId = user?.id || user?.uid || user?.userId || user?.studentId || authData?.id;
        
        if (token && userId) {
          const response = await fetch(`https://czc-eight.vercel.app/api/student/profile/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const profile = data?.data?.profile;
            
            if (profile) {
              // Update coins if available
              if (profile.coins !== undefined) {
                setCoins(profile.coins);
                localStorage.setItem("coins", String(profile.coins));
              }
              
              // Update avatar if available
              if (profile.avatarUrl) {
                setSavedImage(profile.avatarUrl);
                localStorage.setItem("profileImage", profile.avatarUrl);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile from Firestore:", error);
      }
    };
    
    fetchProfileFromFirestore();
  }, []);

  useEffect(() => {
    // Listen for custom coin update event
    const handleCoinUpdate = (event) => {
      if (event.detail && event.detail.coins !== undefined) {
        setCoins(event.detail.coins);
      }
    };
    
    // Listen to localStorage changes and refetch from Firestore
    const handleStorage = async () => {
      const updatedCoins = localStorage.getItem("coins");
      if (updatedCoins) setCoins(parseInt(updatedCoins, 10));
      
      const updatedImage = localStorage.getItem("profileImage");
      if (updatedImage) setSavedImage(updatedImage);
      
      // Also refetch from Firestore to get latest data
      try {
        const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
        const token = authData.token || authData?.data?.token || authData?.user?.token;
        const user = authData?.user || authData?.data?.user || authData?.data || authData;
        const userId = user?.id || user?.uid || user?.userId || user?.studentId || authData?.id;
        
        if (token && userId) {
          const response = await fetch(`https://czc-eight.vercel.app/api/student/profile/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const profile = data?.data?.profile;
            
            if (profile?.avatarUrl) {
              setSavedImage(profile.avatarUrl);
              localStorage.setItem("profileImage", profile.avatarUrl);
            }
          }
        }
      } catch (error) {
        console.error("Error refetching profile:", error);
      }
    };
    
    window.addEventListener("coinUpdate", handleCoinUpdate);
    window.addEventListener("storage", handleStorage);
    
    return () => {
      window.removeEventListener("coinUpdate", handleCoinUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleNavClick = (item) => {
    setActiveItem(item);
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <nav
      className="bg-[#870022] text-white flex items-center justify-between fixed top-0 left-0 w-full z-50 px-4 sm:px-8 lg:px-16 xl:px-24"
      style={{
        height: "64px",
        boxSizing: "border-box",
        boxShadow:
          "56px 0 15px -5px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.2)"
      }}
    >
      <img src="/logo.png" alt="Logo" className="h-10 sm:h-12 flex-shrink-0" />

      <div className="hidden lg:flex items-center font-medium space-x-20">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => handleNavClick(item.name)}
            className={`text-base lg:text-lg border-b-[2px] transition-all duration-200 ${
              activeItem === item.name ? "border-white" : "border-transparent"
            }`}
            style={{
              height: "24px",
              display: "flex",
              alignItems: "center",
              paddingBottom: "2px",
              width: "80px",
              justifyContent: "center"
            }}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
        <div className="flex items-center space-x-2">
          <img src={coinIcon} alt="Coin Icon" className="h-6 w-6" />
          <span className="text-base font-medium inline-block text-right" style={{ width: "5px" }}>
            {coins}
          </span>
        </div>

        <div onClick={handleProfileClick} className="cursor-pointer">
          <img
            src={savedImage || defaultAvatar}
            alt="User Profile"
            className="h-10 w-10 rounded-full border-[2px] border-white object-cover"
          />
        </div>
      </div>

      <div className="flex lg:hidden items-center space-x-3 sm:space-x-4">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <img src={coinIcon} alt="Coin" className="h-5 w-5" />
          <span className="text-sm font-medium inline-block text-right" style={{ width: "30px" }}>
            {coins}
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="transition-transform duration-300 active:scale-90"
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-[64px] right-0 lg:hidden bg-[#870022] w-[60%] sm:w-[50%] p-5 rounded-bl-xl shadow-lg flex flex-col items-center space-y-3">
          <img
            src={savedImage || defaultAvatar}
            alt="User Profile"
            className="h-14 w-14 rounded-full border-[1px] border-white object-cover mb-4"
          />

          {navItems.map((item, index) => (
            <React.Fragment key={item.name}>
              <Link
                to={item.path}
                onClick={() => handleNavClick(item.name)}
                className="text-base sm:text-lg py-2 w-full text-white text-center"
              >
                {item.name}
              </Link>

              {index < navItems.length - 1 && (
                <div className="w-3/4 border-b border-gray-300 opacity-40 my-1.5"></div>
              )}
            </React.Fragment>
          ))}

          <div className="w-3/4 border-b border-gray-300 opacity-40 my-2"></div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="text-lg py-2 w-full text-white text-center"
          >
            Profile
          </Link>
        </div>
      )}
    </nav>
  );
};

export default DashboardNavbar;
