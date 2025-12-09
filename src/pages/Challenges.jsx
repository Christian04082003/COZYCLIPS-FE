import React, { useState, useEffect, useCallback } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import { BookOpen, Coins, CheckCircle, Calendar } from "lucide-react";

// The base URL for the API
const API_BASE_URL = "https://czc-eight.vercel.app/api"; 

// Storage key for challenge completion dates
const CHALLENGE_COMPLETION_KEY = "challengeCompletionDates";

// Use StreakWidget's date key logic for consistency
const getDateKey = (d = new Date()) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Helper to load completion dates from localStorage
const loadCompletionDates = () => {
  try {
    return JSON.parse(localStorage.getItem(CHALLENGE_COMPLETION_KEY)) || {};
  } catch {
    return {};
  }
};

// Helper to save completion dates to localStorage
const saveCompletionDates = (data) => {
  try {
    localStorage.setItem(CHALLENGE_COMPLETION_KEY, JSON.stringify(data));
  } catch {}
};

const Challenges = ({ userLevel = 1, completedBooks = 0 }) => {
  const [quests, setQuests] = useState([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completingQuestId, setCompletingQuestId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [notification, setNotification] = useState(null);
  const [completionDates, setCompletionDates] = useState({});

  // Helper to retrieve the authentication token from localStorage
  const getAuthToken = useCallback(() => {
    let token = null;
    try {
      // 1. Try czc_auth.token
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      token = authData.token;

      // 2. If not found, try czc_auth directly (if it contains the token)
      if (!token && typeof authData === 'string') {
        token = authData;
      }
      
      // 3. Last resort: try 'token' key
      if (!token) {
        token = localStorage.getItem("token");
      }
    } catch (e) {
      console.error("Error retrieving token from localStorage:", e);
    }
    return token;
  }, []);

  // Helper to mark a challenge as completed on a specific date (using StreakWidget's pattern)
  const markChallengeCompleted = useCallback((questId, dateKey = getDateKey()) => {
    setCompletionDates(prev => {
      const updated = { ...prev };
      if (!updated[questId]) {
        updated[questId] = {};
      }
      updated[questId][dateKey] = true;
      saveCompletionDates(updated);
      return updated;
    });
  }, []);

  // Helper to check if a challenge was completed on a specific date
  const isChallengeCompletedOnDate = useCallback((questId, dateKey = getDateKey()) => {
    return !!completionDates[questId]?.[dateKey];
  }, [completionDates]);

  // Improved streak calculation using StreakWidget logic: count consecutive days backwards from today
  const getConsecutiveDays = useCallback((questId) => {
    if (!completionDates[questId]) return 0;
    
    let streak = 0;
    let current = new Date();
    
    // Count backwards from today
    while (true) {
      const dateKey = getDateKey(current);
      if (completionDates[questId][dateKey]) {
        streak++;
        current.setUTCDate(current.getUTCDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }, [completionDates]);

  // Function to fetch the current coin balance
  const fetchCoinBalance = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      console.error("Authentication token not found for coin balance fetch.");
      return;
    }

    try {
      // NOTE: Assuming there's a specific endpoint to get the user's data/coins
      // Using a placeholder endpoint, as the original code didn't provide one.
      const response = await fetch(`${API_BASE_URL}/user/coins`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch coin balance");
      }

      const data = await response.json();
      const newBalance = data.coins || 0; 
      setCoinBalance(newBalance);
      localStorage.setItem("coins", String(newBalance));
      window.dispatchEvent(new CustomEvent("coinUpdate", { detail: { coins: newBalance } }));
    } catch (error) {
      console.error("Error fetching coin balance:", error);
    }
  }, [getAuthToken]);

  // Fetch quests from backend API
  const fetchQuests = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      console.error("Authentication token not found, cannot fetch quests.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/quest/progress`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quests");
      }

      const data = await response.json();
      console.log("[Challenges] Raw quest data from backend:", data);
      
      // Remove duplicate challenges by title (keep first occurrence)
      const uniqueQuests = [];
      const seenTitles = new Set();
      const fetchedQuests = data.quests || []; // Assuming the response has a 'quests' array
      
      for (const quest of fetchedQuests) {
        if (!seenTitles.has(quest.title)) {
          // Calculate status if not provided by backend (optional, depends on API)
          if (quest.currentProgress >= quest.targetProgress && quest.status !== "completed") {
            quest.status = "ready_to_complete";
          } else if (quest.status !== "completed") {
            quest.status = "in_progress";
          }
          uniqueQuests.push(quest);
          seenTitles.add(quest.title);
        }
      }

      setQuests(uniqueQuests);
      
    } catch (error) {
      console.error("Error fetching quests:", error);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);


  // Function to complete a quest and claim the reward
  const completeQuest = useCallback(async (id) => {
    const quest = quests.find(q => q.id === id);
    if (!quest) return;

    setCompletingQuestId(id);
    const token = getAuthToken();
    
    try {
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/quest/complete/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to claim quest reward");
      }

      const data = await response.json();
      
      if (data.success) {
        console.log("Quest completed successfully:", data);

        // Mark completion with today's date (like streak tracking)
        const today = getDateKey();
        markChallengeCompleted(id, today);

        // Update local quest status
        setQuests(prevQuests =>
          prevQuests.map((q) =>
            q.id === id ? { ...q, status: "completed" } : q
          )
        );

        // Update coin balance from backend response or locally
        const newBalance = data.newCoins || coinBalance + quest.reward;
        setCoinBalance(newBalance);
        
        // Sync coin balance with localStorage and dispatch event
        localStorage.setItem("coins", String(newBalance));
        window.dispatchEvent(new CustomEvent("coinUpdate", { detail: { coins: newBalance } }));

        // Show success animations and notification
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);

        setNotification({ 
          message: `You earned ${quest.reward} coins! Total: ${newBalance}`, 
          type: "success" 
        });
        setTimeout(() => setNotification(null), 4000);
        
        // Refetch coin balance from backend to ensure consistency
        setTimeout(() => {
          fetchCoinBalance();
        }, 1000);
      } else {
        throw new Error(data.message || "Failed to claim reward");
      }
    } catch (error) {
      console.error("Error claiming quest:", error);
      setNotification({ 
        message: error.message || "Failed to claim reward. Please try again.", 
        type: "error" 
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setCompletingQuestId(null);
    }
  }, [getAuthToken, quests, coinBalance, fetchCoinBalance, markChallengeCompleted]);

  // --- Effects ---

  // Load completion dates from localStorage on mount
  useEffect(() => {
    const loadedDates = loadCompletionDates();
    setCompletionDates(loadedDates);
  }, []);

  // Initial load and quest refresh on focus/event
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchQuests();
    };
    load();

    // Refetch quests when page regains focus (e.g., after reading a book)
    const handleFocus = () => {
      console.log("Page regained focus, refreshing quests...");
      load();
    };

    // Listen for custom bookCompleted event
    const handleBookCompleted = () => {
      console.log("Book completed event received, refreshing quests...");
      // Add a small delay to allow backend to process the book completion
      setTimeout(() => {
        load();
      }, 500);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("bookCompleted", handleBookCompleted);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("bookCompleted", handleBookCompleted);
    };
  }, [fetchQuests]); // Only depends on fetchQuests

  // Fetch coin balance when component mounts and when quests change
  useEffect(() => {
    fetchCoinBalance();
  }, [fetchCoinBalance]); // Only depends on fetchCoinBalance

  // --- Helper Functions for Rendering ---
  
  const getProgressPercentage = (current, target) =>
    Math.min((current / target) * 100, 100);

  const getStatusColor = (status) => {
    if (status === "completed") return "bg-green-600 text-white border-green-600";
    if (status === "ready_to_complete") return "bg-yellow-600 text-white border-yellow-600";
    return "bg-gray-500 text-white border-gray-500";
  };

  const getStatusText = (status) => {
    if (status === "completed") return "Claimed";
    if (status === "ready_to_complete") return "Ready to Claim";
    return "In Progress";
  };

  // --- Loading State Render ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3EBE2]">
        <p className="text-gray-600">Loading challenges...</p>
      </div>
    );
  }

  // --- Main Component Render ---

  return (
    <>
      <DashboardNavbar />
      

      <div className="min-h-screen pt-20 pb-8 px-[50px] bg-[#F3EBE2]">

        {/* Confetti Animation for Reward Claim */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Notification Banner */}
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`px-6 py-4 rounded-lg shadow-lg text-white ${
                notification.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {notification.message}
            </div>
          </div>
        )}

        <div className="max-w-[100%] mx-auto">
          <h1 className="text-3xl font-serif font-bold text-[#870022] mb-8">Daily Challenges & Quests 🏆</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {quests.map((quest) => {
              let consecutiveDays = getConsecutiveDays(quest.id);
              let completedToday = isChallengeCompletedOnDate(quest.id);
              
              return (
              <div
                key={quest.id}
                className="challenge-box bg-white text-gray-800 p-4 rounded-2xl shadow border border-gray-200 
                          hover:shadow-xl hover:scale-105 transition-transform duration-300
                          h-full flex flex-col justify-between"
              >
                <div>
                  {/* Title and Status Tag */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold flex-1">{quest.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs border whitespace-nowrap ml-2 ${getStatusColor(quest.status)}`}>
                      {getStatusText(quest.status)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-2 text-sm">{quest.description}</p>

                  {/* Streak Info */}
                  {consecutiveDays > 0 && (
                    <div className="bg-orange-100 border border-orange-300 rounded-lg p-2 mb-3 flex items-center gap-2">
                      <span className="text-orange-500 font-bold text-lg">🔥</span>
                      <span className="text-orange-700 text-sm font-semibold">
                        {consecutiveDays} day{consecutiveDays !== 1 ? 's' : ''} streak{completedToday ? ' (today!)' : ''}
                      </span>
                    </div>
                  )}

                  {/* Progress Text */}
                  <p className="text-sm text-gray-700 mb-1">
                    Progress: <b>{quest.currentProgress >= 0 && quest.targetProgress > 0
                      ? `${Math.floor(quest.currentProgress)}/${Math.floor(quest.targetProgress)}`
                      : "Loading..."}
                    </b>
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-blue-200 rounded-full progress-stroke mb-3">
                    <div
                      className="h-full bg-[#870022] rounded-full transition-all duration-300"
                      style={{
                        width: `${getProgressPercentage(
                          quest.currentProgress,
                          quest.targetProgress
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Reward and Action Button */}
                <div className="flex justify-between items-center mt-5">
                  <span className="font-bold flex items-center gap-1 text-gray-800">
                    <Coins className="text-yellow-500" />
                    {quest.reward}
                  </span>

                  {quest.status === "ready_to_complete" && (
                    <button
                      onClick={() => completeQuest(quest.id)}
                      disabled={completingQuestId === quest.id || completedToday}
                      className="px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-yellow-600 to-red-600 
                                hover:from-yellow-700 hover:to-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completedToday
                        ? "Already Claimed Today"
                        : completingQuestId === quest.id
                        ? "Claiming..."
                        : "Claim Reward"}
                    </button>
                  )}

                  {quest.status === "in_progress" && (
                    <p className="text-gray-600 font-semibold text-sm">
                      Keep Going!
                    </p>
                  )}

                  {quest.status === "completed" && (
                    <p className="text-green-600 font-semibold flex items-center gap-1 text-sm">
                      <CheckCircle size={18} /> Claimed
                    </p>
                  )}
                </div>
              </div>
            );
            })}
          </div>

          {/* No Challenges Message */}
          {quests.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-xl shadow">
              <BookOpen className="mx-auto text-gray-300 mb-4" size={60} />
              <p className="text-gray-700 font-semibold">No challenges available right now! Check back later.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Challenges;