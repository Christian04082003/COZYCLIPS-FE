import React, { useState, useEffect } from "react";
import DashboardNavbar from "./DashboardNavbar";
import { Upload, Bookmark, BookmarkCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const rankStages = ["V", "IV", "III", "II", "I"];
const rankOrder = ["Bronze", "Silver", "Gold", "Diamond", "Amethyst", "Challenger"];

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
    firstName: localStorage.getItem("username") || "User",
    email: "user@email.com",
  });

  const [levelProgress, setLevelProgress] = useState(() => Number(localStorage.getItem("levelProgress")) || 0);
  const [completedProgress, setCompletedProgress] = useState(() => Number(localStorage.getItem("completedProgress")) || 0);

  const [suggested, setSuggested] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    const saved = localStorage.getItem("bookmarks");
    return saved ? JSON.parse(saved).map((b) => b.id) : [];
  });

  const [ratings, setRatings] = useState({});
  const [rank, setRank] = useState(JSON.parse(localStorage.getItem("rankData")) || { tier: "Bronze", stage: 1 });

  const navigate = useNavigate();

  useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) setProfileImage(savedImage);

    const savedUsername = localStorage.getItem("username");
    if (savedUsername) setUserData((u) => ({ ...u, firstName: savedUsername }));
  }, []);

  // --- START: Updated useEffect hook for fetching suggested books from the backend ---
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
  // --- END: Updated useEffect hook ---

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

  const upgradeRank = () => {
    let { tier, stage } = rank;

    if (stage < 5) stage += 1;
    else {
      const index = rankOrder.indexOf(tier);
      if (index < rankOrder.length - 1) {
        tier = rankOrder[index + 1];
        stage = 1;
      }
    }

    const newRank = { tier, stage };
    setRank(newRank);
    localStorage.setItem("rankData", JSON.stringify(newRank));

    setLevelProgress(0);
    setCompletedProgress(0);

    window.dispatchEvent(new Event("progressUpdate"));
  };

  useEffect(() => {
    if (levelProgress >= 100 && completedProgress >= 10) upgradeRank();
  }, [levelProgress, completedProgress]);

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

      const booksRead = Number(localStorage.getItem("booksRead")) || 0;
      localStorage.setItem("booksRead", booksRead + 1);

      window.dispatchEvent(new Event("progressUpdate"));

      navigate("/read", { state: { book, link: url } });
    }
  };

  const toggleBookmark = (book) => {
    const stored = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const isBookmarked = bookmarkedIds.includes(book.id);
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
  };

  return (
    <>
      <DashboardNavbar profileImage={profileImage} />
      <main className="flex-1 flex flex-col p-6 overflow-auto mt-6 mb-12" style={{ backgroundColor: "#F9F3EA" }}>
        <div
          className="flex items-center justify-between w-full h-[180px] rounded-2xl overflow-hidden shadow-2xl relative mt-6"
          style={{
            backgroundImage: "url('/src/assets/bronze.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>

          <div className="relative flex items-center w-full md:w-1/2 p-4 md:p-8 space-x-4 md:space-x-6 backdrop-blur-[2px] z-10">
            <label
              htmlFor="profile-upload-disabled"
              className="relative w-20 h-20 md:w-40 md:h-32 bg-gray-700/80 rounded-lg flex items-center justify-center overflow-hidden border border-gray-600"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="object-cover w-full h-full" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <Upload size={24} />
                </div>
              )}
              <input id="profile-upload-disabled" type="file" disabled className="hidden" />
            </label>

            <div className="w-full">
              <h2 className="text-lg md:text-2xl font-semibold text-white drop-shadow-md">{userData.firstName}</h2>

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
            <img src="/src/assets/dragon.png" alt="Dragon" className="absolute bottom-3 right-3 w-28 h-28 object-contain opacity-90" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="order-1 md:order-2 bg-white rounded-2xl shadow-md border border-gray-300 flex flex-col h-auto md:h-[calc(100vh-300px)]">
            <h2 className="text-lg font-semibold p-4 sticky top-0 bg-white z-10 border-b border-gray-200 rounded-t-2xl">To-do</h2>
            <div className="overflow-auto flex-1 flex flex-col items-center justify-center p-4">
              <img src="/src/assets/bear.png" className="w-16 md:w-20 opacity-50" />
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