/**
 * デイリーミッション管理ユーティリティ
 */

import { DAILY_MISSIONS, MISSION_TYPES, getInitialMissionProgress } from '../data/missions';

const MISSION_STORAGE_KEY = 'dailyMissions';
const LAST_RESET_KEY = 'lastMissionReset';

/**
 * 今日の日付文字列を取得 (YYYY-MM-DD)
 */
const getTodayString = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

/**
 * ミッションデータをlocalStorageから読み込み
 */
export const loadMissions = () => {
    try {
        const savedData = localStorage.getItem(MISSION_STORAGE_KEY);
        const lastReset = localStorage.getItem(LAST_RESET_KEY);
        const today = getTodayString();

        // 日付が変わっていたらリセット
        if (lastReset !== today) {
            console.log('New day detected, resetting missions');
            const freshProgress = getInitialMissionProgress();
            saveMissions(freshProgress);
            localStorage.setItem(LAST_RESET_KEY, today);
            return freshProgress;
        }

        if (savedData) {
            return JSON.parse(savedData);
        }

        // 初回起動時
        const initialProgress = getInitialMissionProgress();
        saveMissions(initialProgress);
        localStorage.setItem(LAST_RESET_KEY, today);
        return initialProgress;
    } catch (error) {
        console.error('Error loading missions:', error);
        return getInitialMissionProgress();
    }
};

/**
 * ミッションデータをlocalStorageに保存
 */
export const saveMissions = (missionProgress) => {
    try {
        localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(missionProgress));
    } catch (error) {
        console.error('Error saving missions:', error);
    }
};

/**
 * ミッション進捗を更新
 * @param {string} missionType - ミッションタイプ
 * @param {number} increment - 増加量
 * @param {Object} studyData - 学習データ（科目、スコアなど）
 */
export const updateMissionProgress = (missionType, increment = 1, studyData = {}) => {
    const missions = loadMissions();
    let updated = false;

    DAILY_MISSIONS.forEach(mission => {
        if (mission.type === missionType && !missions[mission.id].completed) {
            const current = missions[mission.id].current + increment;
            missions[mission.id].current = current;

            // 目標達成判定
            if (current >= mission.target) {
                missions[mission.id].current = mission.target;
                missions[mission.id].completed = true;
                updated = true;
            } else {
                updated = true;
            }
        }
    });

    if (updated) {
        saveMissions(missions);
    }

    return missions;
};

/**
 * 科目学習時のミッション更新（複数のミッションタイプを同時更新）
 * @param {Object} studyData - { subject, duration, score, totalQuestions }
 */
export const updateMissionsOnStudy = (studyData) => {
    const missions = loadMissions();
    const { subject, duration = 0, score = 0, totalQuestions = 0 } = studyData;

    // 学習回数
    updateMissionProgress(MISSION_TYPES.STUDY_ONCE, 1);
    updateMissionProgress(MISSION_TYPES.STUDY_FIVE_TIMES, 1);

    // 学習時間（分単位）
    if (duration > 0) {
        updateMissionProgress(MISSION_TYPES.STUDY_30_MIN, duration);
    }

    // 満点判定
    if (score === totalQuestions && totalQuestions > 0) {
        updateMissionProgress(MISSION_TYPES.PERFECT_SCORE, 1);
    }

    // 科目別学習（3つの異なる科目）
    updateStudiedSubjects(subject);

    return loadMissions();
};

/**
 * 学習した科目を記録（3科目ミッション用）
 */
const STUDIED_SUBJECTS_KEY = 'studiedSubjectsToday';

const updateStudiedSubjects = (subject) => {
    try {
        const today = getTodayString();
        const lastReset = localStorage.getItem(LAST_RESET_KEY);

        let subjects = [];
        if (lastReset === today) {
            const saved = localStorage.getItem(STUDIED_SUBJECTS_KEY);
            if (saved) {
                subjects = JSON.parse(saved);
            }
        }

        // 新しい科目を追加
        if (!subjects.includes(subject)) {
            subjects.push(subject);
            localStorage.setItem(STUDIED_SUBJECTS_KEY, JSON.stringify(subjects));

            // 3科目達成判定
            if (subjects.length >= 3) {
                updateMissionProgress(MISSION_TYPES.STUDY_THREE_SUBJECTS, 1);
            }
        }
    } catch (error) {
        console.error('Error updating studied subjects:', error);
    }
};

/**
 * キャラクター会話時のミッション更新
 */
export const updateMissionsOnInteract = () => {
    return updateMissionProgress(MISSION_TYPES.INTERACT_CHARACTER, 1);
};

/**
 * ストーリー閲覧時のミッション更新
 */
export const updateMissionsOnStory = () => {
    return updateMissionProgress(MISSION_TYPES.OPEN_STORY, 1);
};

/**
 * ミッション報酬を受け取る
 * @param {string} missionId - ミッションID
 * @returns {Object|null} 報酬 { diamonds, intellect }
 */
export const claimMissionReward = (missionId) => {
    const missions = loadMissions();
    const missionDef = DAILY_MISSIONS.find(m => m.id === missionId);

    if (!missionDef) {
        console.error('Mission not found:', missionId);
        return null;
    }

    const progress = missions[missionId];

    // 完了しているが未受取の場合のみ報酬を付与
    if (progress.completed && !progress.claimed) {
        progress.claimed = true;
        saveMissions(missions);
        return missionDef.rewards;
    }

    return null;
};

/**
 * すべてのミッション情報を取得（UI表示用）
 */
export const getAllMissionsWithProgress = () => {
    const progress = loadMissions();

    return DAILY_MISSIONS.map(mission => ({
        ...mission,
        ...progress[mission.id],
        progressPercent: Math.min((progress[mission.id].current / mission.target) * 100, 100),
    }));
};

/**
 * 未受取の報酬があるかチェック
 */
export const hasUnclaimedRewards = () => {
    const missions = loadMissions();
    return Object.values(missions).some(m => m.completed && !m.claimed);
};

/**
 * デバッグ用：ミッションをリセット
 */
export const resetMissions = () => {
    const freshProgress = getInitialMissionProgress();
    saveMissions(freshProgress);
    localStorage.setItem(LAST_RESET_KEY, getTodayString());
    localStorage.removeItem(STUDIED_SUBJECTS_KEY);
    return freshProgress;
};
