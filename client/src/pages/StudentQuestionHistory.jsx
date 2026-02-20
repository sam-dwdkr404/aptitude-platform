import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NeonBackground from "../components/NeonBackground";

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

function StudentQuestionHistory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        if (!token) throw new Error("Missing token");
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/student/questions-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load history");
        if (isMounted) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setError(err.message || "Unable to load question history.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold">Question History</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Questions from weeks you have already attempted.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
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
                  No question history found.
                </div>
              )}

              {!loading &&
                !error &&
                rows.map((row) => {
                  const topic = detectTopic(row.question);
                  const videoLink = extractVideoLink(row.explanation || "");
                  const explanation = cleanExplanation(row.explanation || "");
                  const answerIndex = Number(row.correctAnswer);

                  return (
                    <div key={row._id} className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-yellow-300">
                          Week {row.week}
                        </span>
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black">
                          {row.questionCode || `W${row.week}-Q${row.questionNumber || "-"}`}
                        </span>
                        <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
                          {row.questionNumber || "-"} / {row.totalQuestionsInWeek || "-"}
                        </span>
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {row.weekStartDay}, {row.weekStartDate}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-800">Exercise : {topic} - General Questions</p>
                      <p className="text-sm text-slate-700">{topic} - Formulas</p>
                      <p className="text-sm text-slate-700">{topic} - General Questions</p>

                      <div className="mt-3 rounded-xl border border-amber-300 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">{row.questionNumber || ""}. {row.question}</p>

                        {Array.isArray(row.options) && row.options.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {row.options.map((option, index) => (
                              <span
                                key={`${row._id}-opt-${index}`}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  index === answerIndex
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-slate-100 text-slate-700 border border-slate-300"
                                }`}
                              >
                                Option {index + 1}: {option}
                              </span>
                            ))}
                          </div>
                        )}

                        {Number.isFinite(answerIndex) && answerIndex >= 0 && (
                          <p className="mt-3 text-sm font-semibold text-slate-800">
                            Answer: Option {answerIndex + 1}
                          </p>
                        )}

                        <p className="mt-3 text-sm font-semibold text-slate-800">Explanation:</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                          {explanation || "No explanation provided."}
                        </p>

                        {videoLink && (
                          <a
                            href={videoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-block rounded-md bg-black px-3 py-2 text-xs font-semibold text-yellow-300 hover:opacity-90"
                          >
                            Video Explanation
                          </a>
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

export default StudentQuestionHistory;
