import React from "react";
import webImg from "../assets/web.png";
import goalImg from "../assets/goal.png";
import teamImg from "../assets/team.png";

const Aboutus = () => {
  return (
    <section className="bg-[#F4EDE4] py-24 px-6 text-center text-[#2B1E17]">
      <h2 className="text-4xl font-bold mb-16">About Us</h2>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-24">

        <div className="flex flex-col items-center">
          <img
            src={webImg}
            alt="About the Web"
            className="w-[340px] h-auto mb-6"
          />
          <h3 className="text-3xl font-bold mb-4">About the Web</h3>
          <p className="text-xl leading-relaxed max-w-[380px]">
            CozyClips Stories makes reading fun and interactive by combining
            stories with games and challenges that boost comprehension. We
            support all learners with voice narration, sign language, and
            progress tracking for teachers and parents.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <img
            src={goalImg}
            alt="Our Goal"
            className="w-[340px] h-auto mb-6"
          />
          <h3 className="text-3xl font-bold mb-4">Our Goal</h3>
          <p className="text-xl leading-relaxed max-w-[380px]">
            We turn reading into an exciting adventure with quizzes, rewards,
            and challenges that encourage students to read more and improve.
            Our aim is to create a motivating space where every child can grow
            and succeed.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <img
            src={teamImg}
            alt="Our Team"
            className="w-[340px] h-auto mb-6"
          />
          <h3 className="text-3xl font-bold mb-4">Our Team</h3>
          <p className="text-xl leading-relaxed max-w-[380px]">
            We're a passionate group dedicated to using technology to make
            reading accessible and engaging, while providing tools for teachers
            and parents to monitor progress.
          </p>
        </div>

      </div>
    </section>
  );
};

export default Aboutus;