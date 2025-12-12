import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import avatar1 from "../assets/avatar1.png";
import avatar2 from "../assets/avatar2.png";
import avatar3 from "../assets/avatar3.png";
import avatar4 from "../assets/avatar4.png";
import avatar5 from "../assets/avatar5.png";
import avatar6 from "../assets/avatar6.png";
import frame1 from "../assets/frame1.png";
import frame2 from "../assets/frame2.png";
import frame3 from "../assets/frame3.png";
import frame4 from "../assets/frame4.png";
import frame5 from "../assets/frame5.png";
import frame6 from "../assets/frame6.png";

const BASE_URL = "https://czc-eight.vercel.app";

function getAuth() {
  try {
    const raw = localStorage.getItem("czc_auth");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token =
      parsed?.token ||
      parsed?.accessToken ||
      parsed?.idToken ||
      parsed?.data?.token ||
      parsed?.data?.accessToken ||
      parsed?.user?.token;
    const user = parsed?.user || parsed?.data?.user || parsed?.data || parsed;
    const userId = user?.id || user?.uid || user?.userId || user?.studentId || parsed?.id;
    return { token, user, userId };
  } catch {
    return {};
  }
}

const ProfileSettings = () => {
  const [profilePic, setProfilePic] = useState(localStorage.getItem("profileImage") || null);
  const [success, setSuccess] = useState("");
  const [errorRequired, setErrorRequired] = useState(false);
  const [activeTab, setActiveTab] = useState("avatars");

  const [fullName, setFullName] = useState(localStorage.getItem("fullName") || "");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [errorsRequired, setErrorsRequired] = useState({ fullName: false, username: false });

  const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6];
  const frames = [frame1, frame2, frame3, frame4, frame5, frame6];
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [errors, setErrors] = useState({ current: false, new: false, confirm: false });
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Backend-related state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState(null);
  const [history, setHistory] = useState([]);

  const { token, userId, user } = getAuth();

  useEffect(() => {
    loadProfile();
    loadRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getHeaders = () => {
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
      localStorage.setItem("profileImage", reader.result);
      setSuccess("Profile uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    };
    reader.readAsDataURL(file);
  };

  const applyChanges = () => {
    if (selectedAvatar) {
      setProfilePic(selectedAvatar);
      localStorage.setItem("profileImage", selectedAvatar);
    }
    if (selectedFrame) {
      alert("Frame selected: " + selectedFrame);
    }
  };

  const validateNewPassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return minLength && hasUpper && hasLower && hasNumber;
  };

  async function loadProfile() {
    setLoading(true);
    try {
      if (userId) {
        try {
          const res = await fetch(`${BASE_URL}/api/student/profile/${userId}`, {
            headers: getHeaders(),
          });
          if (res.ok) {
            const json = await res.json();
            setProfile(json?.data?.profile || null);
            // sync UI fields
            const p = json?.data?.profile;
            if (p?.displayName) {
              setFullName(p.displayName);
              localStorage.setItem("displayName", p.displayName);
              localStorage.setItem("fullName", p.displayName);
            }
            if (p?.username) {
              setUsername(p.username);
              localStorage.setItem("username", p.username);
            }
            if (p?.avatarUrl) {
              setProfilePic(p.avatarUrl);
              localStorage.setItem("profileImage", p.avatarUrl);
            }
            setLoading(false);
            return;
          }
        } catch (e) {
          // fallback to list
        }
      }

      try {
        const res2 = await fetch(`${BASE_URL}/api/student/profile`, { headers: getHeaders() });
        if (res2.ok) {
          const json = await res2.json();
          const profiles = json?.data?.profiles ?? json?.data ?? (Array.isArray(json) ? json : null);
          if (Array.isArray(profiles) && profiles.length) {
            let candidate = null;
            const raw = localStorage.getItem("czc_auth");
            let uid = null;
            if (raw) {
              try {
                const p = JSON.parse(raw);
                uid = p?.user?.id || p?.user?.uid || p?.userId || p?.id;
              } catch {}
            }
            if (uid) {
              candidate = profiles.find(
                (x) =>
                  String(x.studentId || x.id || x.username) === String(uid) ||
                  String(x.username) === String(uid)
              );
            }
            if (!candidate) candidate = profiles[0];
            setProfile(candidate);
            if (candidate?.displayName) {
              setFullName(candidate.displayName);
              localStorage.setItem("displayName", candidate.displayName);
              localStorage.setItem("fullName", candidate.displayName);
            }
            if (candidate?.username) {
              setUsername(candidate.username);
              localStorage.setItem("username", candidate.username);
            }
            if (candidate?.avatarUrl) {
              setProfilePic(candidate.avatarUrl);
              localStorage.setItem("profileImage", candidate.avatarUrl);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error("loadProfile error", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadRanking() {
    try {
      const headers = getHeaders();
      const r = await fetch(`${BASE_URL}/api/ranking`, { headers });
      if (r.ok) {
        const json = await r.json();
        setRanking(json);
      }
      const h = await fetch(`${BASE_URL}/api/ranking/history`, { headers });
      if (h.ok) {
        const json = await h.json();
        setHistory(Array.isArray(json?.history) ? json.history : []);
      }
    } catch (e) {
      console.warn("ranking fetch failed", e);
    }
  }

  const handleSaveChanges = async () => {
    const emptyFullName = fullName.trim() === "";
    const emptyUsername = username.trim() === "";

    setErrorsRequired({
      fullName: emptyFullName,
      username: emptyUsername,
    });

    if (emptyFullName || emptyUsername) {
      setSuccess("");
      setErrorRequired(true);
      return null;
    }

    setErrorRequired(false);
    setLoading(true);

    const id = (profile && (profile.studentId || profile.id)) || userId;
    const updated = {
      displayName: fullName,
      username: username,
    };

    if (profilePic) {
      const p = String(profilePic);
      if (p.startsWith("data:")) {
        updated.avatarBase64 = p;
      } else {
        updated.avatarUrl =
          p.startsWith("http") || p.startsWith("https")
            ? p
            : window.location.origin + (p.startsWith("/") ? p : "/" + p);
      }
    }

    try {
      const hasProfileId = profile && (profile.studentId != null || profile.id != null);

      if (hasProfileId) {
        const idToUse = profile.studentId ?? profile.id;
        const res = await fetch(`${BASE_URL}/api/student/profile/${idToUse}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(updated),
        });

        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.success) {
          const newProfile = json?.data?.profile || { ...profile, ...updated };
          setProfile(newProfile);
          
          // Update state and localStorage with the Firebase Storage URL from backend
          if (newProfile.avatarUrl) {
            setProfilePic(newProfile.avatarUrl);
            localStorage.setItem("profileImage", newProfile.avatarUrl);
          }
          
          localStorage.setItem("displayName", newProfile.displayName || fullName);
          localStorage.setItem("fullName", newProfile.displayName || fullName);
          localStorage.setItem("username", newProfile.username || username);
          
          // Trigger storage event to update navbar
          window.dispatchEvent(new Event('storage'));
          
          console.log("[ProfileSettings] Profile updated successfully:", { displayName: newProfile.displayName, username: newProfile.username, avatarUrl: newProfile.avatarUrl });
          setSuccess("Changes saved successfully!");
          return newProfile;
        } else {
          setSuccess("");
          alert(json?.message || `Failed to update profile (status ${res.status})`);
          return null;
        }
      } else {
        const res = await fetch(`${BASE_URL}/api/student/profile`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ userId: id, ...updated }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.success) {
          const createdProfile = json?.data?.profile || { ...updated };
          setProfile(createdProfile);
          
          // Update state and localStorage with the Firebase Storage URL from backend
          if (createdProfile.avatarUrl) {
            setProfilePic(createdProfile.avatarUrl);
            localStorage.setItem("profileImage", createdProfile.avatarUrl);
          }
          
          localStorage.setItem("displayName", createdProfile.displayName || fullName);
          localStorage.setItem("fullName", createdProfile.displayName || fullName);
          localStorage.setItem("username", createdProfile.username || username);
          
          // Trigger storage event to update navbar
          window.dispatchEvent(new Event('storage'));
          
          setSuccess("Profile created");
          return createdProfile;
        } else {
          setSuccess("");
          alert(json?.message || `Failed to create profile (status ${res.status})`);
          return null;
        }
      }
    } catch (e) {
      console.error("handleSaveChanges error:", e);
      alert("Network error while saving profile");
      return null;
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleChangePassword = async () => {
    let newErrors = { current: false, new: false, confirm: false };
    let valid = true;
    if (!validateNewPassword(newPassword)) {
      newErrors.new = true;
      valid = false;
    }
    if (newPassword !== confirmNewPassword) {
      newErrors.confirm = true;
      valid = false;
    }
    if (!valid) {
      setErrors(newErrors);
      return;
    }

    if (!profile && !userId) return alert("No profile loaded");

    setLoading(true);
    try {
      const id = (profile && (profile.studentId || profile.id)) || userId;
      const res = await fetch(`${BASE_URL}/api/student/profile/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, password: newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.success) {
        console.log("[ProfileSettings] Password changed successfully for userId:", id);
        setPasswordChangeSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setErrors({ current: false, new: false, confirm: false });
        setTimeout(() => {
          setPasswordChangeSuccess("");
          setShowPasswordModal(false);
        }, 2000);
      } else {
        console.error("[ProfileSettings] Password change failed:", json?.message);
        alert(json?.message || "Failed to change password");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile && !userId) return alert("No profile loaded");
    if (deleteConfirm !== "DELETE") return;
    setLoading(true);
    try {
      const id = (profile && (profile.studentId || profile.id)) || userId;
      const res = await fetch(`${BASE_URL}/api/student/profile/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.success) {
        console.log("[ProfileSettings] Account deleted successfully for userId:", id);
        alert("Account deleted");
        setProfile(null);
        setShowDeleteModal(false);
        localStorage.removeItem("czc_auth");
        window.location.href = "/";
      } else {
        console.error("[ProfileSettings] Account deletion failed:", json?.message);
        alert(json?.message || "Failed to delete account");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishBook = async (bookId, title) => {
    if (!bookId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/student/finish-book`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ bookId, title }),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.success) {
        alert("Book marked finished");
        await loadRanking();
        await loadProfile();
      } else {
        alert(json?.message || "Failed to mark book finished");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to mark finished");
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const buttonHoverClasses = "transition transform hover:scale-105 hover:brightness-110";

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#FDEBD0] py-10">
      <h2 className="text-2xl sm:text-3xl font-extrabold ml-2 mb-3 text-[#6A001A]">Learning Progress</h2>

      <div className="flex flex-col md:flex-row justify-center gap-5 mt-10 flex-wrap">
        <div className="bg-white w-full md:w-[900px] rounded-xl shadow p-8 mb-6">
          <h2 className="text-2xl font-semibold text-center mb-4">Profile Settings</h2>

          {success && (
            <p className="bg-green-100 text-green-800 text-center py-2 rounded mb-6">
              {success}
            </p>
          )}

          {errorRequired && (
            <p className="bg-red-100 text-red-700 text-center py-2 rounded mb-6">
              Required input
            </p>
          )}

          <p className="font-semibold text-lg mb-2">Profile Picture</p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <img src={profilePic || "/default-avatar.jpg"} className="h-40 w-40 rounded-full object-cover" alt="" />
            <label className={`px-5 py-2 bg-[#8A0026] text-white rounded cursor-pointer ${buttonHoverClasses}`}>
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          <label className="text-lg font-medium">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className={`w-full bg-[#F7EFE6] border rounded p-3 mb-4 text-lg ${
              errorsRequired.fullName ? "border-red-500" : "border-gray-400"
            }`}
          />

          <label className="text-lg font-medium">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className={`w-full bg-[#F7EFE6] border rounded p-3 mb-6 text-lg ${
              errorsRequired.username ? "border-red-500" : "border-gray-400"
            }`}
          />

          <div className="flex justify-center mb-4">
            <button
              style={{ width: "calc(50% - 250px)" }}
              className={`py-3 rounded bg-[#8A0026] text-white font-semibold ${buttonHoverClasses}`}
              onClick={handleSaveChanges}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="border-t my-6"></div>

          <p className="font-semibold text-lg mb-3">Account Actions</p>

          <div className="flex justify-center mb-3">
            <button
              style={{ width: "calc(50% - 200px)" }}
              className={`py-3 bg-[#F5E8DD] text-[#8A0026] font-semibold rounded ${buttonHoverClasses}`}
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </button>
          </div>

          <div className="flex justify-center">
            <button
              style={{ width: "calc(50% - 200px)" }}
              className={`py-3 bg-[#FCE4E4] text-red-700 font-semibold rounded mt-3 ${buttonHoverClasses}`}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </button>
          </div>
        </div>

        <div className="bg-white w-full md:w-[900px] rounded-xl shadow p-8 flex flex-col items-center mb-6">
          <h2 className="text-2xl font-semibold text-center mb-4">Customization</h2>

          <div className="bg-[#F6ECE2] rounded-lg h-[300px] w-full flex items-center justify-center mb-6">
            <div className="relative flex items-center justify-center">
              {selectedFrame && (
                <img
                  src={selectedFrame}
                  className="absolute rounded-full opacity-95 pointer-events-none"
                  style={{ width: "260px", height: "260px" }}
                  alt="Frame"
                />
              )}

              <img
                src={selectedAvatar || profilePic || "/default-avatar.jpg"}
                className="rounded-full object-cover relative z-10"
                style={{ width: "210px", height: "210px" }}
                alt=""
              />
            </div>
          </div>

          <div className="flex gap-4 justify-center mb-6 flex-wrap">
            <button
              className={`px-8 py-2 rounded font-semibold ${
                activeTab === "avatars" ? "bg-[#8A0026] text-white" : "bg-[#E8DED3]"
              } ${buttonHoverClasses}`}
              onClick={() => setActiveTab("avatars")}
            >
              Avatars
            </button>

            <button
              className={`px-8 py-2 rounded font-semibold ${
                activeTab === "frames" ? "bg-[#8A0026] text-white" : "bg-[#E8DED3]"
              } ${buttonHoverClasses}`}
              onClick={() => setActiveTab("frames")}
            >
              Frames
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 w-full">
            {activeTab === "avatars" &&
              avatars.map((src, i) => (
                <div
                  key={i}
                  className={`bg-[#F6ECE2] p-2 rounded-lg cursor-pointer border flex items-center justify-center ${
                    selectedAvatar === src ? "border-[#8A0026] border-4" : ""
                  } ${buttonHoverClasses}`}
                  onClick={() => setSelectedAvatar(src)}
                >
                  <img src={src} className="h-32 w-full object-contain rounded-md" alt="" />
                </div>
              ))}

            {activeTab === "frames" &&
              frames.map((src, i) => (
                <div
                  key={i}
                  className={`bg-[#F6ECE2] p-2 rounded-lg cursor-pointer border flex items-center justify-center ${
                    selectedFrame === src ? "border-[#8A0026] border-4" : ""
                  } ${buttonHoverClasses}`}
                  onClick={() => setSelectedFrame(src)}
                >
                  <img src={src} className="h-32 w-full object-contain rounded-md" alt="" />
                </div>
              ))}
          </div>

          <button
            onClick={applyChanges}
            className={`py-3 rounded bg-[#8A0026] text-white font-semibold ${buttonHoverClasses}`}
            style={{ width: "calc(100% - 90px)", maxWidth: "200px" }}
          >
            Apply Changes
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <>
          <div className="fixed inset-0 bg-black opacity-30 z-40" onClick={() => setShowPasswordModal(false)}></div>

          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-[700px] min-h-[600px]">

              <h3 className="text-xl font-semibold mb-6">Change Password</h3>

              {passwordChangeSuccess && (
                <p className="bg-green-100 text-green-800 text-center py-2 rounded mb-6">
                  {passwordChangeSuccess}
                </p>
              )}

              <label className="block mb-1 font-semibold text-sm">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword.current ? "text" : "password"}
                  className={`w-full border rounded-md p-3 mb-4 ${
                    errors.current ? "border-red-500" : "border-gray-400"
                  }`}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer text-gray-500"
                  onClick={() => toggleShow("current")}
                >
                  {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <label className="block mb-1 font-semibold text-sm">New Password</label>
              <div className="relative">
                <input
                  type={showPassword.new ? "text" : "password"}
                  className={`w-full border rounded-md p-3 mb-4 ${
                    errors.new ? "border-red-500" : "border-gray-400"
                  }`}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer text-gray-500"
                  onClick={() => toggleShow("new")}
                >
                  {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <label className="block mb-1 font-semibold text-sm">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  className={`w-full border rounded-md p-3 mb-4 ${
                    errors.confirm ? "border-red-500" : "border-gray-400"
                  }`}
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer text-gray-500"
                  onClick={() => toggleShow("confirm")}
                >
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="bg-gray-100 text-gray-600 text-xs p-3 rounded mb-6">
                <p className="font-semibold mb-1">Password must contain:</p>
                <ul className="list-disc list-inside leading-tight">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className={`flex-1 py-2 rounded font-semibold bg-gray-300 hover:bg-gray-400 transition ${buttonHoverClasses}`}
                >
                  Cancel
                </button>

                <button
                  onClick={handleChangePassword}
                  className={`flex-1 py-2 rounded font-semibold bg-[#8A0026] text-white hover:bg-[#6A001A] transition ${buttonHoverClasses}`}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black opacity-30 z-40" onClick={() => setShowDeleteModal(false)}></div>

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-[700px] max-h-[90vh] overflow-auto">

              <h3 className="text-xl font-semibold mb-6">Delete Account</h3>

              <div className="border border-red-400 bg-red-100 rounded p-4 mb-6">
                <p className="text-red-700 font-semibold mb-2">Warning: This action cannot be undone!</p>
                <p className="text-red-600 mb-2">Deleting your account will permanently remove:</p>

                <ul className="list-disc list-inside text-red-600 space-y-1">
                  <li>All your reading progress and quiz history</li>
                  <li>Your achievements and badges</li>
                  <li>Your coins, gems, and unlocked items</li>
                  <li>Your bookmarks and saved content</li>
                  <li>All personal information and settings</li>
                </ul>
              </div>

              <label className="block font-semibold mb-1">
                Type <span className="text-red-700 font-bold">DELETE</span> to confirm
              </label>

              <input
                type="text"
                placeholder="Type DELETE"
                className="w-full border border-gray-300 rounded-md p-3 mb-6 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
              />

              <div className="bg-gray-300 text-gray-700 p-4 rounded mb-6 text-sm leading-relaxed">
                <p className="font-semibold mb-2">Alternative:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Log out and take a break</li>
                  <li>Contact support if you're experiencing issues</li>
                  <li>Export your data before deletion (if needed)</li>
                </ul>
              </div>

              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-300 text-gray-800 rounded font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>

                <button
                  disabled={deleteConfirm !== "DELETE" || loading}
                  onClick={handleDeleteAccount}
                  className={`flex-1 py-3 rounded font-semibold text-white transition ${
                    deleteConfirm === "DELETE"
                      ? "bg-red-700 hover:bg-red-800 cursor-pointer"
                      : "bg-red-300 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-gray-500">
                If you're sure, please proceed with caution
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileSettings;