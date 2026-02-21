import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NeonBackground from "../components/NeonBackground";
import { formatWeekSlot, getWeekStartDateFromWeek } from "../utils/schedule";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function TestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("token");

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [week, setWeek] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSchedule = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/schedule`);
        if (!res.ok) throw new Error("Failed to fetch schedule");
        const data = await res.json();
        if (isMounted) setSchedule(data);
      } catch (err) {
        if (isMounted) setSchedule(null);
      }
    };

    loadSchedule();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const resolveWeek = async () => {
      const weekParam = Number(searchParams.get("week"));
      if (weekParam) {
        if (isMounted) setWeek(weekParam);
        return;
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/student/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load summary");
        const data = await res.json();
        if (isMounted) setWeek(data.currentWeek || 0);
      } catch (err) {
        if (isMounted) setWeek(0);
      }
    };

    resolveWeek();
    return () => {
      isMounted = false;
    };
  }, [searchParams, token]);

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      if (!week) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/questions?week=${week}&t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load questions");
        const data = await res.json();
        if (isMounted) setQuestions(data);
      } catch (err) {
        if (isMounted) setQuestions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadQuestions();
    return () => {
      isMounted = false;
    };
  }, [week]);

  useEffect(() => {
    let isMounted = true;

    const checkAttempt = async () => {
      if (!token || !week) return;
      try {
        const res = await fetch(`${API_BASE}/api/student/attempted?week=${week}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to check attempt");
        const data = await res.json();
        if (isMounted) setAttempted(Boolean(data.attempted));
      } catch (err) {
        if (isMounted) setAttempted(false);
      }
    };

    checkAttempt();
    return () => {
      isMounted = false;
    };
  }, [week, token]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOptionSelect = (index) => {
    setAnswers({ ...answers, [current]: index });
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    }
  };

  const handleSubmit = async () => {
    let score = 0;

    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        score++;
      }
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token) {
      navigate("/login");
      return;
    }

    const res = await fetch(`${API_BASE}/api/save-test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        week,
        score,
        totalQuestions: questions.length,
      }),
    });

    if (res.status === 409) {
      alert("You have already attempted this week.");
      navigate("/dashboard");
      return;
    }

    if (!res.ok) {
      let errorMessage = "Unable to submit test right now.";
      try {
        const errorPayload = await res.json();
        if (errorPayload?.error) errorMessage = errorPayload.error;
      } catch (_err) {
        // Keep default message when response body is not JSON.
      }
      alert(errorMessage);
      navigate("/dashboard");
      return;
    }

    const key = `attempts:${user.email}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const weekStart = getWeekStartDateFromWeek(
        schedule?.week1StartDate,
        week,
        schedule?.testDayOfWeek
      );
    const next = [
      {
        week,
        weekStartDate: weekStart
          ? weekStart.toLocaleDateString("en-CA")
          : null,
        weekStartDay: weekStart
          ? weekStart.toLocaleDateString("en-US", { weekday: "long" })
          : null,
        score,
        totalQuestions: questions.length,
        createdAt: new Date().toISOString(),
      },
      ...existing,
    ];
    localStorage.setItem(key, JSON.stringify(next));

    navigate("/result", {
      state: {
        score,
        total: questions.length,
        questions,
        answers,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
        <NeonBackground className="min-h-screen">
          <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
            <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Loading
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Preparing your test environment...
              </h2>
              <div className="mt-6 h-2 w-full rounded-full bg-slate-200">
                <div className="h-full w-1/2 rounded-full bg-yellow-400" />
              </div>
            </div>
          </div>
        </NeonBackground>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
        <NeonBackground className="min-h-screen">
          <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
            <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="text-2xl font-semibold">
                No active week yet
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Today is {schedule?.todayDay || "-"}, {schedule?.todayDate || "-"}. Week 1 starts on{" "}
                {formatWeekSlot(
                  schedule?.week1StartDate,
                  1,
                  schedule?.windowStartTime || "7:00 AM",
                  schedule?.testDayOfWeek
                )}.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-6 rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </NeonBackground>
      </div>
    );
  }

  if (attempted) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
        <NeonBackground className="min-h-screen">
          <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
            <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="text-2xl font-semibold">
                Week {week} already attempted
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Scheduled for{" "}
                {formatWeekSlot(
                  schedule?.week1StartDate,
                  week,
                  schedule?.windowStartTime || "7:00 AM",
                  schedule?.testDayOfWeek
                )}. You can move on to the next week when it is published.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-6 rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </NeonBackground>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
        <NeonBackground className="min-h-screen">
          <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
            <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="text-2xl font-semibold">
                No questions available for week {week}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Scheduled date:{" "}
                {formatWeekSlot(
                  schedule?.week1StartDate,
                  week,
                  schedule?.windowStartTime || "7:00 AM",
                  schedule?.testDayOfWeek
                )}. Please check back after the admin publishes questions.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-6 rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </NeonBackground>
      </div>
    );
  }

  const q = questions[current];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const weekDateLabel = formatWeekSlot(
    schedule?.week1StartDate,
    week,
    schedule?.windowStartTime || "7:00 AM",
    schedule?.testDayOfWeek
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-black px-4 py-3 text-white">
              <img
                src="/oscode-logo.png"
                alt="OSCODE AGMRCET logo"
                className="h-9 w-9 rounded-full border border-yellow-400/40 bg-black object-cover"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-yellow-300">
                  OSCODE AGMRCET
                </p>
                <p className="text-xs text-white/70">
                  Weekly Aptitude Program
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-black px-5 py-4 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-yellow-300">
                  Focus Mode
                </p>
                <h2 className="text-2xl font-semibold">
                  Week {week} · Question {current + 1} / {questions.length}
                </h2>
                <p className="text-xs text-white/70">{weekDateLabel}</p>
              </div>
              <div className="rounded-full border border-yellow-400/40 bg-black px-4 py-2 text-sm text-yellow-300">
                Time Left: {minutes}:{seconds}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">
                {q.question}
              </h3>
            </div>

            <div className="mt-6 space-y-3">
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    answers[current] === i
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-slate-200 bg-white hover:border-yellow-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      className="h-4 w-4 accent-yellow-400"
                      checked={answers[current] === i}
                      onChange={() => handleOptionSelect(i)}
                    />
                    <span>{opt}</span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Option {i + 1}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Selections auto-save locally.
              </p>
              {current < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default TestPage;



