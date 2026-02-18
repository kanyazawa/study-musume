"use client"

import { Star, Settings } from "lucide-react"
import Image from "next/image"

export function StatsHeader() {
  return (
    <header className="relative overflow-hidden border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[rgba(255,107,166,0.15)] via-[rgba(78,207,255,0.1)] to-[rgba(255,214,66,0.1)]">
      {/* Background decorative sparkles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-4 top-2 h-1 w-1 animate-pulse rounded-full bg-[var(--game-gold)]" />
        <div className="absolute right-12 top-6 h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--game-pink)] delay-300" />
        <div className="absolute left-1/3 top-1 h-1 w-1 animate-pulse rounded-full bg-[var(--game-blue)] delay-700" />
      </div>

      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* Character avatar */}
        <div className="relative">
          <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-[var(--game-gold)] shadow-[0_0_12px_rgba(255,214,66,0.3)]">
            <Image
              src="/images/stats-character.jpg"
              alt="Character avatar"
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--game-deep)] bg-gradient-to-b from-[var(--game-gold)] to-[#e6b800] text-[8px] font-black text-[#1a103a]">
            {"14"}
          </div>
        </div>

        {/* User info */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[var(--foreground)]">
              {"トレーナー"}
            </span>
            <div className="flex items-center gap-0.5 rounded-md bg-[var(--game-gold)]/20 px-1.5 py-0.5">
              <Star className="h-2.5 w-2.5 fill-[var(--game-gold)] text-[var(--game-gold)]" />
              <span className="text-[9px] font-bold text-[var(--game-gold)]">
                {"Lv.14"}
              </span>
            </div>
          </div>
          {/* XP bar */}
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--game-gold)] to-[var(--game-green)] shadow-[0_0_6px_rgba(255,214,66,0.4)]"
                style={{ width: "75%" }}
              />
            </div>
            <span className="text-[10px] font-bold text-[var(--game-gold)]">
              {"75/100"}
            </span>
          </div>
        </div>

        {/* Settings */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[var(--muted-foreground)] transition-colors hover:bg-[rgba(255,255,255,0.1)]">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Title bar */}
      <div className="flex items-center justify-center gap-2 bg-[rgba(0,0,0,0.15)] px-4 py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--game-gold)]/30 to-transparent" />
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-black tracking-wider text-[var(--foreground)]">
            {"学習統計"}
          </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--game-gold)]/30 to-transparent" />
      </div>
    </header>
  )
}
