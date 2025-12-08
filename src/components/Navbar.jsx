import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("discover");
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "discover", label: "Discover" },
    { id: "features", label: "Features" },
    { id: "stories", label: "Stories" },
    { id: "about", label: "About" },
  ];

  useEffect(() => {
    if (location.pathname !== "/") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px 0px 0px" }
    );

    navItems.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    setActiveSection("discover");

    return () => observer.disconnect();
  }, [location.pathname]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = element.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top: offset, behavior: "smooth" });

    setActiveSection(id);
    setIsOpen(false);
  };

  const goToLogin = () => {
    navigate("/login");
    setIsOpen(false);
  };

  return (
    <nav className="bg-[#870022] text-white flex items-center justify-between fixed top-0 left-0 w-full z-50 shadow-md py-2 px-4 sm:px-8 md:px-16 lg:px-24">
      <img src="/logo.png" alt="Logo" className="h-12" />


      <div className="hidden md:flex items-center space-x-9 font-medium ml-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`text-lg pb-1 transition border-b-2 ${
              activeSection === item.id
                ? "border-white"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={goToLogin}
          className="bg-white text-black font-semibold px-6 py-0.5 rounded-md hover:bg-gray-300 transition"
        >
          Login
        </button>
      </div>


      <button className="md:hidden ml-auto" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>


      {isOpen && (
        <div className="absolute top-[60px] right-0 bg-[#870022] w-2/3 p-5 rounded-bl-xl shadow-lg flex flex-col items-center text-center md:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`text-lg py-2 w-full ${
                activeSection === item.id ? "text-gray-300" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={goToLogin}
            className="mt-5 bg-white text-black font-semibold px-5 py-2 rounded-md hover:bg-gray-300"
          >
            Login
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;