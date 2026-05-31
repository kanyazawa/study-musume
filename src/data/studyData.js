import { touchCloudSaveData } from '../utils/saveUtils';

// 学習トピックデータ
export const STUDY_DATA = {
    science: {
        name: '理科',
        chapters: [
            {
                id: 'biology',
                name: '生物',
                unlocked: true,
                progress: 3,
                total: 8,
                topics: [
                    { id: 'cell', name: '細胞', difficulty: 1, cleared: true },
                    { id: 'photosynthesis', name: '光合成', difficulty: 2, cleared: true },
                    { id: 'respiration', name: '呼吸', difficulty: 2, cleared: true },
                    { id: 'heredity', name: '遺伝', difficulty: 3, cleared: false },
                    { id: 'evolution', name: '進化', difficulty: 3, cleared: false },
                    { id: 'ecosystem', name: '生態系', difficulty: 4, cleared: false }
                ]
            },
            {
                id: 'chemistry',
                name: '化学',
                unlocked: true,
                progress: 2,
                total: 6,
                topics: [
                    { id: 'atomic_structure', name: '原子の構造', difficulty: 1, cleared: true },
                    { id: 'periodic_table', name: '周期表', difficulty: 2, cleared: true },
                    { id: 'chemical_bond', name: '化学結合', difficulty: 3, cleared: false },
                    { id: 'reaction', name: '化学反応', difficulty: 3, cleared: false },
                    { id: 'acid_base', name: '酸と塩基', difficulty: 3, cleared: false }
                ]
            },
            {
                id: 'earth_science',
                name: '地学',
                unlocked: false,
                progress: 0,
                total: 5,
                topics: []
            }
        ]
    },
    physics: {
        name: '物理',
        chapters: [
            {
                id: 'mechanics',
                name: '力学',
                unlocked: true,
                progress: 4,
                total: 10,
                topics: [
                    { id: 'uniform_acceleration', name: '等加速度運動', difficulty: 1, cleared: true },
                    { id: 'projectile', name: '放物運動', difficulty: 2, cleared: false },
                    { id: 'equation_of_motion', name: '運動方程式', difficulty: 3, cleared: false },
                    { id: 'equation_of_motion_2', name: '運動方程式', difficulty: 4, cleared: false }
                ]
            },
            {
                id: 'wave',
                name: '波動',
                unlocked: true,
                progress: 0,
                total: 5,
                topics: [
                    { id: 'wave_intro', name: '波の基本', difficulty: 2, cleared: false },
                    { id: 'interference', name: '干渉', difficulty: 3, cleared: false },
                    { id: 'diffraction', name: '回折', difficulty: 3, cleared: false },
                    { id: 'stationary_wave', name: '定常波', difficulty: 4, cleared: false },
                    { id: 'doppler', name: 'ドップラー効果', difficulty: 4, cleared: false }
                ]
            },
            {
                id: 'electromagnetism',
                name: '電磁気',
                unlocked: false,
                progress: 0,
                total: 8,
                topics: []
            }
        ]
    },
    english: {
        name: '英語',
        chapters: [
            {
                id: 'grammar',
                name: '文法',
                unlocked: true,
                progress: 5,
                total: 10,
                topics: [
                    { id: 'be_verb', name: 'be動詞', difficulty: 1, cleared: true },
                    { id: 'general_verb', name: '一般動詞', difficulty: 1, cleared: true },
                    { id: 'plural', name: '複数形', difficulty: 1, cleared: true },
                    { id: 'pronoun', name: '代名詞', difficulty: 2, cleared: true },
                    { id: 'third_person', name: '三単現のs', difficulty: 2, cleared: true },
                    { id: 'past_tense', name: '過去形', difficulty: 2, cleared: false }
                ]
            },
            {
                id: 'reading',
                name: '読解',
                unlocked: true,
                progress: 1,
                total: 6,
                topics: [
                    { id: 'short_passage', name: '短文読解', difficulty: 2, cleared: true },
                    { id: 'long_passage', name: '長文読解', difficulty: 3, cleared: false },
                    { id: 'comprehension', name: '内容理解', difficulty: 3, cleared: false },
                    { id: 'inference', name: '推論', difficulty: 4, cleared: false }
                ]
            },
            {
                id: 'listening',
                name: 'リスニング',
                unlocked: false,
                progress: 0,
                total: 5,
                topics: []
            }
        ]
    }
};

export const LAST_STUDY_TOPIC_STORAGE_KEY = 'lastStudyTopic';

const isBrowserStorageAvailable = () => (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
);

const sanitizeRelativeRoute = (routePath) => {
    const value = String(routePath || '').trim();
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
        return '';
    }

    return value;
};

export const buildStudyRouteFromItem = (item) => {
    if (!item) return '';

    if (item.level) {
        return `/multiplayer-match?mode=solo&level=${encodeURIComponent(item.level)}`;
    }

    if (item.mode === 'writing') {
        return `/writing${item.writingLevel ? `?level=${encodeURIComponent(item.writingLevel)}` : ''}`;
    }

    if (item.mode === 'reading') {
        return `/reading${item.readingLevel ? `?level=${encodeURIComponent(item.readingLevel)}` : ''}`;
    }

    if (item.id === 'eng_vocab_basic' || item.topic === '英単語') {
        return '/multiplayer-match?mode=solo';
    }

    if (item.topic) {
        return `/dialogue?topic=${encodeURIComponent(item.topic)}`;
    }

    return '';
};

export const getLevelLabel = (level) => {
    const labels = {
        grade5: '英検5級',
        grade4: '英検4級',
        grade3: '英検3級',
        grade_pre2: '英検準2級',
        grade2: '英検2級',
        grade_pre1: '英検準1級',
        grade1: '英検1級',
        custom: '自作単語',
    };

    return labels[level] || '';
};

