import React, { useState, useEffect } from "react";
import DashboardNavbar from "./DashboardNavbar";
import { Upload, Bookmark, BookmarkCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dragonImg from "../assets/dragon.png";
import bearImg from "../assets/bear.png";
import bronzeImg from "../assets/bronze.png";
import defaultAvatar from "../assets/dafault.webp";

const rankStages = ["V", "IV", "III", "II", "I"];
const rankOrder = ["Bronze", "Silver", "Gold", "Diamond", "Amethyst", "Challenger"];

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
    return { token, userId };
  } catch {
    return {};
  }
}

// --- Utility function for client-side shuffle (defined for completeness) ---
const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};
// -------------------------------------------------------------------------

const DashboardHome = () => {
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);

  const [userData, setUserData] = useState({
    displayName: localStorage.getItem("displayName") || "User Student",
    email: localStorage.getItem("email") || "user@email.com",
  });

  // Debug log whenever userData changes
  useEffect(() => {
    console.log("[DashboardHome] userData state updated:", userData);
  }, [userData]);

  const [levelProgress, setLevelProgress] = useState(() => Number(localStorage.getItem("levelProgress")) || 0);
  const [completedProgress, setCompletedProgress] = useState(() => Number(localStorage.getItem("completedProgress")) || 0);

  const [suggested, setSuggested] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const [ratings, setRatings] = useState({});
  const [rank, setRank] = useState(JSON.parse(localStorage.getItem("rankData")) || { tier: "Bronze", stage: 1 });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Fetch bookmarks from backend
  useEffect(() => {
    const fetchBookmarksFromBackend = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
        const token = authData.token;
        
        if (!token) {
          // Fallback to localStorage if not authenticated
          const saved = localStorage.getItem("bookmarks");
          setBookmarkedIds(saved ? JSON.parse(saved).map((b) => b.id) : []);
          return;
        }

        const response = await fetch("https://czc-eight.vercel.app/api/student/bookmarks", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const bookmarkIds = data.bookmarks || [];
          console.log("[DashboardHome] Fetched bookmark IDs from Firestore:", bookmarkIds);
          setBookmarkedIds(bookmarkIds);
          
          // Fetch full book details for bookmarks if needed
          if (bookmarkIds.length > 0) {
            const storedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
            const existingIds = new Set(storedBookmarks.map(b => String(b.id)));
            const missingIds = bookmarkIds.filter(id => !existingIds.has(String(id)));
            
            if (missingIds.length > 0) {
              console.log("[DashboardHome] Fetching missing book details for:", missingIds);
              const bookPromises = missingIds.map(async (storyId) => {
                try {
                  const bookResponse = await fetch(`https://czc-eight.vercel.app/api/stories/${storyId}`);
                  if (bookResponse.ok) {
                    const bookData = await bookResponse.json();
                    return {
                      id: storyId,
                      title: bookData.story?.title || "Unknown",
                      author: bookData.story?.author || "Unknown",
                      cover_url: bookData.story?.cover_url || null,
                      formats: bookData.story?.formats || {},
                      authors: bookData.story?.authors || [],
                      dateBookmarked: new Date().toISOString()
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching book ${storyId}:`, error);
                  return null;
                }
              });
              
              const newBooks = (await Promise.all(bookPromises)).filter(b => b !== null);
              const allBookmarks = [...storedBookmarks, ...newBooks];
              localStorage.setItem("bookmarks", JSON.stringify(allBookmarks));
            }
          }
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem("bookmarks");
          setBookmarkedIds(saved ? JSON.parse(saved).map((b) => b.id) : []);
        }
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
        const saved = localStorage.getItem("bookmarks");
        setBookmarkedIds(saved ? JSON.parse(saved).map((b) => b.id) : []);
      }
    };
    
    fetchBookmarksFromBackend();
  }, []);

  // Helper function to get auth token
  const getAuthToken = () => {
    let token = null;
    const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
    token = authData.token;
    
    if (!token && authData) {
      token = authData;
    }
    if (!token) {
      token = localStorage.getItem("token");
    }
    
    return token;
  };

  // Fetch user data from backend/Firestore
  const fetchUserData = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      const token = authData.token || authData?.data?.token || authData?.user?.token;
      const user = authData?.user || authData?.data?.user || authData?.data || authData;
      const userId = user?.id || user?.uid || user?.userId || user?.studentId || authData?.id;
      
      console.log("[DashboardHome] Auth data:", { 
        token: token ? "exists" : "missing", 
        userId, 
        user,
        fullAuthData: authData 
      });
      
      if (!token || !userId) {
        console.error("[DashboardHome] No authentication token or userId found. Auth data:", authData);
        setLoading(false);
        return;
      }

      console.log(`[DashboardHome] Fetching student profile from: https://czc-eight.vercel.app/api/student/profile/${userId}`);
      const response = await fetch(`https://czc-eight.vercel.app/api/student/profile/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("[DashboardHome] Response status:", response.status);
      const data = await response.json();
      console.log("[DashboardHome] Full response data:", JSON.stringify(data, null, 2));

      if (response.ok && data) {
        // Handle different response structures
        const profile = data.profile || data.data?.profile || data;
        console.log("[DashboardHome] Extracted profile:", profile);
        
        if (profile && profile.displayName) {
          console.log("[DashboardHome] Setting displayName:", profile.displayName);

          const emailFromProfile = profile.email;
          const emailFromAuth = user?.email;
          const resolvedEmail = emailFromProfile || emailFromAuth || "user@email.com";
          console.log("[DashboardHome] Resolved email:", resolvedEmail);
          
          // Update userData state with displayName from Firestore
          setUserData({
            displayName: profile.displayName,
            email: resolvedEmail
          });

          // Save to localStorage
          localStorage.setItem("displayName", profile.displayName);
          localStorage.setItem("email", resolvedEmail);
          console.log("[DashboardHome] Saved to localStorage - displayName:", profile.displayName);

          // Update profile image if available (avatarUrl from Firestore)
          if (profile.avatarUrl) {
            setProfileImage(profile.avatarUrl);
            localStorage.setItem("profileImage", profile.avatarUrl);
            console.log("[DashboardHome] Updated profile image:", profile.avatarUrl);
          }

          // Update level progress if available from profile
          // If not in profile, will be fetched from ranking API
          if (profile.levelProgress !== undefined) {
            setLevelProgress(profile.levelProgress);
            localStorage.setItem("levelProgress", profile.levelProgress);
            console.log("[DashboardHome] Got levelProgress from profile:", profile.levelProgress);
          }

          // Update completed progress (booksRead in current rank) if available from profile
          // If not in profile, will be fetched from ranking API
          if (profile.completedProgress !== undefined) {
            setCompletedProgress(profile.completedProgress);
            localStorage.setItem("completedProgress", profile.completedProgress);
            console.log("[DashboardHome] Got completedProgress from profile:", profile.completedProgress);
          }

          // Update rank if available
          if (profile.rank) {
            setRank(profile.rank);
            localStorage.setItem("rankData", JSON.stringify(profile.rank));
          }
        } else {
          console.error("[DashboardHome] No displayName in profile:", profile);
        }
      } else {
        console.error("[DashboardHome] Failed to fetch student profile. Status:", response.status, "Data:", data);
      }
    } catch (error) {
      console.error("[DashboardHome] Error fetching student profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    // Clear old firstName/lastName from localStorage if they exist
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("fullName");

    // First, try to load from localStorage for instant display
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) setProfileImage(savedImage);

    const savedDisplayName = localStorage.getItem("displayName");
    const savedEmail = localStorage.getItem("email");
    
    if (savedDisplayName || savedEmail) {
      setUserData({
        displayName: savedDisplayName || "User Student",
        email: savedEmail || "user@email.com"
      });
    }

    // Also check auth data
    try {
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      const authEmail = authData?.user?.email || authData?.data?.user?.email;
      if (authEmail) {
        setUserData((prev) => ({ ...prev, email: authEmail }));
        localStorage.setItem("email", authEmail);
      }
    } catch (error) {
      console.error("Error parsing auth data:", error);
    }

    // Then fetch fresh data from backend - this will override with real data from Firestore
    fetchUserData();

    // Listen for storage changes (e.g., from ProfileSettings)
    const handleStorageChange = (e) => {
      if (e.key === "displayName" || e.key === "profileImage") {
        fetchUserData();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Fetch suggested books from backend
  useEffect(() => {
    const fetchSuggestedBooks = async () => {
      try {
        const BACKEND_URL = "https://czc-eight.vercel.app/api/library/stories";
        
        // Request 12 books with a random seed to get a fresh, shuffled set
        const randomSeed = Math.floor(Math.random() * 10000);
        const requestUrl = `${BACKEND_URL}?limit=12&seed=${randomSeed}`;

        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        // Safely access the array
        const bookDataArray = Array.isArray(data.books) ? data.books : (Array.isArray(data) ? data : []); 
        
        // Map and prepare books
        let books = bookDataArray.map((book) => {
            const id = book.id ? String(book.id) : `t-${Math.random().toString(36).slice(2,9)}`;
            const authorName = book.author || 'Unknown Author';
            const coverUrl = book.cover_url || (book.formats && book.formats['image/jpeg']) || '/src/assets/book.png';
            const textLink = book.source_url || (book.formats && (book.formats['text/plain'] || book.formats['text/html']));
            
            return {
                id, 
                title: book.title || 'Untitled',
                authors: [{ name: authorName }], 
                formats: {
                    "image/jpeg": coverUrl,
                    "text/plain": textLink,
                    "text/html": textLink,
                },
                ...book
            };
        });

        // Ensure exactly 12 books are used (if available) and shuffle client-side for extra randomness
        books = shuffleArray(books).slice(0, 12);
        setSuggested(books);
        
        // Set random ratings (1 to 5)
        const initialRatings = {};
        books.forEach((book) => {
          initialRatings[book.id] = Math.floor(Math.random() * 5) + 1;
        });
        setRatings(initialRatings);

      } catch (error) {
        console.error("Failed to fetch suggested books from backend:", error);
      }
    };
    
    fetchSuggestedBooks();
  }, []);

  useEffect(() => {
    localStorage.setItem("levelProgress", levelProgress);
    window.dispatchEvent(new Event("progressUpdate"));
  }, [levelProgress]);

  useEffect(() => {
    localStorage.setItem("completedProgress", completedProgress);
    window.dispatchEvent(new Event("progressUpdate"));
  }, [completedProgress]);

  useEffect(() => {
    const start = localStorage.getItem("readingStartTime");
    if (!start) return;

    const now = Date.now();
    const minutes = Math.floor((now - Number(start)) / 60000);

    localStorage.removeItem("readingStartTime");

    if (minutes >= 2) {
      const gained = Math.floor(minutes / 2);
      setLevelProgress((prev) => Math.min(prev + gained, 100));
      setCompletedProgress((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    const syncProgress = () => {
      setLevelProgress(Number(localStorage.getItem("levelProgress")) || 0);
      setCompletedProgress(Number(localStorage.getItem("completedProgress")) || 0);

      const storedRank = JSON.parse(localStorage.getItem("rankData")) || null;
      if (storedRank) setRank(storedRank);
    };

    window.addEventListener("progressUpdate", syncProgress);
    return () => window.removeEventListener("progressUpdate", syncProgress);
  }, []);

  // Fetch ranking data from API to get accurate level and completed progress
  useEffect(() => {
    let mounted = true;
    const { token } = getAuth();

    async function loadRanking() {
      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${BASE_URL}/api/ranking`, { headers });
        if (response && response.ok) {
          const json = await response.json();
          console.log("[DashboardHome] Ranking API response:", json);
          
          const tier = json?.tier || rank.tier;
          const stage = Number(json?.sublevel ?? rank.stage);
          const progress = Number(json?.progressInSublevel ?? 0);
          const computedLevel = Math.min(Math.round((progress / 10) * 100), 100);
          const apiBooksInRank = Number(json?.booksRead ?? 0);

          console.log("[DashboardHome] Computed:", { tier, stage, progress, computedLevel, booksInRank: apiBooksInRank });

          if (mounted) {
            // Update rank
            const newRank = { tier, stage };
            setRank(newRank);
            localStorage.setItem("rankData", JSON.stringify(newRank));

            // Update level (0-100% based on progressInSublevel)
            setLevelProgress(computedLevel);
            localStorage.setItem("levelProgress", computedLevel);

            // Update completed (0-9 books in current rank)
            setCompletedProgress(apiBooksInRank);
            localStorage.setItem("completedProgress", apiBooksInRank);
            
            console.log("[DashboardHome] Updated from ranking API:", { tier, stage, level: computedLevel, completed: apiBooksInRank });
          }
        }
      } catch (e) {
        console.warn("[DashboardHome] Error loading ranking:", e);
      }
    }
    
    loadRanking();
    
    // Refresh ranking when books are read
    const handleProgressUpdate = () => {
      loadRanking();
    };
    window.addEventListener("progressUpdate", handleProgressUpdate);
    window.addEventListener("bookOpened", handleProgressUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("progressUpdate", handleProgressUpdate);
      window.removeEventListener("bookOpened", handleProgressUpdate);
    };
  }, []);

  // Rank upgrades are now handled by the backend based on cumulative progress
  // The ranking API automatically calculates the correct rank based on total books read

  const openBook = (book) => {
    const formats = book.formats;
    const url =
      formats["text/plain; charset=utf-8"] ||
      formats["text/plain"] ||
      formats["text/html; charset=utf-8"] ||
      formats["text/html"] ||
      formats["application/epub+zip"] ||
      null;

    if (url) {
      localStorage.setItem("readingStartTime", Date.now());
      localStorage.setItem("currentBookId", book.id);

      // Don't manually update localStorage - let the API handle it
      window.dispatchEvent(new Event("bookOpened"));

      navigate("/read", { state: { book, link: url } });
    }
  };

  const toggleBookmark = async (book) => {
    const stored = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const isBookmarked = bookmarkedIds.includes(book.id);

    try {
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      const token = authData.token;
      
      if (token) {
        // Call backend API
        const endpoint = isBookmarked 
          ? "https://czc-eight.vercel.app/api/student/bookmarks/remove"
          : "https://czc-eight.vercel.app/api/student/bookmarks/add";
        
        console.log(`[DashboardHome] Calling bookmark API: ${endpoint} with storyId: ${book.id}`);
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ storyId: String(book.id) })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[DashboardHome] Bookmark API error:", response.status, errorData);
          throw new Error(errorData.message || "Failed to update bookmark in backend");
        }
        
        const result = await response.json();
        console.log("[DashboardHome] Bookmark API success:", result);
      }
      
      // Update local state
      let updatedBookmarks;
      if (isBookmarked) {
        updatedBookmarks = stored.filter((b) => b.id !== book.id);
        setBookmarkedIds((prev) => prev.filter((id) => id !== book.id));
      } else {
        updatedBookmarks = [...stored, book];
        setBookmarkedIds((prev) => [...prev, book.id]);
      }
      localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
      
      const el = document.getElementById(`bookmark-icon-${book.id}`);
      if (el) {
        el.classList.add("scale-up");
        setTimeout(() => el.classList.remove("scale-up"), 300);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      // Still update localStorage as fallback
      let updatedBookmarks;
      if (isBookmarked) {
        updatedBookmarks = stored.filter((b) => b.id !== book.id);
        setBookmarkedIds((prev) => prev.filter((id) => id !== book.id));
      } else {
        updatedBookmarks = [...stored, book];
        setBookmarkedIds((prev) => [...prev, book.id]);
      }
      localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
      
      const el = document.getElementById(`bookmark-icon-${book.id}`);
      if (el) {
        el.classList.add("scale-up");
        setTimeout(() => el.classList.remove("scale-up"), 300);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F3EA]">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar profileImage={profileImage} />
      <main className="flex-1 flex flex-col p-6 overflow-auto mt-6 mb-12" style={{ backgroundColor: "#F9F3EA" }}>
        <div
          className="flex items-center justify-between w-full h-[180px] rounded-2xl overflow-hidden shadow-2xl relative mt-6"
          style={{
            backgroundImage: `url(${bronzeImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>

          <div className="relative flex items-center w-full md:w-1/2 p-4 md:p-8 space-x-4 md:space-x-6 backdrop-blur-[2px] z-10">
            <label
              htmlFor="profile-upload-disabled"
              className="relative w-20 h-20 md:w-40 md:h-32 rounded-lg flex items-center justify-center overflow-hidden border-2 border-purple-400"
            >
              <img 
                src={profileImage || defaultAvatar} 
                alt="Profile" 
                className="object-cover w-full h-full" 
              />
              <input id="profile-upload-disabled" type="file" disabled className="hidden" />
            </label>

            <div className="w-full">
              <h2 className="text-lg md:text-2xl font-semibold text-white drop-shadow-md">
                {userData.displayName || "Loading..."}
              </h2>

              <div className="flex items-center text-xs md:text-sm text-gray-200 mt-1 space-x-2">
                <span>{userData.email}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="text-amber-400 font-medium">
                  {rank.tier} {rankStages[rank.stage - 1]}
                </span>
              </div>

              <div className="mt-2 md:mt-3 space-y-2 md:space-y-3">
                <div>
                  <div className="flex justify-between text-xs md:text-xs mb-1 text-white">
                    <span>LVL</span>
                    <span>{levelProgress} /100%</span>
                  </div>
                  <div className="relative w-full h-2 bg-[#c2a27a]/40 rounded-full overflow-hidden">
                    <div className="h-2 bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${levelProgress}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs md:text-xs mb-1 text-white">
                    <span>Completed</span>
                    <span>{completedProgress} /10</span>
                  </div>
                  <div className="relative w-full h-2 bg-[#c2a27a]/40 rounded-full overflow-hidden">
                    <div className="h-2 bg-[#d9a86c] rounded-full transition-all duration-500" style={{ width: `${completedProgress * 10}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex relative w-1/2 p-8 flex-col justify-center z-10 text-left">
            <h3 className="text-xl font-semibold text-white drop-shadow-md mr-8">Unlock Stories. Level Up Learning.</h3>
            <p className="text-sm text-gray-200 mt-3 drop-shadow-sm mr-8">Story-driven games make reading fun and rewarding.</p>
            <img src={dragonImg} alt="Dragon" className="absolute bottom-3 right-3 w-28 h-28 object-contain opacity-90" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="order-1 md:order-2 bg-white rounded-2xl shadow-md border border-gray-300 flex flex-col h-auto md:h-[calc(100vh-300px)]">
            <h2 className="text-lg font-semibold p-4 sticky top-0 bg-white z-10 border-b border-gray-200 rounded-t-2xl">To-do</h2>
            <div className="overflow-auto flex-1 flex flex-col items-center justify-center p-4">
              <img src={bearImg} className="w-16 md:w-20 opacity-50" />
              <p className="text-gray-500 mt-3 text-sm">No Task Available</p>
            </div>
          </div>

          <div className="order-2 md:order-1 bg-white rounded-2xl shadow-md border border-gray-300 flex flex-col h-[400px] md:h-[calc(100vh-300px)] md:col-span-2">
            <h2 className="text-lg font-semibold p-4 sticky top-0 bg-white z-10 border-b border-gray-200 rounded-t-2xl">Suggested</h2>

            <div className="overflow-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 md:gap-5">
              {suggested.map((book) => (
                <div
                  key={book.id}
                  className="flex p-2 sm:p-3 md:p-4 border rounded-2xl shadow-sm bg-[#faf7f3] space-x-2 md:space-x-3 relative cursor-pointer transition-transform duration-200 hover:scale-105"
                  onClick={() => openBook(book)}
                >
                  <div className="relative w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36">
                    <img src={book.formats["image/jpeg"] || "/src/assets/book.png"} className="w-full h-full object-cover rounded-2xl" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-1">{book.authors?.[0]?.name || "Unknown Author"}</p>
                      <p className="text-sm sm:text-base md:text-xl text-yellow-500 mb-1 font-bold">
                        {"★".repeat(ratings[book.id] || 0) + "☆".repeat(5 - (ratings[book.id] || 0))}
                      </p>
                    </div>

                    <div className="mt-1 flex space-x-1 sm:space-x-2 md:space-x-2">
                      <button
                        className="text-xs sm:text-sm md:text-sm px-2 sm:px-3 py-1 rounded text-white"
                        style={{ backgroundColor: "#870022" }}
                        onClick={() => openBook(book)}
                      >
                        Read Now
                      </button>

                      <button
                        id={`bookmark-icon-${book.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(book);
                        }}
                        className="p-1 sm:p-2 rounded flex items-center justify-center text-white hover:opacity-90 transition-transform hover:scale-105"
                        style={{ backgroundColor: "#870022" }}
                      >
                        {bookmarkedIds.includes(book.id) ? (
                          <BookmarkCheck className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400" />
                        ) : (
                          <Bookmark className="w-4 sm:w-5 h-4 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>
          {`
            .scale-up {
              transform: scale(0.5);
              transition: transform 0.3s ease-in-out;
            }
          `}
        </style>
      </main>
    </>
  );
};

export default DashboardHome;