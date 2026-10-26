import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-brand">
            <ShieldCheck size={18} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">PUCTrack</p>
            <p className="text-xs mt-0.5 text-ink-muted">Sign in to your account</p>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-sm text-ink-muted text-center">
          New here?{" "}
          <Link to="/register" className="text-brand font-medium">
            Create an account
          </Link>
        </p>

        {/* <p className="mt-4 text-xs text-ink-muted text-center">
          Demo admin: admin@puctrack.in / password123
        </p> */}
      </div>
    </div>
  );
}
