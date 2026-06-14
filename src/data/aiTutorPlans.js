export const AI_TUTOR_TRIAL_LIMIT = 3;

export const AI_TUTOR_PLANS = [
    {
        id: 'free',
        name: '無料',
        monthlyPrice: 0,
        yearlyPrice: 0,
        yearlyMonthlyEquivalent: 0,
        monthlyCorrectionLimit: 0,
        accent: 'soft',
        badge: 'FREE',
        description: 'イベント進行と模範解答は無料。AI添削は初回体験ぶんだけ使えます。',
        features: [
            'イベント進行は無料',
            '模範解答の確認',
            `初回 ${AI_TUTOR_TRIAL_LIMIT} 回だけAI添削`,
        ],
    },
    {
        id: 'standard',
        name: 'スタンダード',
        monthlyPrice: 980,
        yearlyPrice: 7800,
        yearlyMonthlyEquivalent: 650,
        monthlyCorrectionLimit: 30,
        accent: 'primary',
        badge: 'RECOMMENDED',
        description: '普段の英作文練習にちょうどいい本命プラン。まずはここから。',
        features: [
            '月30回までAI添削',
            '自然な言い換え1案',
            '短い改善コメント',
            '添削履歴の見返し',
        ],
        recommended: true,
    },
    {
        id: 'premium',
        name: 'プレミアム',
        monthlyPrice: 2480,
        yearlyPrice: 12800,
        yearlyMonthlyEquivalent: 1067,
        monthlyCorrectionLimit: 120,
        accent: 'gold',
        badge: 'PLUS',
        description: 'ヘビーユーザー向け。高頻度の添削と深い解説までまとめて使えます。',
        features: [
            '月120回までAI添削',
            '自然な言い換え3案',
            '丁寧 / カジュアル比較',
            '将来のAI会話練習を優先開放予定',
        ],
    },
];

export const AI_TUTOR_TICKET_PACKS = [
    {
        id: 'ticket_pack_small',
        name: '3回パック',
        price: 480,
        corrections: 3,
        accent: 'soft',
    },
    {
        id: 'ticket_pack_large',
        name: '10回パック',
        price: 1200,
        corrections: 10,
        accent: 'primary',
        recommended: true,
    },
];

export const getAiTutorPlanById = (planId = 'free') => (
    AI_TUTOR_PLANS.find((plan) => plan.id === planId) || AI_TUTOR_PLANS[0]
);

export const getAiTutorTicketPackById = (packId) => (
    AI_TUTOR_TICKET_PACKS.find((pack) => pack.id === packId) || null
);
