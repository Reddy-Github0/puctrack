import React, { useCallback, useEffect, useState } from "react";
import { Car, ParkingSquare, Filter, Plus, UserPlus, History, Bell } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/shared/TopBar";
import { PucStatusBadge } from "../components/shared/Badges";
import IssueFineForm from "../components/admin/IssueFineForm";
import IssuePucForm from "../components/admin/IssuePucForm";
import AdminAddVehicleForm from "../components/admin/AdminAddVehicleForm";
import AnalyticsCharts from "../components/admin/AnalyticsCharts";
import AuditLogPanel from "../components/admin/AuditLogPanel";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [slots, setSlots] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [fineTarget, setFineTarget] = useState(null);
  const [pucTarget, setPucTarget] = useState(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [reminderStatus, setReminderStatus] = useState("");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, vehiclesRes, slotsRes, timelineRes] = await Promise.all([
        api.get("/admin/stats", token),
        api.get("/vehicles", token),
        api.get("/parking/slots", token),
        api.get("/admin/analytics/fines-timeline", token),
      ]);
      setStats(statsRes);
      setFleet(vehiclesRes.vehicles);
      setSlots(slotsRes.slots);
      setTimeline(timelineRes.timeline);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function sendReminders() {
    setSendingReminders(true);
    setReminderStatus("");
    try {
      const r = await api.post("/admin/notifications/send-expiry-reminders", {}, token);
      setReminderStatus(`Checked ${r.checked} vehicle(s) — sent ${r.sent}, ${r.failed} failed.`);
    } catch (err) {
      setReminderStatus(err.message);
    } finally {
      setSendingReminders(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm">Loading…</div>;
  }

  const statCards = stats
    ? [
        { label: "Registered vehicles", value: stats.total_vehicles, className: "text-slate" },
        { label: "Expiring within 14 days", value: stats.puc_expiring, className: "text-expiring" },
        { label: "Expired, unrenewed", value: stats.puc_expired, className: "text-expired" },
        { label: "Unpaid fines", value: stats.unpaid_fines, className: "text-brand" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-bg">
      <div className="w-full px-6 lg:px-10 py-6">
        <TopBar />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={sendReminders}
              disabled={sendingReminders}
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 border border-border text-ink-muted hover:text-ink disabled:opacity-60"
            >
              <Bell size={12} /> {sendingReminders ? "Sending…" : "Send PUC expiry reminders"}
            </button>
            <button
              onClick={() => setShowAuditLog(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 border border-border text-ink-muted hover:text-ink"
            >
              <History size={12} /> Audit log
            </button>
          </div>
          {reminderStatus && <p className="text-xs text-ink-muted">{reminderStatus}</p>}
        </div>

        {error && <p className="mb-4 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>}

        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-xl p-4 bg-surface border border-border">
                <p className={`text-2xl font-semibold ${s.className}`}>{s.value}</p>
                <p className="mt-1 text-xs leading-snug text-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {stats && <AnalyticsCharts stats={stats} timeline={timeline} />}

          <div className="rounded-xl bg-surface border border-border">
            <div className="px-6 py-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <Car size={16} />
                <p className="text-sm font-medium">Fleet — PUC status</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 bg-paidc-tint">
                  <Filter size={12} /> All statuses
                </button>
                <button
                  onClick={() => setShowAddVehicle(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 bg-brand text-white"
                >
                  <UserPlus size={12} /> Add vehicle
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-muted">
                    <th className="text-left font-medium px-6 py-2.5">Registration</th>
                    <th className="text-left font-medium px-6 py-2.5">Owner</th>
                    <th className="text-left font-medium px-6 py-2.5">PUC status</th>
                    <th className="text-left font-medium px-6 py-2.5">Valid until</th>
                    <th className="text-left font-medium px-6 py-2.5">Unpaid fines</th>
                    <th className="text-right font-medium px-6 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {fleet.map((v) => (
                    <tr key={v.id} className="border-t border-border">
                      <td className="px-6 py-3 font-mono">{v.reg_number}</td>
                      <td className="px-6 py-3">{v.owner_name}</td>
                      <td className="px-6 py-3">
                        <PucStatusBadge status={v.puc_status} size="sm" />
                      </td>
                      <td className="px-6 py-3 text-ink-muted">
                        {v.expiry_date ? new Date(v.expiry_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-3">
                        {v.unpaid_fine_count > 0 ? (
                          <span className="font-medium text-expired">{v.unpaid_fine_count}</span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setPucTarget(v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate"
                          >
                            <Plus size={12} /> {v.certificate_no ? "Renew PUC" : "Issue PUC"}
                          </button>
                          <button
                            onClick={() => setFineTarget(v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand"
                          >
                            <Plus size={12} /> Issue fine
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl p-6 bg-surface border border-border">
            <div className="flex items-center gap-2 mb-4">
              <ParkingSquare size={16} className="text-slate" />
              <p className="text-sm font-medium">Parking — live occupancy</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {slots.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-md py-2 text-center text-xs font-medium ${
                    s.status === "free" ? "bg-valid-tint text-valid" : "bg-expired-tint text-expired"
                  }`}
                >
                  {s.slot_no}
                </div>
              ))}
            </div>
          </div>
        </div>

        {fineTarget && (
          <IssueFineForm
            vehicle={fineTarget}
            onClose={() => setFineTarget(null)}
            onIssued={() => {
              setFineTarget(null);
              loadAll();
            }}
          />
        )}

        {pucTarget && (
          <IssuePucForm
            vehicle={pucTarget}
            onClose={() => setPucTarget(null)}
            onIssued={() => {
              setPucTarget(null);
              loadAll();
            }}
          />
        )}

        {showAddVehicle && (
          <AdminAddVehicleForm
            onClose={() => setShowAddVehicle(false)}
            onAdded={() => {
              setShowAddVehicle(false);
              loadAll();
            }}
          />
        )}

        {showAuditLog && <AuditLogPanel onClose={() => setShowAuditLog(false)} />}
      </div>
    </div>
  );
}
