import { Clock, BookOpen, Target, TrendingUp } from "lucide-react"

const stats = [
    {
        icon: <Clock className="h-5 w-5" />,
        label: "総学習時間",
        value: "48.5h",
        sub: "+3.2h 今週",
        gradient: "from-[#ff6ba6] to-[#ff8fbe]",
        iconBg: "bg-[#ff6ba6]/20",
    },
    {
        icon: <BookOpen className="h-5 w-5" />,
        label: "完了問題数",
        value: "1,284",
        sub: "+86 今週",
        gradient: "from-[#4ecfff] to-[#7bdeff]",
        iconBg: "bg-[#4ecfff]/20",
    },
    {
        icon: <Target className="h-5 w-5" />,
        label: "正解率",
        value: "78.5%",
        sub: "+2.1% 先週比",
        gradient: "from-[#ffd642] to-[#ffe57a]",
        iconBg: "bg-[#ffd642]/20",
    },
    {
        icon: <TrendingUp className="h-5 w-5" />,
        label: "連続日数",
        value: "14日",
        sub: "最長記録!",
        gradient: "from-[#42e695] to-[#6feda8]",
        iconBg: "bg-[#42e695]/20",
    },
]

export function SummaryCards() {
    return (
        <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-gradient-to-br from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.03)] p-3 shadow-lg transition-all hover:scale-[1.02] hover:border-[rgba(255,255,255,0.2)]"
                >
                    {/* Glow effect */}
                    <div
                        className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${stat.gradient} opacity-20 blur-xl transition-opacity group-hover:opacity-40`}
                    />

                    <div className="relative z-10">
                        <div className="mb-2 flex items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.iconBg} text-[var(--foreground)]`}
                            >
                                {stat.icon}
                            </div>
                            <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
                                {stat.label}
                            </span>
                        </div>
                        <div className="text-xl font-black text-[var(--foreground)]">
                            {stat.value}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-[var(--game-green)]">
                            {stat.sub}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
