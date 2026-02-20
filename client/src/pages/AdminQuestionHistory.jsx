import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NeonBackground from "../components/NeonBackground";
import { formatWeekDate } from "../utils/schedule";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const detectTopic = (text = "") => {
  const value = text.toLowerCase();
  if (value.includes("percent") || value.includes("%")) return "Percentage";
  if (value.includes("train") || value.includes("speed") || value.includes("distance")) return "Time-Speed-Distance";
  if (value.includes("profit") || value.includes("loss")) return "Profit and Loss";
  return "Aptitude";
};

const extractVideoLink = (text = "") => {
  const match = text.match(/https?:\/\/\S+/i);
  return match ? match[0] : "";
};

const cleanExplanation = (text = "") =>
  text.replace(/Video Explanation:\s*https?:\/\/\S+/gi, "").trim();

const splitExplanationLines = (text = "") =>
  String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const optionLetter = (index) => String.fromCharCode(65 + index);

function AdminQuestionHistory() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [weekFilter, setWeekFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [expandedId, setExpandedId] = useState("");

  const loadRows = async (filter = "") => {
    try {
      setLoading(true);
      setError("");
      const query = filter && Number(filter) > 0 ? `?week=${Number(filter)}` : "";
      const [questionsRes, scheduleRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/questions${query}`),
        fetch(`${API_BASE}/api/schedule`),
      ]);
      const questionsData = await questionsRes.json();
      if (!questionsRes.ok) throw new Error(questionsData.error || "Failed to load question history");
      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setSchedule(scheduleData);
      }
      setRows(Array.isArray(questionsData) ? questionsData : []);
    } catch (err) {
      setRows([]);
      setError(err.message || "Unable to load question history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold">Question Bank</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Manage and review questions with clean preview cards.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={weekFilter}
                  onChange={(e) => setWeekFilter(e.target.value)}
                  placeholder="Filter by week"
                  className="w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-yellow-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => loadRows(weekFilter)}
                  className="rounded-md bg-yellow-400 px-3 py-2 text-xs font-semibold text-black"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeekFilter("");
                    loadRows("");
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {loading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Loading question history...
                </div>
              )}

              {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!loading && !error && rows.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No questions found.
                </div>
              )}

              {!loading &&
                !error &&
                rows.map((row) => {
                  const topic = detectTopic(row.question);
                  const videoLink = extractVideoLink(row.explanation || "");
                  const explanation = cleanExplanation(row.explanation || "");
                  const explanationLines = splitExplanationLines(explanation);
                  const answerIndex = Number(row.correctAnswer);
                  const isExpanded = expandedId === row._id;

                  return (
                    <div key={row._id} className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-yellow-300">
                          Week {row.week}
                        </span>
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black">
                          Q{row.questionNumber || 1}
                        </span>
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatWeekDate(
                            schedule?.week1StartDate,
                            row.week,
                            schedule?.testDayOfWeek
                          )}
                        </span>
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          Added: {new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-800">{topic}</p>

                      <div className="mt-3 rounded-xl border border-amber-300 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Q{row.questionNumber || 1}. {row.question}
                        </p>

                        {Array.isArray(row.options) && row.options.length > 0 && (
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {row.options.map((option, index) => (
                              <div
                                key={`${row._id}-opt-${index}`}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                                  index === answerIndex
                                    ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                    : "border-slate-300 bg-slate-100 text-slate-700"
                                }`}
                              >
                                {optionLetter(index)}. {option}
                              </div>
                            ))}
                          </div>
                        )}

                        {Number.isFinite(answerIndex) && answerIndex >= 0 && (
                          <p className="mt-3 text-sm font-semibold text-slate-800">
                            Answer: Option {answerIndex + 1}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId((prev) => (prev === row._id ? "" : row._id))
                          }
                          className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {isExpanded ? "Hide details" : "View question"}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Explanation
                            </p>
                            {explanationLines.length > 0 ? (
                              <div className="mt-1 space-y-1 text-sm leading-relaxed text-slate-700">
                                {explanationLines.map((line, index) => (
                                  <p key={`${row._id}-exp-${index}`}>{line}</p>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-1 text-sm text-slate-600">No explanation provided.</p>
                            )}

                            {videoLink && (
                              <a
                                href={videoLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-block rounded-md bg-black px-3 py-2 text-xs font-semibold text-yellow-300 hover:opacity-90"
                              >
                                Watch Video Explanation
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default AdminQuestionHistory;
