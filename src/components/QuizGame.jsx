import React, { useState, useEffect } from "react";

const QuizGame = () => {
  const [quizData] = useState([
    { id: 1, type: "Multiple Choice", question: "Who betrayed the hero in the middle of the story?", options: ["Marcus the Brave", "Elena the Wise", "Thomas the Loyal", "Sarah the Swift"], correct: "Marcus the Brave" },
    { id: 2, type: "True/False", question: "The hero was defeated in the first battle.", options: ["True", "False"], correct: "False" },
    { id: 3, type: "Multiple Choice", question: "Which city did the hero travel to first?", options: ["Aldoria", "Branfield", "Caldora", "Drevon"], correct: "Aldoria" },
    { id: 4, type: "Multiple Choice", question: "Who is the hero's mentor?", options: ["Master Zane", "Old Tomas", "Lady Elina", "Sir Robert"], correct: "Master Zane" },
    { id: 5, type: "True/False", question: "The hero found the magical sword on his journey.", options: ["True", "False"], correct: "True" },
    { id: 6, type: "Multiple Choice", question: "What is the main villain's name?", options: ["Lord Vex", "Darkon", "Malrick", "Zyron"], correct: "Lord Vex" },
    { id: 7, type: "Multiple Choice", question: "Which companion stayed loyal to the hero?", options: ["Marcus", "Elena", "Thomas", "Sarah"], correct: "Thomas" },
    { id: 8, type: "True/False", question: "The hero loses all allies at the end of the story.", options: ["True", "False"], correct: "False" },
    { id: 9, type: "Multiple Choice", question: "Where did the final battle take place?", options: ["Mount Drakon", "Eternal Forest", "Crystal Lake", "Shadow Castle"], correct: "Shadow Castle" },
    { id: 10, type: "Multiple Choice", question: "What lesson did the hero learn?", options: ["Courage", "Greed", "Deception", "Patience"], correct: "Courage" },
  ]);

  const totalQuestions = quizData.length;
  const [timer, setTimer] = useState(30);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState(Array(totalQuestions).fill(null));
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [freezeTime, setFreezeTime] = useState(false);
  const [doubleCoinsUsed, setDoubleCoinsUsed] = useState(Array(totalQuestions).fill(false));
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const question = quizData[current];

  useEffect(() => {
    if (timer > 0 && !freezeTime) {
      const countdown = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [timer, freezeTime]);

  const handleSelect = (opt) => {
    setSelected(opt);
    const updatedAnswers = [...answers];
    updatedAnswers[current] = opt;
    setAnswers(updatedAnswers);
  };

  const calculateScore = () => {
    let correctCount = answers.filter((ans, i) => ans === quizData[i].correct).length;
    setScore(correctCount);
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
    const updated = [...doubleCoinsUsed];
    updated[current] = true;
    setDoubleCoinsUsed(updated);
    alert("Double Coins activated!");
  };

  const handleFiftyFifty = () => setFiftyFiftyUsed(true);
  const handleFreezeTime = () => setFreezeTime((prev) => !prev);
  const handleSkipQuestion = () => {
    const updatedAnswers = [...answers];
    updatedAnswers[current] = question.correct;
    setAnswers(updatedAnswers);
    handleNext();
  };
  const handleExtraTime = () => setTimer((prev) => prev + 120);

  let displayedOptions = question.options;
  if (fiftyFiftyUsed && question.type === "Multiple Choice") {
    const correctOption = question.correct;
    const wrongOptions = question.options.filter((o) => o !== correctOption);
    displayedOptions = [correctOption, wrongOptions[0]].sort(() => Math.random() - 0.5);
  }

  return (
    <div className="bg-[#F9F3EA] min-h-screen p-2 sm:p-4 flex justify-center mt-16">
      <div className="w-full max-w-[1580px]">
        <div className="bg-white border border-[#7d0000] rounded-xl shadow-lg p-4 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <img src="https://i.ibb.co/Lkq0mwz/ibon-adarna.jpg" alt="Book" className="w-20 h-20 sm:w-30 sm:h-30 rounded-md border" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">Ibon Adarna</h1>
              <p className="text-gray-700 text-sm sm:text-lg">Wally Bayola</p>
              <p className="text-gray-700 font-semibold mt-1 text-xs sm:text-lg">
                Question {current + 1} of {totalQuestions}
              </p>
              <div className="w-full bg-gray-300 h-1 sm:h-2 rounded-full mt-1">
                <div className="h-1 sm:h-2 bg-[#145579] rounded-full" style={{ width: `${((current + 1) / totalQuestions) * 100}%` }}></div>
              </div>
            </div>
          </div>
          <div className={`border-2 rounded-full px-4 sm:px-6 py-1 sm:py-2 text-lg sm:text-xl font-bold ${freezeTime ? "border-green-600 text-green-600" : "border-[#7d0000] text-[#7d0000]"}`}>
            ⏱ 00:{timer < 10 ? "0" + timer : timer}
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="w-full lg:w-64 bg-white border border-[#7d0000] rounded-xl p-2 sm:p-4 flex lg:flex-col gap-2 sm:gap-4 overflow-x-auto lg:overflow-visible">
            <h2 className="text-md sm:text-xl font-bold mb-2 sm:mb-4 flex items-center gap-2">⚡ Power - Ups</h2>
            <div className="flex lg:flex-col gap-2 sm:gap-4">
              <button onClick={handleDoubleCoins} className="flex-1 lg:flex-none w-full border-2 border-[#145579] rounded-lg p-2 sm:p-3 hover:bg-[#f4f4f4] transition-colors text-xs sm:text-sm">
                <p className="font-bold text-left">Double Coins</p>
                <p className="text-gray-600 text-left">2x coins for this question</p>
              </button>
              <button onClick={handleFiftyFifty} className="flex-1 lg:flex-none w-full border-2 border-[#145579] rounded-lg p-2 sm:p-3 hover:bg-[#f4f4f4] transition-colors text-xs sm:text-sm">
                <p className="font-bold text-left">50/50</p>
                <p className="text-gray-600 text-left">Remove 2 wrong answers</p>
              </button>
              <button onClick={handleFreezeTime} className={`flex-1 lg:flex-none w-full border-2 rounded-lg p-2 sm:p-3 hover:bg-[#f4f4f4] transition-colors text-xs sm:text-sm ${freezeTime ? "border-green-600 text-green-600" : "border-[#145579]"}`}>
                <p className="font-bold text-left">Freeze Time</p>
                <p className="text-gray-600 text-left">{freezeTime ? "Timer is frozen" : "Pause timer for 60 seconds"}</p>
              </button>
              <button onClick={handleSkipQuestion} className="flex-1 lg:flex-none w-full border-2 border-[#145579] rounded-lg p-2 sm:p-3 hover:bg-[#f4f4f4] transition-colors text-xs sm:text-sm">
                <p className="font-bold text-left">Skip Question</p>
                <p className="text-gray-600 text-left">Skip and mark as correct</p>
              </button>
              <button onClick={handleExtraTime} className="flex-1 lg:flex-none w-full border-2 border-[#145579] rounded-lg p-2 sm:p-3 hover:bg-[#f4f4f4] transition-colors text-xs sm:text-sm">
                <p className="font-bold text-left">Extra Time</p>
                <p className="text-gray-600 text-left">Add 2 minutes to timer</p>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white border border-[#7d0000] rounded-xl p-3 sm:p-6">
            <div className="flex gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
              <div className="bg-[#7d0000] text-white px-2 sm:px-4 py-1 rounded-full font-semibold text-xs sm:text-sm">Question {current + 1}</div>
              <div className="bg-[#FFD96A] px-2 sm:px-4 py-1 rounded-full font-semibold text-xs sm:text-sm">{question.type}</div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">{question.question}</h2>

            <div className="space-y-2 sm:space-y-4">
              {displayedOptions.map((opt, i) => (
                <button key={i} onClick={() => handleSelect(opt)} className={`w-full flex items-center gap-2 sm:gap-4 border-2 rounded-lg p-2 sm:p-4 text-sm sm:text-lg ${selected === opt ? "bg-[#7d0000] text-white border-[#7d0000]" : "border-[#FFD96A] bg-white"}`}>
                  <span className="font-bold">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>

            <p className="text-center text-gray-500 mt-2 sm:mt-4 text-xs sm:text-sm">Select an answer to continue</p>

            {!showResult && (
              <div className="mt-4 sm:mt-8 border-t pt-2 sm:pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
                <button onClick={handlePrevious} className="bg-[#FFD96A] py-1 sm:py-2 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base w-full sm:w-auto transition-transform duration-200 hover:scale-105">Previous</button>
                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  {Array.from({ length: totalQuestions }, (_, i) => (
                    <button key={i} onClick={() => goToQuestion(i)} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border text-sm sm:text-lg font-bold flex-shrink-0 ${i === current ? "bg-[#7d0000] text-white" : "bg-white"}`}>{i + 1}</button>
                  ))}
                </div>
                <button onClick={handleNext} className="bg-[#7d0000] text-white py-1 sm:py-2 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base w-full sm:w-auto transition-transform duration-200 hover:scale-105">
                  {current === totalQuestions - 1 ? "Finish" : "Next"}
                </button>
              </div>
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
              onClick={() => window.location.reload()}
              className="mt-6 bg-[#7d0000] text-white py-2 px-6 rounded-lg font-bold hover:bg-[#5a0000]"
            >
              Restart Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGame;
