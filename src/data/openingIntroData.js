const OPENING_VARIANTS = {
    noah: {
        partnerName: 'ノア',
        chapterTitle: 'プロローグ',
        lead: '放課後補習、はじまり',
        scenes: [
            {
                speaker: 'partner',
                emotion: 'serious',
                text: 'やっと来たわね。今日から私が、あんたの勉強を見る。まずは赤点回避。そこから先を狙うわよ。'
            },
            {
                speaker: 'you',
                emotion: 'normal',
                text: 'ほんとに助けてくれるの？ 正直、何から手をつければいいかもわからなくて……'
            },
            {
                speaker: 'partner',
                emotion: 'normal',
                text: 'ホームでは TP と本番までの日数を確認。迷ったら「授業へ」を押しなさい。青いボタン、見失わないで。'
            },
            {
                speaker: 'partner',
                emotion: 'serious',
                text: '間違えた問題は「弱点ノート」に残るわ。新しい問題ばかり追うより、そこで穴を埋める方が伸びやすいの。'
            },
            {
                speaker: 'partner',
                emotion: 'happy',
                text: '「課題」は毎日のごほうび、「ストーリー」は仲が深まると開く。続ければ、ちゃんと景色は変わっていくわ。'
            },
            {
                speaker: 'partner',
                emotion: 'smile',
                text: 'じゃ、最初の一歩。今日は私と一緒に、短くても一回進めましょ。逃げるのは禁止だからね。'
            },
        ],
    },
    ren: {
        partnerName: 'レン',
        chapterTitle: 'プロローグ',
        lead: '静かな放課後の約束',
        scenes: [
            {
                speaker: 'partner',
                emotion: 'serious',
                text: '来たか。今日から俺が勉強を見る。まずは立て直しだ。焦らなくていい、順番にやれば間に合う。'
            },
            {
                speaker: 'you',
                emotion: 'normal',
                text: '助かるよ……。やる気はあるんだけど、何から始めればいいのか全然まとまってなくて。'
            },
            {
                speaker: 'partner',
                emotion: 'normal',
                text: 'ホームでは TP と本番までの日数を見ろ。迷ったら「授業へ」から入ればいい。まずは一周、流れを掴もう。'
            },
            {
                speaker: 'partner',
                emotion: 'serious',
                text: '間違えた問題は「弱点ノート」に残る。苦手を放置しない。それだけで、点の伸び方はかなり変わる。'
            },
            {
                speaker: 'partner',
                emotion: 'relaxed',
                text: '「課題」を片づければ報酬が入るし、「ストーリー」は続けた分だけ積み上がる。習慣にできれば強い。'
            },
            {
                speaker: 'partner',
                emotion: 'happy',
                text: '準備は十分だ。最初の一歩だけ、俺が横で見ていてやる。まずは始めよう。'
            },
        ],
    },
};

export const getOpeningIntroContent = (characterId = 'noah') =>
    OPENING_VARIANTS[characterId] || OPENING_VARIANTS.noah;

export const OPENING_GUIDE_CARDS = [
    {
        title: '授業へ',
        body: '新しい問題を進める入口。迷ったらまずここから。'
    },
    {
        title: '弱点ノート',
        body: '間違えた問題を回収する場所。伸びやすさが変わる。'
    },
    {
        title: '課題と物語',
        body: 'デイリー報酬と関係の進展。続ける理由を増やせる。'
    },
];
