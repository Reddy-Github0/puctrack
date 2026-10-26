import React, { useEffect, useState } from "react";
import { X, UserPlus, Users } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function AdminAddVehicleForm({ onClose, onAdded }) {
  const { token } = useAuth();
  const [mode, setMode] = useState("existing"); // existing | new
  const [users, setUsers] = useState([]);
  const [ownerId, setOwnerId] = useState("");
  const [newOwner, setNewOwner] = useState({ name: "", email: "" });
  const [vehicle, setVehicle] = useState({ reg_number: "", vehicle_type: "car", model: "" });
  const [error, setError] = useState("");
  const [successNote, setSuccessNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/admin/users", token).then(({ users }) => {
      setUsers(users);
      if (users.length > 0) setOwnerId(String(users[0].id));
    }).catch((err) => setError(err.message));
  }, [token]);

  function updateVehicle(field) {
    return (e) => setVehicle((v) => ({ ...v, [field]: e.target.value }));
  }
  function updateNewOwner(field) {
    return (e) => setNewOwner((o) => ({ ...o, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      let finalOwnerId = ownerId;

      if (mode === "new") {
        const { user, temp_password } = await api.post("/admin/users", newOwner, token);
        finalOwnerId = user.id;
        setSuccessNote(`Account created for ${user.email} — temp password: ${temp_password}`);
      }

      await api.post("/vehicles", { ...vehicle, owner_id: finalOwnerId }, token);
      onAdded();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md bg-surface rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-muted">
          <X size={18} />
        </button>
        <p className="text-sm font-medium mb-4">Register a vehicle</p>

        <div className="flex items-center rounded-full p-1 mb-4 bg-paidc-tint w-fit">
          {[
            { key: "existing", label: "Existing owner", Icon: Users },
            { key: "new", label: "New owner", Icon: UserPlus },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 ${
                mode === key ? "bg-brand text-white" : "text-ink-muted"
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-expired bg-expired-tint rounded-md px-3 py-2">{error}</p>}
        {successNote && (
          <p className="mb-3 text-sm text-brand-deep bg-brand-tint rounded-md px-3 py-2">{successNote}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "existing" ? (
            <div>
              <label className="text-xs font-medium text-ink-muted">Owner</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              >
                {users.length === 0 && <option value="">No registered owners yet</option>}
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-ink-muted">Owner's full name</label>
                <input
                  required
                  value={newOwner.name}
                  onChange={updateNewOwner("name")}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Owner's email</label>
                <input
                  type="email"
                  required
                  value={newOwner.email}
                  onChange={updateNewOwner("email")}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <p className="text-xs text-ink-muted">
                A temporary password will be generated — share it with the owner so they can log in and set their own.
              </p>
            </>
          )}

          <div className="pt-2 border-t border-border">
            <label className="text-xs font-medium text-ink-muted">Registration number</label>
            <input
              required
              placeholder="e.g. TS 09 EQ 4471"
              value={vehicle.reg_number}
              onChange={updateVehicle("reg_number")}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <select
            value={vehicle.vehicle_type}
            onChange={updateVehicle("vehicle_type")}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="car">Car</option>
            <option value="bike">Bike</option>
            <option value="commercial">Commercial</option>
          </select>
          <input
            placeholder="Model, e.g. Honda City ZX - 2021"
            value={vehicle.model}
            onChange={updateVehicle("model")}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />

          <button
            type="submit"
            disabled={submitting || (mode === "existing" && !ownerId)}
            className="w-full rounded-md bg-brand text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Register vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
}
