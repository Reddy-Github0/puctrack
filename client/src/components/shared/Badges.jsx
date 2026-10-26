import React from "react";
import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";

const PUC_MAP = {
  valid: { label: "Valid", classes: "bg-valid-tint text-valid", Icon: ShieldCheck },
  expiring: { label: "Expiring soon", classes: "bg-expiring-tint text-expiring", Icon: AlertTriangle },
  expired: { label: "Expired", classes: "bg-expired-tint text-expired", Icon: XCircle },
  no_record: { label: "No PUC record", classes: "bg-paidc-tint text-paidc", Icon: AlertTriangle },
};

export function PucStatusBadge({ status, size = "md" }) {
  const { label, classes, Icon } = PUC_MAP[status] || PUC_MAP.no_record;
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad} ${classes}`}>
      <Icon size={size === "sm" ? 12 : 14} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export function FineStatusBadge({ status }) {
  const paid = status === "paid";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        paid ? "bg-paidc-tint text-paidc" : "bg-expired-tint text-expired"
      }`}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

export function StatDot({ free }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${free ? "bg-valid" : "bg-paidc"}`} />;
}
