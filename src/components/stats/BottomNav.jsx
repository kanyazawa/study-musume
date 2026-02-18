import { cn } from "@/lib/utils"
import { BookOpen, BarChart3, Home, Sparkles, Users } from "lucide-react"

const navItems = [
    { icon: BookOpen, label: "ストーリー", active: false },
    { icon: BarChart3, label: "統計", active: true },
    { icon: Home, label: "ホーム", active: false, isCenter: true },
    { icon: Sparkles, label: "ガチャ", active: false },
    { icon: Users, label: "キャラ", active: false },
]

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(255,255,255,0.08)] bg-[#0f0825]/95 backdrop-blur-xl">
            <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-[env(safe-area-inset-bottom)]">
                {navItems.map((item) => {
                    const Icon = item.icon
                    if (item.isCenter) {
                        return (
                            <button
                                key={item.label}
                                className="group relative -mt-5 flex flex-col items-center"
                            >
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--game-gold)]/50 bg-gradient-to-b from-[var(--game-green)] to-[#2bc977] shadow-[0_0_20px_rgba(66,230,149,0.3)]">
                                    <Icon className="h-6 w-6 text-[#0a0520]" />
                                    <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.3)_0%,transparent_60%)]" />
                                </div>
                                <span className="mt-0.5 text-[10px] font-bold text-[var(--game-green)]">
                                    {item.label}
                                </span>
                            </button>
                        )
                    }
                    return (
                        <button
                            key={item.label}
                            className={cn(
                                "flex flex-col items-center gap-0.5 py-2",
                                item.active
                                    ? "text-[var(--game-gold)]"
                                    : "text-[var(--muted-foreground)]"
                            )}
                        >
                            <div className="relative">
                                <Icon className="h-5 w-5" />
                                {item.active && (
                                    <div className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[var(--game-gold)]" />
                                )}
                            </div>
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
