import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
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
            <p className="text-xs mt-0.5 text-ink-muted">Create a vehicle-owner account</p>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input
              required
              value={form.name}
              onChange={update("name")}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-ink-muted text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
