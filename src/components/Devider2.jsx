import React from "react";
import leafImg from "../assets/leaf.png";
import bgBookImg from "../assets/bg-book.png";
import designImg from "../assets/design.png";
import qlImg from "../assets/ql.png";
import qrImg from "../assets/qr.png";

const Devider2 = () => {
  return (
    <section className="relative bg-[#870022] text-white py-16 md:py-20 overflow-hidden flex items-center justify-center">

      <img
        src={leafImg}
        alt="Leaf"
        className="absolute left-[10px] bottom-[0px] w-[130px] sm:w-[180px] md:left-[90px] md:bottom-[15px] md:w-[450px] opacity-80 z-0 pointer-events-none"
      />

      <img
        src={bgBookImg}
        alt="Books"
        className="absolute left-[-30px] bottom-[-40px] w-[150px] sm:w-[230px] md:left-[-20px] md:bottom-[-100px] md:w-[620px] z-10 pointer-events-none"
      />

      <img
        src={designImg}
        alt="Design"
        className="absolute right-[-20px] bottom-0 w-[120px] sm:w-[180px] md:w-[400px] opacity-80 pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-xl sm:px-6 md:px-12 md:max-w-3xl">
        <div className="relative mb-6 sm:mb-8 flex items-center justify-center gap-2 md:gap-0">
          <img
            src={qlImg}
            alt="Quote Left"
            className="w-5 h-5 sm:w-7 sm:h-7 md:absolute md:top-[-20px] md:left-[-1px] md:w-14 md:h-14"
          />

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight text-center">
            Turn Pages, Unlock Adventures.
          </h2>

          <img
            src={qrImg}
            alt="Quote Right"
            className="w-5 h-5 sm:w-7 sm:h-7 md:absolute md:top-[-20px] md:right-[-5px] md:w-14 md:h-14"
          />
        </div>

        <p className="text-sm sm:text-base md:text-xl text-gray-100 leading-relaxed tracking-wide">
          CozyClips Stories turns reading into an interactive and engaging
          experience, combining storytelling with challenges and progress
          tracking to promote comprehension, motivation, and learning.
        </p>
      </div>
    </section>
  );
};

export default Devider2;