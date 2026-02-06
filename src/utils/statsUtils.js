// ============================================
// 詳細統計計算ユーティリティ
// ============================================

import { getStudyHistory } from './studyHistoryUtils';
import { getReviewQuestions } from './reviewUtils';

// ============================================
// 基本統計
// ============================================

/**
 * 科目別の正答率を計算
 * @returns {Object} 科目ごとの統計
 */
export const calculateSubjectAccuracy = () => {
    const history = getStudyHistory();
    const stats = {};

    history.forEach(session => {
        const subject = session.subject || '不明';

        if (!stats[subject]) {
            stats[subject] = {
                totalQuestions: 0,
                correctAnswers: 0,
                totalTime: 0,
                sessions: 0,
                accuracy: 0
            };
        }

        stats[subject].totalQuestions += session.questionsAnswered || 0;
        stats[subject].correctAnswers += session.correctAnswers || 0;
        stats[subject].totalTime += session.duration || 0;
        stats[subject].sessions += 1;
    });

    // 正答率を計算
    Object.keys(stats).forEach(subject => {
        const s = stats[subject];
        s.accuracy = s.totalQuestions > 0
            ? Math.round((s.correctAnswers / s.totalQuestions) * 100)
            : 0;
    });

    return stats;
};

/**
 * 全体の統計を取得
 * @returns {Object} 全体統計
 */
export const getOverallStats = () => {
    const history = getStudyHistory();

    let totalTime = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let sessions = history.length;

    history.forEach(session => {
        totalTime += session.duration || 0;
        totalQuestions += session.questionsAnswered || 0;
        totalCorrect += session.correctAnswers || 0;
    });

    return {
        totalTime,
        totalQuestions,
        totalCorrect,
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        sessions
    };
};

// ============================================
// 苦手問題の抽出
// ============================================

/**
 * 苦手な問題を抽出
 * @param {number} limit - 取得する問題数
 * @returns {Array} 苦手問題リスト
 */
export const getWeakPoints = (limit = 5) => {
    const reviewQuestions = getReviewQuestions();

    // 間違えた回数でソート
    const sorted = [...reviewQuestions].sort((a, b) => b.wrongCount - a.wrongCount);

    return sorted.slice(0, limit).map(q => ({
        subject: q.subject,
        questionText: q.questionText,
        wrongCount: q.wrongCount,
        id: q.id
    }));
};

/**
 * 科目別の苦手単元を取得
 * @returns {Object} 科目ごとの苦手単元
 */
export const getWeakUnitsBySubject = () => {
    const reviewQuestions = getReviewQuestions();
    const stats = {};

    reviewQuestions.forEach(q => {
        const subject = q.subject;
        if (!stats[subject]) {
            stats[subject] = {};
        }

        // 単元ごとにカウント（問題IDから推測）
        const unit = q.questionId.split('-')[0] || '不明';
        if (!stats[subject][unit]) {
            stats[subject][unit] = 0;
        }
        stats[subject][unit] += q.wrongCount;
    });

    return stats;
};

// ============================================
// 期間別レポート
// ============================================

/**
 * 指定期間の統計を取得
 * @param {number} days - 遡る日数
 * @returns {Object} 期間統計
 */
const getPeriodStats = (days) => {
    const history = getStudyHistory();
    const now = Date.now();
    const periodStart = now - (days * 24 * 60 * 60 * 1000);

    const periodSessions = history.filter(s => s.timestamp >= periodStart);

    let totalTime = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;

    periodSessions.forEach(session => {
        totalTime += session.duration || 0;
        totalQuestions += session.questionsAnswered || 0;
        totalCorrect += session.correctAnswers || 0;
    });

    return {
        totalTime,
        totalQuestions,
        totalCorrect,
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        sessions: periodSessions.length
    };
};

/**
 * 週間レポートを取得
 * @returns {Object} 週間統計と前週比
 */
