import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { BarChart3 } from "lucide-react";

const PUC_COLORS = { Valid: "#2F8F5B", "Expiring soon": "#C97C1F", Expired: "#B23A2E", "No record": "#9AA5A1" };

export default function AnalyticsCharts({ stats, timeline }) {
  const pieData = [
    { name: "Valid", value: stats.puc_valid },
    { name: "Expiring soon", value: stats.puc_expiring },
    { name: "Expired", value: stats.puc_expired },
    { name: "No record", value: stats.puc_no_record },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-slate" />
          <p className="text-sm font-medium">PUC status across the fleet</p>
        </div>
        {pieData.length === 0 ? (
          <p className="text-sm text-ink-muted">No PUC data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {pieData.map((d) => (
                  <Cell key={d.name} fill={PUC_COLORS[d.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-brand" />
          <p className="text-sm font-medium">Fines issued vs. paid, by week</p>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-ink-muted">No fines in the last 12 weeks.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5E1" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="issued" name="Issued" fill="#C97C1F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Paid" fill="#2F8F5B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
