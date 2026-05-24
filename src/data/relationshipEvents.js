export const RELATIONSHIP_EVENTS = [
    {
        id: 'emma_event_01',
        characterId: 'emma',
        order: 1,
        title: '空き教室の合図',
        teaser: '放課後に会うことが、少しだけ当たり前になる。',
        requirements: {
            minAffectionLevel: 1,
            totals: {
                chat: 1,
            },
        },
        rewards: {
            affection: 20,
            diamonds: 10,
        },
        scenes: [
            { speaker: '高瀬エマ', text: '……来たんだ。なら、少しだけ話してから始めよ。' },
            { speaker: 'あなた', text: 'うん。エマがいると、ちゃんと来ようって思えるから。' },
            { speaker: '高瀬エマ', text: 'そういう言い方、少し困る。でも……悪くはない。' },
            { speaker: 'あなた', text: 'またここに来てもいい？' },
            { speaker: '高瀬エマ', text: 'いいよ。空いてる日は、だいたいここにいるから。' },
        ],
    },
    {
        id: 'emma_event_02',
        characterId: 'emma',
        order: 2,
        title: '途中式の横顔',
        teaser: '隣で勉強する空気が、少し自然になる。',
        requirements: {
            minAffectionLevel: 2,
            totals: {
                study: 2,
            },
        },
        rewards: {
            affection: 25,
            diamonds: 10,
        },
        scenes: [
            { speaker: '高瀬エマ', text: '前より、途中で止まらなくなったね。考え方が繋がってきてる。' },
            { speaker: 'あなた', text: 'エマが横で見てくれてるからかも。ひとりより落ち着く。' },
            { speaker: '高瀬エマ', text: '……それなら、見てる意味はあるかな。' },
            { speaker: 'あなた', text: 'こういう時間、けっこう好きかもしれない。' },
            { speaker: '高瀬エマ', text: 'じゃあ、もう少しだけ続けよ。今の集中、切らしたくないし。' },
        ],
    },
    {
        id: 'emma_event_03',
        characterId: 'emma',
        order: 3,
        title: 'ちゃんと覚えてる',
        teaser: '渡した気持ちは、静かに残っていた。',
        requirements: {
            minAffectionLevel: 3,
            totals: {
                gift: 1,
            },
        },
        rewards: {
            affection: 30,
            diamonds: 15,
        },
        scenes: [
            { speaker: 'あなた', text: 'そのしおり、まだ使ってくれてるんだ。' },
            { speaker: '高瀬エマ', text: '使いやすいし……もらったもの、雑には扱いたくないから。' },
            { speaker: 'あなた', text: '気に入ってくれたなら嬉しい。' },
            { speaker: '高瀬エマ', text: 'うん。ちゃんと考えて選んでくれたの、分かってる。' },
            { speaker: 'あなた', text: 'また何か役に立ちそうなの見つけたら持ってくるよ。' },
            { speaker: '高瀬エマ', text: '……期待してる、って言ったら調子に乗る？' },
        ],
    },
    {
        id: 'emma_event_04',
        characterId: 'emma',
        order: 4,
        title: '隣にいる理由',
        teaser: '一緒に進める時間が、少し特別に変わっていく。',
        requirements: {
            minAffectionLevel: 4,
            totals: {
                study: 4,
                chat: 3,
            },
        },
        rewards: {
            affection: 40,
            diamonds: 20,
        },
        scenes: [
            { speaker: '高瀬エマ', text: '最近、ここで待つのが前より自然になってきた。' },
            { speaker: 'あなた', text: '俺が来る前提で？' },
            { speaker: '高瀬エマ', text: '……そう。来ないと、少しだけ静かすぎるから。' },
            { speaker: 'あなた', text: 'じゃあ、これからも来るよ。' },
            { speaker: '高瀬エマ', text: 'うん。次も、ちゃんと続きを見よう。今はそれがいちばん自然。' },
        ],
    },
    {
        id: 'noah_event_01',
        characterId: 'noah',
        order: 1,
        title: '放課後のひとこと',
        teaser: '少しだけ、話しかけやすい空気になる。',
        requirements: {
            minAffectionLevel: 1,
            totals: {
                chat: 1,
            },
        },
        rewards: {
            affection: 20,
            diamonds: 10,
        },
        scenes: [
            { speaker: 'ノア', text: '......また来たの。' },
            { speaker: 'あなた', text: 'うん。少しだけ話したくて。' },
            { speaker: 'ノア', text: 'ふうん。前みたいに、すぐ帰れとは言わないわよ。' },
            { speaker: 'あなた', text: 'それって、ちょっと嬉しいかも。' },
            { speaker: 'ノア', text: 'べ、別に深い意味はないってば。......でも、また来てもいいわよ。' },
        ],
    },
    {
        id: 'noah_event_02',
        characterId: 'noah',
        order: 2,
        title: '並んで勉強',
        teaser: '一緒に勉強する時間が、少し自然になる。',
        requirements: {
            minAffectionLevel: 2,
            totals: {
                study: 2,
            },
        },
        rewards: {
            affection: 25,
            diamonds: 10,
        },
        scenes: [
            { speaker: 'ノア', text: 'はい、今日はここまで解いてみなさい。' },
            { speaker: 'あなた', text: '前よりはついていけてる気がする。' },
            { speaker: 'ノア', text: '......そうね。アンタ、前よりちゃんと考えて答えてる。' },
            { speaker: 'あなた', text: 'ノアが付き合ってくれてるからだよ。' },
            { speaker: 'ノア', text: 'そういうこと、急に言わないで。......でも、その調子ならもっと伸びるわ。' },
        ],
    },
    {
        id: 'noah_event_03',
        characterId: 'noah',
        order: 3,
        title: '覚えていた贈り物',
        teaser: '渡した気持ちは、ちゃんと残っていた。',
        requirements: {
            minAffectionLevel: 3,
            totals: {
                gift: 1,
            },
        },
        rewards: {
            affection: 30,
            diamonds: 15,
        },
        scenes: [
            { speaker: 'あなた', text: 'それ、この前の......？' },
            { speaker: 'ノア', text: '見ればわかるでしょ。まだ使ってるわよ。' },
            { speaker: 'あなた', text: '気に入ってくれたんだ。' },
            { speaker: 'ノア', text: '......こういうの、けっこう覚えてるから。軽い気持ちで渡したなら困るんだけど。' },
            { speaker: 'あなた', text: 'ちゃんと考えて選んだよ。' },
            { speaker: 'ノア', text: 'なら、いいわ。......ありがとう。' },
        ],
    },
    {
        id: 'noah_event_04',
        characterId: 'noah',
        order: 4,
        title: '隣が落ち着く',
        teaser: 'いつの間にか、隣にいることが当たり前になっていく。',
        requirements: {
            minAffectionLevel: 4,
            totals: {
                study: 4,
                chat: 3,
            },
        },
        rewards: {
            affection: 40,
            diamonds: 20,
        },
        scenes: [
            { speaker: 'ノア', text: '最近、アンタが隣にいるの普通になってきたわね。' },
            { speaker: 'あなた', text: '嫌じゃない？' },
            { speaker: 'ノア', text: '......嫌なら、とっくに追い返してる。' },
            { speaker: 'あなた', text: 'じゃあ、いてもいい？' },
            { speaker: 'ノア', text: 'そういう聞き方、ずるいのよ。......でも前より、隣が落ち着くのは本当。' },
        ],
    },
];

export const getRelationshipEventsByCharacter = (characterId = 'noah') =>
    RELATIONSHIP_EVENTS
        .filter((event) => event.characterId === characterId)
        .sort((a, b) => a.order - b.order);

export const getRelationshipEventById = (eventId) =>
    RELATIONSHIP_EVENTS.find((event) => event.id === eventId) || null;
