import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://czc-eight.vercel.app";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fadeState, setFadeState] = useState("enter");
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setFadeState("visible"), 50);
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter your email.");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/forgot-password/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data && data.success) {
        if (data.data && data.data.code) {
          setDebugCode(String(data.data.code));
        }
        alert(`An OTP has been sent to ${email}`);
        setStep(2);
      } else {
        alert(data?.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      alert("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return alert("Please enter the OTP.");
    setLoading(true);
    try {
      // If debug code is available, validate before moving to reset step
      if (debugCode) {
        if (String(otp) !== String(debugCode)) {
          alert("Invalid OTP. Please try again.");
          setLoading(false);
          return;
        }
        setStep(3);
      } else {
        // If no debug code provided by backend, proceed to next step (final reset will validate)
        setStep(3);
      }
    } catch (err) {
      alert("OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/forgot-password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, newPassword }),
      });
      const data = await res.json();
      if (data && data.success) {
        alert("Your password has been reset successfully!");
        navigate("/login");
      } else {
        alert(data?.message || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      alert("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-white transition-all duration-700 ease-in-out ${
        fadeState === "visible"
          ? "opacity-100 translate-y-0 scale-100"
          : fadeState === "enter"
          ? "opacity-0 translate-y-6 scale-95"
          : "opacity-0 -translate-y-6 scale-95"
      }`}
    >
      <div
        className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[70%] xl:w-[60%] bg-[#F3EBE2]
        rounded-[20px] shadow-2xl flex flex-col md:flex-row overflow-hidden
        min-h-[80vh] transition-all duration-500"
      >
        <div
          className="flex-1 flex flex-col justify-center items-center bg-[#f9f2ed]
          p-6 sm:p-10 md:p-14 lg:p-16"
        >
          <div className="w-full max-w-md">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 tracking-widest py-4">
              Forgot Password
            </h2>

            {step === 1 && (
              <form
                onSubmit={handleSendOtp}
                className="space-y-5 sm:space-y-6 text-base sm:text-lg"
              >
                <div>
                  <label className="block text-gray-700 mb-2 font-semibold text-lg sm:text-xl">
                    Enter your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full border border-gray-400 rounded-md px-5 py-3
                    text-base sm:text-lg font-medium text-gray-800 placeholder-gray-500/70
                    focus:outline-none focus:ring-2 focus:ring-[#870022]"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-[#870022] border-2 border-[#AA9B9B] text-white
                    px-6 py-2 rounded-md hover:bg-[#a0002a] hover:scale-105
                    transition-all duration-500 ease-in-out text-sm sm:text-base
                    font-semibold min-w-[130px] ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form
                onSubmit={handleVerifyOtp}
                className="space-y-5 sm:space-y-6 text-base sm:text-lg"
              >
                <div>
                  <label className="block text-gray-700 mb-2 font-semibold text-lg sm:text-xl">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the OTP sent to your email"
                    className="w-full border border-gray-400 rounded-md px-5 py-3
                    text-base sm:text-lg font-medium text-gray-800 placeholder-gray-500/70
                    focus:outline-none focus:ring-2 focus:ring-[#870022]"
                  />
                </div>

                <div className="flex justify-center space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-[#870022] border-2 border-[#AA9B9B] text-white
                    px-6 py-2 rounded-md hover:bg-[#a0002a] hover:scale-105
                    transition-all duration-500 ease-in-out text-sm sm:text-base
                    font-semibold min-w-[120px] ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[#870022] text-sm sm:text-base font-medium hover:underline transition-all"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form
                onSubmit={handleResetPassword}
                className="space-y-5 sm:space-y-6 text-base sm:text-lg"
              >
                <div>
                  <label className="block text-gray-700 mb-2 font-semibold text-lg sm:text-xl">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full border border-gray-400 rounded-md px-5 py-3
                    text-base sm:text-lg font-medium text-gray-800 placeholder-gray-500/70
                    focus:outline-none focus:ring-2 focus:ring-[#870022]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-semibold text-lg sm:text-xl">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full border border-gray-400 rounded-md px-5 py-3
                    text-base sm:text-lg font-medium text-gray-800 placeholder-gray-500/70
                    focus:outline-none focus:ring-2 focus:ring-[#870022]"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-[#870022] border-2 border-[#AA9B9B] text-white
                    px-6 py-2 rounded-md hover:bg-[#a0002a] hover:scale-105
                    transition-all duration-500 ease-in-out text-sm sm:text-base
                    font-semibold min-w-[130px] ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}

            <div className="hidden md:block text-center mt-8">
              <button
                onClick={() => navigate("/login")}
                className="text-[#870022] text-sm sm:text-base font-medium hover:underline transition-all"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>

        <div
          className="flex-1 flex justify-center items-center text-white p-8 bg-cover bg-center
          order-last md:order-none min-h-[40vh] md:min-h-auto"
          style={{
            backgroundImage: "url('/src/assets/Side-1.png')",
          }}
        >
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed max-w-md text-center drop-shadow-lg">
            Forgot your password? Don’t worry — we’ll help you get back in!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;