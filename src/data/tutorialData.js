import ClassroomBackground from '../assets/images/bg_classroom.webp';
import NoahPortrait from '../assets/images/noah_normal.webp';
import RenPortrait from '../assets/images/ren_normal.webp';
import HotaruPortrait from '../assets/images/firefly/firefly_normal.webp';

export const TUTORIAL_BACKGROUND_IMAGE = ClassroomBackground;

export const TUTORIAL_OPENING_LINES = [
    'こんな退屈そうな顔してる人、はじめて見た。今日から隣の席になったノアよ。',
    '帰国子女だからって何でもできるわけじゃないけど、勉強くらいなら見てあげる。',
    '放課後、少しだけ付き合いなさい。あんたの毎日、ちょっとはマシにしてあげる。',
];

export const TUTORIAL_CHARACTERS = [
    {
        id: 'noah',
        name: 'ノア',
        archetype: 'ツンデレ幼なじみ',
        description: '面倒見はいいけど、素直じゃないタイプ。',
        image: NoahPortrait,
    },
    {
        id: 'ren',
        name: 'レン',
        archetype: '甘やかし先輩',
        description: 'やさしく背中を押してくれる頼れる先輩。',
        image: RenPortrait,
    },
    {
        id: 'hotaru',
        name: 'ホタル',
        archetype: '少し重い同級生',
        description: '距離感は近め。でも一緒に頑張ってくれる。',
        image: HotaruPortrait,
    },
];

export const TUTORIAL_QUIZ_QUESTIONS = [
    {
        id: 'apple',
        prompt: 'apple',
        choices: ['りんご', '学校', '水', '友達'],
        correctIndex: 0,
    },
    {
        id: 'school',
        prompt: 'school',
        choices: ['本', '先生', '学校', '机'],
        correctIndex: 2,
    },
    {
        id: 'book',
        prompt: 'book',
        choices: ['本', '窓', 'えんぴつ', '犬'],
        correctIndex: 0,
    },
    {
        id: 'water',
        prompt: 'water',
        choices: ['火', '空', '水', '雲'],
        correctIndex: 2,
    },
    {
        id: 'friend',
        prompt: 'friend',
        choices: ['先生', '友達', '家族', '駅'],
        correctIndex: 1,
    },
];

export const TUTORIAL_QUIZ_REWARDS = {
    correct: {
        affection: 5,
        gems: 20,
        line: '…やるじゃん',
    },
    incorrect: {
        affection: 0,
        gems: 5,
        line: 'まぁ、最初だし次いこ',
    },
    resultBonusGems: 1000,
};

export const TUTORIAL_GACHA_RESULTS = [
    {
        id: 'tutorial-ssr-noah-memory',
        name: '放課後、二人だけの教室',
        rarity: 'SSR',
        type: 'memory',
        emoji: '✨',
        description: 'ノアの思い出カード',
    },
    {
        id: 'tutorial-sr-noah-voice',
        name: 'ノアの特別ボイス',
        rarity: 'SR',
        type: 'voice',
        emoji: '🎙️',
        description: '特別なひとことボイス',
    },
    {
        id: 'tutorial-r-memory-piece-01',
        name: 'メモリーピース',
        rarity: 'R',
        type: 'material',
        emoji: '🧩',
        description: '思い出を育てる欠片',
    },
    {
        id: 'tutorial-r-memory-piece-02',
        name: 'メモリーピース',
        rarity: 'R',
        type: 'material',
        emoji: '🧩',
        description: '思い出を育てる欠片',
    },
    {
        id: 'tutorial-r-memory-piece-03',
        name: 'メモリーピース',
        rarity: 'R',
        type: 'material',
        emoji: '🧩',
        description: '思い出を育てる欠片',
    },
    {
        id: 'tutorial-r-memory-piece-04',
        name: 'メモリーピース',
        rarity: 'R',
        type: 'material',
        emoji: '🧩',
        description: '思い出を育てる欠片',
    },
    {
        id: 'tutorial-r-memory-piece-05',
        name: 'メモリーピース',
        rarity: 'R',
        type: 'material',
        emoji: '🧩',
        description: '思い出を育てる欠片',
    },
    {
        id: 'tutorial-r-memory-piece-06',
        name: 'メモリーピース',
        rarity: 'R',
        type: 'material',
        emoji: '🧩',
        description: '思い出を育てる欠片',
    },
    {
        id: 'tutorial-r-memory-piece-07',
        name: 'メモリーピース',
        rarity: 'R',
        type: 'material',
        emoji: '🧩',
        description: '思い出を育てる欠片',
    },
    {
        id: 'tutorial-r-memory-piece-08',
        name: 'メモリーピース',
        rarity: 'R',
        type: 'material',
        emoji: '🧩',
        description: '思い出を育てる欠片',
    },
];

export const TUTORIAL_EVENT_LINES = [
    '転校初日なのに、もう放課後まで付き合ってるなんて変な感じ。',
    'でも、退屈だった毎日よりは少しだけ面白いかも。',
    'だから明日も来なさいよ。隣の席なんだし、それくらい当然でしょ。',
];

export const TUTORIAL_HOME_LINE = '明日も放課後、ちゃんと来ること。';
