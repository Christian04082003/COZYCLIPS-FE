import React, { useState, useEffect } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import { BookOpen, Coins, CheckCircle } from "lucide-react";

const Challenges = ({ userLevel = 1, completedBooks = 0 }) => {
  const [quests, setQuests] = useState([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completingQuestId, setCompletingQuestId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch quests from backend API
  const fetchQuests = async () => {
    try {
      // Try to get token from multiple possible locations
      let token = null;
      
      // First try czc_auth.token
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      token = authData.token;
      
      // If not found, try czc_auth directly as token
      if (!token && authData) {
        token = authData;
      }
      
      // If still not found, try localStorage directly
      if (!token) {
        token = localStorage.getItem("token");
      }
      
      console.log("Auth data:", authData);
      console.log("Token found:", !!token);
      
      if (!token) {
        console.error("No authentication token found");
        console.log("Available in czc_auth:", Object.keys(authData));
        setNotification({
          message: "Please log in again to view challenges.",
          type: "error"
        });
        setTimeout(() => setNotification(null), 3000);
        setQuests([]);
        return;
      }

      const response = await fetch("https://czc-eight.vercel.app/api/quest/progress", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quests: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.quests)) {
        // Ensure all quests have valid progress values
        const validatedQuests = data.quests.map(quest => {
          const target = Number(quest.targetProgress) || 1;
          const current = Number(quest.currentProgress) || 0;
          return {
            ...quest,
            currentProgress: current,
            targetProgress: target
          };
        });
        console.log("Validated quests:", validatedQuests);
        setQuests(validatedQuests);
      } else {
        console.error("Invalid response format:", data);
        setQuests([]);
      }
    } catch (error) {
      console.error("Error fetching quests:", error);
      setNotification({
        message: "Failed to load challenges. Please try again.",
        type: "error"
      });
      setTimeout(() => setNotification(null), 3000);
      setQuests([]);
    }
  };

  // Fetch coin balance from backend
  const fetchCoinBalance = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      const token = authData.token;
      
      if (!token) {
        console.error("No authentication token found");
        setCoinBalance(0);
        return;
      }

      // Fetch actual coin balance from backend
      const response = await fetch("https://czc-eight.vercel.app/api/user/coins", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched coin balance from backend:", data);
        if (data.success && data.coins !== undefined) {
          console.log("Setting coin balance to:", data.coins);
          setCoinBalance(data.coins);
          localStorage.setItem("coins", String(data.coins));
        }
      }
    } catch (error) {
      console.error("Error fetching coin balance:", error);
      setCoinBalance(0);
    }
  };

  // Complete quest via backend
  const completeQuest = async (id) => {
    console.log("completeQuest called with id:", id, "Type:", typeof id);
    setCompletingQuestId(id);
    const quest = quests.find((q) => q.id === id);

    console.log("Attempting to complete quest:", quest);
    console.log("Quest ID from object:", quest?.id, "Type:", typeof quest?.id);
    console.log("All quest IDs available:", quests.map(q => ({ id: q.id, type: typeof q.id, title: q.title })));

    if (!quest || quest.status === "completed") {
      console.error("Quest already completed or not found:", quest);
      setCompletingQuestId(null);
      return;
    }

    try {
      const authData = JSON.parse(localStorage.getItem("czc_auth") || "{}");
      let token = authData.token;
      
      if (!token && authData) {
        token = authData;
      }
      if (!token) {
        token = localStorage.getItem("token");
      }
      
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`https://czc-eight.vercel.app/api/quest/complete/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to claim quest reward");
      }

      const data = await response.json();
      
      if (data.success) {
        console.log("Quest completed successfully:", data);
        // Update local quest status
        setQuests(prevQuests =>
          prevQuests.map((q) =>
            q.id === id ? { ...q, status: "completed" } : q
          )
        );

        // Update coin balance from backend response
        const newBalance = data.newCoins || coinBalance + quest.reward;
        console.log("New coin balance:", newBalance);
        setCoinBalance(newBalance);
        
        // Update localStorage coins to sync with navbar
        localStorage.setItem("coins", String(newBalance));
        // Dispatch custom event to notify navbar
        window.dispatchEvent(new CustomEvent("coinUpdate", { detail: { coins: newBalance } }));

        // Show success animations
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
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchQuests();
      setLoading(false);
    };
    load();
  }, []);

  // Fetch coin balance when component mounts and when quests change
  useEffect(() => {
    fetchCoinBalance();
  }, [quests]);

  const getProgressPercentage = (current, target) =>
    Math.min((current / target) * 100, 100);

  const getStatusColor = (status) => {
    if (status === "in_progress") return "bg-green-600 text-white border-green-600";
    if (status === "ready_to_complete") return "bg-yellow-600 text-white border-yellow-600";
    return "bg-gray-500 text-white border-gray-500";
  };

  const getStatusText = (status) => {
    if (status === "completed") return "Claimed";
    if (status === "ready_to_complete") return "Ready to Complete";
    return "In Progress";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3EBE2]">
        <p className="text-gray-600">Loading challenges...</p>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar />

      <div className="min-h-screen pt-20 pb-8 px-[50px] bg-[#F3EBE2]">

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
          <div className="mb-8"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className="challenge-box bg-white text-gray-800 p-4 rounded-2xl shadow border border-gray-200 
                           hover:shadow-xl hover:scale-105 transition-transform duration-300
                           h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="text-xl font-bold">{quest.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(quest.status)}`}>
                      {getStatusText(quest.status)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-2 text-sm">{quest.description}</p>

                  <p className="text-sm text-gray-700 mb-1">
                    Progress: <b>{quest.currentProgress >= 0 && quest.targetProgress > 0 ? `${Math.floor(quest.currentProgress)}/${Math.floor(quest.targetProgress)}` : "Loading..."}</b>
                  </p>

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

                <div className="flex justify-between items-center mt-5">
                  <span className="font-bold flex items-center gap-1 text-gray-800">
                    <Coins className="text-yellow-500" />
                    {quest.reward}
                  </span>

                  {quest.status === "ready_to_complete" && (
                    <button
                      onClick={() => completeQuest(quest.id)}
                      disabled={completingQuestId === quest.id}
                      className="px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-yellow-600 to-red-600 
                                 hover:from-yellow-700 hover:to-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completingQuestId === quest.id ? "Claiming..." : "Claim Reward"}
                    </button>
                  )}

                  {quest.status === "in_progress" && (
                    <p className="text-gray-600 font-semibold text-sm">
                      Progress: {quest.currentProgress >= 0 && quest.targetProgress > 0 ? `${Math.floor(quest.currentProgress)}/${Math.floor(quest.targetProgress)}` : "Loading..."}
                    </p>
                  )}

                  {quest.status === "completed" && (
                    <p className="text-green-600 font-semibold flex items-center gap-1 text-sm">
                      <CheckCircle size={18} /> Claimed
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {quests.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl shadow">
              <BookOpen className="mx-auto text-gray-300 mb-4" size={60} />
              <p className="text-gray-700 font-semibold">No challenges available.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Challenges;