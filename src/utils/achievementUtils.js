/**
 * 実績/トロフィー管理ユーティリティ
 */

import { ACHIEVEMENTS, getInitialAchievementProgress } from '../data/achievements';
import { getAffectionLevel } from './affectionUtils';

const ACHIEVEMENTS_STORAGE_KEY = 'achievements';
const STATS_TRACKING_KEY = 'achievementStats';

/**
 * 実績データをlocalStorageから読み込み
 */
export const loadAchievements = () => {
    try {
        const savedData = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
        if (savedData) {
            return JSON.parse(savedData);
        }
        const initialProgress = getInitialAchievementProgress();
        saveAchievements(initialProgress);
        return initialProgress;
    } catch (error) {
        console.error('Error loading achievements:', error);
        return getInitialAchievementProgress();
    }
};

/**
 * 実績データをlocalStorageに保存
 */
export const saveAchievements = (achievements) => {
    try {
        localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
    } catch (error) {
        console.error('Error saving achievements:', error);
    }
};

/**
 * 統計データを読み込み
 */
export const loadAchievementStats = () => {
    try {
        const savedData = localStorage.getItem(STATS_TRACKING_KEY);
        if (savedData) {
            return JSON.parse(savedData);
        }
        return {
            studyCount: 0,
            perfectCount: 0,
            totalStudyTime: 0, // 分単位
            gachaCount: 0,
            studiedSubjects: [],
            lastStudyDate: null,
            currentStreak: 0,
            longestStreak: 0,
            studyTimes: [], // 学習開始時刻の記録
        };
    } catch (error) {
        console.error('Error loading achievement stats:', error);
        return {};
    }
};

/**
 * 統計データを保存
 */
export const saveAchievementStats = (stats) => {
    try {
        localStorage.setItem(STATS_TRACKING_KEY, JSON.stringify(stats));
    } catch (error) {
        console.error('Error saving achievement stats:', error);
    }
};

/**
 * 実績の達成チェック
 */
const checkAchievementCondition = (achievement, stats, gameStats) => {
    const { type, value } = achievement.condition;

    switch (type) {
        case 'study_count':
            return stats.studyCount >= value;

        case 'perfect_count':
            return stats.perfectCount >= value;

        case 'study_streak':
            return stats.currentStreak >= value;

        case 'total_study_time':
            return stats.totalStudyTime >= value;

        case 'affection_level':
            const affectionLevel = getAffectionLevel(gameStats?.affection || 0);
            return affectionLevel.level >= value;

        case 'gacha_count':
            return stats.gachaCount >= value;

        case 'inventory_count':
            return (gameStats?.inventory || []).length >= value;

        case 'all_skins':
            // スキンIDを確認（実装に応じて調整）
            const skins = (gameStats?.inventory || []).filter(item => item.type === 'skin');
            return skins.length >= 2; // デフォルト + カジュアル（必要に応じて調整）

        case 'study_early_morning':
            return stats.studyTimes.some(time => {
                const hour = new Date(time).getHours();
                return hour < 6;
            });

        case 'study_late_night':
            return stats.studyTimes.some(time => {
                const hour = new Date(time).getHours();
                return hour >= 0 && hour < 5;
            });

        case 'all_subjects':
            // すべての科目を学習したかチェック（実装に応じて調整）
            return stats.studiedSubjects.length >= 3; // 数学、英語、理科など

        case 'app_start':
            return true; // アプリ起動で自動達成

        default:
            return false;
    }
};

/**
 * すべての実績をチェックして新規達成を返す
 */
export const checkForNewAchievements = (gameStats) => {
    const achievements = loadAchievements();
    const stats = loadAchievementStats();
    const newlyUnlocked = [];

    ACHIEVEMENTS.forEach(achievement => {
        const progress = achievements[achievement.id];

        // 未達成の実績のみチェック
        if (!progress.unlocked) {
            const isAchieved = checkAchievementCondition(achievement, stats, gameStats);

            if (isAchieved) {
                progress.unlocked = true;
                progress.unlockedAt = new Date().toISOString();
                progress.notified = false; // 通知未表示
                newlyUnlocked.push(achievement);
            }
        }
    });

    if (newlyUnlocked.length > 0) {
        saveAchievements(achievements);
    }

    return newlyUnlocked;
};

/**
 * 学習完了時に統計を更新
 */
export const updateStatsOnStudy = (studyData) => {
    const stats = loadAchievementStats();
    const { subject, duration = 0, isPerfect = false } = studyData;

    // 学習回数
    stats.studyCount = (stats.studyCount || 0) + 1;

    // 学習時間
    stats.totalStudyTime = (stats.totalStudyTime || 0) + duration;

    // 満点回数
    if (isPerfect) {
        stats.perfectCount = (stats.perfectCount || 0) + 1;
    }

    // 科目記録
    if (subject && !stats.studiedSubjects.includes(subject)) {
        stats.studiedSubjects.push(subject);
    }

    // 連続学習日数の更新
    const today = new Date().toISOString().split('T')[0];
    const lastDate = stats.lastStudyDate;

    if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
            // 連続
            stats.currentStreak = (stats.currentStreak || 0) + 1;
        } else {
            // 途切れた
            stats.currentStreak = 1;
        }

        stats.lastStudyDate = today;
        stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);
    }

    // 学習時刻を記録
    stats.studyTimes = stats.studyTimes || [];
    stats.studyTimes.push(new Date().toISOString());
    // 直近100件のみ保持
    if (stats.studyTimes.length > 100) {
        stats.studyTimes = stats.studyTimes.slice(-100);
    }

    saveAchievementStats(stats);
    return stats;
};

/**
 * ガチャ実行時に統計を更新
 */
export const updateStatsOnGacha = () => {
    const stats = loadAchievementStats();
    stats.gachaCount = (stats.gachaCount || 0) + 1;
    saveAchievementStats(stats);
    return stats;
};

/**
 * 実績の通知済みフラグを更新
 */
export const markAchievementAsNotified = (achievementId) => {
    const achievements = loadAchievements();
    if (achievements[achievementId]) {
        achievements[achievementId].notified = true;
        saveAchievements(achievements);
    }
};

/**
 * すべての実績と進捗を取得（UI表示用）
 */
export const getAllAchievementsWithProgress = () => {
    const progress = loadAchievements();

    return ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        ...progress[achievement.id],
    }));
};

/**
 * 達成済み実績の数を取得
 */
export const getAchievementStats = () => {
    const achievements = loadAchievements();
    const unlocked = Object.values(achievements).filter(a => a.unlocked).length;
    const total = ACHIEVEMENTS.length;

    return {
        unlocked,
        total,
        percentage: Math.round((unlocked / total) * 100),
    };
};

/**
 * 未通知の実績を取得
 */
export const getUnnotifiedAchievements = () => {
    const achievements = loadAchievements();
    const unnotified = [];

    ACHIEVEMENTS.forEach(achievement => {
        const progress = achievements[achievement.id];
        if (progress.unlocked && !progress.notified) {
            unnotified.push({
                ...achievement,
                ...progress,
            });
        }
    });

    return unnotified;
};

/**
 * 獲得した称号のリストを取得
 */
export const getUnlockedTitles = () => {
    const achievements = loadAchievements();
    const titles = [];

    ACHIEVEMENTS.forEach(achievement => {
        const progress = achievements[achievement.id];
        if (progress.unlocked && achievement.rewards.title) {
            titles.push({
                id: achievement.id,
                title: achievement.rewards.title,
                achievementName: achievement.name,
                unlockedAt: progress.unlockedAt,
                rarity: achievement.rarity,
            });
        }
    });

    return titles;
};
