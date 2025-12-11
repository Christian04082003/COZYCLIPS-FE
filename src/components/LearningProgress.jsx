import React, { useState, useEffect } from "react";
import { FaStar, FaBook, FaLevelUpAlt } from "react-icons/fa";

import bronze1 from "../assets/bronze_1.png";
import bronze2 from "../assets/bronze_2.png";
import bronze3 from "../assets/bronze_3.png";
import bronze4 from "../assets/bronze_4.png";
import bronze5 from "../assets/bronze_5.png";

import silver1 from "../assets/silver_1.png";
import silver2 from "../assets/silver_2.png";
import silver3 from "../assets/silver_3.png";
import silver4 from "../assets/silver_4.png";
import silver5 from "../assets/silver_5.png";

import gold1 from "../assets/gold_1.png";
import gold2 from "../assets/gold_2.png";
import gold3 from "../assets/gold_3.png";
import gold4 from "../assets/gold_4.png";
import gold5 from "../assets/gold_5.png";

import diamond1 from "../assets/diamond_1.png";
import diamond2 from "../assets/diamond_2.png";
import diamond3 from "../assets/diamond_3.png";
import diamond4 from "../assets/diamond_4.png";
import diamond5 from "../assets/diamond_5.png";

import amethyst1 from "../assets/amethyst_1.png";
import amethyst2 from "../assets/amethyst_2.png";
import amethyst3 from "../assets/amethyst_3.png";
import amethyst4 from "../assets/amethyst_4.png";
import amethyst5 from "../assets/amethyst_5.png";

import challenger1 from "../assets/challenger_1.png";
import challenger2 from "../assets/challenger_2.png";
import challenger3 from "../assets/challenger_3.png";
import challenger4 from "../assets/challenger_4.png";
import challenger5 from "../assets/challenger_5.png";

const rankImages = {
  Bronze: [bronze1, bronze2, bronze3, bronze4, bronze5],
  Silver: [silver1, silver2, silver3, silver4, silver5],
  Gold: [gold1, gold2, gold3, gold4, gold5],
  Diamond: [diamond1, diamond2, diamond3, diamond4, diamond5],
  Amethyst: [amethyst1, amethyst2, amethyst3, amethyst4, amethyst5],
  Challenger: [challenger1, challenger2, challenger3, challenger4, challenger5],
};

const rankOrder = ["Bronze", "Silver", "Gold", "Diamond", "Amethyst", "Challenger"];
const romanStages = ["V", "IV", "III", "II", "I"];

// Backend base URL
const BASE_URL = "https://czc-eight.vercel.app";

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
    return { token, userId };
  } catch {
    return {};
  }
}

