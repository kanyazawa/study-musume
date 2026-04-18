export const RELATIONSHIP_EVENTS = [
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
