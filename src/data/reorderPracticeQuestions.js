const REORDER_PRACTICE_QUESTIONS = [
    {
        id: 'reorder-1',
        prompt: '「私は放課後に英語を勉強します」',
        answer: 'I study English after school.',
        tokens: ['I', 'study', 'English', 'after', 'school.'],
    },
    {
        id: 'reorder-2',
        prompt: '「彼は毎朝6時に起きます」',
        answer: 'He gets up at six every morning.',
        tokens: ['He', 'gets', 'up', 'at', 'six', 'every', 'morning.'],
    },
    {
        id: 'reorder-3',
        prompt: '「私たちは図書館で宿題をしました」',
        answer: 'We did our homework in the library.',
        tokens: ['We', 'did', 'our', 'homework', 'in', 'the', 'library.'],
    },
    {
        id: 'reorder-4',
        prompt: '「あなたはこの歌を知っていますか」',
        answer: 'Do you know this song?',
        tokens: ['Do', 'you', 'know', 'this', 'song?'],
    },
    {
        id: 'reorder-5',
        prompt: '「彼女は昨日新しい自転車を買いました」',
        answer: 'She bought a new bike yesterday.',
        tokens: ['She', 'bought', 'a', 'new', 'bike', 'yesterday.'],
    },
    {
        id: 'reorder-6',
        prompt: '「私は週末に祖母を訪ねる予定です」',
        answer: 'I am going to visit my grandmother this weekend.',
        tokens: ['I', 'am', 'going', 'to', 'visit', 'my', 'grandmother', 'this', 'weekend.'],
    },
    {
        id: 'reorder-7',
        prompt: '「この部屋はその会議には小さすぎます」',
        answer: 'This room is too small for the meeting.',
        tokens: ['This', 'room', 'is', 'too', 'small', 'for', 'the', 'meeting.'],
    },
    {
        id: 'reorder-8',
        prompt: '「雨が降っていたので、私たちは家にいました」',
        answer: 'We stayed home because it was raining.',
        tokens: ['We', 'stayed', 'home', 'because', 'it', 'was', 'raining.'],
    },
];

export const buildReorderPracticeQuestions = () => {
    const now = Date.now();

    return REORDER_PRACTICE_QUESTIONS.map((question, index) => ({
        id: question.id,
        subject: '英語 並び替え',
        questionId: question.id,
        questionText: `${question.prompt} を英語に並び替えよう`,
        correctAnswer: question.answer,
        questionType: 'reorder',
        tokens: question.tokens,
        wrongCount: 1 + (index % 3),
        reviewLevel: Math.min(index % 2, 1),
        nextReviewDate: now + (index * 30 * 60 * 1000),
        reviewHistory: [],
        userAnswer: '',
    }));
};

