import React, { useEffect, useState } from 'react';
import { Trophy, Book, Zap, Star, Award, Target, Flame, Crown } from 'lucide-react';

const BASE_URL = "https://czc-eight.vercel.app";

function getAuth() {
  try {
    const raw = localStorage.getItem('czc_auth');
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
    return { token, userId, user };
  } catch {
    return {};
  }
}

export default function Achievements() {
  const initialAchievements = [
    { id: 'first-book', name: 'First Steps', description: 'Complete your first book', icon: <Book className="w-8 h-8" />, unlocked: false, category: 'reading' },
    { id: 'quiz-master', name: 'Quiz Master', description: 'Score 100% on 10 quizzes', icon: <Trophy className="w-8 h-8" />, unlocked: false, category: 'quiz' },
    { id: 'speed-reader', name: 'Speed Reader', description: 'Read 5 books in one week', icon: <Zap className="w-8 h-8" />, unlocked: false, category: 'special' },
    { id: 'perfect-streak', name: 'Perfect Streak', description: 'Maintain a 7-day reading streak', icon: <Flame className="w-8 h-8" />, unlocked: false, progress: 0, maxProgress: 7, category: 'special' },
    { id: 'word-wizard', name: 'Word Wizard', description: 'Look up 100 words in Word Helper', icon: <Star className="w-8 h-8" />, unlocked: false, progress: 0, maxProgress: 100, category: 'reading' },
    { id: 'book-collector', name: 'Book Collector', description: 'Read 50 different books', icon: <Award className="w-8 h-8" />, unlocked: false, progress: 0, maxProgress: 50, category: 'reading' },
    { id: 'accuracy-ace', name: 'Accuracy Ace', description: 'Achieve 95% average quiz accuracy', icon: <Target className="w-8 h-8" />, unlocked: false, progress: 0, maxProgress: 95, category: 'quiz' },
    { id: 'reading-champion', name: 'Reading Champion', description: 'Reach Level 20', icon: <Crown className="w-8 h-8" />, unlocked: false, progress: 0, maxProgress: 20, category: 'special' },
    { id: 'early-bird', name: 'Early Bird', description: 'Complete 10 reading sessions before 9 AM', icon: <Book className="w-8 h-8" />, unlocked: false, category: 'special' },
    { id: 'quiz-veteran', name: 'Quiz Veteran', description: 'Complete 100 quizzes', icon: <Trophy className="w-8 h-8" />, unlocked: false, category: 'quiz' },
    { id: 'genre-explorer', name: 'Genre Explorer', description: 'Read books from 10 different genres', icon: <Star className="w-8 h-8" />, unlocked: false, progress: 0, maxProgress: 10, category: 'reading' },
    { id: 'perfect-month', name: 'Perfect Month', description: 'Read every day for 30 days', icon: <Flame className="w-8 h-8" />, unlocked: false, progress: 0, maxProgress: 30, category: 'special' }
  ];

  const initialMilestones = [
    { id: 'books-30', title: 'Read 30 Books', current: 0, target: 30, reward: '100 coins' },
    { id: 'quizzes-150', title: 'Complete 150 Quizzes', current: 0, target: 150, reward: '50 coins + 5 gems' },
    { id: 'points-5000', title: 'Earn 5,000 Points', current: 0, target: 5000, reward: 'Legendary Frame' },
    { id: 'accuracy-90', title: 'Reach 90% Average Accuracy', current: 0, target: 90, reward: 'Diamond Avatar' }
  ];

  const [achievements, setAchievements] = useState(initialAchievements);
  const [milestones, setMilestones] = useState(initialMilestones);

  const { token, userId } = getAuth();

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json, status: res.status };
  }

  function outProgressDefault(a) {
    if (typeof a.progress === 'number') return a.progress;
    if (a.maxProgress) return 0;
    return 0;
  }

  async function loadUserData() {
    try {
      if (!userId) return;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch profile (prefer direct id route)
      let profile = null;
      const p = await fetchJson(`${BASE_URL}/api/student/profile/${userId}`, { headers });
      if (p.ok && p.json?.data?.profile) {
        profile = p.json.data.profile;
      } else {
        const p2 = await fetchJson(`${BASE_URL}/api/student/profile`, { headers });
        if (p2.ok) {
          const profiles = p2.json?.data?.profiles ?? p2.json?.data ?? (Array.isArray(p2.json) ? p2.json : null);
          if (Array.isArray(profiles) && profiles.length) {
            profile = profiles.find(pr => String(pr.studentId || pr.id || pr.username) === String(userId)) || profiles[0];
          }
        }
      }

      // Fetch ranking (note /api prefix)
      const r = await fetchJson(`${BASE_URL}/api/ranking`, { headers });
      const hist = await fetchJson(`${BASE_URL}/api/ranking/history`, { headers });

      // derive safe values
      const booksReadArray = profile?.booksRead || profile?.readingProgress || [];
      const booksReadCount = Number(
        profile?.booksReadCount ??
          (Array.isArray(booksReadArray) ? booksReadArray.length : 0) ??
          (r.json?.totalCompletedBooks ?? 0)
      );

      const quizHistory = profile?.quizHistory || [];
      const quizCount = Array.isArray(quizHistory)
        ? quizHistory.length
        : (Array.isArray(hist.json?.history) ? hist.json.history.filter(h => h.type === 'quiz').length : 0);

      let avgAccuracy = null;
      if (Array.isArray(quizHistory) && quizHistory.length) {
        const scores = quizHistory.map(q => {
          if (typeof q.score === 'number') return q.score;
          if (q.correct != null && q.total != null) return Math.round((Number(q.correct) / Number(q.total)) * 100);
          return null;
        }).filter(v => v !== null);
        if (scores.length) avgAccuracy = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }

      const points = Number(profile?.points ?? profile?.coins ?? r.json?.points ?? 0);

      // build unlocked set from profile fields (prefer authoritative)
      const unlockedSet = new Set();
      if (Array.isArray(profile?.badges)) profile.badges.forEach(b => unlockedSet.add(typeof b === 'string' ? b : (b.id || String(b))));
      if (Array.isArray(profile?.achievements)) profile.achievements.forEach(a => unlockedSet.add(a.id || (a.name && a.name.toLowerCase()) || String(a)));
      if (Array.isArray(profile?.unlockedItems)) profile.unlockedItems.forEach(i => unlockedSet.add(i));

      // helper to find earliest finished date
      const firstFinishedDate = (() => {
        if (!Array.isArray(booksReadArray) || booksReadArray.length === 0) return null;
        for (const e of booksReadArray) {
          const d = e && (e.finishedAt || e.finishedAtDate || e.date) ? new Date(e.finishedAt || e.finishedAtDate || e.date) : null;
          if (d && !isNaN(d.getTime())) return d.toLocaleDateString();
        }
        return null;
      })();

      // compute updated achievements: prefer profile-unlocked, else compute from data
      const updated = initialAchievements.map(a => {
        const out = { ...a, unlocked: false, progress: outProgressDefault(a), unlockedDate: null };

        const explicitlyUnlocked = unlockedSet.has(a.id) || unlockedSet.has(a.name) || unlockedSet.has(a.name?.toLowerCase());
        if (explicitlyUnlocked) {
          out.unlocked = true;
          out.unlockedDate =
            (Array.isArray(profile?.achievements) && profile.achievements.find(x => (x.id === a.id || x.name === a.name))?.unlockedAt) ||
            firstFinishedDate ||
            new Date().toLocaleDateString();
          return out;
        }

        // derive by id
        if (a.id === 'first-book') {
          out.unlocked = booksReadCount >= 1;
          if (out.unlocked) out.unlockedDate = firstFinishedDate || new Date().toLocaleDateString();
          return out;
        }

        if (a.id === 'book-collector') {
          out.progress = Math.min(booksReadCount, a.maxProgress || 50);
          out.unlocked = booksReadCount >= (a.maxProgress || 50);
          return out;
        }

        if (a.id === 'speed-reader') {
          let recent = 0;
          if (Array.isArray(booksReadArray)) {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            for (const e of booksReadArray) {
              const ts = e && (e.finishedAt || e.date) ? Date.parse(e.finishedAt || e.date) : NaN;
              if (!isNaN(ts) && ts >= weekAgo) recent++;
            }
          }
          out.progress = recent;
          out.unlocked = recent >= 5;
          if (out.unlocked) out.unlockedDate = firstFinishedDate || new Date().toLocaleDateString();
          return out;
        }

        if (a.id === 'quiz-master') {
          let perfectCount = 0;
          if (Array.isArray(quizHistory)) {
            quizHistory.forEach(q => { if (q && (q.score === 100 || q.percentage === 100)) perfectCount++; });
          }
          out.progress = perfectCount;
          out.unlocked = perfectCount >= 10;
          if (out.unlocked) out.unlockedDate = new Date().toLocaleDateString();
          return out;
        }

        if (a.id === 'quiz-veteran') {
          out.progress = quizCount;
          out.unlocked = quizCount >= 100;
          return out;
        }

        if (a.id === 'accuracy-ace') {
          if (avgAccuracy !== null) out.progress = avgAccuracy;
          out.unlocked = (avgAccuracy !== null && avgAccuracy >= (a.maxProgress || 95));
          return out;
        }

        if (a.id === 'reading-champion') {
          out.progress = profile?.level || out.progress;
          out.unlocked = (profile?.level && profile.level >= (a.maxProgress || 20));
          return out;
        }

        if (a.id === 'early-bird') {
          const sessionsBefore9 = profile?.sessionsBefore9 || 0;
          out.progress = sessionsBefore9;
          out.unlocked = sessionsBefore9 >= 10;
          if (out.unlocked) out.unlockedDate = profile?.earlyBirdAt || firstFinishedDate;
          return out;
        }

        if (a.id === 'genre-explorer') {
          out.progress = profile?.genresRead?.length || 0;
          out.unlocked = out.progress >= (a.maxProgress || 10);
          return out;
        }

        if (a.id === 'perfect-month') {
          out.progress = profile?.currentMonthStreak || out.progress;
          out.unlocked = out.progress >= (a.maxProgress || 30);
          return out;
        }

        return out;
      });

      setAchievements(updated);

      // update milestones using real data
      setMilestones(prev => prev.map(m => {
        const copy = { ...m };
        if (m.id === 'books-30') copy.current = booksReadCount;
        if (m.id === 'quizzes-150') copy.current = quizCount;
        if (m.id === 'points-5000') copy.current = points;
        if (m.id === 'accuracy-90') copy.current = (avgAccuracy !== null ? avgAccuracy : copy.current);
        return copy;
      }));
    } catch (err) {
      console.warn('Failed to load user achievements data', err);
    }
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionPercentage = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="w-full flex flex-col items-center pb-10">

      <div className="w-full max-w-[calc(100%-40px)] sm:max-w-[calc(100%-60px)] lg:max-w-[calc(100%-90px)] mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold ml-2 mb-3 mt-10 text-[#6A001A]"> Achievements & Badges </h2>
      </div>

      <div className="bg-white border border-black rounded-[20px] p-4 sm:p-6 shadow mb-6 
                      w-full max-w-[calc(100%-40px)] sm:max-w-[calc(100%-60px)] lg:max-w-[calc(100%-90px)]">

        <div className="grid grid-cols-3 text-center gap-4 sm:gap-6">

          <div>
            <p className="font-kameron-semibold text-[32px] sm:text-[38px] md:text-[42px] text-[#870022]">
              {unlockedCount}
            </p>
            <p className="text-[15px] sm:text-[18px] md:text-[20px] text-black/60">Badges Earned</p>
          </div>

          <div>
            <p className="font-kameron-semibold text-[32px] sm:text-[38px] md:text-[42px] text-[#870022]">
              {achievements.length}
            </p>
            <p className="text-[15px] sm:text-[18px] md:text-[20px] text-black/60">Total Badges</p>
          </div>

          <div>
            <p className="font-kameron-semibold text-[32px] sm:text-[38px] md:text-[42px] text-[#870022]">
              {completionPercentage}%
            </p>
            <p className="text-[15px] sm:text-[18px] md:text-[20px] text-black/60">Completion</p>
          </div>

        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
            <div className="bg-[#870022] h-full rounded-full" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>
      </div>


      <div className="bg-white border border-black rounded-[20px] p-4 sm:p-6 shadow mb-6 
                      w-full max-w-[calc(100%-40px)] sm:max-w-[calc(100%-60px)] lg:max-w-[calc(100%-90px)]">

        <h2 className="font-kameron-semibold text-[24px] sm:text-[28px] md:text-[30px] mb-6">
          All Badges
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

          {achievements.map((a) => (
            <div
              key={a.id}
              className={`relative p-5 sm:p-6 rounded-lg border-2 flex flex-col items-center text-center
                ${a.unlocked ? 'bg-yellow-100 border-yellow-400' : 'bg-gray-50 border-gray-200'}
              `}
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3
                ${a.unlocked ? 'bg-[#870022] text-white' : 'bg-gray-300 text-gray-600'}
              `}>
                {a.icon}
              </div>

              <h4 className="font-kameron-semibold text-[16px] sm:text-[18px] mb-1">
                {a.name}
              </h4>

              <p className="text-[13px] sm:text-[15px] text-black/70">
                {a.description}
              </p>

              {a.unlocked && (
                <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-900" />
                </div>
              )}

              <div className="absolute top-2 left-2 px-2 py-1 rounded text-[11px] sm:text-[13px] bg-blue-100 text-blue-800">
                {a.category}
              </div>

              {!!a.maxProgress && (
                <div className="w-full mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#870022] h-2 rounded-full" style={{ width: `${Math.min(100, (a.progress / a.maxProgress) * 100)}%` }} />
                  </div>
                  <p className="text-[12px] mt-1">{a.progress}/{a.maxProgress}</p>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>


      <div className="bg-white border border-black rounded-[20px] p-4 sm:p-6 shadow
                      w-full max-w-[calc(100%-40px)] sm:max-w-[calc(100%-60px)] lg:max-w-[calc(100%-90px)]">

        <h2 className="font-kameron-semibold text-[24px] sm:text-[28px] md:text-[30px] mb-6">
          Current Milestones
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {milestones.map((m) => {
            const progress = Math.min((m.current / m.target) * 100, 100);

            return (
              <div key={m.id} className="bg-[#f3ebe2] p-5 sm:p-6 rounded-lg">

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-kameron-semibold text-[18px] sm:text-[22px]">{m.title}</h4>
                    <p className="text-[14px] sm:text-[17px] text-black/60">Reward: {m.reward}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-kameron-semibold text-[18px] sm:text-[22px]">
                      {m.current} / {m.target}
                    </p>
                    <p className="text-[14px] sm:text-[16px] text-black/60">{Math.round(progress)}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-300 rounded-full h-3 sm:h-4">
                  <div className="bg-[#870022] h-full rounded-full" style={{ width: `${progress}%` }}></div>
                </div>

                <p className="text-[14px] sm:text-[16px] text-black/50 mt-2">
                  {Math.max(0, m.target - m.current)} more to go!
                </p>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}