export const getWeeklyReport = () => {
    const thisWeek = getPeriodStats(7);
    const lastWeek = getPeriodStats(14); // 過去14日のデータから前週を計算

    // 前週のデータ（8-14日前）
    const history = getStudyHistory();
    const now = Date.now();
    const lastWeekStart = now - (14 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = now - (7 * 24 * 60 * 60 * 1000);

    const lastWeekSessions = history.filter(s =>
        s.timestamp >= lastWeekStart && s.timestamp < lastWeekEnd
    );

    let lastWeekTime = 0;
    let lastWeekQuestions = 0;

    lastWeekSessions.forEach(session => {
        lastWeekTime += session.duration || 0;
        lastWeekQuestions += session.questionsAnswered || 0;
    });

    const timeDiff = lastWeekTime > 0
        ? Math.round(((thisWeek.totalTime - lastWeekTime) / lastWeekTime) * 100)
        : 0;
    const questionsDiff = lastWeekQuestions > 0
        ? Math.round(((thisWeek.totalQuestions - lastWeekQuestions) / lastWeekQuestions) * 100)
        : 0;

    return {
        ...thisWeek,
        comparison: {
            timeDiff,
            questionsDiff
        }
    };
};

/**
 * 月間レポートを取得
 * @returns {Object} 月間統計と前月比
 */
export const getMonthlyReport = () => {
    const thisMonth = getPeriodStats(30);

    const history = getStudyHistory();
    const now = Date.now();
    const lastMonthStart = now - (60 * 24 * 60 * 60 * 1000);
    const lastMonthEnd = now - (30 * 24 * 60 * 60 * 1000);

    const lastMonthSessions = history.filter(s =>
        s.timestamp >= lastMonthStart && s.timestamp < lastMonthEnd
    );

    let lastMonthTime = 0;
    let lastMonthQuestions = 0;

    lastMonthSessions.forEach(session => {
        lastMonthTime += session.duration || 0;
        lastMonthQuestions += session.questionsAnswered || 0;
    });

    const timeDiff = lastMonthTime > 0
        ? Math.round(((thisMonth.totalTime - lastMonthTime) / lastMonthTime) * 100)
        : 0;
    const questionsDiff = lastMonthQuestions > 0
        ? Math.round(((thisMonth.totalQuestions - lastMonthQuestions) / lastMonthQuestions) * 100)
        : 0;

    return {
        ...thisMonth,
        comparison: {
            timeDiff,
            questionsDiff
        }
    };
};

// ============================================
// 時間帯別・曜日別分析
// ============================================

/**
 * 時間帯別の統計を取得
 * @returns {Array} 時間帯ごとの統計
 */
export const getHourlyStats = () => {
    const history = getStudyHistory();
    const stats = {};

    // 0-23時で初期化
    for (let i = 0; i < 24; i++) {
        stats[i] = {
            hour: i,
            totalTime: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 0,
            sessions: 0
        };
    }

    history.forEach(session => {
        const hour = session.hour !== undefined ? session.hour : new Date(session.timestamp).getHours();

        if (stats[hour]) {
            stats[hour].totalTime += session.duration || 0;
            stats[hour].totalQuestions += session.questionsAnswered || 0;
            stats[hour].correctAnswers += session.correctAnswers || 0;
            stats[hour].sessions += 1;
        }
    });

    // 正答率を計算
    Object.keys(stats).forEach(hour => {
        const s = stats[hour];
        s.accuracy = s.totalQuestions > 0
            ? Math.round((s.correctAnswers / s.totalQuestions) * 100)
            : 0;
    });

    // 配列に変換してソート
    return Object.values(stats).sort((a, b) => a.hour - b.hour);
};

/**
 * 曜日別の統計を取得
 * @returns {Array} 曜日ごとの統計
 */
export const getDailyStats = () => {
    const history = getStudyHistory();
    const stats = {};
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    // 0-6（日-土）で初期化
    for (let i = 0; i < 7; i++) {
        stats[i] = {
            day: i,
            dayName: dayNames[i],
            totalTime: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 0,
            sessions: 0
        };
    }

    history.forEach(session => {
        const day = session.dayOfWeek !== undefined
            ? session.dayOfWeek
            : new Date(session.timestamp).getDay();

        if (stats[day]) {
            stats[day].totalTime += session.duration || 0;
            stats[day].totalQuestions += session.questionsAnswered || 0;
            stats[day].correctAnswers += session.correctAnswers || 0;
            stats[day].sessions += 1;
        }
    });

    // 正答率を計算
    Object.keys(stats).forEach(day => {
        const s = stats[day];
        s.accuracy = s.totalQuestions > 0
            ? Math.round((s.correctAnswers / s.totalQuestions) * 100)
            : 0;
    });

    // 配列に変換
    return Object.values(stats);
};

// ============================================
// ヘルパー関数
// ============================================

/**
 * 時間を「〇時間〇分」形式に変換
 * @param {number} seconds - 秒数
 * @returns {string} フォーマットされた時間文字列
 */
export const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
};

/**
 * 正答率に応じた色を取得
 * @param {number} accuracy - 正答率（%）
 * @returns {string} カラーコード
 */
export const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4CAF50'; // 緑
    if (accuracy >= 70) return '#FFC107'; // 黄
    return '#F44336'; // 赤
};

/**
 * 前回との比較テキストを取得
 * @param {number} diff - 差分（%）
 * @returns {string} 比較テキスト
 */
export const getComparisonText = (diff) => {
    if (diff > 0) return `前回より+${diff}%`;
    if (diff < 0) return `前回より${diff}%`;
    return '前回と同じ';
};
