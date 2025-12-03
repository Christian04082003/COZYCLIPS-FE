import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Read = () => {
  const { state } = useLocation();
  const { book, link } = state || {};
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showPageIndicator, setShowPageIndicator] = useState(true);
  const [editingPage, setEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const readingTimerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    readingTimerRef.current = setInterval(() => {
      const start = Number(localStorage.getItem("readingStartTime"));
      if (!start) return;
      const now = Date.now();
      const minutes = Math.floor((now - start) / 60000);
      const gained = Math.floor(minutes / 2);
      const lastSaved = Number(localStorage.getItem("levelProgress")) || 0;
      const updated = Math.min(lastSaved + gained, 100);
      localStorage.setItem("levelProgress", updated);
      window.dispatchEvent(new Event("storage"));
    }, 60000);
    return () => clearInterval(readingTimerRef.current);
  }, []);

  useEffect(() => {
    if (!link) return;
    const loadText = async () => {
      try {
        const res = await fetch("http://localhost:4000/fetch-book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link }),
        });
        const data = await res.json();
        if (!data.text) throw new Error("No text returned");

        let plainText = data.text
          .replace(/<[^>]*>/g, " ")
          .replace(/\{[^}]*\}/g, " ")
          .replace(/\[.*?\]/g, " ")
          .replace(/Copyright.*?(\d{4})?/gi, " ")
          .replace(/All rights reserved/gi, " ")
          .replace(/Project Gutenberg License[\s\S]*?(\*\*\*|$)/gi, " ")
          .replace(/www\.[^\s]+/gi, " ")
          .replace(/https?:\/\/[^\s]+/gi, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (isMobile) {
          const words = plainText.split(/\s+/);
          const sections = [];
          let current = "";
          const wordsPerSection = 120;
          words.forEach((word) => {
            current += word + " ";
            if (current.split(" ").length >= wordsPerSection) {
              sections.push(current.trim());
              current = "";
            }
          });
          if (current.trim()) sections.push(current.trim());
          setPages(sections);
        } else {
          const containerHeight = containerRef.current?.clientHeight || 600;
          const lineHeight = 35;
          const usableHeight = containerHeight - 120;
          const linesPerPage = Math.floor(usableHeight / lineHeight);
          const words = plainText.split(/\s+/);
          const output = [];
          let currentPage = "";
          const approxWordsPerLine = 12;
          words.forEach((word) => {
            currentPage += word + " ";
            if ((currentPage.split(" ").length / approxWordsPerLine) >= linesPerPage) {
              output.push(currentPage.trim());
              currentPage = "";
            }
          });
          if (currentPage.trim()) output.push(currentPage.trim());
          setPages(output);
        }
      } catch {
        setPages(["Failed to load content."]);
      }
    };
    loadText();
  }, [link, isMobile]);

  if (!book) return <p className="text-center mt-10">No book selected.</p>;

  const leftPage = pages[pageIndex * 2];
  const rightPage = pages[pageIndex * 2 + 1];
  const totalDoublePages = Math.ceil(pages.length / 2);

  const handleScroll = () => {
    setShowPageIndicator(true);
    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => setShowPageIndicator(false), 1000);
  };

  const handlePageNumberClick = () => {
    setEditingPage(true);
    setPageInput(String(pageIndex + 1));
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === "Enter") {
      let targetPage = parseInt(pageInput, 10);
      if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalDoublePages) {
        setPageIndex(targetPage - 1);
      }
      setEditingPage(false);
    }
  };

  const handleTakeQuiz = () => {
    const completed = Number(localStorage.getItem("completedProgress")) || 0;
    localStorage.setItem("completedProgress", completed + 1);
    const booksRead = Number(localStorage.getItem("booksRead")) || 0;
    localStorage.setItem("booksRead", booksRead + 1);
    window.dispatchEvent(new Event("storage"));
    navigate("/dashboardlayout/quiz-game", { state: { book } });
  };

  return (
    <div
      className={`w-full min-h-screen bg-[#f3ede3] flex flex-col items-center ${
        isMobile ? "p-0" : "pt-[30px] pb-[30px]"
      }`}
      onScroll={isMobile ? handleScroll : undefined}
      ref={containerRef}
    >
      <div
        className={`relative flex ${
          isMobile ? "flex-col w-full h-screen overflow-y-auto" : "w-[calc(100%-70px)] h-[calc(100vh-60px)]"
        } bg-white rounded-[24px] shadow-2xl overflow-hidden`}
        style={{ perspective: "1500px" }}
      >
        {!isMobile && (
          <>
            <div
              className="flex-1 px-[40px] py-5 text-lg font-serif font-normal text-left break-words relative"
              style={{ lineHeight: "38px" }}
            >
              {pageIndex === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
                  <h3 className="text-xl font-semibold">{book.authors?.[0]?.name || "Unknown Author"}</h3>
                </div>
              ) : (
                <p className="whitespace-pre-wrap mt-[60px] mb-[60px]">{leftPage}</p>
              )}
            </div>

            <div className="w-2 bg-gray-300"></div>

            <div
              className="flex-1 px-[40px] py-5 text-lg font-serif font-normal text-left break-words relative"
              style={{ lineHeight: "38px" }}
            >
              {pageIndex === totalDoublePages - 1 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm rounded-[24px] p-6">
                  <p className="text-xl font-semibold mb-4 text-center">Ready to test your knowledge?</p>
                  <button
                    onClick={handleTakeQuiz}
                    className="bg-[#b0042b] text-white px-4 py-2 rounded shadow hover:bg-[#8a0322] transition text-sm"
                  >
                    Take Quiz
                  </button>
                </div>
              ) : (
                <>
                  {rightPage ? (
                    <p className="whitespace-pre-wrap mt-[60px] mb-[60px]">{rightPage}</p>
                  ) : (
                    <p className="text-gray-500 text-left mt-[30px] mb-[30px]">No content</p>
                  )}
                </>
              )}
            </div>

            <div className="absolute bottom-10 w-full flex justify-between px-100">
              {pageIndex > 0 ? (
                <button
                  onClick={() => setPageIndex(pageIndex - 1)}
                  className="bg-[#b0042b] text-white px-6 py-2 rounded shadow hover:bg-[#8a0322] transition"
                >
                  Previous
                </button>
              ) : (
                <div className="w-[94px]"></div>
              )}

              {pageIndex !== totalDoublePages - 1 && (
                <button
                  onClick={() => setPageIndex(pageIndex + 1)}
                  className="bg-[#b0042b] text-white px-6 py-2 rounded shadow hover:bg-[#8a0322] transition"
                >
                  Next
                </button>
              )}
            </div>

            <div className="absolute bottom-4 right-6 text-gray-700 font-semibold cursor-pointer">
              {editingPage ? (
                <input
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={handlePageInputKeyDown}
                  onBlur={() => setEditingPage(false)}
                  autoFocus
                  className="w-16 text-center border border-gray-400 rounded"
                />
              ) : (
                <span onClick={handlePageNumberClick}>
                  Page {pageIndex + 1} / {totalDoublePages}
                </span>
              )}
            </div>
          </>
        )}

        {isMobile && (
          <>
            <div className="snap-start w-full px-4 py-4 flex flex-col justify-center text-center">
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              <h3 className="text-lg font-semibold">{book.authors?.[0]?.name || "Unknown Author"}</h3>
            </div>

            {pages.map((section, idx) => (
              <div
                key={idx}
                className="snap-start w-full px-4 py-4 text-base font-serif break-words flex flex-col justify-start relative bg-white m-0"
                style={{ lineHeight: "28px" }}
              >
                <p className="whitespace-pre-wrap">{section}</p>
                {idx === pages.length - 1 && (
                  <div className="mt-8 flex flex-col items-center">
                    <p className="text-base mb-2 font-semibold text-center">Ready to test your knowledge?</p>
                    <button
                      onClick={handleTakeQuiz}
                      className="bg-[#b0042b] text-white px-4 py-2 rounded shadow hover:bg-[#8a0322] transition text-sm"
                    >
                      Take Quiz
                    </button>
                  </div>
                )}
              </div>
            ))}

            {showPageIndicator && (
              <div className="absolute bottom-4 w-full flex justify-center space-x-2">
                {pages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-2 rounded-full bg-gray-500 ${
                      pageIndex === idx ? "opacity-100" : "opacity-40"
                    }`}
                  ></div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Read;
