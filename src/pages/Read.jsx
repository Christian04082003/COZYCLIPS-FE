import React, { useEffect, useState, useRef, useCallback } from "react";
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
  const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);
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
    if (!book || !book.id) return;
    const loadText = async () => {
      try {
        const BACKEND_URL = `https://czc-eight.vercel.app/api/stories/${book.id}`;
        const res = await fetch(BACKEND_URL);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!data.story || !data.story.content) {
          throw new Error("No content returned");
        }

        let plainText = data.story.content
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
          // Mobile: Simple word-based chunks
          const words = plainText.split(/\s+/);
          const sections = [];
          const wordsPerSection = 200;
          
          for (let i = 0; i < words.length; i += wordsPerSection) {
            const chunk = words.slice(i, i + wordsPerSection).join(" ");
            sections.push(chunk);
          }
          setPages(sections);
        } else {
          // Desktop: Fixed character limit per page with sentence boundaries
          const sentences = plainText.match(/[^.!?]+[.!?]+/g) || [plainText];
          const output = [];
          let currentPage = "";
          const maxCharsPerPage = 1800; // Conservative limit to prevent overflow
          
          for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            
            // If adding this sentence exceeds the limit and we have content, start new page
            if (currentPage.length > 0 && (currentPage.length + sentence.length + 1) > maxCharsPerPage) {
              output.push(currentPage.trim());
              currentPage = sentence + " ";
            } else {
              currentPage += sentence + " ";
            }
          }
          
          // Add any remaining content
          if (currentPage.trim()) {
            output.push(currentPage.trim());
          }
          
          setPages(output);
        }
      } catch (error) {
        console.error("Failed to load book content:", error);
        setPages(["Failed to load content. Please try again later."]);
      }
    };
    loadText();
    setHasRecordedCompletion(false); // Reset flag when loading a new book
    setPageIndex(0); // Reset to first page
  }, [book, isMobile]);

  if (!book) return <p className="text-center mt-10">No book selected.</p>;

  // Desktop shows 2 pages at once (left and right)
  // Title page is page 0, content starts at page 1
  let leftPage, rightPage;
  if (pageIndex === 0) {
    // Title page
    leftPage = null;
    rightPage = pages.length > 0 ? pages[0] : null;
  } else {
    // Content pages
    leftPage = pages[(pageIndex - 1) * 2] || null;
    rightPage = pages[(pageIndex - 1) * 2 + 1] || null;
  }
  
  const totalDoublePages = Math.ceil((pages.length + 1) / 2); // +1 for title page
  const isLastPage = pageIndex === totalDoublePages - 1;

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

  // Record book completion when user reaches the end
  const recordBookCompletion = useCallback(async () => {
    console.log("Recording book completion:", book.id);
    
    const completed = Number(localStorage.getItem("completedProgress")) || 0;
    localStorage.setItem("completedProgress", completed + 1);
    const booksRead = Number(localStorage.getItem("booksRead")) || 0;
    localStorage.setItem("booksRead", booksRead + 1);
    window.dispatchEvent(new Event("storage"));

    // Update quest progress on backend
    try {
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      const token = authData.token;
      
      // Get the start time from localStorage (was set when user started reading)
      const startTime = Number(localStorage.getItem("readingStartTime")) || Date.now();
      
      if (token) {
        const response = await fetch("https://czc-eight.vercel.app/api/quest/update-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            eventType: "book_completed",
            bookId: book.id,
            startTime: startTime
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Book completion recorded on backend:", data);
          // Dispatch event to notify Challenges page
          window.dispatchEvent(new Event("bookCompleted"));
        }
      }
    } catch (error) {
      console.error("Error recording book completion:", error);
    }
  }, [book.id]);

  const handleTakeQuiz = async () => {
    // Book completion is already recorded when reaching the last page
    navigate("/dashboardlayout/quiz-game", { state: { book } });
  };

  const handleBookComplete = async () => {
    // Book completion is already recorded when reaching the last page
    // Go back to library or dashboard
    navigate("/library");
  };

  // Automatically record book completion when user reaches the last page
  useEffect(() => {
    if (isLastPage && pages.length > 0 && !hasRecordedCompletion) {
      setHasRecordedCompletion(true);
      recordBookCompletion();
    }
  }, [isLastPage, pages.length, recordBookCompletion, hasRecordedCompletion]);

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
          isMobile ? "flex-col w-full h-screen overflow-y-auto snap-y snap-mandatory" : "w-[calc(100%-70px)] h-[calc(100vh-60px)]"
        } bg-white rounded-[24px] shadow-2xl overflow-hidden`}
        style={{ perspective: "1500px" }}
      >
        {!isMobile && (
          <>
            {/* Left Page */}
            <div
              className="flex-1 px-[50px] py-[50px] text-[17px] font-serif font-normal text-left break-words relative flex items-start"
              style={{ lineHeight: "32px", overflow: "hidden" }}
            >
              {pageIndex === 0 ? (
                <div className="flex flex-col items-center justify-center h-full w-full text-center">
                  <h1 className="text-4xl font-bold mb-4">{book.title}</h1>
                  <h3 className="text-xl font-semibold text-gray-700">{book.authors?.[0]?.name || "Unknown Author"}</h3>
                </div>
              ) : leftPage ? (
                <div className="whitespace-pre-wrap w-full">
                  {leftPage}
                </div>
              ) : (
                <div className="w-full"></div>
              )}
            </div>

            {/* Center Divider */}
            <div className="w-[2px] bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200"></div>

            {/* Right Page */}
            <div
              className="flex-1 px-[50px] py-[50px] text-[17px] font-serif font-normal text-left break-words relative flex items-start"
              style={{ lineHeight: "32px", overflow: "hidden" }}
            >
              {isLastPage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/5 to-black/10 backdrop-blur-sm rounded-r-[24px] p-6">
                  <div className="bg-white/90 rounded-lg p-8 shadow-xl text-center">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Congratulations! 🎉</h2>
                    <p className="text-lg mb-6 text-gray-700">You've finished reading this book.</p>
                    <p className="text-base mb-6 font-semibold text-gray-800">What would you like to do?</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleBookComplete}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-all transform hover:scale-105"
                      >
                        Complete & Back to Library
                      </button>
                      <button
                        onClick={handleTakeQuiz}
                        className="bg-[#b0042b] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-[#8a0322] transition-all transform hover:scale-105"
                      >
                        Take Quiz
                      </button>
                    </div>
                  </div>
                </div>
              ) : rightPage ? (
                <div className="whitespace-pre-wrap w-full">
                  {rightPage}
                </div>
              ) : (
                <div className="w-full"></div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="absolute bottom-8 left-[50px] pointer-events-none">
              <div className="pointer-events-auto">
                {pageIndex > 0 && (
                  <button
                    onClick={() => setPageIndex(pageIndex - 1)}
                    className="bg-[#b0042b] text-white px-6 py-2.5 rounded-lg shadow-lg hover:bg-[#8a0322] transition-all transform hover:scale-105 font-semibold"
                  >
                    ← Previous
                  </button>
                )}
              </div>
            </div>

            {/* Page Number - Always Centered */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              <div className="text-gray-600 font-semibold text-sm cursor-pointer select-none">
                {editingPage ? (
                  <input
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={() => setEditingPage(false)}
                    autoFocus
                    className="w-20 text-center border border-gray-400 rounded px-2 py-1"
                  />
                ) : (
                  <span onClick={handlePageNumberClick} className="hover:text-[#b0042b] transition">
                    Page {pageIndex + 1} / {totalDoublePages}
                  </span>
                )}
              </div>
            </div>

            <div className="absolute bottom-8 right-[50px] pointer-events-none">
              <div className="pointer-events-auto">
                {!isLastPage && (
                  <button
                    onClick={() => setPageIndex(pageIndex + 1)}
                    className="bg-[#b0042b] text-white px-6 py-2.5 rounded-lg shadow-lg hover:bg-[#8a0322] transition-all transform hover:scale-105 font-semibold"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mobile View */}
        {isMobile && (
          <>
            {/* Title Page */}
            <div className="snap-start w-full min-h-screen px-6 py-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-gray-50 to-white">
              <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
              <h3 className="text-lg font-semibold text-gray-600">{book.authors?.[0]?.name || "Unknown Author"}</h3>
              <p className="mt-8 text-sm text-gray-500">Swipe up to start reading</p>
            </div>

            {/* Content Pages */}
            {pages.map((section, idx) => (
              <div
                key={idx}
                className="snap-start w-full min-h-screen px-5 py-8 text-base font-serif break-words flex flex-col justify-start relative bg-white"
                style={{ lineHeight: "28px" }}
              >
                <p className="whitespace-pre-wrap">{section}</p>
                {idx === pages.length - 1 && (
                  <div className="mt-12 flex flex-col items-center pb-8">
                    <div className="bg-gray-50 rounded-lg p-6 shadow-md text-center">
                      <h3 className="text-xl font-bold mb-3">Congratulations! 🎉</h3>
                      <p className="text-sm mb-4 text-gray-700">You've finished reading this book.</p>
                      <p className="text-base mb-4 font-semibold">What would you like to do?</p>
                      <div className="flex gap-2 justify-center flex-col sm:flex-row">
                        <button
                          onClick={handleBookComplete}
                          className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-all text-sm sm:text-base"
                        >
                          Complete & Back
                        </button>
                        <button
                          onClick={handleTakeQuiz}
                          className="bg-[#b0042b] text-white px-4 py-3 rounded-lg shadow-lg hover:bg-[#8a0322] transition-all text-sm sm:text-base"
                        >
                          Take Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Page Indicator Dots */}
            {showPageIndicator && pages.length > 0 && (
              <div className="fixed bottom-6 w-full flex justify-center space-x-2 z-10 pointer-events-none">
                <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-2">
                  {pages.slice(0, 10).map((_, idx) => (
                    <span
                      key={idx}
                      className={`inline-block h-2 w-2 rounded-full mx-1 transition-all ${
                        pageIndex === idx ? "bg-[#b0042b] w-4" : "bg-white/60"
                      }`}
                    ></span>
                  ))}
                  {pages.length > 10 && <span className="text-white text-xs ml-2">+{pages.length - 10}</span>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Read;