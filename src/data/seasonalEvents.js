export const SUMMER_BEACH_INVITE_EVENT_ID = 'summer_beach_invite';

export const SEASONAL_EVENTS = [
    {
        id: SUMMER_BEACH_INVITE_EVENT_ID,
        season: 'summer',
        title: '真夏の英会話',
        shortTitle: '海に誘う',
        homeBannerTitle: '海に誘う英会話',
        bannerKicker: 'SUMMER EVENT',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        reward: {
            diamonds: 40,
            intellect: 30,
            affection: 12,
        },
        scenes: [
            {
                id: 'invite',
                situation: '放課後、夏らしい予定を切り出したい。まずは自然に海へ誘おう。',
                partnerLine: '最近すごく暑いね。放課後も夏っぽくなってきたかも。',
                prompt: 'いちばん自然な誘い方を選んでください。',
                choices: [
                    {
                        id: 'invite-correct',
                        english: 'Do you want to go to the beach with me this Saturday?',
                        meaning: '今週の土曜日、私と海に行かない？',
                        isCorrect: true,
                        feedback: '気軽で自然な誘い方です。曜日の言い方もきれいです。',
                    },
                    {
                        id: 'invite-wrong-1',
                        english: 'Will you go beach with me in Saturday?',
                        meaning: '土曜日に私と海へ行く？',
                        isCorrect: false,
                        feedback: '`go to the beach` と `on Saturday` にすると自然です。',
                    },
                    {
                        id: 'invite-wrong-2',
                        english: 'I invite you go to beach now.',
                        meaning: '今あなたを海へ誘う。',
                        isCorrect: false,
                        feedback: '`invite` の使い方と文の形が不自然です。会話ならもっとやわらかく聞くほうが自然です。',
                    },
                ],
            },
            {
                id: 'follow-up',
                situation: '興味はありそう。勉強のごほうびっぽく提案して、気まずさを減らしたい。',
                partnerLine: '海かあ…ちょっと気になるかも。最近ずっと勉強ばかりだったし。',
                prompt: '次のひと押しとして自然な英文を選んでください。',
                choices: [
                    {
                        id: 'follow-up-correct',
                        english: 'We can relax there after studying for the test.',
                        meaning: 'テスト勉強のあとなら、そこで少し息抜きできるよ。',
                        isCorrect: true,
                        feedback: '`after studying` の形が自然で、誘い文句としてもやわらかいです。',
                    },
                    {
                        id: 'follow-up-wrong-1',
                        english: 'We can relax there after study for the test.',
                        meaning: 'テスト勉強のあと、そこでくつろげるよ。',
                        isCorrect: false,
                        feedback: '`after` の後ろは動名詞にして `after studying` が自然です。',
                    },
                    {
                        id: 'follow-up-wrong-2',
                        english: 'We relaxing there after studied the test.',
                        meaning: 'テストを勉強したあとそこでくつろぐ。',
                        isCorrect: false,
                        feedback: '動詞の形が崩れています。`We can relax ... after studying ...` の形にすると伝わります。',
                    },
                ],
            },
            {
                id: 'confirm',
                situation: '最後は待ち合わせまでまとめて、ちゃんと約束にしたい。',
                partnerLine: 'その日ならたぶん大丈夫。ちゃんと予定にできそう。',
                prompt: '約束をまとめる自然な英文を選んでください。',
                choices: [
                    {
                        id: 'confirm-correct',
                        english: "Great. Let's meet at the station at ten.",
                        meaning: 'よかった。じゃあ10時に駅で会おう。',
                        isCorrect: true,
                        feedback: '時間も場所も自然にまとまっています。これでデート成立です。',
                    },
                    {
                        id: 'confirm-wrong-1',
                        english: "Great. Let's meet in the station on ten.",
                        meaning: 'よかった。10時に駅の中で会おう。',
                        isCorrect: false,
                        feedback: '待ち合わせは `at the station`、時刻は `at ten` が自然です。',
                    },
                    {
                        id: 'confirm-wrong-2',
                        english: 'Great. We meeting station at ten?',
                        meaning: 'よかった。10時に駅会う？',
                        isCorrect: false,
                        feedback: '主語と動詞の形が崩れています。ここは `Let\'s meet ...` がきれいです。',
                    },
                ],
            },
        ],
        writingChallenge: {
            title: '自分の言葉で海に誘う',
            instruction: '海に誘う一文か二文を、自分の英語で書いてみましょう。',
            hint: '相手・予定・ひとこと理由の3つが入ると自然にまとまりやすいです。',
            minWords: 8,
            targetWords: 18,
            placeholder: 'Example: Do you want to go to the beach with me this weekend?',
            checkpoints: ['beach', 'with me / together', 'this weekend / Saturday'],
        },
    },
];

export const getSeasonalEventById = (eventId) => (
    SEASONAL_EVENTS.find((event) => event.id === eventId) || null
);

const toDayStart = (dateLike) => {
    const date = new Date(dateLike);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const isSeasonalEventActive = (event, now = new Date()) => {
    if (!event?.startDate || !event?.endDate) {
        return false;
    }

    const current = toDayStart(now);
    const start = toDayStart(event.startDate);
    const end = toDayStart(event.endDate);

    return current >= start && current <= end;
};

export const getSeasonalEventRemainingDays = (event, now = new Date()) => {
    if (!event?.endDate) {
        return null;
    }

    const current = toDayStart(now);
    const end = toDayStart(event.endDate);
    const diff = end.getTime() - current.getTime();

    if (diff < 0) {
        return 0;
    }

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getSeasonalEventProgress = (stats, eventId) => {
    const progress = stats?.seasonalEvents?.[eventId];

    return {
        completed: Boolean(progress?.completed),
        rewardClaimed: Boolean(progress?.rewardClaimed),
        clearedAt: progress?.clearedAt || null,
        playCount: Math.max(0, Number(progress?.playCount) || 0),
        bestMistakes: Number.isFinite(Number(progress?.bestMistakes))
            ? Math.max(0, Number(progress.bestMistakes))
            : null,
        writingDraft: typeof progress?.writingDraft === 'string' ? progress.writingDraft : '',
        writingCompleted: Boolean(progress?.writingCompleted),
        writingSubmittedAt: progress?.writingSubmittedAt || null,
        writingScore: Number.isFinite(Number(progress?.writingScore))
            ? Math.max(0, Number(progress.writingScore))
            : null,
    };
};
