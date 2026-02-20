import { useState } from "react";
import { Link } from "react-router-dom";
import NeonBackground from "../components/NeonBackground";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || data.error || "Signup failed");
        return;
      }

      alert("Account created successfully");
      window.location.href = "/login";
    } catch (err) {
      alert("Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-2">
          <div className="space-y-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-600"
            >
              <img
                src="/src/assets/team/oscode-logo.png"
                alt="OSCODE AGMRCET logo"
                className="h-8 w-8 rounded-full border border-yellow-400/40 bg-white object-cover"
              />
              OSCODE AGMRCET
            </Link>
            <h1 className="text-3xl font-semibold leading-tight">
              Create your aptitude account.
            </h1>
            <p className="text-sm text-slate-600">
              Join the weekly test program and get structured placement prep.
            </p>
            <div className="rounded-2xl bg-black p-5 text-white shadow-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                Trusted by AGMRCET
              </p>
              <p className="mt-3 text-sm text-white/80">
                Progress data is private and visible only to the institution.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-black p-8 text-white shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Create Account</h2>
              <p className="text-sm text-white/70">
                Join the weekly aptitude program.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-md border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@domain.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-md border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-md border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-md border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-yellow-400 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Create Account
              </button>
            </form>

            <div className="mt-6 text-sm text-white/70">
              <p>
                Already registered?{" "}
                <Link to="/login" className="text-yellow-300 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default Signup;
