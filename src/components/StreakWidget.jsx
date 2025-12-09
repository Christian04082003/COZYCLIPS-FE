import React, { useEffect, useRef, useState } from "react";
import { Flame, X, ChevronLeft, ChevronRight } from "lucide-react";

const widgetSize = window.innerWidth < 480 ? 44 : 52;
const storageKeyPos = "streakWidgetPosition";
const storageKeyDays = "streakActiveDays";
const BASE_URL = "https://czc-eight.vercel.app";

// Local storage helpers (keeps your existing behavior)
const loadStreaks = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKeyDays)) || {};
  } catch {
    return {};
  }
};

const saveStreaks = (data) => {
  try {
    localStorage.setItem(storageKeyDays, JSON.stringify(data));
  } catch {}
};

const getAllStreaks = async () => loadStreaks();

const getMonthStreaks = async (year, month) => {
  const all = loadStreaks();
  const result = {};
  for (const key of Object.keys(all)) {
    const d = new Date(key);
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month) result[key] = true;
  }
  return result;
};

const setActiveForDate = async (dateKey, value) => {
  const all = loadStreaks();
  all[dateKey] = value;
  saveStreaks(all);
  return all;
};

// Minimal auth helper — matches patterns used elsewhere in the frontend
function getToken() {
  try {
    const raw = localStorage.getItem("czc_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (
      parsed?.token ||
      parsed?.accessToken ||
      parsed?.idToken ||
      parsed?.data?.token ||
      parsed?.data?.accessToken ||
      parsed?.user?.token ||
      null
    );
  } catch {
    return null;
  }
}

