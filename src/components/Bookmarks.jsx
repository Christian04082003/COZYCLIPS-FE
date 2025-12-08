import React, { useState, useEffect } from "react";
import DashboardNavbar from "./DashboardNavbar";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bearImg from "../assets/bear.png";

const Bookmarks = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [bookmarkedBooks, setBookmarkedBooks] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) setProfileImage(savedImage);
    const storedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const enrichedBookmarks = storedBookmarks.map((b) => ({
      ...b,
      dateBookmarked: b.dateBookmarked || new Date().toISOString(),
    }));
    setBookmarkedBooks(enrichedBookmarks);
    setBookmarkedIds(enrichedBookmarks.map((b) => b.id));
  }, []);

  const toggleBookmark = (book) => {
    const stored = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const isBookmarked = bookmarkedIds.includes(book.id);
    let updatedBookmarks;
    if (isBookmarked) {
      updatedBookmarks = stored.filter((b) => b.id !== book.id);
      setBookmarkedIds((prev) => prev.filter((id) => id !== book.id));
    } else {
      const newBookmark = { ...book, dateBookmarked: new Date().toISOString() };
      updatedBookmarks = [...stored, newBookmark];
      setBookmarkedIds((prev) => [...prev, book.id]);
    }
    setBookmarkedBooks(updatedBookmarks);
    localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
    const el = document.getElementById(`bookmark-icon-${book.id}`);
    if (el) {
      el.classList.add("scale-up");
      setTimeout(() => el.classList.remove("scale-up"), 300);
    }
  };

  const openBook = (book) => {
    const formats = book.formats || {};
    const url =
      formats["text/plain; charset=utf-8"] ||
      formats["text/plain"] ||
      formats["text/html; charset=utf-8"] ||
      formats["text/html"] ||
      formats["application/epub+zip"] ||
      null;
    if (url) {
      navigate("/read", { state: { book, link: url } });
    }
  };

  const formatDate = (isoDate) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <DashboardNavbar profileImage={profileImage} />
      <main className="p-4 sm:p-6 bg-[#F9F3EA] min-h-screen">
        <div className="rounded-xl mx-auto text-center py-2 mt-15 shadow-md border border-black/90 bg-[#F9F3EA] w-full max-w-full">
          <h2 className="text-2xl sm:text-3xl font-bold">Your Bookmarks</h2>
        </div>

        <div className="rounded-xl p-3 sm:p-4 mt-5 shadow-lg border border-black/90 bg-[#F9F3EA] min-h-[81vh] max-h-[81vh] overflow-y-auto flex flex-col justify-start">
          {bookmarkedBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 flex-grow">
              <img src={bearImg} alt="No bookmarks" className="w-24 sm:w-28 opacity-70" />
              <p className="text-gray-500 mt-3 text-xs sm:text-sm">No Bookmarks Available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
              {bookmarkedBooks.map((book) => (
                <div
                  key={book.id}
                  className="rounded-xl p-4 flex flex-col justify-between bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  style={{ border: "1px solid rgba(0,0,0,0.9)" }}
                  onClick={() => openBook(book)}
                >
                  <img
                    src={book.formats?.["image/jpeg"] || "/src/assets/book.png"}
                    alt={book.title}
                    className="w-full h-36 object-cover rounded-md shadow-md"
                    style={{ border: "1px solid rgba(0,0,0,0.9)" }}
                  />
                  <div className="mt-3 flex flex-col flex-grow justify-between">
                    <div className="text-left">
                      <h2 className="text-base font-semibold leading-tight line-clamp-2">{book.title}</h2>
                      <p className="text-sm text-gray-600 leading-tight truncate mb-1">{book.authors?.[0]?.name || "Unknown"}</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <p className="text-xs italic text-gray-500">{formatDate(book.dateBookmarked)}</p>
                      <button
                        id={`bookmark-icon-${book.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(book);
                        }}
                        className="bg-[#870022] text-white p-2 rounded hover:bg-[#870022] transition-transform transform hover:scale-105"
                      >
                        {bookmarkedIds.includes(book.id) ? <BookmarkCheck className="w-4 h-4 text-yellow-400" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style>
        {`
          .scale-up {
            transform: scale(1.1);
            transition: transform 0.3s ease-in-out;
          }
        `}
      </style>
    </>
  );
};

export default Bookmarks;