const inferRouteFromLegacyTopic = (topic) => {
    if (!topic) return '';

    if (topic.routePath) {
        return sanitizeRelativeRoute(topic.routePath);
    }

    if (topic.mode === 'writing' || topic.chapterId === 'eng_writing') {
        return `/writing${topic.level ? `?level=${encodeURIComponent(topic.level)}` : ''}`;
    }

    if (topic.mode === 'reading' || topic.chapterId === 'eng_reading') {
        return `/reading${topic.level ? `?level=${encodeURIComponent(topic.level)}` : ''}`;
    }

    if (topic.mode === 'vocab' || topic.level || topic.chapterId === 'eng_vocab') {
        return `/multiplayer-match?mode=solo${topic.level ? `&level=${encodeURIComponent(topic.level)}` : ''}`;
    }

    if (topic.topicName) {
        return `/dialogue?topic=${encodeURIComponent(topic.topicName)}`;
    }

    return '';
};

export const normalizeLastStudyTopic = (topic) => {
    if (!topic || typeof topic !== 'object') {
        return null;
    }

    const routePath = inferRouteFromLegacyTopic(topic);
    if (!routePath) {
        return null;
    }

    const topicName = String(topic.topicName || topic.name || '').trim();
    const chapterName = String(topic.chapterName || topic.categoryName || topic.modeLabel || '').trim();
    const subjectName = String(topic.subjectName || topic.subject || '').trim();
    const label = String(topic.resumeLabel || topic.label || topicName || chapterName || '前回の続き').trim();

    return {
        subject: String(topic.subject || '').trim(),
        subjectName,
        chapterId: String(topic.chapterId || topic.categoryId || '').trim(),
        topicId: String(topic.topicId || topic.id || '').trim(),
        topicName: topicName || label,
        chapterName,
        categoryName: String(topic.categoryName || '').trim(),
        unitName: String(topic.unitName || '').trim(),
        mode: String(topic.mode || '').trim(),
        modeLabel: String(topic.modeLabel || '').trim(),
        level: String(topic.level || '').trim(),
        routePath,
        resumeLabel: label,
        savedAt: Number(topic.savedAt || Date.now()),
    };
};

// 最後に学習したトピックを取得する関数
export const getLastStudyTopic = () => {
    if (!isBrowserStorageAvailable()) {
        return null;
    }

    try {
        const lastTopic = window.localStorage.getItem(LAST_STUDY_TOPIC_STORAGE_KEY);
        if (!lastTopic) {
            return null;
        }

        return normalizeLastStudyTopic(JSON.parse(lastTopic));
    } catch {
        return null;
    }
};

// トピック学習開始時/完了時に保存する関数
export const saveLastStudyTopic = (subject, chapterId, topicId, topicName, chapterName, options = {}) => {
    if (!isBrowserStorageAvailable()) {
        return null;
    }

    const data = normalizeLastStudyTopic({
        subject,
        chapterId,
        topicId,
        topicName,
        chapterName,
        ...options,
        routePath: sanitizeRelativeRoute(options.routePath) || inferRouteFromLegacyTopic({
            subject,
            chapterId,
            topicId,
            topicName,
            chapterName,
            ...options,
        }),
        savedAt: Date.now(),
    });

    if (!data) {
        return null;
    }

    window.localStorage.setItem(LAST_STUDY_TOPIC_STORAGE_KEY, JSON.stringify(data));
    touchCloudSaveData();
    return data;
};

export const saveLastStudyTopicFromItem = (item, context = {}) => {
    const routePath = buildStudyRouteFromItem(item);
    if (!routePath) {
        return null;
    }

    const mode = item.level
        ? 'vocab'
        : item.mode || (item.id === 'eng_vocab_basic' || item.topic === '英単語' ? 'vocab' : 'lesson');
    const levelLabel = item.level ? getLevelLabel(item.level) : '';
    const topicName = item.topic || item.name || levelLabel || '前回の続き';
    const unitName = context.unitName || context.unit?.name || '';
    const categoryName = context.categoryName || context.category?.name || '';
    const subjectName = context.subjectName || context.subject?.name || '';
    const modeLabel = mode === 'vocab'
        ? '英単語'
        : mode === 'writing'
            ? '英検ライティング'
            : mode === 'reading'
                ? '長文読解'
                : categoryName;
    const resumeLabel = item.level
        ? `${levelLabel || item.name}の単語`
        : item.mode === 'writing'
            ? `${item.name || topicName}`
            : item.mode === 'reading'
                ? `${item.name || topicName}`
                : topicName;

    return saveLastStudyTopic(
        context.subject?.id || context.subjectId || '',
        context.category?.id || context.categoryId || '',
        item.id || item.topic || '',
        topicName,
        modeLabel || unitName,
        {
            routePath,
            subjectName,
            categoryName,
            unitName,
            mode,
            modeLabel,
            level: item.level || item.writingLevel || item.readingLevel || '',
            resumeLabel,
        }
    );
};

// 進捗データを取得する関数
export const getProgressData = () => {
    const saved = localStorage.getItem('studyProgress');
    if (saved) {
        return JSON.parse(saved);
    }
    return {};
};

// 進捗データを保存する関数
export const saveProgressData = (progressData) => {
    localStorage.setItem('studyProgress', JSON.stringify(progressData));
    touchCloudSaveData();
};

// トピックをクリア済みにする関数
export const markTopicCleared = (subject, chapterId, topicId) => {
    const progress = getProgressData();
    if (!progress[subject]) {
        progress[subject] = {};
    }
    if (!progress[subject][chapterId]) {
        progress[subject][chapterId] = {};
    }
    progress[subject][chapterId][topicId] = true;
    saveProgressData(progress);
};
