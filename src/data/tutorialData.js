import ClassroomBackground from '../assets/images/bg_classroom.webp';
import EmmaPortrait from '../assets/images/emma_home_preview_generated.png';

export const TUTORIAL_BACKGROUND_IMAGE = ClassroomBackground;

export const TUTORIAL_OPENING_LINES = [
    'まだ残ってたんだ。もうみんな帰ったと思ってた。',
    '……そのノート、英語のとこで止まってる。',
    '難しい単元の前に、基礎が少し曖昧かも。',
    '今日は長くやらなくていい。ひとつだけ、一緒に確認しよ。',
    '現在完了とかより先に、まず be動詞。そこ揃えたほうが早いから。',
];

export const TUTORIAL_CHARACTERS = [
    {
        id: 'emma',
        name: '高瀬エマ',
        archetype: '帰国子女の同級生',
        description: '放課後に英語を見てくれる、少し不器用な学習パートナー。',
        image: EmmaPortrait,
    },
];

export const TUTORIAL_QUIZ_QUESTIONS = [
    {
        id: 'be-verb-intro',
        prompt: 'I ___ a student.',
        choices: ['am', 'are', 'is', 'be'],
        correctIndex: 0,
        lessonTitle: 'be動詞の基本',
        lessonHint: '難しいところへ進む前に、ここだけ先に揃えよ。',
    },
];

export const TUTORIAL_QUIZ_REWARDS = {
    correct: {
        affection: 6,
        gems: 20,
        line: 'うん、合ってる。そうやって一個ずつ揃えればいい。',
    },
    incorrect: {
        affection: 0,
        gems: 5,
        line: '大丈夫。焦らなくていいから、主語に合わせてもう一回だけ見よ。',
    },
};

export const TUTORIAL_RESULT_LINES = [
    'さっきより迷い方が減ってた。最初としては十分。',
    '……続けられる人なんだ、って少し見直したかも。',
    '明日も来るなら、次はこの続きまで一緒に見れる。',
];

export const TUTORIAL_EVENT_LINES = [
    'この時間、空き教室なら静かでちょうどいいから。',
    '明日もここにいる。来るなら、途中で投げないで。',
    '……別に義務じゃないけど。',
    'でも、来たらちゃんと続きを見るよ。',
];

export const TUTORIAL_HOME_LINE = '今日は長くやらなくていい。まず一個だけ、一緒に見よ。';
