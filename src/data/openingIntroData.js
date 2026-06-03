const OPENING_VARIANTS = {
    noah: {
        partnerName: 'ノア',
        chapterTitle: 'プロローグ',
        lead: '退屈な日々のとなり席',
        scenes: [
            {
                speaker: 'partner',
                emotion: 'serious',
                text: 'そんなに退屈そうな顔しないで。今日から隣の席になったノアよ。転校初日から寝られると、こっちまで気が抜けるんだけど。'
            },
            {
                speaker: 'you',
                emotion: 'normal',
                text: '転校生……しかも帰国子女？ ずっと同じ毎日のままだと思ってたのに、急に教室の空気が変わった気がする。'
            },
            {
                speaker: 'partner',
                emotion: 'normal',
                text: '別に期待しなくていいけど、勉強くらいなら見てあげる。放課後、少しだけ残りなさい。赤点まみれのままじゃ、見ていられないし。'
            },
            {
                speaker: 'partner',
                emotion: 'serious',
                text: 'ホームでは TP と残り日数だけ見ておけば十分。迷ったら「授業へ」。変に悩むより、まず一回進めた方が早いわ。'
            },
            {
                speaker: 'partner',
                emotion: 'happy',
                text: '間違えた問題は「弱点ノート」に残るから、そこを埋めていきなさい。退屈な毎日を変えたいなら、ちゃんと積み上げること。'
            },
            {
                speaker: 'partner',
                emotion: 'smile',
                text: 'じゃ、最初の一歩。今日は私が隣で見ててあげる。退屈だった放課後が少し変わるかどうかは、あんた次第よ。'
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
    firefly: {
        partnerName: 'ホタル',
        chapterTitle: 'プロローグ',
        lead: '試作パートナー、起動',
        scenes: [
            {
                speaker: 'partner',
                emotion: 'serious',
                text: '待たせたわね。今日から私が、あんたの勉強を見る。まずは無理に全部やろうとしないで、一回ちゃんと進めるところからよ。'
            },
            {
                speaker: 'you',
                emotion: 'normal',
                text: '助かる……。やる気はあるんだけど、何から触ればいいのかいつも散らかっちゃって。'
            },
            {
                speaker: 'partner',
                emotion: 'normal',
                text: 'ホームでは TP と本番までの日数を見なさい。迷ったら「授業へ」からでいいわ。動きながら整えればいいの。'
            },
            {
                speaker: 'partner',
                emotion: 'serious',
                text: '間違えた問題は「弱点ノート」に残るから、そこを回すだけでも進み方が変わる。新しい問題だけ追うのは後でもできるわ。'
            },
            {
                speaker: 'partner',
                emotion: 'happy',
                text: '「課題」は毎日の区切り、「ストーリー」は続けた分だけ開く。小さく進めても、積み上がればちゃんと形になるわ。'
            },
            {
                speaker: 'partner',
                emotion: 'smile',
                text: 'じゃ、試しに一回やってみましょ。完璧じゃなくていいから、今日は私と一緒に前へ出るの。'
            },
        ],
    },
    sparkle: {
        partnerName: '花火',
        chapterTitle: 'プロローグ',
        lead: '退屈しのぎの共犯者',
        scenes: [
            {
                speaker: 'partner',
                emotion: 'smile',
                text: 'やっと来たね。今日から君の勉強、わたしがちょっと面白くしてあげる。まずは肩の力を抜いて、一回ちゃんと進めてみようか。'
            },
            {
                speaker: 'you',
                emotion: 'normal',
                text: '助かるよ……。やる気はあるんだけど、何から手をつければいいか迷ってばかりで。'
            },
            {
                speaker: 'partner',
                emotion: 'normal',
                text: 'ホームでは TP と本番までの日数を見れば十分。迷ったら「授業へ」、それだけ覚えておけば最初は平気だよ。'
            },
            {
                speaker: 'partner',
                emotion: 'serious',
                text: '間違えた問題は「弱点ノート」に残るから、そこを回収すると伸び方が変わる。新しい問題ばかり追うのは、そのあとでも遅くないよ。'
            },
            {
                speaker: 'partner',
                emotion: 'happy',
                text: '「課題」は毎日のごほうび、「ストーリー」は続けたぶんだけ開いていく。小さく進めても、積み重なるとちゃんと効いてくるから。'
            },
            {
                speaker: 'partner',
                emotion: 'smile',
                text: 'じゃあ始めようか。今日はわたしと一緒に、一歩だけでも前へ出る。それだけで十分だよ。'
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
