import React, { useCallback, useEffect, useState } from "react";
import { Bell, Wallet, ParkingSquare, Leaf, QrCode, Download } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/shared/TopBar";
import { PucStatusBadge, FineStatusBadge, StatDot } from "../components/shared/Badges";
import EcoScoreRing from "../components/shared/EcoScoreRing";
import AddVehicleForm from "../components/user/AddVehicleForm";

export default function UserDashboard() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [fines, setFines] = useState([]);
  const [ecoscore, setEcoscore] = useState(null);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadVehicles = useCallback(async () => {
    try {
      const { vehicles } = await api.get("/vehicles", token);
      setVehicles(vehicles);
      if (vehicles.length > 0) setSelectedId(vehicles[0].id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadVehicles();
    api.get("/parking/slots", token).then(({ slots }) => setSlots(slots)).catch(() => {});
  }, [loadVehicles, token]);

  useEffect(() => {
    if (!selectedId) return;
    api.get(`/vehicles/${selectedId}/fines`, token).then(({ fines }) => setFines(fines)).catch(() => {});
    api.get(`/vehicles/${selectedId}/ecoscore`, token).then(({ ecoscore }) => setEcoscore(ecoscore)).catch(() => {});
  }, [selectedId, token]);

  async function payFine(fineId) {
    try {
      await api.patch(`/fines/${fineId}/pay`, {}, token);
      setFines((list) => list.map((f) => (f.id === fineId ? { ...f, status: "paid" } : f)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function downloadReceipt(fineId) {
    try {
      await api.download(`/fines/${fineId}/receipt`, token, `receipt-FN-${fineId}.pdf`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function bookSlot(slotId) {
    try {
      await api.post("/parking/bookings", { slot_id: slotId, vehicle_id: selectedId }, token);
      setSlots((list) => list.map((s) => (s.id === slotId ? { ...s, status: "occupied" } : s)));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm">Loading…</div>;
  }

  const vehicle = vehicles?.find((v) => v.id === selectedId);

  return (
    <div className="min-h-screen bg-bg">
      <div className="w-full px-6 lg:px-10 py-6">
        <TopBar />
        {error && <p className="mb-4 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>}

        {vehicles?.length === 0 && <AddVehicleForm onAdded={loadVehicles} />}

        {vehicle && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {vehicles.length > 1 && (
              <div className="lg:col-span-3 flex gap-2">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`text-sm font-medium rounded-full px-3 py-1.5 ${
                      v.id === selectedId ? "bg-brand text-white" : "bg-surface border border-border text-ink-muted"
                    }`}
                  >
                    {v.reg_number}
                  </button>
                ))}
              </div>
            )}

            {/* PUC certificate card, styled like the physical windshield sticker */}
            <div className="lg:col-span-2 rounded-xl overflow-hidden bg-surface border border-border">
              <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-dashed border-border">
                <div>
                  <p className="text-xs font-medium tracking-wide text-ink-muted">Pollution Under Control</p>
                  <p className="mt-1 text-2xl font-semibold font-mono">{vehicle.reg_number}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{vehicle.model || vehicle.vehicle_type}</p>
                </div>
                <PucStatusBadge status={vehicle.puc_status} />
              </div>

              {vehicle.certificate_no ? (
                <>
                  <div className="px-6 py-5 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-ink-muted">Certificate no.</p>
                      <p className="mt-1 text-sm font-mono">{vehicle.certificate_no}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">Issued</p>
                      <p className="mt-1 text-sm">{new Date(vehicle.issue_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">Valid until</p>
                      <p className="mt-1 text-sm font-medium">{new Date(vehicle.expiry_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {vehicle.puc_status !== "valid" && (
                    <div className="mx-6 mb-5 rounded-lg px-4 py-3 flex items-center justify-between bg-expiring-tint">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-expiring" />
                        <p className="text-sm">
                          {vehicle.days_until_expiry >= 0
                            ? <>Renews in <span className="font-semibold">{vehicle.days_until_expiry} days</span></>
                            : <>Expired <span className="font-semibold">{Math.abs(vehicle.days_until_expiry)} days ago</span></>}
                          {" "}— book a testing slot to stay compliant.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="px-6 py-5 text-sm text-ink-muted">
                  No PUC certificate on file yet — visit a testing center to get one issued.
                </p>
              )}
            </div>

            {/* EcoScore */}
            <div className="rounded-xl p-6 bg-surface border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Leaf size={16} className="text-brand" />
                <p className="text-sm font-medium">EcoScore</p>
              </div>
              {ecoscore ? (
                <div className="flex items-center gap-5">
                  <EcoScoreRing score={ecoscore.score} />
                  <p className="text-sm leading-relaxed text-ink-muted">
                    Built from PUC validity and fine history. Add trip data later to sharpen it.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">Calculating…</p>
              )}
            </div>

            {/* Fines */}
            <div className="lg:col-span-2 rounded-xl bg-surface border border-border">
              <div className="px-6 py-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <Wallet size={16} />
                  <p className="text-sm font-medium">Fines</p>
                </div>
                <p className="text-xs text-ink-muted">
                  {fines.filter((f) => f.status === "unpaid").length} unpaid
                </p>
              </div>
              {fines.length === 0 ? (
                <p className="px-6 py-5 text-sm text-ink-muted">No fines on record.</p>
              ) : (
                fines.map((f, i) => (
                  <div
                    key={f.id}
                    className={`px-6 py-4 flex items-center justify-between ${i < fines.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div>
                      <p className="text-sm">{f.reason}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        FN-{f.id} · {new Date(f.issued_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <FineStatusBadge status={f.status} />
                      <p className="text-sm font-medium w-16 text-right font-mono">₹{f.amount}</p>
                      {f.status === "unpaid" ? (
                        <button
                          onClick={() => payFine(f.id)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-1.5 bg-brand text-white"
                        >
                          <QrCode size={14} /> Pay
                        </button>
                      ) : (
                        <button
                          onClick={() => downloadReceipt(f.id)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-1.5 border border-border text-ink-muted hover:text-ink"
                        >
                          <Download size={14} /> Receipt
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Parking */}
            <div className="rounded-xl p-6 bg-surface border border-border">
              <div className="flex items-center gap-2 mb-4">
                <ParkingSquare size={16} className="text-slate" />
                <p className="text-sm font-medium">Parking</p>
              </div>
              <p className="text-sm mb-3 text-ink-muted">
                {slots.filter((s) => s.status === "free").length} of {slots.length} slots free nearby
              </p>
              <div className="space-y-2">
                {slots.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <StatDot free={s.status === "free"} />
                      <span className="font-mono">{s.slot_no}</span>
                      <span className="text-ink-muted">{s.location}</span>
                    </div>
                    <button
                      disabled={s.status !== "free"}
                      onClick={() => bookSlot(s.id)}
                      className={`text-xs font-medium rounded px-2 py-1 disabled:opacity-40 ${
                        s.status === "free" ? "bg-brand-tint text-brand-deep" : ""
                      }`}
                    >
                      {s.status === "free" ? "Book" : "Occupied"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