const LearningProgress = () => {
  const [rank, setRank] = useState(
    JSON.parse(localStorage.getItem("rankData")) || {
      tier: "Bronze",
      stage: 1,
    }
  );

  const [level, setLevel] = useState(() => Number(localStorage.getItem("levelProgress")) || 0);
  const [points, setPoints] = useState(() => Number(localStorage.getItem("points")) || 0);
  const [booksRead, setBooksRead] = useState(() => Number(localStorage.getItem("booksRead")) || 0); // 0-9 books in current rank
  const [totalBooksRead, setTotalBooksRead] = useState(() => Number(localStorage.getItem("totalBooksRead")) || 0); // cumulative books read
  const [booksCompleted, setBooksCompleted] = useState(() => Number(localStorage.getItem("completedProgress")) || 0);

  const [history, setHistory] = useState([]);

  const levelGoal = 100;
  const booksGoal = 10;

  useEffect(() => {
    const syncProgress = () => {
      setLevel(Number(localStorage.getItem("levelProgress")) || 0);
      setBooksCompleted(Number(localStorage.getItem("completedProgress")) || 0);
      setBooksRead(Number(localStorage.getItem("booksRead")) || 0);
      setTotalBooksRead(Number(localStorage.getItem("totalBooksRead")) || 0);
      setPoints(Number(localStorage.getItem("points")) || 0);

      const storedRank = localStorage.getItem("rankData");
      if (storedRank) setRank(JSON.parse(storedRank));
    };

    syncProgress();
    window.addEventListener("progressUpdate", syncProgress);
    return () => window.removeEventListener("progressUpdate", syncProgress);
  }, []);

  useEffect(() => {
    localStorage.setItem("levelProgress", level);
    localStorage.setItem("completedProgress", booksCompleted);
    localStorage.setItem("booksRead", booksRead);
    localStorage.setItem("totalBooksRead", totalBooksRead);
    localStorage.setItem("points", points);

    window.dispatchEvent(new Event("progressUpdate"));
  }, [level, booksCompleted, booksRead, totalBooksRead, points]);

  useEffect(() => {
    const handleBookOpen = () => {
      setBooksRead((prev) => {
        const updated = prev + 1;
        localStorage.setItem("booksRead", updated);
        window.dispatchEvent(new Event("progressUpdate"));
        return updated;
      });
    };
    window.addEventListener("bookOpened", handleBookOpen);
    return () => window.removeEventListener("bookOpened", handleBookOpen);
  }, []);

  const upgradeRank = () => {
    // Rank upgrades are now handled by the backend based on cumulative progress
    // This function is deprecated but kept for reference
    console.log("[LearningProgress] Rank upgrade handled by backend");
  };

  useEffect(() => {
    // Rank progression is now handled by backend ranking service
    // No need to manually upgrade on frontend
  }, [level, booksCompleted]);

  // Fetch student profile from Firestore
  useEffect(() => {
    let mounted = true;
    const { token, userId } = getAuth();

    async function fetchStudentProfile() {
      if (!token || !userId) {
        console.log("[LearningProgress] No token or userId, skipping profile fetch");
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/student/profile/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.warn("[LearningProgress] Failed to fetch profile:", res.status);
          return;
        }
        const data = await res.json();
        const profile = data?.profile || data?.data?.profile || data;

        if (mounted && profile) {
          console.log("[LearningProgress] Fetched student profile from Firestore:", profile);

          // Get completed books (use array if available, otherwise count)
          const completedBooksArray = Array.isArray(profile.completedBooks) ? profile.completedBooks : [];
          const completedCount = profile.completedBooksCount || completedBooksArray.length || 0;
          
          // Get total cumulative books read from booksRead array
          const booksReadArray = Array.isArray(profile.booksRead) ? profile.booksRead : [];
          const totalBooksReadCount = booksReadArray.length || 0;

          // Get other metrics
          const rankData = profile.rank || { tier: "Bronze", stage: 1 };
          const points = profile.points || 0;

          console.log("[LearningProgress] Extracted data:", { completedCount, totalBooksReadCount, points, rank: rankData });

          // Update state with Firestore data
          setTotalBooksRead(totalBooksReadCount);
          setBooksCompleted(completedCount);
          setPoints(points);
          setRank(rankData);

          // Persist to localStorage
          localStorage.setItem("totalBooksRead", totalBooksReadCount);
          localStorage.setItem("completedProgress", completedCount);
          localStorage.setItem("points", points);
          localStorage.setItem("rankData", JSON.stringify(rankData));
        }
      } catch (err) {
        console.error("[LearningProgress] Error fetching student profile:", err);
      }
    }

    fetchStudentProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const { token } = getAuth();

    async function tryFetch(paths, options = {}) {
      for (const p of paths) {
        try {
          const res = await fetch(p, options);
          if (res.status === 404) continue; 
          return res;
        } catch (e) {
          continue;
        }
      }
      throw new Error("All fetch attempts failed");
    }

    async function loadRanking() {
      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const primaryRanking = `${BASE_URL}/api/ranking`;
        const fallbackRanking = `${BASE_URL}/ranking`;

        const rRes = await tryFetch([primaryRanking, fallbackRanking], { headers });
        if (rRes && rRes.ok) {
          const json = await rRes.json();
          console.log("[LearningProgress] Ranking API response:", json);
          
          const tier = json?.tier || rank.tier;
          const stage = Number(json?.sublevel ?? rank.stage);
          const progress = Number(json?.progressInSublevel ?? 0);
          const computedLevel = Math.min(Math.round((progress / 10) * 100), 100);

          console.log("[LearningProgress] Computed rank:", { tier, stage, progress, computedLevel });

          if (mounted) {
            // Use exact values from API
            const newRank = { tier, stage };
            setRank(newRank);
            localStorage.setItem("rankData", JSON.stringify(newRank));

            // Use returned totals
            const totalCompleted = Number(json?.totalCompletedBooks ?? 0);
            setBooksCompleted(totalCompleted);
            localStorage.setItem("completedProgress", totalCompleted);

            // Get booksRead (0-9 in current rank) from API response
            const apiBooksInRank = Number(json?.booksRead ?? 0);
            console.log("[LearningProgress] API returned booksRead (in current rank):", apiBooksInRank);
            
            // Get total cumulative books read
            const apiTotalBooks = Number(json?.totalCompletedBooks ?? totalCompleted);
            
            setBooksRead(apiBooksInRank);
            setTotalBooksRead(apiTotalBooks);
            localStorage.setItem("booksRead", apiBooksInRank);
            localStorage.setItem("totalBooksRead", apiTotalBooks);

            if (typeof json?.totalPoints !== "undefined") {
              setPoints(Number(json.totalPoints));
              localStorage.setItem("points", Number(json.totalPoints));
            }

            // Always set level based on progress in sublevel
            setLevel(computedLevel);
            localStorage.setItem("levelProgress", computedLevel);
            
            console.log("[LearningProgress] Updated state:", { tier, stage, level: computedLevel, totalCompleted, booksReadInRank: apiBooksInRank, totalBooks: apiTotalBooks });
          }
        } else {
          console.warn('[LearningProgress] Ranking endpoint failed', rRes?.status);
        }

        const primaryHistory = `${BASE_URL}/api/ranking/history`;
        const fallbackHistory = `${BASE_URL}/ranking/history`;
        try {
          const hRes = await tryFetch([primaryHistory, fallbackHistory], { headers });
          if (hRes && hRes.ok) {
            const hj = await hRes.json();
            if (mounted) {
              setHistory(Array.isArray(hj?.history) ? hj.history : []);
            }
          }
        } catch (e) {
          // console.warn('loadRanking history error', e);
        }
      } catch (e) {
        // console.warn('loadRanking error', e);
      }
    }
    
    loadRanking();
    
    // Refresh ranking when books are read
    const handleProgressUpdate = () => {
      loadRanking();
    };
    window.addEventListener("progressUpdate", handleProgressUpdate);
    window.addEventListener("bookOpened", handleProgressUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("progressUpdate", handleProgressUpdate);
      window.removeEventListener("bookOpened", handleProgressUpdate);
    };
  }, []);

  const levelPercent = Math.min((level / levelGoal) * 100, 100);
  
  // Use booksRead directly from API (0-9 books in current rank)
  // API handles the reset logic when ranking up
  const booksDisplayed = Math.max(0, Math.min(booksRead, 10));
  const booksPercent = Math.min((booksDisplayed / 10) * 100, 100);
  
  console.log("[LearningProgress] Books progress:", { rank, booksReadInRank: booksRead, totalBooksRead, booksPercent });
  
  const currentRankImage = rankImages[rank.tier]?.[rank.stage - 1] || bronze1;

  return (
    <div className="w-full pt-2 px-4 sm:px-6 lg:px-30 min-h-screen overflow-auto bg-gradient-to-b from-[#FDEBD0] via-[#F1E5D5] to-[#FDEBD0]">
      <h2 className="text-2xl sm:text-3xl font-extrabold ml-2 mb-3 mt-10 text-[#6A001A]">
        Learning Progress
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 mt-2">
        <div className="glow-card p-4 sm:p-8 h-[180px] sm:h-[200px] flex flex-col justify-center items-center shadow-lg rounded-xl">
          <img src={currentRankImage} alt="Rank Icon" className="w-14 sm:w-16 h-14 sm:h-16 mb-2 sm:mb-3 object-contain" />
          <div className="text-lg sm:text-xl font-semibold text-black">Current Rank</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-black">
            {rank.tier} {romanStages[rank.stage - 1]}
          </div>
        </div>

        <div className="glow-card p-4 sm:p-8 h-[180px] sm:h-[200px] flex flex-col justify-center items-center shadow-lg rounded-xl">
          <FaLevelUpAlt className="text-green-500 text-3xl sm:text-4xl mb-2 sm:mb-3" />
          <div className="text-lg sm:text-xl font-semibold text-black">Level</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-black">{level}/100%</div>
        </div>

        <div className="glow-card p-4 sm:p-8 h-[180px] sm:h-[200px] flex flex-col justify-center items-center shadow-lg rounded-xl">
          <FaStar className="text-blue-500 text-3xl sm:text-4xl mb-2 sm:mb-3" />
          <div className="text-lg sm:text-xl font-semibold text-black">Total Points</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-black">{points}</div>
        </div>

        <div className="glow-card p-4 sm:p-8 h-[180px] sm:h-[200px] flex flex-col justify-center items-center shadow-lg rounded-xl">
          <FaBook className="text-red-500 text-3xl sm:text-4xl mb-2 sm:mb-3" />
          <div className="text-lg sm:text-xl font-semibold text-black">Books Read</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-black">{totalBooksRead}</div>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold ml-2 mb-3 mt-6 sm:mt-10 text-[#6A001A]">
        Reading Progress
      </h2>

      <div className="glow-card border-0 p-4 sm:p-6 shadow-lg h-[300px] sm:h-[350px] flex flex-col">
        <h1 className="text-xl sm:text-2xl font-bold text-black mb-3">
          Keep Growing Through Reading
        </h1>

        <div className="flex justify-between mb-2 mt-4 text-black font-bold text-base sm:text-lg">
          <span>LVL</span>
          <span>{level}/100%</span>
        </div>

        <div className="w-full h-5 sm:h-6 bg-blue-200 rounded-full">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${levelPercent}%` }}></div>
        </div>

        <div className="flex justify-between mb-2 mt-6 text-black font-bold text-base sm:text-lg">
          <span>Completed</span>
          <span>{booksDisplayed}/10</span>
        </div>

        <div className="w-full h-5 sm:h-6 bg-blue-200 rounded-full">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${booksPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default LearningProgress;