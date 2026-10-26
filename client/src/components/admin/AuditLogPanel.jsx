import React, { useEffect, useState } from "react";
import { X, History } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const ACTION_LABELS = {
  fine_issued: "Issued a fine",
  fine_paid: "Fine paid",
  puc_issued: "Issued/renewed a PUC certificate",
  vehicle_registered_by_admin: "Registered a vehicle (on behalf of owner)",
  vehicle_self_registered: "Registered a vehicle",
  user_onboarded: "Onboarded a new owner",
  parking_booked: "Booked a parking slot",
  expiry_reminders_sent: "Sent PUC expiry reminder emails",
};

function describe(entry) {
  const label = ACTION_LABELS[entry.action] || entry.action;
  const d = entry.details || {};
  const bits = [];
  if (d.reg_number) bits.push(d.reg_number);
  if (d.amount) bits.push(`₹${d.amount}`);
  if (d.certificate_no) bits.push(d.certificate_no);
  if (d.sent !== undefined) bits.push(`${d.sent} sent, ${d.failed || 0} failed`);
  return bits.length ? `${label} — ${bits.join(", ")}` : label;
}

export default function AuditLogPanel({ onClose }) {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/audit-log", token)
      .then(({ entries }) => setEntries(entries))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-end z-50">
      <div className="w-full max-w-md h-full bg-surface overflow-y-auto">
        <div className="px-6 py-4 flex items-center justify-between border-b border-border sticky top-0 bg-surface">
          <div className="flex items-center gap-2">
            <History size={16} />
            <p className="text-sm font-medium">Audit log</p>
          </div>
          <button onClick={onClose} className="text-ink-muted">
            <X size={18} />
          </button>
        </div>

        {loading && <p className="px-6 py-5 text-sm text-ink-muted">Loading…</p>}
        {error && <p className="mx-6 mt-4 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>}

        {!loading && entries.length === 0 && (
          <p className="px-6 py-5 text-sm text-ink-muted">No actions recorded yet.</p>
        )}

        <div>
          {entries.map((e, i) => (
            <div key={e.id} className={`px-6 py-3 ${i < entries.length - 1 ? "border-b border-border" : ""}`}>
              <p className="text-sm">{describe(e)}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {e.actor_name ? e.actor_name : "System"} · {new Date(e.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
