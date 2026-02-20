import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NeonBackground from "../components/NeonBackground";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/auth/login`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <NeonBackground className="min-h-screen">
        <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600"
              >
                <img
                  src="/oscode-logo.png"
                  alt="OSCODE AGMRCET logo"
                  className="h-8 w-8 rounded-full border border-yellow-400/40 bg-white object-cover"
                />
                OSCODE AGMRCET
              </Link>
              <Link
                to="/"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
              >
                Back to Home
              </Link>
            </div>
            <h1 className="text-3xl font-semibold leading-tight">
              Admin and student access portal.
            </h1>
            <p className="text-sm text-slate-600">
              Login to manage weekly tests, view analytics, and track progress.
            </p>
            <div className="rounded-2xl bg-black p-5 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
                Secure Session
              </p>
              <p className="mt-3 text-sm text-white/80">
                JWT-secured authentication with role-based access.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-black p-8 text-white shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Login</h2>
              <p className="text-sm text-white/70">
                Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@agmrcet.edu.in"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-md border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
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

              <button
                type="submit"
                className="w-full rounded-md bg-yellow-400 py-3 text-sm font-semibold text-black shadow hover:-translate-y-[1px]"
              >
                Login
              </button>
            </form>

            <div className="mt-6 text-sm text-white/70">
              <p>
                Need an account?{" "}
                <Link to="/signup" className="text-yellow-300 hover:underline">
                  Create one
                </Link>
              </p>
              <p className="mt-2 text-xs text-white/50">
                By continuing, you agree to platform terms.
              </p>
            </div>
          </div>
        </div>
      </NeonBackground>
    </div>
  );
}

export default Login;

