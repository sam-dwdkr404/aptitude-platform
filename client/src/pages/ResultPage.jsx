import { useLocation, useNavigate } from "react-router-dom";
import NeonBackground from "../components/NeonBackground";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    score = 0,
    total = 0,
    questions = [],
    answers = {},
  } = location.state || {};

  const percentage = total ? Math.round((score / total) * 100) : 0;
  const status = percentage >= 60 ? "Good performance" : "Needs improvement";

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-6 flex max-w-md items-center gap-3 rounded-xl bg-black px-4 py-3 text-white">
              <img
                src="/src/assets/team/oscode-logo.png"
                alt="OSCODE AGMRCET logo"
                className="h-9 w-9 rounded-full border border-yellow-400/40 bg-black object-cover"
              />
              <div className="text-left">
                <p className="text-xs uppercase tracking-[0.3em] text-yellow-300">
                  OSCODE AGMRCET
                </p>
                <p className="text-xs text-white/70">
                  Weekly Aptitude Program
                </p>
              </div>
            </div>
            <div className="mx-auto mb-4 max-w-md rounded-xl bg-black px-5 py-3 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-yellow-300">
                Test Result
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Score Summary</h2>
            </div>
            <p className="text-sm text-slate-600">You scored</p>
            <div className="mt-2 text-4xl font-semibold text-black">
              {score} / {total}
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Percentage: <span className="text-slate-900">{percentage}%</span>
            </p>
            <p className="mt-4 text-sm text-slate-600">
              {status}
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="mt-8 space-y-6">
            {questions.map((q, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === q.correctAnswer;

              return (
                <div
                  key={q._id}
                  className="rounded-2xl bg-white p-6 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {index + 1}. {q.question}
                  </h3>

                  <div className="mt-4 space-y-3">
                    {q.options.map((opt, i) => {
                      let className =
                        "rounded-xl border px-4 py-3 text-sm";

                      if (i === q.correctAnswer) {
                        className += " border-emerald-400 bg-emerald-50";
                      } else if (i === userAnswer) {
                        className += " border-red-400 bg-red-50";
                      } else {
                        className += " border-slate-200 bg-white";
                      }

                      return (
                        <div key={i} className={className}>
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Explanation
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {q.explanation}
                    </p>
                  </div>

                  <p
                    className={`mt-4 text-sm font-semibold ${
                      isCorrect ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {isCorrect ? "Correct" : "Wrong"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default ResultPage;
