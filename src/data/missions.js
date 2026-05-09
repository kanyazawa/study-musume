/**
 * デイリーミッション定義
 */

export const MISSION_TYPES = {
    STUDY_ONCE: 'study_once',
    STUDY_THREE_SUBJECTS: 'study_three_subjects',
    STUDY_FIVE_TIMES: 'study_five_times',
    STUDY_30_MIN: 'study_30_min',
    PERFECT_SCORE: 'perfect_score',
    INTERACT_CHARACTER: 'interact_character',
    OPEN_STORY: 'open_story',
    WRITE_DAILY_NOTE: 'write_daily_note',
};

export const DAILY_MISSIONS = [
    {
        id: 'daily_study_once',
        type: MISSION_TYPES.STUDY_ONCE,
        title: '初めの一歩',
        description: '1回勉強する',
        icon: '📖',
        target: 1,
        rewards: {
            diamonds: 5,
            intellect: 10,
        },
    },
    {
        id: 'daily_study_three',
        type: MISSION_TYPES.STUDY_THREE_SUBJECTS,
        title: '幅広く学習',
        description: '3つの科目を勉強する',
        icon: '📚',
        target: 3,
        rewards: {
            diamonds: 10,
            intellect: 20,
        },
    },
    {
        id: 'daily_study_five',
        type: MISSION_TYPES.STUDY_FIVE_TIMES,
        title: '継続は力なり',
        description: '5回勉強する',
        icon: '🔥',
        target: 5,
        rewards: {
            diamonds: 15,
            intellect: 30,
        },
    },
    {
        id: 'daily_study_time',
        type: MISSION_TYPES.STUDY_30_MIN,
        title: '時間をかけて',
        description: '合計30分勉強する',
        icon: '⏰',
        target: 30, // 分
        rewards: {
            diamonds: 20,
            intellect: 40,
        },
    },
    {
        id: 'daily_perfect',
        type: MISSION_TYPES.PERFECT_SCORE,
        title: 'パーフェクト',
        description: '1回満点を取る',
        icon: '⭐',
        target: 1,
        rewards: {
            diamonds: 25,
            intellect: 50,
        },
    },
    {
        id: 'daily_interact',
        type: MISSION_TYPES.INTERACT_CHARACTER,
        title: 'コミュニケーション',
        description: 'キャラクターと会話する',
        icon: '💬',
        target: 1,
        rewards: {
            diamonds: 5,
            intellect: 5,
        },
    },
    {
        id: 'daily_story',
        type: MISSION_TYPES.OPEN_STORY,
        title: 'ストーリー',
        description: 'ストーリーを読む',
        icon: '📖',
        target: 1,
        rewards: {
            diamonds: 5,
            intellect: 5,
        },
    },
    {
        id: 'daily_note',
        type: MISSION_TYPES.WRITE_DAILY_NOTE,
        title: 'ひとことメモ',
        description: '今日のメモを書く',
        icon: '📝',
        target: 1,
        rewards: {
            diamonds: 5,
            intellect: 8,
        },
    },
];

/**
 * ミッションの進捗状態を初期化
 */
export const getInitialMissionProgress = () => {
    const progress = {};
    DAILY_MISSIONS.forEach(mission => {
        progress[mission.id] = {
            current: 0,
            claimed: false,
            completed: false,
        };
    });
    return progress;
};