const StreakWidget = () => {
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeDays, setActiveDays] = useState({});
  const startRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const didDragRef = useRef(false);

  const clickEffectRef = useRef(false);

  const getDateKey = (d = new Date()) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKeyPos);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPos(parsed);
        }
      }
    } catch {}

    // load local streak map immediately
    getAllStreaks().then((all) => setActiveDays(all));

    // If authenticated, fetch backend streak summary and mark corresponding days locally.
    const token = getToken();
    if (token) {
      (async () => {
        try {
          const r = await fetch(`${BASE_URL}/api/streaks`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
          if (!r.ok) return;
          const json = await r.json().catch(() => ({}));
          const s = json?.data?.streak || json?.streak || null;
          if (s && s.activeDays && typeof s.activeDays === 'object') {
            // Use the actual activeDays map from backend instead of reconstructing from currentStreak
            // This preserves all active days, including non-consecutive ones
            const items = { ...s.activeDays };
            // persist to localStorage via local helpers
            let next = await getAllStreaks();
            next = { ...next, ...items };
            try {
              localStorage.setItem(storageKeyDays, JSON.stringify(next));
            } catch {}
            setActiveDays(next);
          }
        } catch {
          // ignore backend failures — keep local state
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = getDateKey();
    // If not active yet, mark today's active. If authenticated, call backend endpoint and then update local map.
    setActiveDays((prev) => {
      if (prev[key]) {
        console.log(`[StreakWidget] Today (${key}) already in activeDays`);
        return prev;
      }

      console.log(`[StreakWidget] Marking today (${key}) as active`);
      const token = getToken();
      if (token) {
        // Call backend to record session for today (post ISO date) and update local map from returned streak
        (async () => {
          try {
            const body = { date: new Date().toISOString() };
            console.log(`[StreakWidget] POST /api/streaks/session`, body);
            const r = await fetch(`${BASE_URL}/api/streaks/session`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(body),
            });
            if (r.ok) {
              const json = await r.json().catch(() => ({}));
              console.log(`[StreakWidget] /api/streaks/session response:`, json);
              const updated = (json?.data && json.data.streak) || json?.data?.streak || json?.streak || json?.data || null;
              if (updated && updated.activeDays && typeof updated.activeDays === 'object') {
                // Use the actual activeDays map from backend instead of reconstructing from currentStreak
                // This preserves all active days, including non-consecutive ones
                const items = { ...updated.activeDays };
                console.log(`[StreakWidget] Backend activeDays keys:`, Object.keys(items));
                // merge with existing local storage map
                let next = await getAllStreaks();
                next = { ...next, ...items };
                try {
                  localStorage.setItem(storageKeyDays, JSON.stringify(next));
                } catch {}
                setActiveDays(next);
              } else {
                // backend responded but with no activeDays detail — fallback to setting today locally
                console.log(`[StreakWidget] No activeDays in response, using fallback`);
                const next = { ...(await getAllStreaks()), [key]: true };
                try {
                  localStorage.setItem(storageKeyDays, JSON.stringify(next));
                } catch {}
                setActiveDays(next);
              }
            } else {
              // backend rejected — fallback to local
              console.log(`[StreakWidget] Session endpoint failed (${r.status}), using fallback`);
              const next = { ...(await getAllStreaks()), [key]: true };
              try {
                localStorage.setItem(storageKeyDays, JSON.stringify(next));
              } catch {}
              setActiveDays(next);
            }
          } catch (err) {
            console.error(`[StreakWidget] Exception in session call:`, err);
            const next = { ...(await getAllStreaks()), [key]: true };
            try {
              localStorage.setItem(storageKeyDays, JSON.stringify(next));
            } catch {}
            setActiveDays(next);
          }
        })();
      } else {
        // unauthenticated: use local storage only
        console.log(`[StreakWidget] No auth token, using local only`);
        setActiveForDate(key, true).then((next) => setActiveDays(next));
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag handlers
  const onPointerDown = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    didDragRef.current = false;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) didDragRef.current = true;
      const nx = startRef.current.px + dx;
      const ny = startRef.current.py + dy;
      const maxX = window.innerWidth - widgetSize - 8;
      const maxY = window.innerHeight - widgetSize - 8;
      setPos({ x: Math.max(8, Math.min(nx, maxX)), y: Math.max(8, Math.min(ny, maxY)) });
    };
    const onUp = () => {
      setDragging(false);
      try {
        localStorage.setItem(storageKeyPos, JSON.stringify(pos));
      } catch {}
      // If it was a simple click (no drag), toggle calendar
      if (!didDragRef.current) setCalendarOpen((o) => !o);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, pos]);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(now.getUTCMonth());

  useEffect(() => {
    getMonthStreaks(viewYear, viewMonth).then((monthData) =>
      setActiveDays((prev) => ({ ...prev, ...monthData }))
    );
  }, [viewYear, viewMonth]);

  const year = viewYear;
  const month = viewMonth;
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isActiveDay = (dnum) => {
    const key = getDateKey(new Date(Date.UTC(year, month, dnum)));
    return !!activeDays[key];
  };

  const goPrevMonth = () => {
    const d = new Date(Date.UTC(year, month, 1));
    d.setUTCMonth(d.getUTCMonth() - 1);
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth());
  };

  const goNextMonth = () => {
    const d = new Date(Date.UTC(year, month, 1));
    d.setUTCMonth(d.getUTCMonth() + 1);
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth());
  };

  const goToday = () => {
    setViewYear(now.getUTCFullYear());
    setViewMonth(now.getUTCMonth());
  };

  const isPhone = window.innerWidth < 480;
  const isTablet = window.innerWidth < 900;

  return (
    <>
      <div
        role="button"
        aria-label="Streak widget"
        onPointerDown={onPointerDown}
        className={`fixed z-[60] cursor-grab active:cursor-grabbing select-none shadow-md rounded-full flex items-center justify-center border ${
          dragging ? "ring-2 ring-[#b0042b]/40" : ""
        }`}
        style={{
          backgroundColor: "#faf7f3",
          borderColor: "#e2ddd7",
          left: pos.x,
          top: pos.y,
          width: widgetSize,
          height: widgetSize,
        }}
      >
        <Flame size={24} className="text-orange-500" />
      </div>

      {calendarOpen && (
        <div
          className="fixed z-[59] rounded-md shadow-xl p-4 border"
          style={{
            backgroundColor: "#faf7f3",
            borderColor: "#e2ddd7",
            width: isPhone ? "100%" : isTablet ? "90%" : "20rem",
            left: isPhone ? 0 : Math.min(pos.x, window.innerWidth - 340),
            right: isPhone ? 0 : "auto",
            bottom: isPhone ? 0 : "auto",
            top: isPhone ? "auto" : Math.min(pos.y + widgetSize + 8, window.innerHeight - 340),
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <button className="p-1 rounded hover:bg-gray-200" onClick={goPrevMonth}>
              <ChevronLeft size={18} className="text-gray-700" />
            </button>

            <div className="flex items-center gap-2">
              <Flame size={18} className="text-orange-500" />
              <span className="text-sm font-semibold text-gray-800">Streak Calendar</span>
            </div>

            <button className="p-1 rounded hover:bg-gray-200" onClick={goNextMonth}>
              <ChevronRight size={18} className="text-gray-700" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-700 mb-2">
            <span>
              {new Date(year, month, 1).toLocaleString(undefined, { month: "long", year: "numeric" })}
            </span>

            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded border text-[11px] border-gray-400 hover:bg-gray-100"
                onClick={goToday}
              >
                Today
              </button>
              <button className="p-1 rounded hover:bg-gray-200" onClick={() => setCalendarOpen(false)}>
                <X size={16} className="text-gray-700" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayNames.map((n) => (
              <div key={n} className="text-[11px] font-medium text-gray-600">
                {n}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, idx) => {
              if (d === null) return <div key={`e-${idx}`} className="h-8" />;
              const active = isActiveDay(d);
              const today =
                d === now.getDate() &&
                year === now.getFullYear() &&
                month === now.getMonth();

              return (
                <div
                  key={d}
                  className={`h-10 rounded flex items-center justify-center border text-[12px] ${
                    today ? "border-[#b0042b]" : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor: "#f2eee9",
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-gray-800">{d}</span>
                    {active ? (
                      <Flame size={14} className="text-orange-500" />
                    ) : (
                      <div className="w-[10px] h-[10px] rounded-full bg-gray-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] text-gray-600 text-center">
            Active days show a flame icon.
          </p>
        </div>
      )}
    </>
  );
};

export default StreakWidget;