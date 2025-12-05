  import React from "react";

  const QuizGame = () => {
    return (
      <div className="p-6 bg-[#F9F3EA] min-h-screen">
        <div className="rounded-xl mx-auto text-center py-2 mt-13 shadow-md border border-black/90 bg-[#F9F3EA] w-full max-w-full -translate-x-[1px]">
          <h2 className="text-2xl sm:text-3xl font-bold">Take Quiz</h2>
        </div>

        <div className="rounded-xl p-3 sm:p-4 mt-5 shadow-lg border border-black/90 bg-[#F9F3EA] min-h-[81vh] max-h-[81vh] overflow-y-auto flex flex-col justify-start">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
            {/* Quiz items will go here dynamically */}
          </div>
        </div>
      </div>
    );
  };

  export default QuizGame;
