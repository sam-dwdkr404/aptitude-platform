import { useEffect, useState } from "react";
import Result from "./Result";
import NeonBackground from "../components/NeonBackground";

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/questions?week=1`
    )
      .then((res) => res.json())
      .then((data) => setQuestions(data));
  }, []);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const selectOption = (i) => {
    const copy = [...answers];
    copy[current] = i;
    setAnswers(copy);
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);

    let sc = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) sc++;
    });

    setScore(sc);
    setShowResult(true);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
        <NeonBackground className="min-h-screen">
          <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
            <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Loading
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Syncing test content...
              </h2>
            </div>
          </div>
        </NeonBackground>
      </div>
    );
  }

  if (showResult) {
    return <Result questions={questions} answers={answers} score={score} />;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
          <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-black px-4 py-3 text-white">
              <img
                src="/src/assets/team/oscode-logo.png"
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
                  Weekly Aptitude Quiz
                </p>
                <h2 className="text-2xl font-semibold">
                  Question {current + 1} / {questions.length}
                </h2>
              </div>
              <span className="rounded-full border border-yellow-400/40 bg-black px-4 py-2 text-sm text-yellow-300">
                {minutes}:{seconds}
              </span>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">
                {questions[current].question}
              </h3>
            </div>

            <div className="mt-6 space-y-3">
              {questions[current].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    answers[current] === i
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-slate-200 bg-white hover:border-yellow-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end">
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent(current + 1)}
                  className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default Quiz;
