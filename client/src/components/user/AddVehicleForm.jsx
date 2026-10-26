import React, { useState } from "react";
import { Car } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function AddVehicleForm({ onAdded }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ reg_number: "", vehicle_type: "car", model: "" });
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
      await api.post("/vehicles", form, token);
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl bg-surface border border-border p-6 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <Car size={16} />
        <p className="text-sm font-medium">Register your vehicle</p>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Add a vehicle to see its PUC status, fines, and EcoScore here.
      </p>
      {error && <p className="mb-3 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          placeholder="Registration number, e.g. TS 09 EQ 4471"
          value={form.reg_number}
          onChange={update("reg_number")}
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        <select
          value={form.vehicle_type}
          onChange={update("vehicle_type")}
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="car">Car</option>
          <option value="bike">Bike</option>
          <option value="commercial">Commercial</option>
        </select>
        <input
          placeholder="Model, e.g. Honda City ZX - 2021"
          value={form.model}
          onChange={update("model")}
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand text-white text-sm font-medium py-2 disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add vehicle"}
        </button>
      </form>
    </div>
  );
}
