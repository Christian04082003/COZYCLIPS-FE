import React, { useEffect, useState, useRef } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck } from "lucide-react";

// Shuffle helper
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Stable color from ID
const getStableColor = (id) => {
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) {
    hash = (hash << 5) - hash + String(id).charCodeAt(i);
    hash |= 0;
  }
  const colors = [
    "bg-pink-200", "bg-yellow-200", "bg-green-200", "bg-blue-200",
    "bg-indigo-200", "bg-purple-200", "bg-red-200", "bg-orange-200"
  ];
  return colors[Math.abs(hash) % colors.length];
};

const Library = () => {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [ratings, setRatings] = useState({});
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Load bookmarks from backend
  useEffect(() => {
    const fetchBookmarksFromBackend = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
        const token = authData.token;
        
        if (!token) {
          // Fallback to localStorage if not authenticated
          const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
          setBookmarkedIds(saved.map(b => b.id));
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
          setBookmarkedIds(bookmarkIds);
          
          // Sync with localStorage
          const storedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
          const syncedBookmarks = storedBookmarks.filter(b => bookmarkIds.includes(String(b.id)));
          localStorage.setItem("bookmarks", JSON.stringify(syncedBookmarks));
        } else {
          // Fallback to localStorage
          const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
          setBookmarkedIds(saved.map(b => b.id));
        }
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
        const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
        setBookmarkedIds(saved.map(b => b.id));
      }
    };
    
    fetchBookmarksFromBackend();
  }, []);

  // Fetch books from your working backend
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://czc-eight.vercel.app/api/library/stories?limit=80&refresh=false", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });

      if (!res.ok) {
        if (res.status === 503) {
          setTimeout(fetchBooks, 4000);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.books)) {
        throw new Error("Invalid response");
      }

      // Backend already gives us perfect, clean books with .content included
      let fetchedBooks = data.books.map(book => ({
        ...book,
        id: book.id || `book-${Math.random().toString(36).substr(2, 9)}`,
        title: book.title?.trim() || "Untitled",
        author: book.author || "Unknown Author",
        cover_url: book.cover_url || `https://www.gutenberg.org/cache/epub/${book.id.replace("GB", "")}/pg${book.id.replace("GB", "")}.cover.medium.jpg`,
        content: book.content || null,
      }));

      // Shuffle for variety
      fetchedBooks = shuffleArray(fetchedBooks);

      // Generate fake ratings
      const newRatings = {};
      fetchedBooks.forEach(b => {
        if (!ratings[b.id]) {
          newRatings[b.id] = "★★★★★".substring(0, Math.floor(Math.random() * 3) + 3) + "☆☆☆☆☆".substring(0, 5 - (Math.floor(Math.random() * 3) + 3));
        }
      });
      setRatings(prev => ({ ...prev, ...newRatings }));

      setBooks(fetchedBooks);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load books:", err);
      setTimeout(fetchBooks, 5000);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Bookmark toggle with backend sync
  const toggleBookmark = async (book) => {
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const exists = saved.some(b => b.id === book.id);

    try {
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      const token = authData.token;
      
      if (token) {
        // Call backend API
        const endpoint = exists 
          ? "https://czc-eight.vercel.app/api/student/bookmarks/remove"
          : "https://czc-eight.vercel.app/api/student/bookmarks/add";
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ storyId: String(book.id) })
        });
        
        if (!response.ok) {
          throw new Error("Failed to update bookmark in backend");
        }
      }
      
      // Update local state
      let updated;
      if (exists) {
        updated = saved.filter(b => b.id !== book.id);
        setBookmarkedIds(prev => prev.filter(id => id !== book.id));
      } else {
        updated = [...saved, book];
        setBookmarkedIds(prev => [...prev, book.id]);
      }
      localStorage.setItem("bookmarks", JSON.stringify(updated));
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      // Still update localStorage as fallback
      let updated;
      if (exists) {
        updated = saved.filter(b => b.id !== book.id);
        setBookmarkedIds(prev => prev.filter(id => id !== book.id));
      } else {
        updated = [...saved, book];
        setBookmarkedIds(prev => [...prev, book.id]);
      }
      localStorage.setItem("bookmarks", JSON.stringify(updated));
    }
  };

  // Split into rows
  const chunk = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const recommendedBooks = books.slice(0, 40);
  const latestBooks = books.slice(40);

  const recommendedRows = chunk(recommendedBooks, 8);
  const latestRows = chunk(latestBooks, 8);

  return (
    <>
      <DashboardNavbar />

      <div className="pt-20 bg-[#f3ede3] min-h-screen px-4 sm:px-6 lg:px-12 pb-24">
        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-8">Library</h1>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-700">Loading your perfect stories...</p>
          </div>
        ) : (
          <>
            {/* Recommended */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-black mb-6">Recommended for You</h2>
              {recommendedRows.map((row, i) => (
                <div key={`rec-${i}`} className="mb-10 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 sm:gap-6 pb-4">
                    {row.map(book => (
                      <div
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className="flex-shrink-0 w-44 sm:w-52 cursor-pointer group"
                      >
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2">
                          <div className="h-64 bg-gray-50 relative overflow-hidden flex items-center justify-center p-2">
                            {book.cover_url ? (
                              <img
                                src={book.cover_url}
                                alt={book.title}
                                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.src = "";
                                  e.target.parentElement.style.backgroundColor = "#fce7f3";
                                  e.target.parentElement.innerHTML += `
                                    <div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                      <span class="text-6xl mb-2">📖</span>
                                      <p class="text-sm font-medium text-gray-700 line-clamp-3">${book.title}</p>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className={`h-full w-full flex flex-col items-center justify-center p-4 text-center ${getStableColor(book.id)}`}>
                                <span className="text-6xl mb-2">📖</span>
                                <p className="text-sm font-medium text-gray-800 line-clamp-3">{book.title}</p>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-sm line-clamp-2">{book.title}</h3>
                            <p className="text-xs text-gray-600 mt-1">{book.author}</p>
                            <p className="text-yellow-500 text-lg mt-2">{ratings[book.id] || "★★★★☆"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Latest */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-6">Latest Additions</h2>
              {latestRows.map((row, i) => (
                <div key={`latest-${i}`} className="mb-10 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 sm:gap-6 pb-4">
                    {row.map(book => (
                      <div key={book.id} onClick={() => setSelectedBook(book)} className="flex-shrink-0 w-44 sm:w-52 cursor-pointer group">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2">
                          <div className="h-64 bg-gray-50 relative overflow-hidden flex items-center justify-center p-2">
                            {book.cover_url ? (
                              <img
                                src={book.cover_url}
                                alt={book.title}
                                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.src = "";
                                  e.target.parentElement.style.backgroundColor = "#fee2e2";
                                  e.target.parentElement.innerHTML += `
                                    <div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                      <span class="text-6xl mb-2">📖</span>
                                      <p class="text-sm font-medium text-gray-700 line-clamp-3">${book.title}</p>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className={`h-full w-full flex flex-col items-center justify-center p-4 text-center ${getStableColor(book.id)}`}>
                                <span className="text-6xl mb-2">📖</span>
                                <p className="text-sm font-medium text-gray-800 line-clamp-3">{book.title}</p>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-sm line-clamp-2">{book.title}</h3>
                            <p className="text-xs text-gray-600 mt-1">{book.author}</p>
                            <p className="text-yellow-500 text-lg mt-2">{ratings[book.id] || "★★★★☆"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>

      {/* Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBook(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-3 -right-3 text-2xl font-bold text-gray-700 hover:text-red-600 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:shadow-lg transition-all border-2 border-gray-200"
              onClick={() => setSelectedBook(null)}
            >×</button>

            <div className="mb-4 relative">
              <div className="h-72 bg-gray-50 rounded-lg overflow-hidden shadow-md flex items-center justify-center p-3">
                {selectedBook.cover_url ? (
                  <img src={selectedBook.cover_url} alt="" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className={`h-full w-full flex flex-col items-center justify-center ${getStableColor(selectedBook.id)}`}>
                    <span className="text-7xl mb-3">📖</span>
                    <p className="text-xl font-bold px-4 text-center line-clamp-3">{selectedBook.title}</p>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); toggleBookmark(selectedBook); }}
                className="absolute top-2 right-2 bg-[#b0042b] p-2 rounded-full shadow-md hover:scale-110 transition"
              >
                {bookmarkedIds.includes(selectedBook.id) ? (
                  <BookmarkCheck size={20} className="text-yellow-400" />
                ) : (
                  <Bookmark size={20} className="text-white" />
                )}
              </button>
            </div>

            <h2 className="text-xl font-bold text-center mb-1 line-clamp-2">{selectedBook.title}</h2>
            <p className="text-center text-gray-600 text-sm mb-3">by {selectedBook.author}</p>
            <p className="text-center text-2xl text-yellow-500 mb-4">{ratings[selectedBook.id] || "★★★★☆"}</p>

            <button
              onClick={() => navigate("/read", { state: { book: selectedBook } })}
              className="w-full bg-[#b0042b] hover:bg-[#8a0322] text-white font-bold py-3 rounded-lg text-base transition"
            >
              Read Now
            </button>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
};

export default Library;