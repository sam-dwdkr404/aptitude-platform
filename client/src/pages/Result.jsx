import NeonBackground from "../components/NeonBackground";

function Result({ questions, answers, score }) {
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
            <p className="mt-4 text-4xl font-semibold text-black">
              {score} / {questions.length}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
            >
              Take Another Test
            </button>
          </div>

          <div className="mt-8 space-y-6">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctAnswer;

              return (
                <div
                  key={q._id}
                  className="rounded-2xl bg-white p-6 shadow-lg"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    Q{i + 1}. {q.question}
                  </p>

                  <p className="mt-3 text-sm text-slate-700">
                    Your Answer:{" "}
                    <span
                      className={
                        isCorrect
                          ? "text-emerald-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {answers[i] !== undefined
                        ? q.options[answers[i]]
                        : "Not Attempted"}
                    </span>
                  </p>

                  {!isCorrect && (
                    <p className="mt-1 text-sm text-slate-700">
                      Correct Answer:{" "}
                      <span className="text-emerald-600 font-semibold">
                        {q.options[q.correctAnswer]}
                      </span>
                    </p>
                  )}

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Explanation
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default Result;
