import { getAffectionLevel, getNextLevel, getPointsToNextLevel } from './affectionUtils';

const MAX_RELATIONSHIP_MOMENTS = 6;
const RELATIONSHIP_TYPES = ['talk', 'chat', 'study', 'gift'];
const DEFAULT_DAILY_STATE = {
    date: '',
    talk: 0,
    chat: 0,
    study: 0,
    gift: 0,
};

const STAGE_COPY = [
    { maxLevel: 1, text: 'まだ少しぎこちない時期。声をかける回数が、そのまま安心感につながる。' },
    { maxLevel: 3, text: '勉強や雑談を重ねるたびに、友達らしい近さが育っている。' },
    { maxLevel: 5, text: '頼り合う空気ができ始めている。頑張りを共有すると、関係が深まりやすい。' },
    { maxLevel: 7, text: '特別扱いが自然に増える段階。印象に残る交流ほど、気持ちに強く響く。' },
    { maxLevel: 10, text: 'もう日常の中で欠かせない相手。小さなやり取りでも温度がしっかり残る。' },
];

const clipText = (value, maxLength = 72) => String(value || '').trim().slice(0, maxLength);

const toDateKey = (timestamp = Date.now()) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const sanitizeDailyState = (dailyState = {}, timestamp = Date.now()) => {
    const date = toDateKey(timestamp);

    if (dailyState?.date !== date) {
        return { ...DEFAULT_DAILY_STATE, date };
    }

    return {
        ...DEFAULT_DAILY_STATE,
        ...dailyState,
        date,
    };
};

export const getRelationshipMoments = (stats = {}) =>
    Array.isArray(stats?.relationshipMoments)
        ? stats.relationshipMoments.filter((moment) => moment && moment.summary)
        : [];

export const getRelationshipDaily = (stats = {}, timestamp = Date.now()) =>
    sanitizeDailyState(stats?.relationshipDaily, timestamp);

export const recordRelationshipMoment = (stats = {}, momentInput = {}) => {
    const timestamp = Number.isFinite(momentInput?.timestamp) ? momentInput.timestamp : Date.now();
    const type = RELATIONSHIP_TYPES.includes(momentInput?.type) ? momentInput.type : 'talk';
    const summary = clipText(momentInput?.summary || '少し距離が縮まった。', 44);
    const detail = clipText(momentInput?.detail || '', 96);
    const affectionDelta = Number.isFinite(Number(momentInput?.affectionDelta))
        ? Number(momentInput.affectionDelta)
        : 0;
    const currentDaily = getRelationshipDaily(stats, timestamp);

    const nextDaily = {
        ...currentDaily,
        [type]: (currentDaily[type] || 0) + 1,
    };

    const nextMoment = {
        id: `${timestamp.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        summary,
        detail,
        affectionDelta,
        createdAt: timestamp,
        count: 1,
    };

    const previousMoments = getRelationshipMoments(stats);
    const latestMoment = previousMoments[0];
    const shouldMergeWithLatest = latestMoment
        && latestMoment.type === nextMoment.type
        && latestMoment.summary === nextMoment.summary
        && Math.abs(timestamp - Number(latestMoment.createdAt || 0)) <= 1000 * 60 * 20;

    const nextMoments = shouldMergeWithLatest
        ? [
            {
                ...latestMoment,
                detail: nextMoment.detail || latestMoment.detail || '',
                affectionDelta: Number(latestMoment.affectionDelta || 0) + affectionDelta,
                createdAt: timestamp,
                count: Number(latestMoment.count || 1) + 1,
            },
            ...previousMoments.slice(1),
        ]
        : [nextMoment, ...previousMoments].slice(0, MAX_RELATIONSHIP_MOMENTS);

    return {
        relationshipDaily: nextDaily,
        relationshipMoments: nextMoments,
        relationshipLastInteractionAt: timestamp,
    };
};

const getStageCopy = (level) =>
    STAGE_COPY.find((entry) => level <= entry.maxLevel)?.text || STAGE_COPY[STAGE_COPY.length - 1].text;

const getRhythmLabel = (daily) => {
    const score = (daily.chat || 0) * 2 + (daily.study || 0) * 2 + (daily.gift || 0) * 3 + (daily.talk || 0);

    if (score >= 9) return 'かなりいい雰囲気';
    if (score >= 5) return '今日は距離が近い';
    if (score >= 2) return '少しずつ打ち解け中';
    return '今日の交流はこれから';
};

const getFocusCopy = (daily) => {
    const entries = [
        { type: 'gift', value: daily.gift || 0, text: 'プレゼントの余韻がいちばん強く残っている。' },
        { type: 'study', value: daily.study || 0, text: '一緒に勉強した時間が、信頼に変わってきている。' },
        { type: 'chat', value: daily.chat || 0, text: '会話が増えて、気持ちを預けやすくなっている。' },
        { type: 'talk', value: daily.talk || 0, text: 'こまめに顔を合わせる習慣が、安心感を育てている。' },
    ].sort((a, b) => b.value - a.value);

    if (!entries[0] || entries[0].value <= 0) {
        return '今日はまだ大きな動きはないけれど、少し話すだけでも空気は変わる。';
    }

    return entries[0].text;
};

const getNextHint = ({ daily, levelInfo, nextLevel, pointsToNext }) => {
    if (!nextLevel) {
        return '今は最上位の関係。何気ない会話でも、ちゃんと特別な時間になる。';
    }

    if ((daily.chat || 0) === 0) {
        return `あと${pointsToNext}ptで「${nextLevel.title}」。まずは少し会話して空気をやわらかくしたい。`;
    }

    if ((daily.study || 0) === 0 && levelInfo.level >= 2) {
        return `あと${pointsToNext}ptで「${nextLevel.title}」。一緒に勉強すると、今の関係が安定しやすい。`;
    }

    if ((daily.gift || 0) === 0 && pointsToNext >= 400) {
        return `あと${pointsToNext}ptで「${nextLevel.title}」。印象に残るプレゼントがあると、一気に近づきやすい。`;
    }

    return `あと${pointsToNext}ptで「${nextLevel.title}」。今日の流れを保てば、ちゃんと次の段階が見えてくる。`;
};

export const getRelationshipSnapshot = (stats = {}) => {
    const affection = Number(stats?.affection || 0);
    const levelInfo = getAffectionLevel(affection);
    const nextLevel = getNextLevel(levelInfo.level);
    const pointsToNext = getPointsToNextLevel(affection);
    const daily = getRelationshipDaily(stats);
    const moments = getRelationshipMoments(stats);
    const latestMoment = moments[0] || null;

    return {
        stageLabel: levelInfo.title,
        stageDescription: getStageCopy(levelInfo.level),
        rhythmLabel: getRhythmLabel(daily),
        focusCopy: getFocusCopy(daily),
        latestMomentTitle: latestMoment?.summary || 'まだ特別な交流は記録されていない',
        latestMomentDetail: latestMoment?.detail || '会話や勉強、プレゼントを重ねると、ここに最近の空気感が残っていく。',
        nextHint: getNextHint({ daily, levelInfo, nextLevel, pointsToNext }),
        daily,
    };
};
