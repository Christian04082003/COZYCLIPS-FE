import React, { useState, useEffect } from "react";

const basePlans = [
  {
    id: "free",
    name: "FREE",
    price: 0,
    type: "free",
    features: [
      { text: "Unlock other abilities.", enabled: true },
      { text: "Gain more rewards.", enabled: true },
      { text: "Unlock premium quests.", enabled: false },
      { text: "Unlimited avatar change.", enabled: false },
      { text: "Unlock premium avatars.", enabled: false },
    ],
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: 299,
    type: "buy",
    features: [
      { text: "Unlock other abilities.", enabled: true },
      { text: "Gain more rewards.", enabled: true },
      { text: "Unlock premium quests.", enabled: true },
      { text: "Unlimited avatar change.", enabled: true },
      { text: "Unlock premium avatars.", enabled: false },
    ],
  },
  {
    id: "teacher",
    name: "TEACHER",
    price: 499,
    type: "buy",
    features: [
      { text: "Unlock other abilities.", enabled: true },
      { text: "Gain more rewards.", enabled: true },
      { text: "Unlock premium quests.", enabled: true },
      { text: "Unlimited avatar change.", enabled: true },
      { text: "Unlock premium avatars.", enabled: true },
    ],
  },
];

const Subscription = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentPlan, setCurrentPlan] = useState("free");

  const [subscription, setSubscription] = useState({
    plan: "Free Plan",
    startDate: "Today",
    expirationDate: "Unlimited",
    status: "Active",
    autoRenew: false,
  });

  const [clickedButton, setClickedButton] = useState(null);
  const clickEffect = (id) => {
    setClickedButton(id);
    setTimeout(() => setClickedButton(null), 150);
  };

  const handleBuy = (planId) => {
    clickEffect(planId);
    const url = `https://your-backend.com/api/payment/checkout?plan=${planId}`;
    window.open(url, "_blank");
  };

  const handleSelectPlan = (planId) => {
    clickEffect(planId);
    setCurrentPlan(planId);

    const selected = basePlans.find((p) => p.id === planId);

    setSubscription({
      plan: `${selected.name} - ${billingCycle}`,
      startDate: "Today",
      expirationDate: selected.type === "free" ? "Unlimited" : "Next Billing",
      status: "Active",
      autoRenew: selected.type !== "free",
    });
  };

  const handleRenew = () => {
    clickEffect("renew");
    alert("Renewing subscription…");
  };

  const handleCancel = () => {
    clickEffect("cancel");
    alert("Cancelling subscription…");
  };

  const displayedPlans =
    billingCycle === "monthly"
      ? basePlans
      : basePlans.map((p) => ({ ...p, price: p.price * 9 }));

  return (
    <div className="p-6">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-[#6A001A] mt-5">Subscription Plan</h1>
        <p className="text-lg text-gray-600 mt-5">Try our premium plans to enhance your learning experience.</p>
      </div>

      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-5 py-1.5 rounded-lg text-lg font-semibold ${
            billingCycle === "monthly" ? "bg-[#6A001A] text-white" : "bg-gray-300"
          }`}
        >
          Monthly
        </button>

        <button
          onClick={() => setBillingCycle("annually")}
          className={`px-5 py-1.5 rounded-lg text-lg font-semibold ${
            billingCycle === "annually" ? "bg-[#6A001A] text-white" : "bg-gray-300"
          }`}
        >
          Annually
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full mb-10 text-lg">
        <h2 className="text-2xl font-bold mb-4 ">Current Subscription</h2>

        <div className="grid grid-cols-2 gap-6 pl-[30px]">
          <div className="flex flex-col space-y-2">
            <p><strong>Plan:</strong> {subscription.plan}</p>
            <p><strong>Start Date:</strong> {subscription.startDate}</p>
            <p><strong>Auto-Renew:</strong> {subscription.autoRenew ? "Enabled" : "Disabled"}</p>
          </div>

          <div className="flex flex-col space-y-2">
            <p>
              <strong>Status:</strong>{" "}
              <span className="text-green-700">{subscription.status}</span>
            </p>
            <p>
              <strong>Expiration Date:</strong>{" "}
              <span className="text-red-600">{subscription.expirationDate}</span>
            </p>
          </div>
        </div>
          
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {displayedPlans.map((plan) => (
          <div key={plan.id} className="bg-white p-8 rounded-xl shadow-lg flex flex-col h-full">
            <h3 className="text-2xl font-semibold mb-4">{plan.name}</h3>
{/* dqdqw */}
            {plan.price > 0 && (
              <p className="text-3xl font-bold mb-6">₱{plan.price}</p>
            )}

            <ul className="mb-8 flex-grow text-lg">
              {plan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center space-x-3 mb-2">
                  <span
                    className={`font-bold text-xl ${
                      feat.enabled ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {feat.enabled ? "✔" : "✘"}
                  </span>
                  <span>{feat.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() =>
                plan.type === "buy" ? handleBuy(plan.id) : handleSelectPlan(plan.id)
              }
              className={`w-full py-1.5 rounded-lg text-xl font-semibold text-white transition mt-auto ${
                currentPlan === plan.id ? "bg-gray-500" : "bg-[#6A001A] hover:opacity-90"
              } ${clickedButton === plan.id ? "scale-95" : ""}`}
            >
              {currentPlan === plan.id ? "CURRENT PLAN" : plan.type === "free" ? "SELECT" : "BUY"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
