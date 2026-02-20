import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import NeonBackground from "../components/NeonBackground";
import { BarChart3, ShieldCheck, Trophy, ClipboardList } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function Landing() {
  const containerRef = useRef(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    activeWeeks: 0,
    testsDeployed: 0,
    averageScore: 0,
    completionRate: 0,
  });
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/stats`);
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        if (isMounted) setStats(data);
      } catch (err) {
        if (isMounted) {
          setStats({
            totalUsers: 0,
            totalTests: 0,
            activeWeeks: 0,
            testsDeployed: 0,
            averageScore: 0,
            completionRate: 0,
          });
        }
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useGSAP(
    () => {
      gsap.from(".landing-animate", {
        opacity: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div ref={containerRef} className="relative mx-auto max-w-6xl px-6 pb-16 pt-8">
          {/* NAVBAR */}
          <header className="landing-animate flex items-center justify-between rounded-2xl bg-black px-6 py-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <img
                src="/src/assets/team/oscode-logo.png"
                alt="OSCODE AGMRCET logo"
                className="h-10 w-10 rounded-full border border-yellow-400/40 bg-black object-cover"
              />
              <div>
                <h1 className="text-lg font-semibold tracking-[0.25em] text-yellow-400">
                  OSCODE
                </h1>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  AGMRCET
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => setShowDemo((prev) => !prev)}
                className="rounded-md border border-white/30 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
              >
                {showDemo ? "Close Demo" : "Demo Mode"}
              </button>
              <Link to="/login" className="text-white/80 hover:text-white">
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-yellow-400 px-5 py-2 font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Sign Up
              </Link>
            </div>
          </header>

          {showDemo && (
            <section className="landing-animate mt-6 rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900">
                Demo Mode
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Quick preview for presentations. No data is written in demo mode.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    View Dashboard
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Explore student + admin layouts.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Report Preview
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    See reporting structure and export.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Test Flow
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Walk through the test interface.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* HERO */}
          <section className="landing-animate mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Weekly Aptitude Program
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight">
                Corporate-grade aptitude testing for placement readiness.
              </h2>
              <p className="mt-4 max-w-xl text-sm text-slate-600">
                AGMRCET OSCODE delivers weekly, exam-grade aptitude simulations with reliable analytics, transparent feedback, and professional reporting.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
                >
                  Enter the Arena
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-black p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
                  Mission Snapshot
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">
                  Live
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  {
                    label: "Students onboarded",
                    value: stats.totalUsers,
                  },
                  {
                    label: "Weekly tests deployed",
                    value: stats.testsDeployed,
                  },
                  {
                    label: "Total attempts",
                    value: stats.totalTests,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs text-white/60">{item.label}</p>
                    <p className="text-lg font-semibold text-yellow-300">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="landing-animate mt-10 grid gap-4 md:grid-cols-3">
            {[
              { title: "Average score", value: `${stats.averageScore}%` },
              {
                title: "Completion rate",
                value: `${Math.min(100, Math.max(0, Number(stats.completionRate || 0)))}%`,
              },
              { title: "Active weeks", value: stats.activeWeeks },
            ].map((stat) => (
              <div
                key={stat.title}
                className="rounded-2xl bg-white p-6 shadow-lg"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {stat.title}
                </p>
                <p className="mt-3 text-3xl font-semibold text-black">
                  {stat.value}
                </p>
              </div>
            ))}
          </section>

          {/* HIGHLIGHTS */}
          <section className="landing-animate mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900">
                Curated question bank
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Questions are handpicked for high placement relevance. Study these topics in depth, not just by attending tests.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900">
                Academic integrity policy
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Avoid using AI tools while attending the test. The goal is accurate self-assessment and genuine improvement.
              </p>
            </div>
          </section>

          {/* FEATURES */}
          <section className="landing-animate mt-12 rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-black">
              Why OSCODE excels?
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {[
                {
                  icon: BarChart3,
                  title: "Analytics-first reporting",
                  desc: "Weekly trend tracking and participation insights for leadership decisions.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure timed testing",
                  desc: "Exam-grade flows with consistent timing and controlled attempts.",
                },
                {
                  icon: Trophy,
                  title: "Leaderboards",
                  desc: "Recognize top performers and motivate every cohort.",
                },
                {
                  icon: ClipboardList,
                  title: "Institution-ready data",
                  desc: "Exportable summaries built for HOD and principal reviews.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(245,158,11,0.15)]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500">
                    <feature.icon size={20} className="text-black" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-amber-800">
                    {feature.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-amber-900">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* LEADERSHIP */}
          <section className="landing-animate mt-12">
            <h3 className="text-2xl font-semibold">OSCODE leadership</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                {
                  name: "Abhishek Kumar",
                  title: "Co-Founder, OSCODE · SWE, Telstra",
                  image: "/src/assets/team/abhishek.jpg.png",
                },
                {
                  name: "Meghna Arora",
                  title: "SDET-2, Cohesity · Mentor, OSCODE",
                  image: "/src/assets/team/meghana.jpg.png",
                },
                {
                  name: "Shraddha Pawar",
                  title: "Vice President",
                  image: "/src/assets/team/shraddha.jpg.png",
                },
                {
                  name: "Jonah Joseph",
                  title: "General Secretary",
                  image: "/src/assets/team/jonah.jpg.png",
                },
                {
                  name: "Samanvita Dharwadkar",
                  title: "Managing Director",
                  image: "/src/assets/team/samanvita.jpg.png",
                },
              ].map((leader) => (
                <div
                  key={leader.name}
                  className="flex items-center justify-between rounded-2xl bg-black px-5 py-4 text-white shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="h-14 w-14 rounded-full border-2 border-yellow-400/70 object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">{leader.name}</p>
                      <p className="text-xs text-white/70">{leader.title}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-yellow-400/40 px-3 py-1 text-xs text-yellow-300">
                    Core
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="landing-animate mt-12 rounded-2xl bg-black p-8 text-center text-white shadow-lg">
            <h3 className="text-2xl font-semibold">Launch the next cohort</h3>
            <p className="mt-3 text-sm text-white/70">
              Switch to mission control mode and activate the weekly test pipeline.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="rounded-md border border-white/30 px-6 py-3 text-sm text-white/80 hover:bg-white/10"
              >
                Admin Login
              </Link>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="landing-animate mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
            <div className="space-y-2">
              <p>&copy; 2026 Aptitude Platform</p>
              <p>OSCODE AGMRCET Chapter | Designed &amp; Developed by Samanvita Dharwadkar</p>
              <p>For academic and structured aptitude assessment initiatives</p>
              <p>
                Contact 📩{" "}
                <a
                  href="mailto:samanvitard@gmail.com"
                  className="font-bold text-sky-700 underline decoration-sky-500 underline-offset-2 hover:text-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  samanvitard@gmail.com
                </a>
              </p>
            </div>
          </footer>
        </div>
      </NeonBackground>
    </div>
  );
}

export default Landing;
