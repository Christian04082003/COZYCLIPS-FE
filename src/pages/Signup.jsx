  import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import sideImage from "../assets/Side-1.png";

const BASE_URL = "https://czc-eight.vercel.app";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [fadeState, setFadeState] = useState("enter");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setFadeState("visible"), 50);
  }, []);

  const handlePasswordChange = (e) => {
    setHasTyped(e.target.value.length > 0);
    handleChange(e);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginClick = () => {
    setFadeState("exit");
    setTimeout(() => navigate("/login"), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password } = formData;

    if (!firstName || !lastName || !email || !password) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.(com|ph)$/i;
    if (!emailPattern.test(email)) {
      alert("❌ Please use an email ending in '.com' or '.ph'.");
      return;
    }

    setLoading(true);
    try {
      const username = `${firstName} ${lastName}`.trim();
      const res = await fetch(`${BASE_URL}/api/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role: "student" }),
      });
      const data = await res.json();
      if (data && data.success) {
        // Store email, first name, last name, and full name for later use
        localStorage.setItem("email", email);
        localStorage.setItem("firstName", firstName);
        localStorage.setItem("lastName", lastName);
        localStorage.setItem("fullName", username);
        setIsSuccess(true);
      } else {
        alert(data?.message || "Failed to create account. Try again.");
      }
    } catch (err) {
      alert("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-white overflow-y-auto transition-all duration-700 ease-in-out ${
        fadeState === "visible"
          ? "opacity-100 translate-y-0 scale-100"
          : fadeState === "enter"
          ? "opacity-0 translate-y-6 scale-95"
          : "opacity-0 -translate-y-6 scale-95"
      }`}
    >
      <div className="w-[95%] md:w-[92%] lg:w-[88%] xl:w-[85%] min-h-[75vh] md:min-h-[70vh] bg-[#F3EBE2] rounded-none md:rounded-[20px] overflow-hidden shadow-2xl flex flex-col-reverse md:flex-row relative">
        <div
          className="flex-1 flex flex-col justify-center items-center text-white p-8 sm:p-10 md:p-14 lg:p-16 bg-cover bg-center text-center h-[45vh] sm:h-[50vh] md:h-auto"
          style={{ backgroundImage: `url(${sideImage})` }}
        >
          <p className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-semibold leading-relaxed max-w-lg drop-shadow-lg mb-6">
            To stay connected with us, please log in using your personal information.
          </p>
          <button
            onClick={handleLoginClick}
            className="bg-[#870022] border-2 border-[#AA9B9B] shadow-md shadow-gray-400/70 text-white 
            px-4 py-1.5 rounded-md hover:bg-[#a0002a] hover:scale-105 
            transition-all duration-500 ease-in-out text-sm font-semibold min-w-[100px]"
          >
            LOG IN
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center bg-[#f9f2ed] p-6 sm:p-10 md:p-14 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-lg transition-all duration-300">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 tracking-widest py-6">
              CREATE AN ACCOUNT
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7 text-base sm:text-lg">
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-lg sm:text-xl">
                  First name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your first name"
                  className="w-full border border-gray-400 rounded-md px-5 py-2 text-lg sm:text-xl font-medium text-gray-800 placeholder-gray-500/70 focus:outline-none focus:ring-2 focus:ring-[#870022]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-lg sm:text-xl">
                  Last name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your last name"
                  className="w-full border border-gray-400 rounded-md px-5 py-2 text-lg sm:text-xl font-medium text-gray-800 placeholder-gray-500/70 focus:outline-none focus:ring-2 focus:ring-[#870022]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-lg sm:text-xl">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  className="w-full border border-gray-400 rounded-md px-5 py-2 text-lg sm:text-xl font-medium text-gray-800 placeholder-gray-500/70 focus:outline-none focus:ring-2 focus:ring-[#870022]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-lg sm:text-xl">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Enter your password"
                    className="w-full border border-gray-400 rounded-md px-5 py-2 text-lg sm:text-xl font-medium text-gray-800 placeholder-gray-500/70 focus:outline-none focus:ring-2 focus:ring-[#870022]"
                  />
                  {hasTyped && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-[#870022] transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-[#870022] border-2 border-[#AA9B9B] shadow-md shadow-gray-400/50 text-white 
                  px-6 py-2 rounded-md hover:bg-[#a0002a] hover:scale-105 
                  transition-all duration-500 ease-in-out text-base font-semibold min-w-[120px]"
                >
                  {loading ? "Creating..." : "SIGN UP"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {isSuccess && (
          <div className="absolute inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm transition-all">
            <div className="bg-white/20 backdrop-blur-lg border border-white/50 rounded-3xl shadow-2xl flex flex-col justify-center items-center px-10 py-10 text-white text-center animate-fadeIn">
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow-2xl tracking-wider">
                🎉 Congratulations!
              </h2>
              <p className="text-xl sm:text-2xl mb-6 font-semibold drop-shadow-lg">
                Your account has been successfully created!
              </p>
              <button
                onClick={handleLoginClick}
                className="bg-[#870022] text-white px-6 py-2 rounded-md hover:bg-[#a0002a] hover:scale-105 transition-all duration-500 ease-in-out text-base font-semibold min-w-[120px] shadow-lg"
              >
                Continue to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;