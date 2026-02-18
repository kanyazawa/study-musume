"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"

const radarData = [
  { subject: "数学", value: 78 },
  { subject: "英語", value: 85 },
  { subject: "国語", value: 62 },
  { subject: "理科", value: 91 },
  { subject: "社会", value: 70 },
]

export function AccuracyRadar() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--game-green)]/20 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.02)] p-4 shadow-[0_0_20px_rgba(66,230,149,0.1)]">
      <div className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 bg-[radial-gradient(circle,rgba(66,230,149,0.15)_0%,transparent_70%)]" />

      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--game-green)]/20 text-sm">
          {"🎯"}
        </div>
        <h3 className="text-sm font-bold text-[var(--foreground)]">
          {"科目別正解率"}
        </h3>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid
              stroke="rgba(255,255,255,0.1)"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "rgba(248,240,255,0.7)", fontSize: 11, fontWeight: 600 }}
            />
            <Radar
              name="正解率"
              dataKey="value"
              stroke="#42e695"
              strokeWidth={2}
              fill="#42e695"
              fillOpacity={0.2}
              dot={{ fill: "#42e695", r: 4, strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
