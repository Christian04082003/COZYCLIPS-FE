import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import sideImage from "../assets/Side-1.png";

const BASE_URL = "https://czc-eight.vercel.app";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [fadeState, setFadeState] = useState("enter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setFadeState("visible"), 50);
  }, []);

  const handlePasswordChange = (e) => {
    setHasTyped(e.target.value.length > 0);
    setPassword(e.target.value);
  };

  const handleNavigate = (path) => {
    setFadeState("exit");
    setTimeout(() => navigate(path), 600);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "student" }),
      });
      const data = await res.json();
      if (data && data.success) {
        const token = data.data?.token;
        const user = data.data?.user;
        const userId = user?.id || user?.uid || user?.userId || user?.studentId;

        if (!token || !userId) {
          alert("Invalid login response. Please try again.");
          setLoading(false);
          return;
        }

        // Verify profile exists in Firestore before setting auth
        const profileRes = await fetch(`${BASE_URL}/api/student/profile/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!profileRes.ok) {
          alert("This account no longer exists. Please contact support or sign up again.");
          setLoading(false);
          return;
        }

        try {
          localStorage.setItem("czc_auth", JSON.stringify(data.data || {}));
          if (user?.email) {
            localStorage.setItem("email", user.email);
          }
        } catch (err) { }
        navigate("/dashboardlayout");
      } else {
        alert(data?.message || "Invalid email or password.");
      }
    } catch (err) {
      alert("Failed to login. Please try again.");
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
      <div
        className="w-[95%] md:w-[92%] lg:w-[88%] xl:w-[85%] min-h-[100vh] md:min-h-[80vh] bg-[#F3EBE2] 
        rounded-none md:rounded-[20px] overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >

        <div className="order-1 flex-1 flex flex-col items-center bg-[#f9f2ed] p-6 sm:p-10 md:p-14 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-lg transition-all duration-300">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 tracking-widest py-10">
              LOG IN
            </h2>

            <form onSubmit={handleLogin} className="space-y-7 sm:space-y-8 text-lg sm:text-xl">
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-xl sm:text-2xl">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full border border-gray-400 rounded-md px-5 py-3.5 text-lg sm:text-xl font-medium text-gray-800 placeholder-gray-500/70 focus:outline-none focus:ring-2 focus:ring-[#870022]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-xl sm:text-2xl">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    className="w-full border border-gray-400 rounded-md px-5 py-3.5 text-lg sm:text-xl font-medium text-gray-800 placeholder-gray-500/70 focus:outline-none focus:ring-2 focus:ring-[#870022]"
                  />
                  {hasTyped && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-[#870022] transition"
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#870022] border-2 border-[#AA9B9B] shadow-md shadow-gray-400/50 text-white 
                  px-6 py-2 rounded-md hover:bg-[#a0002a] hover:scale-105 
                  transition-all duration-500 ease-in-out text-base font-semibold min-w-[120px]"
                >
                  {loading ? "Logging in..." : "LOG IN"}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigate("/forgot-password")}
                  className="text-[#870022] text-base sm:text-lg font-medium hover:underline transition-all"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        </div>

        <div
          className="order-2 flex-1 flex flex-col justify-center items-center text-white p-8 sm:p-10 md:p-14 lg:p-16 bg-cover bg-center text-center h-[45vh] sm:h-[50vh] md:h-auto mb-6 sm:mb-0"
          style={{ backgroundImage: `url(${sideImage})` }}
        >
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-relaxed max-w-lg drop-shadow-lg mb-6">
            New here? <br /> Sign up to discover and enjoy personalized reading with{" "}
            <span className="font-bold">Cozy Clips</span>.
          </p>
          <button
            onClick={() => handleNavigate("/signup")}
            className="bg-[#870022] border-2 border-[#AA9B9B] shadow-md shadow-gray-400/70 text-white 
            px-4 py-1.5 rounded-md hover:bg-[#a0002a] hover:scale-105 
            transition-all duration-500 ease-in-out text-sm font-semibold min-w-[100px]"
          >
            SIGN UP
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;