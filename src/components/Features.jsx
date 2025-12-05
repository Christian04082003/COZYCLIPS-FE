import React, { useRef, useEffect } from "react";

const Features = () => {
  const featuresRef = useRef(null);

  useEffect(() => {
    const container = featuresRef.current;
    if (!container) return;

    container.innerHTML += container.innerHTML;

    let scrollPos = 0;
    const speed = 0.8;

    const animate = () => {
      scrollPos += speed;
      if (scrollPos >= container.scrollWidth / 2) scrollPos = 0;
      container.scrollLeft = scrollPos;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  const features = [
    {
      img: "/src/assets/interactive.png",
      title: "Interactive Book Reading",
      text: "Learners can read stories with visual aids and adjustable text features that improve comprehension and engagement.",
    },
    {
      img: "/src/assets/gamified.png",
      title: "Gamified Challenges",
      text: "Learners complete fun challenges and quizzes that reward them with points, badges, and achievements.",
    },
    {
      img: "/src/assets/leaderboards.png",
      title: "Leaderboards & Achievements",
      text: "Earn badges and climb leaderboards, fostering friendly competition and motivation.",
    },
    {
      img: "/src/assets/assistance.png",
      title: "Word Assistance Tool",
      text: "Highlight and learn difficult words through pronunciation and definitions for better understanding.",
    },
    {
      img: "/src/assets/conditions.png",
      title: "Restrictions / Conditions",
      text: "Set reading conditions to help learners stay focused and improve comprehension.",
    },
    {
      img: "/src/assets/progress.png",
      title: "Progress Tracking",
      text: "Track reading time, completed stories, and quiz scores through visual dashboards.",
    },
  ];

  return (
    <section className="bg-[#fff9f5] py-12 md:py-16 px-6 md:px-12 -mt-8">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-[#222] mb-12">
        FEATURES
      </h2>

      <div
        ref={featuresRef}
        className="flex overflow-x-hidden space-x-6 px-4 scrollbar-hide"
      >
        {features.map((f, i) => (
          <div
            key={i}
            className="w-[300px] sm:w-[350px] md:w-[400px] bg-white rounded-3xl flex-shrink-0 flex flex-col p-6"
          >
            <img
              src={f.img}
              alt={f.title}
              className="w-full h-48 object-contain mb-4"
            />
            <h3 className="text-2xl font-bold mb-3 text-[#b0042b] text-center">
              {f.title}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed text-justify">
              {f.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;