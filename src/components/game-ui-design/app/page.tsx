"use client"

import { useState } from "react"
import { StatsHeader } from "@/components/stats/stats-header"
import { GameTabs } from "@/components/stats/game-tabs"
import { SummaryCards } from "@/components/stats/summary-cards"
import { SubjectChart } from "@/components/stats/subject-chart"
import { WeeklyTrend } from "@/components/stats/weekly-trend"
import { CalendarHeatmap } from "@/components/stats/calendar-heatmap"
import { AccuracyRadar } from "@/components/stats/accuracy-radar"
import { CharacterBanner } from "@/components/stats/character-banner"
import { BottomNav } from "@/components/stats/bottom-nav"

const tabs = [
  { id: "overview", label: "概要", icon: "📋" },
  { id: "subjects", label: "科目別", icon: "📚" },
  { id: "calendar", label: "カレンダー", icon: "📅" },
]

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="relative mx-auto min-h-screen max-w-lg bg-[var(--background)]">
      {/* Background gradient layers */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a103a] via-[#1e1445] to-[#12082a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,166,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(78,207,255,0.06)_0%,transparent_50%)]" />
        {/* Star-like sparkles */}
        <div className="absolute left-[10%] top-[15%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--game-gold)]/60" />
        <div className="absolute left-[80%] top-[25%] h-1 w-1 animate-pulse rounded-full bg-[var(--game-pink)]/40 [animation-delay:600ms]" />
        <div className="absolute left-[60%] top-[45%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--game-blue)]/50 [animation-delay:1200ms]" />
        <div className="absolute left-[25%] top-[65%] h-1 w-1 animate-pulse rounded-full bg-[var(--game-gold)]/30 [animation-delay:1800ms]" />
        <div className="absolute left-[90%] top-[55%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--game-green)]/40 [animation-delay:400ms]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col pb-24">
        <StatsHeader />

        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-4 px-4 py-4">
          {/* Character Banner */}
          <CharacterBanner />

          {/* Game-style tabs */}
          <GameTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <SummaryCards />
              <WeeklyTrend />
              <SubjectChart />
            </div>
          )}

          {activeTab === "subjects" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <AccuracyRadar />
              <SubjectChart />

              {/* Subject detail cards */}
              <div className="flex flex-col gap-2">
                {[
                  { name: "数学", score: 78, color: "#ff6ba6", rank: "B+" },
                  { name: "英語", score: 85, color: "#4ecfff", rank: "A" },
                  { name: "国語", score: 62, color: "#ffd642", rank: "C+" },
                  { name: "理科", score: 91, color: "#42e695", rank: "A+" },
                  { name: "社会", score: 70, color: "#7c5cfc", rank: "B" },
                ].map((subject) => (
                  <div
                    key={subject.name}
                    className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3 transition-all hover:bg-[rgba(255,255,255,0.08)]"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black"
                      style={{
                        backgroundColor: `${subject.color}20`,
                        color: subject.color,
                      }}
                    >
                      {subject.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--foreground)]">
                          {subject.name}
                        </span>
                        <span
                          className="text-sm font-black"
                          style={{ color: subject.color }}
                        >
                          {subject.score}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${subject.score}%`,
                            backgroundColor: subject.color,
                            boxShadow: `0 0 8px ${subject.color}60`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <CalendarHeatmap />

              {/* Study streak banner */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--game-gold)]/30 bg-gradient-to-r from-[rgba(255,214,66,0.15)] to-[rgba(255,107,166,0.1)] p-4">
                <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 bg-[radial-gradient(circle,rgba(255,214,66,0.2)_0%,transparent_70%)]" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border-2 border-[var(--game-gold)]/40 bg-[var(--game-gold)]/10 shadow-[0_0_12px_rgba(255,214,66,0.2)]">
                    <span className="text-2xl font-black text-[var(--game-gold)]">
                      {"14"}
                    </span>
                    <span className="text-[8px] font-bold text-[var(--game-gold)]/80">
                      {"DAYS"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {"連続学習記録を更新中!"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                      {"あと1日で新しいバッジを獲得!"}
                    </p>
                    {/* Progress to next badge */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--game-gold)] to-[var(--game-pink)] shadow-[0_0_6px_rgba(255,214,66,0.4)]"
                          style={{ width: "93%" }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--game-gold)]">
                        {"14/15"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <SummaryCards />
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
