import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import NeonBackground from "../components/NeonBackground";
import { formatWeekDate } from "../utils/schedule";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const RESOURCE_DOCK = [
  {
    name: "IndiaBix",
    subtitle: "Classic Practice",
    bestFor: "Best for: Speed drilling fundamentals",
    url: "https://www.indiabix.com/aptitude/questions-and-answers/",
    style: "border-yellow-300 bg-yellow-50",
  },
  {
    name: "GeeksforGeeks",
    subtitle: "Concept Deep Dive",
    bestFor: "Best for: Topic-wise concept understanding",
    url: "https://www.geeksforgeeks.org/aptitude-for-placements/",
    style: "border-emerald-300 bg-emerald-50",
  },
  {
    name: "PrepInsta",
    subtitle: "Company Specific",
    bestFor: "Best for: Placement pattern practice",
    url: "https://prepinsta.com/aptitude/",
    style: "border-sky-300 bg-sky-50",
  },
  {
    name: "Unstop",
    subtitle: "Contest Mode",
    bestFor: "Best for: Timed challenge environment",
    url: "https://unstop.com/practice",
    style: "border-orange-300 bg-orange-50",
  },
];

function StudentDashboard() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const testOverviewRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const userName = user?.name || "Student";

  const [summary, setSummary] = useState({
    currentWeek: 0,
    scheduledWeek: 0,
    schedule: null,
    bestScore: 0,
    attempts: 0,
    averageScore: 0,
    completionRate: 0,
  });
  const [attemptedCurrent, setAttemptedCurrent] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [showReadyCheck, setShowReadyCheck] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        if (!token) throw new Error("Missing token");
        const res = await fetch(`${API_BASE}/api/student/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load summary");
        const data = await res.json();
        if (isMounted) setSummary(data);
      } catch (_err) {
        if (isMounted) {
          setSummary({
            currentWeek: 0,
            scheduledWeek: 0,
            schedule: null,
            bestScore: 0,
            attempts: 0,
            averageScore: 0,
            completionRate: 0,
          });
        }
      }
    };

    loadSummary();
    const interval = setInterval(loadSummary, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadTopPerformers = async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/student/top-performers?limit=5&latestOnly=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load top performers");
        const data = await res.json();
        if (isMounted) setTopPerformers(Array.isArray(data) ? data : []);
      } catch (_err) {
        if (isMounted) setTopPerformers([]);
      }
    };

    loadTopPerformers();
    const interval = setInterval(loadTopPerformers, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadReminder = async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/student/reminders/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load reminder");
        const data = await res.json();
        const reminder = data?.reminder || null;
        if (!reminder || !isMounted) return;

        const seenKey = `seen-reminder:${user?.email || "student"}:${reminder._id}`;
        const seen = localStorage.getItem(seenKey) === "1";
        if (!seen) setActiveReminder(reminder);
      } catch (_err) {
        // Silent fail: no reminder popup on network issues.
      }
    };

    loadReminder();
    const interval = setInterval(loadReminder, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, user?.email]);

  useEffect(() => {
    let isMounted = true;

    const loadAttempts = async () => {
      try {
        if (!token) throw new Error("Missing token");
        const res = await fetch(`${API_BASE}/api/student/attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load attempts");
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setAttemptHistory(data);
        }
      } catch (_err) {
        if (isMounted) setAttemptHistory([]);
      }
    };

    loadAttempts();
    const interval = setInterval(loadAttempts, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const checkAttempt = async () => {
      try {
        if (!summary.currentWeek || !token) return;
        setCheckingAttempt(true);
        const res = await fetch(`${API_BASE}/api/student/attempted?week=${summary.currentWeek}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to check attempt");
        const data = await res.json();
        if (isMounted) setAttemptedCurrent(Boolean(data.attempted));
      } catch (_err) {
        if (isMounted) setAttemptedCurrent(false);
      } finally {
        if (isMounted) setCheckingAttempt(false);
      }
    };

    checkAttempt();
    return () => {
      isMounted = false;
    };
  }, [summary.currentWeek, token]);

  useGSAP(
    () => {
      gsap.from(".student-animate", {
        opacity: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleStartTestIntent = () => {
    if (checkingAttempt || !summary.currentWeek || attemptedCurrent) return;
    setShowReadyCheck(true);
  };

  const latestCurrentWeekAttempt = useMemo(
    () => attemptHistory.find((row) => Number(row.week) === Number(summary.currentWeek)),
    [attemptHistory, summary.currentWeek]
  );

  const isWindowOpen = Boolean(summary.schedule?.isWindowOpen);
  const windowStatus = summary.schedule?.windowStatus || "not_started";
  const activeWeek = Number(summary.schedule?.activeWeek || summary.currentWeek || 0);
  const scheduledWeek = Number(summary.schedule?.scheduledWeek || 0);
  const nextWeek = Number(summary.schedule?.upcomingWeek || (summary.currentWeek ? summary.currentWeek + 1 : 1));
  const cardWeek = isWindowOpen ? activeWeek : nextWeek;
  const cardDate = formatWeekDate(
    summary.schedule?.week1StartDate,
    cardWeek,
    summary.schedule?.testDayOfWeek
  );
  const windowStartTime = summary.schedule?.windowStartTime || "7:00 AM";
  const windowEndTime = summary.schedule?.windowEndTime || "11:59 PM";
  const windowStartDayLabel = summary.schedule?.testDayLabel || "Saturday";
  const windowEndDayLabel =
    summary.schedule?.windowEndDayLabel || summary.schedule?.testDayLabel || "Saturday";
  const daysUntilStart = Number(summary.schedule?.daysUntilStart || 0);

  const statusText = useMemo(() => {
    if (isWindowOpen && summary.currentWeek) {
      if (attemptedCurrent) return `STATUS: WEEK ${summary.currentWeek} COMPLETED`;
      return `STATUS: WEEK ${summary.currentWeek} AVAILABLE NOW`;
    }
    if (windowStatus === "closed" && scheduledWeek > 0) {
      return `STATUS: WEEK ${scheduledWeek} TEST CLOSED`;
    }
    if (windowStatus === "pre_window" && scheduledWeek > 0) {
      return `STATUS: WEEK ${scheduledWeek} OPENS AT ${windowStartTime}`;
    }
    return "STATUS: NO ACTIVE TEST YET";
  }, [attemptedCurrent, isWindowOpen, scheduledWeek, summary.currentWeek, windowStartTime, windowStatus]);

  const daysLabel =
    windowStatus === "pre_window"
      ? "Starts today"
      : daysUntilStart === 1
        ? "1 day left"
        : `${daysUntilStart} days left`;
  const completionPercent = Math.min(100, Math.max(0, Number(summary.completionRate || 0)));

  const latestTopWeek = useMemo(() => {
    if (!topPerformers.length) return null;
    return Math.max(...topPerformers.map((row) => Number(row.week) || 0));
  }, [topPerformers]);

  const visibleTopPerformers = useMemo(() => {
    if (!latestTopWeek) return [];
    return topPerformers
      .filter((row) => Number(row.week) === latestTopWeek)
      .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0));
  }, [topPerformers, latestTopWeek]);

  const statusTone =
    attemptedCurrent
      ? "completed"
      : isWindowOpen && summary.currentWeek
        ? "live"
        : windowStatus === "pre_window" && scheduledWeek > 0
          ? "upcoming"
          : windowStatus === "closed" && scheduledWeek > 0
            ? "closed"
            : "idle";

  const statusConfig = {
    live: {
      label: "Available",
      headline: `Week ${summary.currentWeek} is live now`,
      helper: "Start the test to secure your rank.",
      container: "border-l-4 border-green-500 bg-green-50",
      badge: "bg-green-200 text-green-800",
      labelText: "text-green-700",
      titleText: "text-green-900",
    },
    upcoming: {
      label: "Upcoming",
      headline: `Week ${scheduledWeek} opens at ${windowStartTime}`,
      helper: "Prepare now to hit a top score.",
      container: "border-l-4 border-yellow-500 bg-yellow-50",
      badge: "bg-yellow-200 text-yellow-800",
      labelText: "text-yellow-700",
      titleText: "text-yellow-900",
    },
    closed: {
      label: "Closed",
      headline: `Week ${scheduledWeek} test closed`,
      helper: "Review past questions while you wait for the next window.",
      container: "border-l-4 border-red-500 bg-red-50",
      badge: "bg-red-200 text-red-800",
      labelText: "text-red-700",
      titleText: "text-red-900",
    },
    completed: {
      label: "Completed",
      headline: `Week ${summary.currentWeek} completed`,
      helper: "Nice work. Review solutions and aim higher next week.",
      container: "border-l-4 border-blue-500 bg-blue-50",
      badge: "bg-blue-200 text-blue-800",
      labelText: "text-blue-700",
      titleText: "text-blue-900",
    },
    idle: {
      label: "Not started",
      headline: "No active test yet",
      helper: "Stay ready. The next test will be announced soon.",
      container: "border-l-4 border-slate-300 bg-slate-50",
      badge: "bg-slate-200 text-slate-700",
      labelText: "text-slate-600",
      titleText: "text-slate-900",
    },
  };

  const currentStatus = statusConfig[statusTone];
  const primaryActionLabel =
    isWindowOpen && summary.currentWeek && !attemptedCurrent ? "Start Test" : "Prepare Now";
  const primaryActionHandler =
    isWindowOpen && summary.currentWeek && !attemptedCurrent
      ? handleStartTestIntent
      : () => openResource("https://www.geeksforgeeks.org/aptitude-for-placements/");
  const primaryActionDisabled =
    isWindowOpen && summary.currentWeek
      ? checkingAttempt || attemptedCurrent
      : false;

  const openResource = (url) => window.open(url, "_blank", "noopener,noreferrer");

  const handleCloseReminder = () => {
    if (activeReminder?._id) {
      const seenKey = `seen-reminder:${user?.email || "student"}:${activeReminder._id}`;
      localStorage.setItem(seenKey, "1");
    }
    setActiveReminder(null);
  };

  const reminderWeek = Number(activeReminder?.week || 0);
  const reminderDateLabel =
    reminderWeek > 0
      ? formatWeekDate(
          summary.schedule?.week1StartDate,
          reminderWeek,
          summary.schedule?.testDayOfWeek
        )
      : "-";
  const reminderWindowLabel =
    windowStartDayLabel === windowEndDayLabel
      ? `${windowStartTime} - ${windowEndTime}`
      : `${windowStartTime} - ${windowEndDayLabel} ${windowEndTime}`;
  const reminderAttempted =
    reminderWeek > 0 &&
    attemptHistory.some((row) => Number(row.week) === reminderWeek);
  const reminderUsesSchedule =
    Boolean(summary.schedule?.week1StartDate) && reminderDateLabel !== "-";
  const reminderPrimaryLabel =
    isWindowOpen && reminderWeek === Number(summary.currentWeek) && !attemptedCurrent
      ? "Go to Test"
      : "Go to Test Dashboard";

  const handleReminderPrimaryAction = () => {
    if (isWindowOpen && reminderWeek === Number(summary.currentWeek) && !attemptedCurrent) {
      handleStartTestIntent();
      return;
    }
    testOverviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div ref={containerRef} className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          {activeReminder && (
            <div className="student-animate mb-4 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-100 p-[1px] shadow-lg">
              <div className="flex flex-col gap-4 rounded-[15px] bg-black px-4 py-4 text-white md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
                      Reminder
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                      Week {activeReminder.week || summary.currentWeek || "-"}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {reminderWeek ? `Week ${reminderWeek} Test Window` : activeReminder.title}
                  </p>
                  {reminderUsesSchedule ? (
                    <div className="mt-3 space-y-2 text-sm text-white/75">
                      <p>
                        <span className="font-semibold text-white">Date:</span> {reminderDateLabel}
                      </p>
                      <p>
                        <span className="font-semibold text-white">Test Window:</span> {reminderWindowLabel}
                      </p>
                      <p>
                        You can attempt the <span className="font-semibold text-white">20-question aptitude test</span> once within this window.
                      </p>
                      <p>
                        <span className="font-semibold text-white">Status:</span> {reminderAttempted ? "Attempted" : "Not Attempted"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 max-w-3xl text-sm text-white/75">{activeReminder.message}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleReminderPrimaryAction}
                    className="rounded-md bg-yellow-400 px-4 py-2 text-xs font-semibold text-black shadow hover:bg-yellow-300"
                  >
                    {reminderPrimaryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseReminder}
                    className="rounded-md border border-white/15 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="student-animate flex flex-col gap-4 rounded-2xl bg-black px-4 py-4 text-white shadow-lg sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/oscode-logo.png"
                alt="OSCODE AGMRCET logo"
                className="h-12 w-12 rounded-full border border-yellow-400/40 bg-black object-cover"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-yellow-300">Student Console</p>
                <h1 className="text-2xl font-semibold sm:text-3xl">Hey {userName}</h1>
                <p className="text-sm text-white/70">Your weekly test status and next steps.</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-yellow-400 px-5 py-2 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
            >
              Logout
            </button>
          </div>

          <div ref={testOverviewRef} className="student-animate mt-6 rounded-2xl bg-white p-6 shadow-lg">
            <div className={`rounded-xl p-5 ${currentStatus.container}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${currentStatus.labelText}`}>
                    {currentStatus.label}
                  </p>
                  <h2 className={`mt-1 text-lg font-semibold ${currentStatus.titleText}`}>
                    {currentStatus.headline}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{currentStatus.helper}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentStatus.badge}`}>
                  {currentStatus.label}
                </span>
              </div>
            </div>
            {attemptedCurrent && latestCurrentWeekAttempt ? (
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>
                  Score: {latestCurrentWeekAttempt.score}/{latestCurrentWeekAttempt.totalQuestions} ({
                    latestCurrentWeekAttempt.totalQuestions > 0
                      ? Math.round((latestCurrentWeekAttempt.score / latestCurrentWeekAttempt.totalQuestions) * 100)
                      : 0
                  }
                  %)
                </p>
                <p>Attempted: {new Date(latestCurrentWeekAttempt.createdAt).toLocaleString()}</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  Next Test: Week {cardWeek}
                </p>
                <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-600">
                  {windowStartDayLabel} to {windowEndDayLabel}
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="text-sm font-semibold text-slate-900">{cardDate}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-500">Test Window</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {windowStartTime} - {windowEndTime}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-red-600">
                Attempt allowed only during this time.
              </p>
              {!isWindowOpen && (
                <p className="mt-2 text-xs text-slate-600">{daysLabel} {"\u2022"} Prepare now</p>
              )}
              {isWindowOpen && (
                <p className="mt-2 text-xs text-slate-600">20 questions {"\u2022"} 30 minutes {"\u2022"} 1 attempt</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={primaryActionHandler}
                disabled={primaryActionDisabled || (!summary.currentWeek && isWindowOpen)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {primaryActionLabel}
              </button>
              <button
                type="button"
                onClick={() => openResource("https://www.indiabix.com/aptitude/questions-and-answers/")}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Practice Questions
              </button>
              <button
                type="button"
                onClick={() => navigate("/question-history")}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Review Past Questions
              </button>
            </div>

            {showReadyCheck && (
              <div className="mt-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Ready Check</p>
                <p className="mt-1 text-sm text-slate-700">
                  Week {summary.currentWeek} test is scheduled for{" "}
                  {formatWeekDate(
                    summary.schedule?.week1StartDate,
                    summary.currentWeek,
                    summary.schedule?.testDayOfWeek
                  )}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openResource("https://www.geeksforgeeks.org/aptitude-for-placements/")}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Quick Review (10 min)
                  </button>
                <button
                  type="button"
                  onClick={() => navigate(`/test?week=${summary.currentWeek || 0}`)}
                  className="rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black"
                >
                  Start Test
                </button>
                  <button
                    type="button"
                    onClick={() => setShowReadyCheck(false)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="student-animate mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Top Performers {latestTopWeek ? `(Week ${latestTopWeek})` : ""}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {latestTopWeek
                    ? `Top performers from Week ${latestTopWeek}.`
                    : "Top performers from the latest test."}
                </p>
              </div>
              <span className="rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                Auto-updates every 20s
              </span>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
              </table>

              {visibleTopPerformers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-slate-600">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Leaderboard</div>
                  <p className="text-base font-semibold text-slate-900">No attempts yet</p>
                  <p className="text-sm text-slate-600">
                    Be the first to take the test and secure Rank #1 on the leaderboard.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartTestIntent}
                    disabled={checkingAttempt || !summary.currentWeek || attemptedCurrent}
                    className="mt-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Take Test
                  </button>
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <tbody>
                    {visibleTopPerformers.map((row) => {
                      const rank = Number(row.rank || 0);
                      const highlight =
                        rank === 1
                          ? "bg-yellow-50"
                          : rank === 2
                            ? "bg-slate-50"
                            : rank === 3
                              ? "bg-orange-50"
                              : "bg-white";
                      const badge =
                        rank === 1
                          ? "bg-yellow-400 text-black"
                          : rank === 2
                            ? "bg-slate-400 text-white"
                            : rank === 3
                              ? "bg-orange-400 text-white"
                              : "bg-slate-200 text-slate-700";
                      const dateLabel = row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "-";
                      return (
                        <tr key={`${row.week}-${row.rank}`} className={`border-t border-slate-200 ${highlight}`}>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${badge}`}
                            >
                              #{rank || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {row.studentName || "Unknown"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.score}</td>
                          <td className="px-4 py-3 text-slate-600">{dateLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="student-animate mt-8 rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Quick Practice</h3>
            <p className="text-sm text-slate-600">Use these resources while waiting for the next test.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {RESOURCE_DOCK.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => openResource(item.url)}
                  className={`rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-[2px] hover:shadow-md ${item.style}`}
                >
                  <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{item.subtitle}</p>
                  <p className="mt-2 text-xs text-slate-600">{item.bestFor}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="student-animate mt-8 rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Your Journey ({attemptHistory.length} attempts)</h3>
            {attemptHistory.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No attempts yet. Start your first weekly test.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {attemptHistory.slice(0, 6).map((row) => {
                  const percentage =
                    row.totalQuestions > 0 ? Math.round((row.score / row.totalQuestions) * 100) : 0;
                  return (
                    <div key={row._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          Week {row.week}: {percentage}%
                        </p>
                        <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => navigate("/question-history")}
                  className="mt-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View all results
                </button>
              </div>
            )}

            {attemptHistory.length > 0 && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">Test rules</summary>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                    <li>Timed test begins as soon as you start.</li>
                    <li>Each question carries one mark. No negative marking.</li>
                    <li>Do not refresh the page during the test.</li>
                    <li>You can submit before time ends.</li>
                    <li>Answers cannot be changed after submission.</li>
                  </ol>
                </details>
              </div>
            )}
          </div>

          <div className="student-animate mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-lg">
              <p className="text-sm font-semibold text-slate-600">Best Score</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.bestScore || 0}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-lg">
              <p className="text-sm font-semibold text-slate-600">Average Score</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.averageScore || 0}%</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-lg">
              <p className="text-sm font-semibold text-slate-600">Program Progress</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{completionPercent}%</p>
            </div>
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default StudentDashboard;



