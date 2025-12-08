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
    return { token, userId, user };
  } catch {
    return {};
  }
}

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
  const [loading, setLoading] = useState(false);

  const clickEffect = (id) => {
    setClickedButton(id);
    setTimeout(() => setClickedButton(null), 150);
  };

  const { token, userId } = getAuth();

  useEffect(() => {
    loadSubscription();
    // eslint-disable-next-line
  }, [userId]);

  const getHeaders = () => {
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  async function fetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json, status: res.status };
  }

  function computeEndDate(startIso, cycle) {
    // startIso: ISO string; cycle: "monthly" | "annually"
    try {
      const start = startIso ? new Date(startIso) : new Date();
      if (!start || isNaN(start.getTime())) return null;
      const d = new Date(start.getTime());
      if (cycle === "monthly") {
        d.setMonth(d.getMonth() + 1);
      } else if (cycle === "annually") {
        d.setFullYear(d.getFullYear() + 1);
      } else {
        return null;
      }
      return d.toISOString();
    } catch {
      return null;
    }
  }

  function isExpired(endIso) {
    if (!endIso) return false; // treat missing end as non-expiring (free)
    const now = Date.now();
    const end = new Date(endIso).getTime();
    if (isNaN(end)) return false;
    return end <= now;
  }

  function formatDateIsoToLocal(dateIso) {
    try {
      if (!dateIso) return null;
      const d = new Date(dateIso);
      if (isNaN(d.getTime())) return dateIso;
      return d.toLocaleDateString();
    } catch {
      return dateIso;
    }
  }

  async function loadSubscription() {
    setLoading(true);
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      const headers = getHeaders();
      const res = await fetchJson(`${BASE_URL}/api/subscription/${userId}`, { headers });
      if (res.ok && res.json?.data) {
        const data = res.json.data;
        applyServerSubscription(data);
        return;
      }
      // not found — keep defaults
      setSubscription((s) => ({ ...s }));
    } catch (err) {
      console.warn("Failed loading subscription:", err);
    } finally {
      setLoading(false);
    }
  }

  function applyServerSubscription(data) {
    // data expected: { userId, plan, status, startDate, endDate, autoRenew, metadata, ... }
    const serverPlan = (data?.plan || "Free").toLowerCase();

    // find startIso from server fields or metadata
    const startIso = data?.startDate || data?.metadata?.startDate || null;
    // billing cycle preference: metadata.billingCycle or current UI billingCycle
    const serverBillingCycle = data?.metadata?.billingCycle || billingCycle;
    // prefer explicit server endDate / metadata.endDate, otherwise compute from startIso + cycle
    const explicitEnd = data?.endDate || data?.metadata?.endDate || null;
    const computedEnd = startIso ? computeEndDate(startIso, serverBillingCycle) : null;
    const endIso = explicitEnd || computedEnd || null;

    const expired = endIso ? isExpired(endIso) : false;
    const requestedPlanId = data?.metadata?.requestedPlanId || null;

    if (expired) {
      // treat as free if expired
      setCurrentPlan("free");
      setSubscription({
        plan: "Free",
        startDate: startIso ? formatDateIsoToLocal(startIso) : data?.startDate || "Today",
        expirationDate: "Expired",
        status: data?.status || "expired",
        autoRenew: false,
      });
      return;
    }

    // Determine UI label: show 'Teacher' if metadata asked for teacher, else if server says premium => premium
    let uiPlanId = "free";
    if (requestedPlanId === "teacher") uiPlanId = "teacher";
    else if (serverPlan.includes("premium")) uiPlanId = "premium";
    else uiPlanId = "free";

    setCurrentPlan(uiPlanId);

    setSubscription({
      plan:
        requestedPlanId === "teacher"
          ? "Teacher"
          : data?.plan || (uiPlanId === "premium" ? "Premium" : "Free"),
      startDate: startIso ? formatDateIsoToLocal(startIso) : (data?.startDate ? formatDateIsoToLocal(data.startDate) : "Today"),
      expirationDate: endIso ? formatDateIsoToLocal(endIso) : (uiPlanId === "free" ? "Unlimited" : "Next Billing"),
      status: data?.status || "active",
      autoRenew: !!(data?.autoRenew || data?.metadata?.autoRenew),
    });
  }

  async function createSubscription(planId) {
    if (!userId) return alert("You must be logged in to subscribe.");
    // Prevent downgrading to free if active paid subscription exists
    if (planId === "free" && currentPlan !== "free") {
      const endIso = subscription?.expirationDate && subscription.expirationDate !== "Unlimited" && subscription.expirationDate !== "Expired"
        ? subscription.expirationDate
        : null;
      if (endIso && !isExpired(new Date(endIso).toISOString())) {
        return alert("You cannot switch to Free until your current paid subscription expires.");
      }
    }

    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      let endIso = null;
      if (planId === "free") {
        endIso = null; // unlimited
      } else {
        // paid plan: compute expiration based on billingCycle
        endIso = computeEndDate(nowIso, billingCycle);
      }

      // backend expects plan 'Free' or 'Premium' — map teacher -> Premium
      const planName = planId === "free" ? "Free" : "Premium";

      // metadata to pass to backend so it can set start/end
      const metadata = {
        startDate: nowIso,
        endDate: endIso,
        autoRenew: planId !== "free",
        billingCycle: billingCycle,
        requestedPlanId: planId,
      };

      const headers = getHeaders();
      const body = { plan: planName, metadata };

      const res = await fetchJson(`${BASE_URL}/api/subscription`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok && res.json?.success) {
        // backend returns created record; use server data but prefer showing teacher label when selected
        const rec = res.json.data || res.json;
        if (planId === "teacher") {
          setCurrentPlan("teacher");
          setSubscription({
            plan: "Teacher",
            startDate: formatDateIsoToLocal(metadata.startDate),
            expirationDate: metadata.endDate ? formatDateIsoToLocal(metadata.endDate) : "Unlimited",
            status: rec?.status || "pending",
            autoRenew: !!metadata.autoRenew,
          });
        } else {
          applyServerSubscription(rec);
        }
        alert(planId === "free" ? "Subscribed to free plan" : "Subscription created");
        return rec;
      } else {
        alert(res.json?.message || `Failed to create subscription (status ${res.status})`);
        return null;
      }
    } catch (err) {
      console.error("createSubscription error:", err);
      alert("Network error while creating subscription");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function patchSubscription(patch) {
    if (!userId) return alert("You must be logged in.");
    setLoading(true);
    try {
      const headers = getHeaders();
      const res = await fetchJson(`${BASE_URL}/api/subscription/${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patch),
      });
      if (res.ok && res.json?.success) {
        const rec = res.json.data || res.json;
        applyServerSubscription(rec);
        return rec;
      } else {
        alert(res.json?.message || `Failed to update subscription (status ${res.status})`);
        return null;
      }
    } catch (err) {
      console.error("patchSubscription error:", err);
      alert("Network error while updating subscription");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function deleteSubscription() {
    if (!userId) return alert("You must be logged in.");
    setLoading(true);
    try {
      const headers = getHeaders();
      const res = await fetchJson(`${BASE_URL}/api/subscription/${userId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok && res.json?.success) {
        setSubscription({
          plan: "Free Plan",
          startDate: "Today",
          expirationDate: "Unlimited",
          status: "cancelled",
          autoRenew: false,
        });
        setCurrentPlan("free");
        alert("Subscription cancelled");
        return res.json.data || res.json;
      } else {
        alert(res.json?.message || `Failed to cancel subscription (status ${res.status})`);
        return null;
      }
    } catch (err) {
      console.error("deleteSubscription error:", err);
      alert("Network error while cancelling subscription");
      return null;
    } finally {
      setLoading(false);
    }
  }

  const handleBuy = async (planId) => {
    clickEffect(planId);
    if (!token) return alert("Please log in to subscribe.");
    await createSubscription(planId);
  };

  const handleSelectPlan = async (planId) => {
    clickEffect(planId);

    // If user has active paid subscription and it's not expired, disallow switching to free
    if (planId === "free" && currentPlan !== "free") {
      const endIso = subscription?.expirationDate && subscription.expirationDate !== "Unlimited" && subscription.expirationDate !== "Expired"
        ? new Date(subscription.expirationDate).toISOString()
        : null;
      if (endIso && !isExpired(endIso)) {
        return alert("You cannot switch to Free until your current paid subscription expires.");
      }
    }

    // If not logged in: local selection only
    if (!token) {
      setCurrentPlan(planId);
      const selected = basePlans.find((p) => p.id === planId);
      setSubscription({
        plan: `${selected.name} - ${billingCycle}`,
        startDate: "Today",
        expirationDate: selected.type === "free" ? "Unlimited" : (billingCycle === "monthly" ? formatDateIsoToLocal(new Date(Date.now() + 30*24*60*60*1000).toISOString()) : formatDateIsoToLocal(new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString())),
        status: "local",
        autoRenew: selected.type !== "free",
      });
      return;
    }

    // Authenticated: create or update backend
    if (planId === "free") {
      const rec = await createSubscription("free");
      if (rec) {
        setCurrentPlan("free");
      }
      return;
    }

    // paid plans: create subscription with computed expiration
    await createSubscription(planId);
  };

  const handleRenew = async () => {
    clickEffect("renew");
    if (!token) return alert("You must be logged in to renew.");
    // Renew: set startDate now and endDate based on billingCycle, set status active
    const nowIso = new Date().toISOString();
    const endIso = computeEndDate(nowIso, billingCycle);
    const patch = { startDate: nowIso, endDate: endIso, status: "active", autoRenew: true };
    const rec = await patchSubscription(patch);
    if (rec) alert("Subscription renewed (status set to active).");
  };

  const handleCancel = async () => {
    clickEffect("cancel");
    if (!token) return alert("You must be logged in to cancel.");
    await deleteSubscription();
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