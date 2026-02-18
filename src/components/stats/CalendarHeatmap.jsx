import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"

function generateMockData() {
    const data = []
    const today = new Date()
    for (let i = 34; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        data.push({
            date,
            minutes: Math.random() > 0.2 ? Math.floor(Math.random() * 120) + 5 : 0,
        })
    }
    return data
}

function getIntensity(minutes) {
    if (minutes === 0) return 0
    if (minutes < 15) return 1
    if (minutes < 30) return 2
    if (minutes < 60) return 3
    return 4
}

const intensityColors = [
    "bg-[rgba(255,255,255,0.06)]",
    "bg-[#4ecfff]/30",
    "bg-[#4ecfff]/50",
    "bg-[#4ecfff]/75",
    "bg-[#4ecfff]",
]

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"]

export function CalendarHeatmap() {
    const data = useMemo(() => generateMockData(), [])
    const [currentMonth] = useState(new Date())

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDow = firstDay.getDay()

    const calendarDays = []
    for (let i = 0; i < startDow; i++) calendarDays.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(year, month, d)
        const found = data.find(
            (dd) =>
                dd.date.getFullYear() === date.getFullYear() &&
                dd.date.getMonth() === date.getMonth() &&
                dd.date.getDate() === date.getDate()
        )
        calendarDays.push(found || { date, minutes: 0 })
    }

    const today = new Date()
    const streak = data
        .slice()
        .reverse()
        .findIndex((d) => d.minutes === 0)

    const monthStr = `${year}年${month + 1}月`

    return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--game-gold)]/30 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.02)] p-4 shadow-[0_0_20px_rgba(78,207,255,0.1)]">
            {/* Decorative corner sparkles */}
            <div className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 bg-[radial-gradient(circle,rgba(255,214,66,0.3)_0%,transparent_70%)]" />
            <div className="pointer-events-none absolute -bottom-2 -left-2 h-16 w-16 bg-[radial-gradient(circle,rgba(78,207,255,0.2)_0%,transparent_70%)]" />

            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--game-blue)]/20">
                        <Flame className="h-4 w-4 text-[var(--game-gold)]" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                        {"学習カレンダー"}
                    </h3>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-1">
                    <Flame className="h-3 w-3 text-[var(--game-gold)]" />
                    <span className="text-xs font-bold text-[var(--game-gold)]">
                        {streak}{"日連続"}
                    </span>
                </div>
            </div>

            {/* Month nav */}
            <div className="mb-3 flex items-center justify-center gap-3">
                <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-[var(--foreground)] transition-colors hover:bg-[rgba(255,255,255,0.2)]">
                    <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold text-[var(--foreground)]">{monthStr}</span>
                <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-[var(--foreground)] transition-colors hover:bg-[rgba(255,255,255,0.2)]">
                    <ChevronRight className="h-3 w-3" />
                </button>
            </div>

            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
                {weekdayLabels.map((label) => (
                    <div
                        key={label}
                        className="text-center text-[10px] font-medium text-[var(--muted-foreground)]"
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />
                    const intensity = getIntensity(day.minutes)
                    const isToday =
                        day.date.getDate() === today.getDate() &&
                        day.date.getMonth() === today.getMonth() &&
                        day.date.getFullYear() === today.getFullYear()

                    return (
                        <div
                            key={i}
                            className={cn(
                                "group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg transition-all hover:scale-110",
                                intensityColors[intensity],
                                isToday && "ring-2 ring-[var(--game-gold)] ring-offset-1 ring-offset-[var(--background)]"
                            )}
                        >
                            <span className="text-[10px] font-medium text-[var(--foreground)]/80">
                                {day.date.getDate()}
                            </span>
                            {day.minutes > 0 && (
                                <span className="text-[7px] font-bold text-[var(--foreground)]">
                                    {day.minutes}{"m"}
                                </span>
                            )}
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 scale-0 rounded-lg border border-[var(--game-gold)]/30 bg-[var(--game-deep)] px-2 py-1 text-[10px] font-bold text-[var(--foreground)] shadow-lg transition-transform group-hover:scale-100">
                                {day.minutes}{"分"}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[10px] text-[var(--muted-foreground)]">{"少"}</span>
                {intensityColors.map((color, i) => (
                    <div
                        key={i}
                        className={cn("h-3 w-3 rounded", color)}
                    />
                ))}
                <span className="text-[10px] text-[var(--muted-foreground)]">{"多"}</span>
            </div>
        </div>
    )
}
