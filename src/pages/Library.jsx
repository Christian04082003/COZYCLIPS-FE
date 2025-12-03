import React, { useEffect, useState, useRef } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck } from "lucide-react"; 

const Library = () => {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const [recIndex, setRecIndex] = useState([0, 0, 0, 0]);
  const [latIndex, setLatIndex] = useState([0, 0, 0, 0]);

  const recRefs = Array.from({ length: 4 }, () => useRef(null));
  const latRefs = Array.from({ length: 4 }, () => useRef(null));

  const navigate = useNavigate();

  const randomStars = () =>
    "★".repeat(Math.floor(Math.random() * 5) + 1).padEnd(5, "☆");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    setBookmarkedIds(stored.map((b) => b.id));
  }, []);

  const fetchManyBooks = async () => {
    let allBooks = [];
    const totalPages = 50;
    const batchSize = 5;

    for (let i = 1; i <= totalPages; i += batchSize) {
      const batch = await Promise.all(
        [...Array(batchSize)].map((_, idx) => {
          const page = i + idx;
          return page <= totalPages
            ? fetch(`https://gutendex.com/books/?page=${page}`)
                .then((res) => res.json())
                .catch(() => null)
            : null;
        })
      );

      const results = batch.filter((b) => b?.results).flatMap((b) => b.results);
      allBooks = [...allBooks, ...results];

      const uniqueBooks = Array.from(
        new Map(allBooks.map((b) => [b.id, b])).values()
      ).slice(0, 1200);

      setRatings((prev) => {
        const updated = { ...prev };
        uniqueBooks.forEach((b) => {
          if (!updated[b.id]) updated[b.id] = randomStars();
        });
        return updated;
      });

      setBooks(uniqueBooks);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManyBooks();
  }, []);

  const booksPerSlide = 6;

  const scrollTo = (ref, index) => {
    if (!ref.current) return;
    const container = ref.current;
    const totalSlides = Math.ceil(container.children.length / booksPerSlide);
    const slideWidth = container.scrollWidth / totalSlides;
    container.scrollTo({ left: slideWidth * index, behavior: "smooth" });
  };

  const getSlideCount = (list) => Math.ceil(list.length / booksPerSlide);

  const renderRow = (list, ref, index, setIndex, rowNumber, offset = 0) => {
    const rowBooks = list.slice(offset).concat(list.slice(0, offset));
    return (
      <div className="space-y-4 w-full">
        <div ref={ref} className="flex space-x-4 gap-[1px] overflow-x-hidden w-full">
          {rowBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="
                bg-white rounded-xl p-3 cursor-pointer
                shadow-lg shadow-black/20 hover:shadow-xl
                hover:-translate-y-1 transition-all
                flex-shrink-0
                h-[262px] flex flex-col
                w-[70%] sm:w-[40%] md:w-[24%] lg:w-[14%] xl:w-[12%]
              "
            >
              <img
                src={book.formats["image/jpeg"] || "/src/assets/book.png"}
                className="rounded mb-2 object-cover w-full h-28 sm:h-32 md:h-36"
              />
              <h3 className="font-semibold text-base sm:text-lg line-clamp-2 break-words">
                {book.title}
              </h3>
              <p className="text-gray-700 text-sm sm:text-base">
                {book.authors?.[0]?.name || "Unknown"}
              </p>
              <p className="text-yellow-500 text-2xl sm:text-3xl mt-auto">
                {ratings[book.id]}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center space-x-2 sm:space-x-3">
          {Array.from({ length: getSlideCount(list) }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => {
                const newIndex = [...index];
                newIndex[rowNumber] = idx;
                setIndex(newIndex);
                scrollTo(ref, idx);
              }}
              className={`rounded-full cursor-pointer transition-all h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                index[rowNumber] === idx ? "bg-[#b0042b]" : "bg-gray-400"
              }`}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  const recommendedBooks = books.slice(0, 30);
  const latestBooks = books.slice(30, 60);

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
      <DashboardNavbar />

      <div className="pt-20 bg-[#f3ede3] px-4 sm:px-6 lg:px-10 pb-20 min-h-screen">
        <h1 className="text-black font-bold mb-6 sm:mb-8 text-2xl sm:text-3xl">
          📚 Library
        </h1>

        {loading ? (
          <p className="text-center text-lg text-gray-700">Loading books...</p>
        ) : (
          <>
            <h2 className="text-black text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
              Recommended
            </h2>
            <div className="space-y-8 sm:space-y-10">
              {recRefs.map((ref, i) =>
                renderRow(recommendedBooks, ref, recIndex, setRecIndex, i, i * 3)
              )}
            </div>

            <h2 className="text-black text-xl sm:text-2xl font-semibold mt-10 mb-3 sm:mb-4">
              Latest
            </h2>
            <div className="space-y-8 sm:space-y-10">
              {latRefs.map((ref, i) =>
                renderRow(latestBooks, ref, latIndex, setLatIndex, i, i * 3)
              )}
            </div>
          </>
        )}
      </div>

      {selectedBook && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md sm:max-w-lg relative">
            <button
              className="absolute top-3 left-3 text-xl sm:text-2xl z-50 hover:text-red-600 transition"
              onClick={() => setSelectedBook(null)}
            >
              ✖
            </button>

            <div className="relative">
              <img
                src={selectedBook.formats["image/jpeg"]}
                className="rounded mb-4 w-full h-40 sm:h-90 object-cover mt-5"
              />
              <button
                id={`bookmark-icon-${selectedBook.id}`}
                className="absolute top-2 right-2 text-white p-1 rounded-full bg-[#b0042b] hover:bg-[#8a0322] transition-transform"
                onClick={() => toggleBookmark(selectedBook)}
              >
                {bookmarkedIds.includes(selectedBook.id) ? (
                  <BookmarkCheck size={24} className="text-yellow-400" />
                ) : (
                  <Bookmark size={24} className="text-white" />
                )}
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-center">{selectedBook.title}</h2>

            <p className="text-gray-700 mb-1 text-sm sm:text-base text-center">
              <strong>Author:</strong> {selectedBook.authors?.[0]?.name || "Unknown"}
            </p>

            <p className="text-yellow-500 text-2xl sm:text-3xl mb-3 text-center">
              {ratings[selectedBook.id]}
            </p>

            <button
              className="bg-[#b0042b] hover:bg-[#8a0322] text-white py-2 px-10 rounded-lg text-sm sm:text-base font-semibold mx-auto block"
              onClick={() =>
                navigate("/read", {
                  state: {
                    book: selectedBook,
                    link:
                      selectedBook.formats["text/plain"] ||
                      selectedBook.formats["text/html"],
                  },
                })
              }
            >
              Read Now
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          .scale-up {
            transform: scale(1.4);
            transition: transform 0.3s ease-in-out;
          }
        `}
      </style>
    </>
  );
};

export default Library;
