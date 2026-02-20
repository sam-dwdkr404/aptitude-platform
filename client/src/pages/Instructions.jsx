import { Link } from "react-router-dom";
import NeonBackground from "../components/NeonBackground";

function Instructions() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12">
          <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
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
            <div className="flex items-center justify-between rounded-xl bg-black px-5 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-yellow-300">
                  Instructions
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Online Aptitude Test
                </h2>
              </div>
              <span className="rounded-full border border-white/30 px-4 py-2 text-xs text-white/70">
                Ready
              </span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li>Total number of questions: 10</li>
              <li>Time allotted: 10 minutes</li>
              <li>Each question carries 1 mark</li>
              <li>No negative marking</li>
              <li>Do not refresh or close the browser during the test</li>
              <li>The test will auto-submit once the time is over</li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/test"
                className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Start Test
              </Link>

              <Link
                to="/"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default Instructions;

