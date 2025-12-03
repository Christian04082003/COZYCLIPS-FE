import React from "react";

const Devider1 = () => {
  const items = [
    {
      icon: "/src/assets/chat.png",
      title: "Engage",
      text: "Personalized reading with visuals and adjustable text for clearer, engaging learning.",
    },
    {
      icon: "/src/assets/empower.png",
      title: "Empower",
      text: "Accessible stories that adapt to boost focus and enjoyment for all learners.",
    },
    {
      icon: "/src/assets/enrich.png",
      title: "Enrich",
      text: "CozyClips makes reading interactive and engaging.",
    },
    {
      icon: "/src/assets/elevate.png",
      title: "Elevate",
      text: "CozyClips personalizes reading for smoother, enjoyable learning.",
    },
  ];

  return (
    <section className="bg-[#870022] text-white py-10 px-6 md:px-10">
      <div className="max-w-8xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center space-y-3">
            <div className="bg-white rounded-lg p-4 w-16 h-16 flex items-center justify-center shadow-md">
              <img
                src={item.icon}
                alt={item.title}
                className="w-8 h-8 object-contain"
              />
            </div>

            <div className="mt-3">
              <h3 className="text-xl font-extrabold mb-1">{item.title}</h3>
              <p className="text-gray-200 text-base leading-relaxed max-w-xs mx-auto">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Devider1;