import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Helper function to get authentication data from localStorage
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
    
    console.log("Auth token extracted:", !!token, "User ID:", userId);
    
    return { token, user, userId };
  } catch (e) {
    console.error("Error parsing auth:", e);
    return {};
  }
}

const QuizGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { book, storyContent } = location.state || {};

  // Debug: Log what we received from navigation
  useEffect(() => {
    console.log("=== QuizGame Mounted ===");
    console.log("Book:", book);
    console.log("Story Content Length:", storyContent?.length || "undefined/0");
    console.log("Story Content Preview:", storyContent ? storyContent.substring(0, 200) : "NO CONTENT");
  }, []);

  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookInfo, setBookInfo] = useState({
    title: book?.title || "Loading...",
    author: book?.author || "Unknown",
    image: book?.cover_url || (book?.id ? `https://www.gutenberg.org/cache/epub/${book.id.replace("GB", "")}/pg${book.id.replace("GB", "")}.cover.medium.jpg` : "https://i.ibb.co/Lkq0mwz/ibon-adarna.jpg")
  });

  const totalQuestions = quizData.length;
  const [timer, setTimer] = useState(30);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [freezeTime, setFreezeTime] = useState(false);
  const [doubleCoinsUsed, setDoubleCoinsUsed] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStartTime] = useState(Date.now());
  const [userInventory, setUserInventory] = useState([]); // User's purchased power-ups
  const [consumedIds, setConsumedIds] = useState(new Set()); // Track consumed items locally

  // Fetch user's unlocked power-ups from Firestore via backend
  const fetchUserInventory = async (token, userId) => {
    try {
      const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api'
        : 'https://czc-eight.vercel.app/api';
      
      // Fetch student data to get unlockedItems array
      const studentResponse = await fetch(`${API_BASE}/student/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!studentResponse.ok) {
        console.warn("Failed to fetch student data:", studentResponse.status);
        setUserInventory([]);
        return;
      }

      const studentData = await studentResponse.json();
      const unlockedItemIds = studentData.data?.profile?.unlockedItems || [];
      console.log("User unlocked item IDs from Firestore:", unlockedItemIds);

      if (unlockedItemIds.length === 0) {
        setUserInventory([]);
        return;
      }

      // Fetch shop items to get full details
      const shopResponse = await fetch(`${API_BASE}/shop`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        const allItems = shopData.data || [];
        
        // Filter to only unlocked items
        const unlockedItems = allItems.filter(item => unlockedItemIds.includes(item.id));
        console.log("Matched unlocked items with details:", unlockedItems);
        setUserInventory(unlockedItems);
      } else {
        console.warn("Failed to fetch shop items");
        setUserInventory([]);
      }
    } catch (err) {
      console.error("Error fetching user unlocked items:", err);
      setUserInventory([]);
    }
  };

  const consumePowerUp = async (itemId) => {
    try {
      const { token } = getAuth();
      const userId = getAuth().userId;
      if (!token || !userId) return;

      const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api'
        : 'https://czc-eight.vercel.app/api';

      const res = await fetch(`${API_BASE}/student/powerups/consume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId })
      });

      if (!res.ok) {
        console.warn('Failed to consume power-up:', res.status);
      }
    } catch (err) {
      console.error('Error consuming power-up:', err);
    }
  };

  const markConsumed = (itemId) => {
    setUserInventory((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((i) => i.id === itemId);
      if (idx !== -1) updated.splice(idx, 1);
      return updated;
    });
    setConsumedIds((prev) => new Set(prev).add(itemId));
  };

  const question = quizData[current];

  // Fetch quiz from backend
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!book || !book.id) {
        setError("No book selected. Please read a book first, then take the quiz from the reading page.");
        setLoading(false);
        return;
      }
      
      console.log("QuizGame mounted with book:", book.id, "Story content available:", !!storyContent, "Length:", storyContent?.length || 0);

      try {
        setLoading(true);
        const { token, userId } = getAuth();

        if (!token || !userId) {
          setError("Please log in to take the quiz");
          setLoading(false);
          return;
        }

        // Fetch user inventory first
        await fetchUserInventory(token, userId);

        // Validate storyId format
        if (!book.id || !book.id.match(/^GB\d+$/)) {
          setError(`This book (${book.id || 'unknown'}) is not supported for quizzes yet. Only Gutenberg books are supported.`);
          setLoading(false);
          return;
        }

        // Auto-detect API base URL: use localhost for development, Vercel for production
        const API_BASE = window.location.hostname === 'localhost' 
          ? 'http://localhost:5000/api'
          : 'https://czc-eight.vercel.app/api';
        
        console.log("Using API_BASE:", API_BASE);
        console.log("Fetching quiz for book:", book.id, "user:", userId);
        
        // First, try to get existing quiz
        let response = await fetch(`${API_BASE}/quiz/${book.id}?userId=${userId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        let data;
        
        // If quiz doesn't exist, generate it
        if (response.status === 404) {
          console.log("Quiz not found, generating new quiz...");
          console.log("Story content length:", storyContent?.length || 0);
          
          // Prepare content - send as much as possible (capped)
          let contentToSend = "";
          if (storyContent && storyContent.length >= 100) {
            // Send up to first 50000 characters to maximize usable text
            contentToSend = storyContent.slice(0, 50000);
            console.log("✅ Using provided story content, length:", contentToSend.length);
          } else {
            // If no content provided, backend will fetch it from Gutenberg
            console.log("⚠️ No story content provided (storyContent empty or too short), backend will fetch from Gutenberg");
            // Try to fallback to fetching from backend if content is missing
            if (!storyContent || storyContent.length < 100) {
              console.warn("⚠️ Story content is missing or too short. Book ID:", book?.id);
            }
          }
          
          console.log("Sending content length:", contentToSend.length);
          console.log("Token present:", !!token);
          console.log("User ID:", userId);
          
          // Retry logic for quiz generation
          let retries = 0;
          const maxRetries = 2;
          let lastError = null;
          
          while (retries < maxRetries) {
            try {
              response = await fetch(`${API_BASE}/quiz/generate`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  userId,
                  storyId: book.id,
                  content: contentToSend
                })
              });

              if (response.ok) {
                data = await response.json();
                console.log("Quiz generated successfully:", data);
                break;
              } else if (response.status === 403 && retries < maxRetries - 1) {
                // 403 might be temporary - retry
                console.log(`Quiz generation returned 403, retrying... (attempt ${retries + 1}/${maxRetries})`);
                retries++;
                await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds before retry
                continue;
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Quiz generation failed:", response.status, errorData);
                
                // Log the actual error details from backend
                if (errorData.errors) {
                  console.error("Validation errors:", errorData.errors);
                }
                if (errorData.message) {
                  console.error("Backend message:", errorData.message);
                }
                
                lastError = { status: response.status, data: errorData };
                break;
              }
            } catch (err) {
              console.error("Network error during quiz generation:", err);
              lastError = err;
              if (retries < maxRetries - 1) {
                retries++;
                await new Promise(r => setTimeout(r, 2000));
                continue;
              } else {
                break;
              }
            }
          }
          
          // After the retry loop, check if we have data
          console.log("After retry loop - response.ok:", response?.ok, "data exists:", !!data, "lastError:", !!lastError);
          
          // If we got an error, handle it
          if (!response?.ok || lastError) {
            const errorInfo = lastError || { status: response?.status };
            const status = errorInfo.status || 500;
            const errorData = errorInfo.data || {};
            
            // Provide specific error messages based on status
            let errorMessage = "Failed to generate quiz.";
            if (status === 403) {
              errorMessage = "Access denied (403). The server temporarily blocked the request. Please wait a moment and try again, or try another book.";
            } else if (status === 503) {
              errorMessage = "The AI quiz generation service is temporarily unavailable. Please try again in a few moments.";
            } else if (status === 400) {
              errorMessage = errorData.message || "The book content is too short or invalid for quiz generation.";
            } else if (status === 404) {
              errorMessage = "Book not found or content unavailable.";
            } else if (status === 429) {
              errorMessage = "Too many requests. Please wait a few minutes and try again.";
            } else if (status >= 500) {
              errorMessage = "Server error. The AI service may be temporarily unavailable. Please try again in a few moments.";
            }
            
            throw new Error(errorMessage);
          }
        } else if (response.ok) {
          data = await response.json();
        } else {
          const errorText = await response.text();
          console.error("Quiz API error:", response.status, errorText);
          throw new Error(`Failed to fetch quiz: ${response.status}`);
        }

        if (data.success && data.data && data.data.questions) {
          console.log("✅ Valid quiz response received");
          console.log("Number of questions:", data.data.questions.length);
          console.log("First question:", data.data.questions[0]);
          
          // Transform backend format to frontend format
          const transformedQuestions = data.data.questions.map((q, index) => {
            // Handle both formats: backend returns choices array
            let options = [];
            let questionType = "Multiple Choice";
            
            if (q.type === "true-false") {
              options = ["True", "False"];
              questionType = "True/False";
            } else if (q.choices && Array.isArray(q.choices)) {
              options = q.choices;
              questionType = "Multiple Choice";
            } else {
              // Fallback if choices are missing
              options = ["True", "False"];
              questionType = "True/False";
            }
            
            return {
              id: index + 1,
              type: questionType,
              question: q.question,
              options: options,
              correct: null // Validated on backend
            };
          });

          console.log("✅ Transformed questions:", transformedQuestions.length);
          setQuizData(transformedQuestions);
          setAnswers(Array(transformedQuestions.length).fill(null));
          setDoubleCoinsUsed(Array(transformedQuestions.length).fill(false));
        } else {
          console.error("❌ Invalid quiz data structure");
          console.error("data.success:", data?.success);
          console.error("data.data:", data?.data);
          console.error("data.data.questions:", data?.data?.questions);
          throw new Error("Invalid quiz data received");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(err.message || "Failed to load quiz");
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [book, storyContent]);

  useEffect(() => {
    if (timer > 0 && !freezeTime && !loading) {
      const countdown = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [timer, freezeTime, loading]);

  const handleSelect = (opt) => {
    setSelected(opt);
    const updatedAnswers = [...answers];
    updatedAnswers[current] = opt;
    setAnswers(updatedAnswers);
  };

  const calculateScore = async () => {
    // Submit quiz to backend for validation and scoring
    try {
      const { token, userId } = getAuth();
      const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000); // in seconds

      // Auto-detect API base URL: use localhost for development, Vercel for production
      const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api'
        : 'https://czc-eight.vercel.app/api';
      const response = await fetch(`${API_BASE}/quiz/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          storyId: book.id,
          answers: answers,
          timeTaken
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update score with backend response
          setScore(result.data.score);
          console.log("Quiz submitted successfully. Coins earned:", result.data.coinsEarned);
          console.log("Accuracy:", result.data.accuracy + "%");
          console.log("Total points:", result.data.totalPoints);
        } else {
          throw new Error(result.message || "Failed to submit quiz");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit quiz");
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert("Error submitting quiz: " + err.message);
      return;
    }
    
    setShowResult(true);
  };

  const handleNext = () => {
    if (current < totalQuestions - 1) {
      setCurrent(current + 1);
      setSelected(answers[current + 1] || null);
      setTimer(30);
      setFiftyFiftyUsed(false);
    } else {
      calculateScore();
    }
  };

  const handlePrevious = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setSelected(answers[current - 1] || null);
      setTimer(30);
      setFiftyFiftyUsed(false);
    }
  };

  const goToQuestion = (num) => {
    if (num < totalQuestions) {
      setCurrent(num);
      setSelected(answers[num] || null);
      setTimer(30);
      setFiftyFiftyUsed(false);
    }
  };

  const handleDoubleCoins = () => {
    if (consumedIds.has('double-coins')) return;
    const updated = [...doubleCoinsUsed];
    updated[current] = true;
    setDoubleCoinsUsed(updated);
    alert("Double Coins activated for this question!");
    consumePowerUp('double-coins');
    markConsumed('double-coins');
  };

  const handleFiftyFifty = () => {
    if (!fiftyFiftyUsed && !consumedIds.has('fifty-fifty')) {
      setFiftyFiftyUsed(true);
      alert("50/50 activated! Two wrong answers removed.");
      consumePowerUp('fifty-fifty');
      markConsumed('fifty-fifty');
    }
  };
  
  const handleFreezeTime = () => {
    if (consumedIds.has('freeze-time')) return;
    setFreezeTime((prev) => !prev);
    alert(freezeTime ? "Timer resumed!" : "Timer frozen!");
    consumePowerUp('freeze-time');
    markConsumed('freeze-time');
  };
  
  const handleSkipQuestion = () => {
    // Skip to next question without answering (will be marked wrong)
    alert("Question skipped. You can come back to it later.");
    handleNext();
    if (!consumedIds.has('skip-question')) {
      consumePowerUp('skip-question');
      markConsumed('skip-question');
    }
  };
  
  const handleExtraTime = () => {
    if (consumedIds.has('extra-time')) return;
    setTimer((prev) => prev + 120);
    alert("Added 2 minutes to the timer!");
    consumePowerUp('extra-time');
    markConsumed('extra-time');
  };

  let displayedOptions = question?.options || [];
  if (fiftyFiftyUsed && question?.type === "Multiple Choice" && displayedOptions.length === 4) {
    // Randomly select 2 options to show (including potentially the correct one)
    // Since we don't know the correct answer, we'll just randomly pick 2
    const shuffled = [...displayedOptions].sort(() => Math.random() - 0.5);
    displayedOptions = shuffled.slice(0, 2);
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#F9F3EA] min-h-screen p-2 sm:p-4 flex justify-center items-center mt-16">
        <div className="bg-white border border-[#7d0000] rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#7d0000] mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Quiz...</p>
          <p className="text-gray-600 mt-2">Generating questions for {bookInfo.title}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#F9F3EA] min-h-screen p-2 sm:p-4 flex justify-center items-center mt-16">
        <div className="bg-white border border-red-500 rounded-xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#7d0000] text-white py-2 px-6 rounded-lg font-bold hover:bg-[#5a0000]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (!quizData || quizData.length === 0) {
    return (
      <div className="bg-[#F9F3EA] min-h-screen p-2 sm:p-4 flex justify-center items-center mt-16">
        <div className="bg-white border border-[#7d0000] rounded-xl shadow-lg p-8 text-center">
          <p className="text-xl font-semibold">No quiz questions available</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-[#7d0000] text-white py-2 px-6 rounded-lg font-bold hover:bg-[#5a0000]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F3EA] min-h-screen p-2 sm:p-4 flex justify-center mt-16">
      <div className="w-full max-w-[1580px]">
        <div className="bg-white border border-[#7d0000] rounded-xl shadow-lg p-4 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={bookInfo.image} alt="Book" className="w-16 h-20 sm:w-20 sm:h-28 rounded-md border object-cover" onError={(e) => { e.target.src = "https://i.ibb.co/Lkq0mwz/ibon-adarna.jpg"; }} />
            <div>
              <h1 className="text-base sm:text-xl font-bold truncate max-w-[300px]">{bookInfo.title}</h1>
              <p className="text-gray-700 text-xs sm:text-base">{bookInfo.author}</p>
              <p className="text-gray-700 font-semibold mt-1 text-xs sm:text-sm">
                Question {current + 1} of {totalQuestions}
              </p>
              <div className="w-full bg-gray-300 h-1 sm:h-2 rounded-full mt-1">
                <div className="h-1 sm:h-2 bg-[#145579] rounded-full" style={{ width: `${((current + 1) / totalQuestions) * 100}%` }}></div>
              </div>
            </div>
          </div>
          <div className={`border-2 rounded-full px-3 sm:px-6 py-1 sm:py-2 text-base sm:text-lg font-bold ${freezeTime ? "border-green-600 text-green-600" : "border-[#7d0000] text-[#7d0000]"}`}>
            ⏱ 00:{timer < 10 ? "0" + timer : timer}
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="w-full lg:w-60 bg-white border border-[#7d0000] rounded-xl p-2 sm:p-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
            <h2 className="text-sm sm:text-base font-bold mb-2 flex items-center gap-2 whitespace-nowrap">⚡ Power-Ups</h2>
            <div className="flex lg:flex-col gap-2">
              {userInventory.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm">No power-ups purchased yet. Visit the shop!</p>
              ) : (
                userInventory.map((item) => {
                  // Determine button handler based on item ID
                  let handler = () => alert("Power-up not configured");
                  let label = item.name;
                  let description = item.description || "";

                  switch (item.id) {
                    case "double-coins":
                      handler = handleDoubleCoins;
                      break;
                    case "fifty-fifty":
                      handler = handleFiftyFifty;
                      break;
                    case "freeze-time":
                      handler = handleFreezeTime;
                      break;
                    case "skip-question":
                      handler = handleSkipQuestion;
                      break;
                    case "extra-time":
                      handler = handleExtraTime;
                      break;
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={handler}
                      className="flex-1 lg:flex-none w-full border-2 border-[#145579] rounded-lg p-2 hover:bg-[#f4f4f4] transition-colors"
                    >
                      <p className="font-bold text-left text-[10px] sm:text-xs">{label}</p>
                      <p className="text-gray-600 text-left text-[9px] sm:text-[10px]">{description}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex-1 bg-white border border-[#7d0000] rounded-xl p-3 sm:p-6">
            {question ? (
              <>
                <div className="flex gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
                  <div className="bg-[#7d0000] text-white px-2 sm:px-4 py-1 rounded-full font-semibold text-xs sm:text-sm">Question {current + 1}</div>
                  <div className="bg-[#FFD96A] px-2 sm:px-4 py-1 rounded-full font-semibold text-xs sm:text-sm">{question.type}</div>
                </div>

                <h2 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4">{question.question}</h2>

                <div className="space-y-2">
                  {displayedOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(opt)}
                      className={`w-full flex items-start gap-2 sm:gap-3 border-2 rounded-lg p-2 sm:p-3 text-xs sm:text-base whitespace-normal break-words leading-snug ${selected === opt ? "bg-[#7d0000] text-white border-[#7d0000]" : "border-[#FFD96A] bg-white"}`}
                    >
                      <span className="font-bold text-sm mt-[2px]">{String.fromCharCode(65 + i)}</span>
                      <span className="text-left whitespace-normal break-words">{opt}</span>
                    </button>
                  ))}
                </div>

                <p className="text-center text-gray-500 mt-2 sm:mt-3 text-[10px] sm:text-xs">Select an answer to continue</p>

                {!showResult && (
                  <div className="mt-3 sm:mt-6 border-t pt-2 sm:pt-3 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <button onClick={handlePrevious} className="bg-[#FFD96A] py-1 sm:py-2 px-3 sm:px-5 rounded-lg font-bold text-xs sm:text-sm w-full sm:w-auto transition-transform duration-200 hover:scale-105">Previous</button>
                    <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                      {Array.from({ length: totalQuestions }, (_, i) => (
                        <button key={i} onClick={() => goToQuestion(i)} className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg border text-xs sm:text-base font-bold flex-shrink-0 ${i === current ? "bg-[#7d0000] text-white" : "bg-white"}`}>{i + 1}</button>
                      ))}
                    </div>
                    <button onClick={handleNext} className="bg-[#7d0000] text-white py-1 sm:py-2 px-3 sm:px-5 rounded-lg font-bold text-xs sm:text-sm w-full sm:w-auto transition-transform duration-200 hover:scale-105">
                      {current === totalQuestions - 1 ? "Finish" : "Next"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500">Loading question...</p>
            )}
          </div>
        </div>
      </div>

      {showResult && (
        <div className="fixed inset-0 bg-opacity-100 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 sm:p-10 w-11/12 sm:w-96 text-center">
            <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
            <p className="text-lg mb-4">You scored {score} out of {totalQuestions}</p>
            <p className={`text-xl font-semibold ${score / totalQuestions >= 0.7 ? "text-green-600" : "text-red-600"}`}>
              {score / totalQuestions >= 0.7 ? "🎉 Passed!" : "❌ Failed!"}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 bg-[#7d0000] text-white py-2 px-6 rounded-lg font-bold hover:bg-[#5a0000]"
            >
              Back to Reading
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGame;
