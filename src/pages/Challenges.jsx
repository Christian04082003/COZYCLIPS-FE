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

  const fetchQuests = async () => {
    const completedProgress = Number(localStorage.getItem("completedProgress")) || 0;

    const mockQuests = [
      {
        id: 0,
        title: completedProgress >= 1 ? "New User Challenge (Claimable)" : "New User Challenge",
        description: "Complete your first book and get your starting coins!",
        currentProgress: completedProgress >= 1 ? 1 : 0,
        targetProgress: 1,
        reward: 250,
        status: "ready_to_complete"
      },
      { id: 1, title: "Reading Marathon", description: "Read 5 books this month", currentProgress: 0, targetProgress: 5, reward: 100, status: "in_progress" },
      { id: 2, title: "Genre Explorer", description: "Read books from 3 different genres", currentProgress: 0, targetProgress: 3, reward: 75, status: "in_progress" },
      { id: 3, title: "Speed Reader", description: "Complete a book in one week", currentProgress: 0, targetProgress: 1, reward: 50, status: "in_progress" },
      { id: 4, title: "Classic Literature Fan", description: "Read 2 classic literature books", currentProgress: 0, targetProgress: 2, reward: 120, status: "in_progress" },
      { id: 5, title: "Weekend Sprint", description: "Read for 2 hours over the weekend", currentProgress: 0, targetProgress: 120, reward: 40, status: "in_progress" },
      { id: 6, title: "Non-fiction Navigator", description: "Finish a non-fiction book", currentProgress: 0, targetProgress: 1, reward: 80, status: "in_progress" },
      { id: 7, title: "Poetry Path", description: "Read 10 poems", currentProgress: 0, targetProgress: 10, reward: 60, status: "in_progress" },
      { id: 8, title: "Daily Habit", description: "Read 15 minutes daily for 5 days", currentProgress: 0, targetProgress: 5, reward: 90, status: "in_progress" }
    ];

    setQuests(mockQuests);
  };

  const fetchCoinBalance = async () => {
    const stored = localStorage.getItem("coins");
    const startingBalance = stored ? parseInt(stored, 10) : 0;
    setCoinBalance(startingBalance);
    localStorage.setItem("coins", startingBalance);
  };

  const completeQuest = async (id) => {
    setCompletingQuestId(id);
    const quest = quests.find((q) => q.id === id);

    setQuests(
      quests.map((q) =>
        q.id === id ? { ...q, status: "completed", title: "New User Challenge (Claimed)" } : q
      )
    );

    const newBalance = coinBalance + quest.reward;
    setCoinBalance(newBalance);
    localStorage.setItem("coins", newBalance);
    window.dispatchEvent(new Event("storage"));

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    setNotification({ message: `You earned ${quest.reward} coins!`, type: "success" });
    setTimeout(() => setNotification(null), 3000);

    setCompletingQuestId(null);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchQuests();
      await fetchCoinBalance();
      setLoading(false);
    };
    load();
  }, []);

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
                    Progress: <b>{quest.currentProgress}/{quest.targetProgress}</b>
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

                  {quest.status === "ready_to_complete" && quest.status !== "completed" && (
                    <button
                      onClick={() => completeQuest(quest.id)}
                      disabled={completingQuestId === quest.id}
                      className="px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-yellow-600 to-red-600 
                                 hover:from-yellow-700 hover:to-red-900"
                    >
                      {completingQuestId === quest.id ? "Claiming..." : "Claim Reward"}
                    </button>
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
