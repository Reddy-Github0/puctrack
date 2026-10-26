import React, { useState } from "react";
import { X } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function IssueFineForm({ vehicle, onClose, onIssued }) {
  const { token } = useAuth();
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/vehicles/${vehicle.id}/fines`, { reason, amount: Number(amount) }, token);
      onIssued();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-surface rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-muted">
          <X size={18} />
        </button>
        <p className="text-sm font-medium mb-1">Issue a fine</p>
        <p className="text-sm text-ink-muted mb-4 font-mono">{vehicle.reg_number}</p>

        {error && <p className="mb-3 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Reason, e.g. Emission re-test overdue"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            required
            type="number"
            min="0"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {submitting ? "Issuing…" : "Issue fine"}
          </button>
        </form>
      </div>
    </div>
  );
}
