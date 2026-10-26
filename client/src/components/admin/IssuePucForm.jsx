import React, { useState } from "react";
import { X } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function plusOneYearISO() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function IssuePucForm({ vehicle, onClose, onIssued }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    certificate_no: `PUCC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    issue_date: todayISO(),
    expiry_date: plusOneYearISO(),
  });
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
      await api.post(`/vehicles/${vehicle.id}/puc`, form, token);
      onIssued();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isRenewal = vehicle.certificate_no != null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-surface rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-muted">
          <X size={18} />
        </button>
        <p className="text-sm font-medium mb-1">{isRenewal ? "Renew PUC certificate" : "Issue PUC certificate"}</p>
        <p className="text-sm text-ink-muted mb-4 font-mono">{vehicle.reg_number}</p>

        {isRenewal && (
          <p className="mb-3 text-xs text-ink-muted bg-paidc-tint rounded-md px-3 py-2">
            Current certificate {vehicle.certificate_no} is valid until{" "}
            {new Date(vehicle.expiry_date).toLocaleDateString()}. Issuing a new one adds a fresh record —
            the vehicle's status will follow whichever certificate expires latest.
          </p>
        )}

        {error && <p className="mb-3 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-ink-muted">Certificate number</label>
            <input
              required
              value={form.certificate_no}
              onChange={update("certificate_no")}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-muted">Issue date</label>
              <input
                required
                type="date"
                value={form.issue_date}
                onChange={update("issue_date")}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Expiry date</label>
              <input
                required
                type="date"
                value={form.expiry_date}
                onChange={update("expiry_date")}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {submitting ? "Saving…" : isRenewal ? "Renew certificate" : "Issue certificate"}
          </button>
        </form>
      </div>
    </div>
  );
}
