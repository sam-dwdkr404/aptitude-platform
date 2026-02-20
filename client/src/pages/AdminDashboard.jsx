
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import NeonBackground from "../components/NeonBackground";
import { formatWeekDate } from "../utils/schedule";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const pad2 = (value) => String(value).padStart(2, "0");

function AdminDashboard() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [activity, setActivity] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [showOldQuestions, setShowOldQuestions] = useState(false);
  const [oldQuestions, setOldQuestions] = useState([]);
  const [questionWeekFilter, setQuestionWeekFilter] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [expandedQuestionId, setExpandedQuestionId] = useState("");
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    week: 1,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });

  const [reports, setReports] = useState({
    studentAttempts: [],
    weeklyParticipation: [],
    performance: [],
    topScorers: [],
    engagement: null,
    system: null,
  });

  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    week: 1,
  });

  const [loading, setLoading] = useState(false);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    week1StartDate: "",
    testDayOfWeek: 6,
    windowStartTime: "07:00",
    windowEndTime: "23:59",
  });

  const readApiResponse = async (res, fallbackMessage) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    const text = await res.text();
    throw new Error(
      text?.trim()
        ? `${fallbackMessage}: ${text.slice(0, 120)}`
        : `${fallbackMessage}. Check API base URL and backend server.`
    );
  };

  useGSAP(
    () => {
      gsap.from(".admin-animate", {
        opacity: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  const loadAdminData = async () => {
    try {
      const [statsRes, leaderboardRes, activityRes, scheduleRes] =
        await Promise.all([
          fetch(`${API_BASE}/api/admin/stats`),
          fetch(`${API_BASE}/api/admin/leaderboard?limit=5`),
          fetch(`${API_BASE}/api/admin/activity?limit=5`),
          fetch(`${API_BASE}/api/schedule`),
        ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data);
      }

      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivity(data);
      }

      if (scheduleRes.ok) {
        const data = await scheduleRes.json();
        setSchedule(data);
      }
    } catch (err) {
      setStats({ totalAttempts: 0, averageScore: 0 });
    }
  };

  const loadReports = async () => {
    try {
      const [
        studentRes,
        weeklyRes,
        performanceRes,
        topRes,
        engagementRes,
        systemRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/api/admin/reports/student-attempts`),
        fetch(`${API_BASE}/api/admin/reports/weekly-participation`),
        fetch(`${API_BASE}/api/admin/reports/performance`),
        fetch(`${API_BASE}/api/admin/reports/top-scorers?limit=3`),
        fetch(`${API_BASE}/api/admin/reports/engagement`),
        fetch(`${API_BASE}/api/admin/reports/system`),
      ]);

      const studentAttempts = studentRes.ok ? await studentRes.json() : [];
      const weeklyParticipation = weeklyRes.ok ? await weeklyRes.json() : [];
      const performance = performanceRes.ok ? await performanceRes.json() : [];
      const topScorers = topRes.ok ? await topRes.json() : [];
      const engagement = engagementRes.ok ? await engagementRes.json() : null;
      const system = systemRes.ok ? await systemRes.json() : null;

      setReports({
        studentAttempts,
        weeklyParticipation,
        performance,
        topScorers,
        engagement,
        system,
      });
    } catch (err) {
      setReports({
        studentAttempts: [],
        weeklyParticipation: [],
        performance: [],
        topScorers: [],
        engagement: null,
        system: null,
      });
    }
  };

  const loadOldQuestions = async (weekFilter = "") => {
    try {
      setQuestionsLoading(true);
      setQuestionsError("");
      const query =
        weekFilter && Number(weekFilter) > 0 ? `?week=${Number(weekFilter)}` : "";
      const res = await fetch(`${API_BASE}/api/admin/questions${query}`);
      const data = await readApiResponse(res, "Failed to load questions");
      if (!res.ok) throw new Error(data.error || "Failed to load questions");
      setOldQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      setOldQuestions([]);
      setQuestionsError(err.message || "Unable to load old questions. Please refresh backend and try again.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const startEditQuestion = (row) => {
    setEditingQuestionId(row._id);
    const nextOptions = Array.isArray(row.options) ? [...row.options] : [];
    while (nextOptions.length < 4) nextOptions.push("");
    setEditForm({
      week: Number(row.week) || 1,
      question: row.question || "",
      options: nextOptions.slice(0, 4),
      correctAnswer: Number(row.correctAnswer) || 0,
      explanation: row.explanation || "",
    });
  };

  const cancelEditQuestion = () => {
    setEditingQuestionId("");
    setEditLoading(false);
  };

  const handleEditOptionChange = (index, value) => {
    setEditForm((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuestionId) return;
    try {
      setEditLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/questions/${editingQuestionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await readApiResponse(res, "Failed to update question");
      if (!res.ok) {
        throw new Error(data.error || "Failed to update question");
      }
      alert("Question updated successfully");
      setEditingQuestionId("");
      loadOldQuestions(questionWeekFilter);
    } catch (err) {
      alert(err.message || "Failed to update question");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const ok = window.confirm("Delete this question permanently?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });
      const data = await readApiResponse(res, "Failed to delete question");
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete question");
      }
      alert("Question deleted successfully");
      if (editingQuestionId === questionId) {
        setEditingQuestionId("");
      }
      loadOldQuestions(questionWeekFilter);
    } catch (err) {
      alert(err.message || "Failed to delete question");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isMounted) return;
      await loadAdminData();
      await loadReports();
    };

    load();
    const interval = setInterval(load, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!schedule) return;
    setForm((prev) => ({
      ...prev,
      week: schedule.hasStarted ? Math.max(1, schedule.scheduledWeek) : 1,
    }));
  }, [schedule]);

  useEffect(() => {
    if (!schedule) return;
    if (showScheduleEditor) return;
    setScheduleForm((prev) => ({
      ...prev,
      week1StartDate: schedule.week1StartDate || prev.week1StartDate || "",
      testDayOfWeek: Number.isFinite(Number(schedule.testDayOfWeek))
        ? Number(schedule.testDayOfWeek)
        : prev.testDayOfWeek,
      windowStartTime: `${pad2(schedule.windowStartHour ?? 7)}:${pad2(
        schedule.windowStartMinute ?? 0
      )}`,
      windowEndTime: `${pad2(schedule.windowEndHour ?? 23)}:${pad2(
        schedule.windowEndMinute ?? 59
      )}`,
    }));
  }, [schedule, showScheduleEditor]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleOptionChange = (index, value) => {
    const updated = [...form.options];
    updated[index] = value;
    setForm({ ...form, options: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add question");
      alert("Question added successfully");

      setForm({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
        week: 1,
      });

      loadAdminData();
      loadReports();
      if (showOldQuestions) {
        loadOldQuestions(questionWeekFilter);
      }
    } finally {
      setLoading(false);
    }
  };

  const dashboardHealth = useMemo(() => {
    const totalRegistered = reports.engagement?.totalRegisteredStudents || 0;
    const uniqueAttempted = reports.engagement?.uniqueStudentsAttempted || 0;
    const activeStudents = uniqueAttempted;
    const attemptRate =
      totalRegistered > 0
        ? Math.round((uniqueAttempted / totalRegistered) * 100)
        : 0;

    const atRiskCount = reports.studentAttempts.filter(
      (row) => Number(row.percentage) < 50
    ).length;
    const atRiskPercent =
      reports.studentAttempts.length > 0
        ? Math.round((atRiskCount / reports.studentAttempts.length) * 100)
        : 0;

    const inactiveStudents = Math.max(totalRegistered - uniqueAttempted, 0);
    const recentDelta =
      reports.weeklyParticipation.length > 0
        ? reports.weeklyParticipation[reports.weeklyParticipation.length - 1].delta
        : 0;

    const weakestWeek =
      reports.performance.length > 0
        ? [...reports.performance].sort(
            (a, b) => Number(a.averageScore) - Number(b.averageScore)
          )[0]
        : null;

    return {
      totalRegistered,
      activeStudents,
      attemptRate,
      atRiskCount,
      atRiskPercent,
      inactiveStudents,
      recentDelta,
      weakestWeek,
    };
  }, [reports]);

  const latestParticipation = useMemo(() => {
    const totalStudents = Number(reports.engagement?.totalRegisteredStudents || 0);
    const uniqueAttempted = Number(reports.engagement?.uniqueStudentsAttempted || 0);
    const totalAttempts = Number(reports.engagement?.totalAttempts || 0);
    const percent =
      totalStudents > 0 ? Math.round((uniqueAttempted / totalStudents) * 100) : 0;
    const avgAttemptsPerStudent =
      uniqueAttempted > 0 ? (totalAttempts / uniqueAttempted).toFixed(1) : "0.0";

    return {
      week: Number(schedule?.scheduledWeek || 1),
      uniqueAttempted,
      totalAttempts,
      totalStudents,
      percent: Math.min(100, Math.max(0, percent)),
      avgAttemptsPerStudent,
      missingStudents: Math.max(totalStudents - uniqueAttempted, 0),
    };
  }, [reports.engagement, schedule?.scheduledWeek]);

  const nextTestWeek = Number(schedule?.upcomingWeek || 1);
  const nextTestDate = formatWeekDate(
    schedule?.week1StartDate,
    nextTestWeek,
    schedule?.testDayOfWeek
  );
  const lastCompletedWeek = Math.max(1, Number(schedule?.scheduledWeek || 1) - 1);

  const formatRelativeTime = (value) => {
    const deltaMs = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.floor(deltaMs / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatCompactDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const detectQuestionTopic = (text = "") => {
    const value = String(text).toLowerCase();
    if (value.includes("percent") || value.includes("%")) return "Percentage";
    if (value.includes("profit") || value.includes("loss")) return "Profit and Loss";
    if (value.includes("train") || value.includes("speed") || value.includes("distance")) return "Time-Speed-Distance";
    if (value.includes("ratio")) return "Ratio and Proportion";
    return "Aptitude";
  };

  const formatWeekWithDate = (week, weekStartDate, weekStartDay) => {
    if (!week) return "-";
    const fallbackDate = formatWeekDate(
      schedule?.week1StartDate,
      week,
      schedule?.testDayOfWeek
    );
    const finalDate = weekStartDate || fallbackDate;
    const finalDay = weekStartDay || (finalDate !== "-" ? finalDate.split(",")[0] : "-");
    return `Week ${week} (${finalDay}, ${finalDate})`;
  };

  const formatShortDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const latestPerformanceWeek = useMemo(() => {
    if (!reports.performance.length) return null;
    return [...reports.performance].sort((a, b) => Number(b.week) - Number(a.week))[0];
  }, [reports.performance]);
  const latestWeeklyParticipation = useMemo(() => {
    if (!reports.weeklyParticipation.length) return null;
    return [...reports.weeklyParticipation].sort((a, b) => Number(b.week) - Number(a.week))[0];
  }, [reports.weeklyParticipation]);

  const topPerformers = useMemo(() => {
    if (!reports.topScorers.length) return [];
    const latestWeek = Math.max(...reports.topScorers.map((row) => Number(row.week) || 0));
    const rows = reports.topScorers
      .filter((row) => Number(row.week) === latestWeek)
      .sort((a, b) => Number(b.score) - Number(a.score));

    // Safety net on UI: ensure one entry per student email.
    const uniqueRows = [];
    const seenEmails = new Set();
    rows.forEach((row) => {
      const emailKey = String(row.email || "").toLowerCase();
      if (!emailKey || seenEmails.has(emailKey)) return;
      seenEmails.add(emailKey);
      uniqueRows.push(row);
    });

    let displayedRank = 0;
    let previousScore = null;
    return uniqueRows.map((row, index) => {
      const score = Number(row.score || 0);
      if (previousScore === null || score !== previousScore) {
        displayedRank = index + 1;
      }
      previousScore = score;
      const match = reports.studentAttempts.find(
        (attempt) =>
          Number(attempt.week) === Number(row.week) &&
          String(attempt.email) === String(row.email) &&
          Number(attempt.score) === Number(row.score)
      );
      return {
        ...row,
        displayedRank,
        displayName: row.studentName && row.studentName !== "Unknown" ? row.studentName : row.email,
        attemptDate: match?.attemptedAt || null,
      };
    });
  }, [reports.studentAttempts, reports.topScorers]);

  const exportFullReport = () => {
    const summaryRows = [
      ["Total Registered Students", reports.engagement?.totalRegisteredStudents ?? 0],
      ["Unique Students Attempted", reports.engagement?.uniqueStudentsAttempted ?? 0],
      ["Total Attempts", reports.engagement?.totalAttempts ?? 0],
      ["Latest Week Attempts", latestWeeklyParticipation?.totalAttempts ?? 0],
      ["Latest Week Average Score", latestPerformanceWeek ? `${latestPerformanceWeek.averageScore}%` : "-"],
    ];

    const attemptsRows = reports.studentAttempts.map((row) => [
      row.studentName && row.studentName !== "Unknown" ? row.studentName : row.email,
      row.email,
      `Week ${row.week}`,
      `${row.score}/${row.totalQuestions}`,
      `${row.percentage}%`,
      formatShortDate(row.attemptedAt),
    ]);

    const weeklyRows = reports.weeklyParticipation.map((row) => [
      `Week ${row.week}`,
      row.totalAttempts,
    ]);

    const lines = [];
    lines.push("=== SUMMARY ===");
    lines.push("Metric,Value");
    summaryRows.forEach((row) => lines.push(row.map((value) => `"${String(value)}"`).join(",")));
    lines.push("");
    lines.push("=== ATTEMPTS ===");
    lines.push("Student,Email,Week,Score,Percentage,Date");
    attemptsRows.forEach((row) => lines.push(row.map((value) => `"${String(value)}"`).join(",")));
    lines.push("");
    lines.push("=== WEEKLY ===");
    lines.push("Week,Attempts");
    weeklyRows.forEach((row) => lines.push(row.map((value) => `"${String(value)}"`).join(",")));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "oscode_full_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredQuestions = useMemo(() => {
    const term = questionSearch.trim().toLowerCase();
    if (!term) return oldQuestions;

    return oldQuestions.filter((row) => {
      const questionText = String(row.question || "").toLowerCase();
      const explanationText = String(row.explanation || "").toLowerCase();
      return questionText.includes(term) || explanationText.includes(term);
    });
  }, [oldQuestions, questionSearch]);

  const questionGroups = useMemo(() => {
    const map = new Map();
    filteredQuestions.forEach((row) => {
      const week = Number(row.week) || 0;
      if (!map.has(week)) map.set(week, []);
      map.get(week).push(row);
    });

    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([week, rows]) => ({
        week,
        rows: [...rows].sort(
          (a, b) =>
            Number(a.questionNumber || 0) - Number(b.questionNumber || 0)
        ),
      }));
  }, [filteredQuestions]);

  useEffect(() => {
    if (!expandedQuestionId) return;
    const exists = filteredQuestions.some((row) => row._id === expandedQuestionId);
    if (!exists) setExpandedQuestionId("");
  }, [expandedQuestionId, filteredQuestions]);

  const openQuestionBank = () => {
    if (!showOldQuestions) {
      loadOldQuestions(questionWeekFilter);
    }
    setShowOldQuestions(true);
    setExpandedQuestionId("");
  };

  const closeQuestionBank = () => {
    setShowOldQuestions(false);
    setQuestionSearch("");
    setExpandedQuestionId("");
  };

  const handleSendReminder = async () => {
    try {
      setReminderMessage("");
      const week = Number(schedule?.upcomingWeek || schedule?.scheduledWeek || 1);
      const res = await fetch(`${API_BASE}/api/admin/reminders/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week }),
      });
      const data = await readApiResponse(res, "Failed to send reminder");
      if (!res.ok) throw new Error(data.error || "Failed to send reminder");
      setReminderMessage(`Reminder sent for Week ${week}.`);
    } catch (err) {
      setReminderMessage(err.message || "Unable to send reminder.");
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      setScheduleSaving(true);
      setScheduleMessage("");

      const [startHour, startMinute] = String(scheduleForm.windowStartTime)
        .split(":")
        .map(Number);
      const [endHour, endMinute] = String(scheduleForm.windowEndTime)
        .split(":")
        .map(Number);

      if (!scheduleForm.week1StartDate) {
        throw new Error("Week 1 date is required");
      }
      if (
        !Number.isFinite(startHour) ||
        !Number.isFinite(startMinute) ||
        !Number.isFinite(endHour) ||
        !Number.isFinite(endMinute)
      ) {
        throw new Error("Please choose valid start and end times");
      }

      const res = await fetch(`${API_BASE}/api/admin/schedule-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week1StartDate: scheduleForm.week1StartDate,
          testDayOfWeek: Number(scheduleForm.testDayOfWeek),
          windowStartHour: startHour,
          windowStartMinute: startMinute,
          windowEndHour: endHour,
          windowEndMinute: endMinute,
        }),
      });

      const data = await readApiResponse(res, "Failed to update schedule");
      if (!res.ok) throw new Error(data.error || "Failed to update schedule");

      setSchedule(data.schedule || null);
      setScheduleMessage("Schedule updated successfully.");
      await loadAdminData();
      await loadReports();
    } catch (err) {
      setScheduleMessage(err.message || "Unable to update schedule.");
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div ref={containerRef} className="relative mx-auto max-w-6xl px-6 py-10">
          {/* Header */}
          <div className="admin-animate flex flex-col gap-4 rounded-2xl bg-black px-6 py-5 text-white shadow-lg md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/oscode-logo.png"
                alt="OSCODE AGMRCET logo"
                className="h-12 w-12 rounded-full border border-yellow-400/40 bg-black object-cover"
              />
              <div>
                <p className="text-sm font-semibold tracking-normal text-yellow-300">
                  Admin Console
                </p>
                <h1 className="text-3xl font-semibold">
                  Mission Control Dashboard
                </h1>
                <p className="text-sm text-white/70">
                  Live oversight for weekly aptitude operations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="rounded-md border border-white/30 bg-black px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                type="button"
              >
                Demo Mode
              </button>
              <button
                onClick={handleLogout}
                className="rounded-md bg-yellow-400 px-5 py-2 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Logout
              </button>
            </div>
          </div>
          {/* At A Glance */}
          <div className="admin-animate mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <p className="text-sm font-semibold tracking-normal text-slate-600">
                Active Students
              </p>
              <p className="mt-3 text-3xl font-semibold text-black">
                {dashboardHealth.activeStudents}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {dashboardHealth.recentDelta >= 0 ? "?" : "?"} {Math.abs(dashboardHealth.recentDelta)} from last weekly cycle.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <p className="text-sm font-semibold tracking-normal text-slate-600">
                Weekly Attempt Rate
              </p>
              <p className="mt-3 text-3xl font-semibold text-black">
                {dashboardHealth.attemptRate}%
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {dashboardHealth.activeStudents}/{dashboardHealth.totalRegistered} students active.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <p className="text-sm font-semibold tracking-normal text-slate-600">
                At-Risk Students
              </p>
              <p className="mt-3 text-3xl font-semibold text-black">
                {dashboardHealth.atRiskPercent}%
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {dashboardHealth.atRiskCount} low-score attempts need intervention.
              </p>
            </div>
          </div>

          <div className="admin-animate mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Requires Attention</p>
            <div className="mt-2 space-y-1">
              <p>• {dashboardHealth.inactiveStudents} students missed Week {lastCompletedWeek}.</p>
              <p>
                •{" "}
                {dashboardHealth.weakestWeek
                  ? `Week ${dashboardHealth.weakestWeek.week} performance: ${dashboardHealth.weakestWeek.averageScore}% avg`
                  : "Not enough performance data yet"}.
              </p>
              <p>
                • Next test: Week {nextTestWeek} • {nextTestDate},{" "}
                {schedule?.windowStartTime || "7:00 AM"}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSendReminder}
                className="rounded-md bg-black px-3 py-2 text-xs font-semibold text-yellow-300"
              >
                Send Reminder
              </button>
              <button
                type="button"
                onClick={() => setShowScheduleEditor((prev) => !prev)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Adjust Schedule
              </button>
            </div>
            {reminderMessage && (
              <p className="mt-2 text-xs text-slate-700">{reminderMessage}</p>
            )}

            {showScheduleEditor && (
              <form
                onSubmit={handleSaveSchedule}
                className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  Schedule Controls
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Set weekly test day and test window. Changes apply immediately.
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Week 1 Date
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.week1StartDate}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          week1StartDate: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Test Day
                    </label>
                    <select
                      value={scheduleForm.testDayOfWeek}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          testDayOfWeek: Number(e.target.value),
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    >
                      {DAY_OPTIONS.map((item) => (
                        <option key={`day-${item.value}`} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Window Start
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.windowStartTime}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          windowStartTime: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Window End
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.windowEndTime}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          windowEndTime: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-600">
                    Current window: {schedule?.testDayLabel || "Saturday"},{" "}
                    {schedule?.windowStartTime || "7:00 AM"} -{" "}
                    {schedule?.windowEndTime || "11:59 PM"}.
                  </p>
                  <button
                    type="submit"
                    disabled={scheduleSaving}
                    className="rounded-md bg-black px-4 py-2 text-xs font-semibold text-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {scheduleSaving ? "Saving..." : "Save Schedule"}
                  </button>
                </div>

                {scheduleMessage && (
                  <p className="mt-2 text-xs text-slate-700">{scheduleMessage}</p>
                )}
              </form>
            )}
          </div>

          {/* Grid */}
          <div className="admin-animate mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Weekly Participation
                </h2>
                <p className="text-sm text-slate-500">
                  Week {latestParticipation?.week || 1} • {formatShortDate(schedule?.activeWeekDate || schedule?.nextWeekDate)}
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {latestParticipation ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800">
                      Progress: {latestParticipation.uniqueAttempted} of {latestParticipation.totalStudents} students ({latestParticipation.percent}%)
                    </p>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-yellow-400"
                        style={{ width: `${latestParticipation.percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Total attempts: {latestParticipation.totalAttempts}
                    </p>
                    <p className="text-xs text-slate-600">
                      Avg per student: {latestParticipation.avgAttemptsPerStudent}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      Missing: {latestParticipation.missingStudents} students
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    No participation data yet.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-black p-6 text-white shadow-lg">
                <h2 className="text-lg font-semibold text-white">
                  Leaderboard Snapshot
                </h2>
                <p className="text-sm text-white/70">
                  Top performers from the latest attempts.
                </p>
                <div className="mt-4 space-y-3">
                  {leaderboard.length === 0 && (
                    <p className="text-sm text-white/60">No data yet.</p>
                  )}
                  {leaderboard.map((student) => (
                    <div
                      key={student.email}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {student.email}
                        </p>
                        <p className="text-xs text-white/60">
                          {formatWeekWithDate(
                            student.week,
                            student.weekStartDate,
                            student.weekStartDay
                          )}
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-yellow-300">
                        {student.bestScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-black p-6 text-white shadow-lg">
                <h2 className="text-lg font-semibold text-white">
                  Live Activity Feed
                </h2>
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  {activity.length === 0 && (
                    <p className="text-sm text-white/60">No recent activity.</p>
                  )}
                  {activity.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between">
                      <span>
                        {entry.email} submitted{" "}
                        {formatWeekWithDate(
                          entry.week,
                          entry.weekStartDate,
                          entry.weekStartDay
                        )}
                      </span>
                      <span className="text-xs text-white/50">
                        {formatRelativeTime(entry.time)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Reports */}
          <div className="admin-animate mt-8 rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Platform Overview
                </h2>
                <p className="text-sm text-slate-500">
                  Live data for placement readiness.
                </p>
              </div>
              <button
                type="button"
                onClick={exportFullReport}
                className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-black"
              >
                Export Full Report
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Last updated:{" "}
              {reports.studentAttempts[0]?.attemptedAt
                ? formatRelativeTime(reports.studentAttempts[0].attemptedAt)
                : "just now"}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">Registered Students</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {reports.engagement?.totalRegisteredStudents ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">Unique Attempted</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {reports.engagement?.uniqueStudentsAttempted ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">Total Attempts</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {reports.engagement?.totalAttempts ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                Week {latestPerformanceWeek?.week ?? "-"}:{" "}
                {latestWeeklyParticipation?.totalAttempts ?? 0} attempts • Avg score:{" "}
                {latestPerformanceWeek ? `${latestPerformanceWeek.averageScore}%` : "-"}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-base font-semibold text-slate-900">
                Top Performers {topPerformers[0]?.week ? `(Week ${topPerformers[0].week})` : ""}
              </h3>
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-4 py-2 text-left">Rank</th>
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Score</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                          No top performer data yet.
                        </td>
                      </tr>
                    )}
                    {topPerformers.map((row, idx) => (
                      <tr key={`tp-${idx}`} className="border-t border-slate-200">
                        <td className="px-4 py-2">#{row.displayedRank}</td>
                        <td className="px-4 py-2">{row.displayName}</td>
                        <td className="px-4 py-2">{row.email}</td>
                        <td className="px-4 py-2">{row.score}</td>
                        <td className="px-4 py-2">{formatShortDate(row.attemptDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Add Question */}
          <div className="admin-animate mt-8 rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Add New Question
                </h2>
                <p className="text-sm text-slate-500">
                  Push updates instantly to the weekly test pipeline.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/admin/question-bank")}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Bank ?
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-1">
                <label className="block text-sm font-semibold tracking-normal text-slate-700">
                  Week Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.week}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      week: Number(e.target.value),
                    })
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter week number"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-semibold tracking-normal text-slate-700">
                  Correct Option
                </label>
                <select
                  value={form.correctAnswer}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      correctAnswer: Number(e.target.value),
                    })
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-yellow-400 focus:outline-none"
                >
                  <option value={0}>Correct Option: 1</option>
                  <option value={1}>Correct Option: 2</option>
                  <option value={2}>Correct Option: 3</option>
                  <option value={3}>Correct Option: 4</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold tracking-normal text-slate-700">
                  Question
                </label>
                <input
                  type="text"
                  placeholder="Write the question prompt"
                  value={form.question}
                  onChange={(e) =>
                    setForm({ ...form, question: e.target.value })
                  }
                  required
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              {form.options.map((opt, i) => (
                <div key={i}>
                  <label className="block text-sm font-semibold tracking-normal text-slate-700">
                    Option {i + 1}
                  </label>
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    required
                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              ))}

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold tracking-normal text-slate-700">
                  Explanation
                </label>
                <textarea
                  placeholder="Explain the correct answer"
                  value={form.explanation}
                  onChange={(e) =>
                    setForm({ ...form, explanation: e.target.value })
                  }
                  required
                  rows={4}
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="lg:col-span-2 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Encrypted pipeline active. Changes sync instantly.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Publishing..." : "Add Question"}
                </button>
              </div>
            </form>

            {showOldQuestions && (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    Question Bank
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-600">
                      {filteredQuestions.length} question{filteredQuestions.length === 1 ? "" : "s"}
                      {questionWeekFilter ? ` • Week ${questionWeekFilter}` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={closeQuestionBank}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Back to Add Question
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={questionWeekFilter}
                      onChange={(e) => setQuestionWeekFilter(e.target.value)}
                      placeholder="All Weeks"
                      className="w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-yellow-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="Search question text"
                      className="w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-yellow-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => loadOldQuestions(questionWeekFilter)}
                      className="rounded-md bg-yellow-400 px-3 py-2 text-xs font-semibold text-black"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionWeekFilter("");
                        setQuestionSearch("");
                        loadOldQuestions("");
                      }}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {questionsError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {questionsError}
                    </div>
                  )}
                  {questionsLoading && (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      Loading questions...
                    </div>
                  )}
                  {!questionsLoading && filteredQuestions.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      No questions found.
                    </div>
                  )}

                  {!questionsLoading &&
                    questionGroups.map((group) => (
                      <div key={`week-group-${group.week}`} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Week {group.week} •{" "}
                          {formatWeekDate(
                            schedule?.week1StartDate,
                            group.week,
                            schedule?.testDayOfWeek
                          )}
                        </p>

                        <div className="mt-3 space-y-3">
                          {group.rows.map((row) => {
                            const isExpanded = expandedQuestionId === row._id;
                            const topic = detectQuestionTopic(row.question);
                            const questionNo = Number(row.questionNumber) || 1;
                            const fullQuestion = String(row.question || "");
                            const previewText = fullQuestion.slice(0, 110);
                            return (
                              <div
                                key={row._id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <p className="text-sm font-semibold text-slate-900">
                                  Q{questionNo}. {topic}
                                </p>
                                <p className="mt-1 text-sm text-slate-700">
                                  {isExpanded || fullQuestion.length <= 110
                                    ? fullQuestion
                                    : `${previewText}...`}
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedQuestionId((prev) =>
                                      prev === row._id ? "" : row._id
                                    )
                                  }
                                  className="mt-2 text-xs font-semibold text-slate-700 underline underline-offset-2"
                                >
                                  {isExpanded ? "Hide question" : "View full question"}
                                </button>

                                {isExpanded && row.explanation && (
                                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Explanation
                                    </p>
                                    <p className="mt-1 text-sm text-slate-700">{row.explanation}</p>
                                  </div>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                  <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
                                    Correct: Option {Number(row.correctAnswer) + 1}
                                  </span>
                                  <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
                                    Added: {formatCompactDate(row.createdAt)}
                                  </span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditQuestion(row)}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(row._id)}
                                    className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedQuestionId((prev) =>
                                        prev === row._id ? "" : row._id
                                      )
                                    }
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    {isExpanded ? "Preview less" : "Preview"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>

                {editingQuestionId && (
                  <form
                    onSubmit={handleUpdateQuestion}
                    className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Edit Question</h4>
                      <button
                        type="button"
                        onClick={cancelEditQuestion}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Week</label>
                        <input
                          type="number"
                          min={1}
                          value={editForm.week}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, week: Number(e.target.value) }))
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Correct Option</label>
                        <select
                          value={editForm.correctAnswer}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              correctAnswer: Number(e.target.value),
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-slate-700">Question</label>
                      <input
                        type="text"
                        value={editForm.question}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, question: e.target.value }))
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                        required
                      />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {editForm.options.map((option, index) => (
                        <div key={`edit-option-${index}`}>
                          <label className="block text-xs font-semibold text-slate-700">
                            Option {index + 1}
                          </label>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleEditOptionChange(index, e.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-slate-700">Explanation</label>
                      <textarea
                        rows={3}
                        value={editForm.explanation}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, explanation: e.target.value }))
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                        required
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={editLoading}
                        className="rounded-md bg-yellow-400 px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {editLoading ? "Updating..." : "Update Question"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="admin-animate mt-8 rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Impact Report (For HOD / Principal)</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Platform Outcomes</p>
                <p className="mt-2 text-sm text-slate-600">Students trained: {dashboardHealth.totalRegistered}</p>
                <p className="text-sm text-slate-600">Mock tests conducted: {reports.system?.totalAttemptsRecorded ?? 0}</p>
                <p className="text-sm text-slate-600">Weekly attempt rate: {dashboardHealth.attemptRate}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Readiness Signal</p>
                <p className="mt-2 text-sm text-slate-600">Average score: {stats.averageScore}%</p>
                <p className="text-sm text-slate-600">At-risk students: {dashboardHealth.atRiskPercent}%</p>
                <p className="text-sm text-slate-600">
                  Tests conducted (weeks): {reports.system?.totalTestsConducted ?? 0}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Schedule review meet
              </button>
            </div>
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default AdminDashboard;

