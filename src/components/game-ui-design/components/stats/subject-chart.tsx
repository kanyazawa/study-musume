"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts"

const subjectData = [
  { name: "数学", minutes: 85, color: "#ff6ba6" },
  { name: "英語", minutes: 72, color: "#4ecfff" },
  { name: "国語", minutes: 45, color: "#ffd642" },
  { name: "理科", minutes: 38, color: "#42e695" },
  { name: "社会", minutes: 25, color: "#7c5cfc" },
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string } }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[var(--game-gold)]/30 bg-[var(--game-deep)] px-3 py-2 shadow-lg">
        <p className="text-xs font-bold text-[var(--foreground)]">
          {payload[0].payload.name}
        </p>
        <p className="text-sm font-black text-[var(--game-gold)]">
          {payload[0].value}{"分"}
        </p>
      </div>
    )
  }
  return null
}

export function SubjectChart() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--game-pink)]/20 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.02)] p-4 shadow-[0_0_20px_rgba(255,107,166,0.1)]">
      {/* Decorative corner */}
      <div className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 bg-[radial-gradient(circle,rgba(255,107,166,0.2)_0%,transparent_70%)]" />

      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--game-pink)]/20 text-sm">
          {"📊"}
        </div>
        <h3 className="text-sm font-bold text-[var(--foreground)]">
          {"科目別学習時間"}
        </h3>
        <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">
          {"今週"}
        </span>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subjectData} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
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
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
              {subjectData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
