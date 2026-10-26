import React from "react";
import { ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-brand">
          <ShieldCheck size={17} color="#fff" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">PUCTrack</p>
          <p className="text-xs mt-0.5 text-ink-muted">Vehicle compliance, in one place</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-none">{user?.name}</p>
          <p className="text-xs text-ink-muted mt-0.5 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-1.5 border border-border text-ink-muted hover:text-ink"
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}
