"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const weeklyData = [
  { day: "月", study: 45, correct: 82 },
  { day: "火", study: 60, correct: 76 },
  { day: "水", study: 30, correct: 88 },
  { day: "木", study: 75, correct: 91 },
  { day: "金", study: 55, correct: 79 },
  { day: "土", study: 90, correct: 85 },
  { day: "日", study: 40, correct: 72 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[var(--game-gold)]/30 bg-[var(--game-deep)] px-3 py-2 shadow-lg">
        <p className="mb-1 text-xs font-bold text-[var(--foreground)]">{label}{"曜日"}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-[10px] text-[var(--muted-foreground)]">
            {p.dataKey === "study" ? "学習" : "正解率"}{": "}
            <span className="font-bold text-[var(--foreground)]">
              {p.value}{p.dataKey === "study" ? "分" : "%"}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function WeeklyTrend() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--game-blue)]/20 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.02)] p-4 shadow-[0_0_20px_rgba(78,207,255,0.1)]">
      <div className="pointer-events-none absolute -left-3 -top-3 h-20 w-20 bg-[radial-gradient(circle,rgba(78,207,255,0.2)_0%,transparent_70%)]" />

      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--game-blue)]/20 text-sm">
          {"📈"}
        </div>
        <h3 className="text-sm font-bold text-[var(--foreground)]">
          {"週間トレンド"}
        </h3>
      </div>

      {/* Legend */}
      <div className="mb-2 flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--game-pink)]" />
          <span className="text-[10px] text-[var(--muted-foreground)]">{"学習時間"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--game-blue)]" />
          <span className="text-[10px] text-[var(--muted-foreground)]">{"正解率"}</span>
        </div>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6ba6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ff6ba6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ecfff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4ecfff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "rgba(248,240,255,0.6)", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(248,240,255,0.4)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="study"
              stroke="#ff6ba6"
              strokeWidth={2.5}
              fill="url(#pinkGrad)"
              dot={{ fill: "#ff6ba6", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#ff6ba6", stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="correct"
              stroke="#4ecfff"
              strokeWidth={2.5}
              fill="url(#blueGrad)"
              dot={{ fill: "#4ecfff", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#4ecfff", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
