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

// 最後に学習したトピックを取得する関数
export const getLastStudyTopic = () => {
    const lastTopic = localStorage.getItem('lastStudyTopic');
    if (lastTopic) {
        return JSON.parse(lastTopic);
    }
    // デフォルト値
    return {
        subject: 'physics',
        chapterId: 'mechanics',
        topicId: 'equation_of_motion',
        topicName: '運動方程式',
        chapterName: '力学'
    };
};

// トピック学習完了時に保存する関数
export const saveLastStudyTopic = (subject, chapterId, topicId, topicName, chapterName) => {
    const data = {
        subject,
        chapterId,
        topicId,
        topicName,
        chapterName
    };
    localStorage.setItem('lastStudyTopic', JSON.stringify(data));
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
