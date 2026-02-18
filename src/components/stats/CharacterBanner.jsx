const messages = [
    "今日もがんばったね!",
    "もっと上を目指そう!",
    "その調子だよ!",
]

export function CharacterBanner() {
    const message = messages[Math.floor(Date.now() / 86400000) % messages.length]

    return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--game-pink)]/30 bg-gradient-to-r from-[rgba(255,107,166,0.15)] via-[rgba(78,207,255,0.08)] to-[rgba(255,214,66,0.1)]">
            {/* Sparkle decorations */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-8 top-3 h-1 w-1 animate-pulse rounded-full bg-[var(--game-gold)]" />
                <div className="absolute right-16 top-5 h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--game-pink)] [animation-delay:500ms]" />
                <div className="absolute left-20 bottom-4 h-1 w-1 animate-pulse rounded-full bg-[var(--game-blue)] [animation-delay:1000ms]" />
            </div>

            <div className="relative flex items-end gap-3 px-4 py-3">
                {/* Character */}
                <div className="relative h-24 w-20 flex-shrink-0">
                    <img
                        src="/images/stats-character.jpg"
                        alt="Study character cheering"
                        className="h-full w-full rounded-xl object-cover object-top shadow-lg"
                        onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-[var(--game-gold)]/30" />
                </div>

                {/* Speech bubble */}
                <div className="relative flex-1 rounded-2xl rounded-bl-none border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] px-4 py-3 backdrop-blur-sm">
                    {/* Bubble tail */}
                    <div className="absolute -left-2 bottom-2 h-3 w-3 rotate-45 border-b border-l border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)]" />
                    <p className="relative text-sm font-bold text-[var(--foreground)]">
                        {message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--game-gold)]">
                        {"- あなたの学習パートナー"}
                    </p>
                </div>
            </div>
        </div>
    )
}
