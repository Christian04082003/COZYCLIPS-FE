import { Trophy, Book, Zap, Star, Award, Target, Flame, Crown } from 'lucide-react';

export default function Achievements() {

  const achievements = [
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

  const milestones = [
    { id: 'books-30', title: 'Read 30 Books', current: 0, target: 30, reward: '100 coins' },
    { id: 'quizzes-150', title: 'Complete 150 Quizzes', current: 0, target: 150, reward: '50 coins + 5 gems' },
    { id: 'points-5000', title: 'Earn 5,000 Points', current: 0, target: 5000, reward: 'Legendary Frame' },
    { id: 'accuracy-90', title: 'Reach 90% Average Accuracy', current: 0, target: 90, reward: 'Diamond Avatar' }
  ];

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
                  {m.target - m.current} more to go!
                </p>

              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
