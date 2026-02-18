"use client"

import { cn } from "@/lib/utils"

interface GameTabsProps {
  tabs: { id: string; label: string; icon: string }[]
  activeTab: string
  onTabChange: (id: string) => void
}

export function GameTabs({ tabs, activeTab, onTabChange }: GameTabsProps) {
  return (
    <div className="relative mx-auto flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-[var(--game-gold)]/20 bg-[rgba(255,255,255,0.05)] p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
      {/* Animated background glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(255,214,66,0.05)_0%,transparent_70%)]" />

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-300",
              isActive
                ? "bg-gradient-to-b from-[var(--game-gold)] to-[#e6b800] text-[#1a103a] shadow-[0_2px_12px_rgba(255,214,66,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                : "text-[var(--muted-foreground)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--foreground)]"
            )}
          >
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>

            {/* Active indicator decorations */}
            {isActive && (
              <>
                <div className="pointer-events-none absolute -top-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[rgba(255,255,255,0.5)]" />
                <div className="pointer-events-none absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-[var(--game-gold)]/30 blur-sm" />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
