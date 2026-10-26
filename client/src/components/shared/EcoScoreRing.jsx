import React from "react";

export default function EcoScoreRing({ score = 0 }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r={r} fill="none" stroke="#E4F0EA" strokeWidth="12" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="#1F6F54"
        strokeWidth="12"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="64" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill="#16231F">
        {score}
      </text>
      <text x="64" y="80" textAnchor="middle" fontSize="11" fill="#5B6B65">
        out of 100
      </text>
    </svg>
  );
}
