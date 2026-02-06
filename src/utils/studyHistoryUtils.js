/**
 * 学習履歴管理ユーティリティ
 */

const STORAGE_KEY = 'studyHistory';

/**
 * 学習セッションを記録
 * @param {Object} session - 学習セッションデータ
 * @param {string} session.subject - 科目（例: "数学"）
 * @param {string} session.category - 分野（例: "代数"）
 * @param {string} session.unit - 単元（例: "因数分解"）
 * @param {number} session.duration - 学習時間（秒）
 * @param {number} session.questionsAnswered - 解いた問題数
 * @param {number} session.correctAnswers - 正解数
 */
export const saveStudySession = (session) => {
    const history = getStudyHistory();

    const newSession = {
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        subject: session.subject || '不明',
        category: session.category || '',
        unit: session.unit || '',
        duration: session.duration || 0,
        questionsAnswered: session.questionsAnswered || 0,
        correctAnswers: session.correctAnswers || 0,
        timestamp: Date.now(),
        hour: new Date().getHours(),  // 0-23
        dayOfWeek: new Date().getDay()  // 0-6 (0=日曜)
    };

    history.push(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    console.log('Study session saved:', newSession);
};

/**
 * 学習履歴を取得
 * @param {number} days - 取得する日数（オプション）
 * @returns {Array} 学習履歴の配列
 */
export const getStudyHistory = (days = null) => {
    try {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        if (!days) return history;

        // 過去N日間のデータのみを返す
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffString = cutoffDate.toISOString().split('T')[0];

        return history.filter(session => session.date >= cutoffString);
    } catch (error) {
        console.error('Error getting study history:', error);
        return [];
    }
};

/**
 * 日別統計を取得（グラフ用）
 * @param {number} days - 取得する日数
 * @returns {Array} 日別統計の配列
 */
export const getDailyStats = (days = 7) => {
    const history = getStudyHistory(days);

    // 日付の範囲を生成
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    // 日付ごとにデータを集計
    const dailyStats = dates.map(date => {
        const daySessions = history.filter(s => s.date === date);

        // 科目ごとの学習時間を集計
        const subjectTimes = {};
        daySessions.forEach(session => {
            const subject = session.subject;
            if (!subjectTimes[subject]) {
                subjectTimes[subject] = 0;
            }
            subjectTimes[subject] += session.duration / 60; // 分に変換
        });

        return {
            date,
            dateLabel: formatDate(date),
            ...subjectTimes,
            total: Object.values(subjectTimes).reduce((sum, time) => sum + time, 0)
        };
    });

    return dailyStats;
};

/**
 * 科目の一覧を取得
 * @returns {Array} 使用されている科目の配列
 */
export const getUsedSubjects = () => {
    const history = getStudyHistory();
    const subjects = new Set(history.map(s => s.subject));
    return Array.from(subjects).filter(s => s && s !== '不明');
};

/**
 * 日付をフォーマット（MM/DD形式）
 * @param {string} dateString - YYYY-MM-DD形式の日付文字列
 * @returns {string} MM/DD形式の日付
 */
const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
};

/**
 * 学習履歴をクリア（テスト用）
 */
export const clearStudyHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Study history cleared');
};

/**
 * 科目別学習時間の分布を取得（円グラフ用）
 * @param {number} days - 取得する日数
 * @returns {Array} 科目別の学習時間配列
 */
export const getSubjectDistribution = (days = 7) => {
    const history = getStudyHistory(days);

    const subjectTimes = {};
    history.forEach(session => {
        const subject = session.subject;
        if (!subjectTimes[subject]) {
            subjectTimes[subject] = 0;
        }
        subjectTimes[subject] += session.duration / 60; // 分に変換
    });

    // 配列に変換
    return Object.entries(subjectTimes)
        .filter(([subject, _]) => subject && subject !== '不明')
        .map(([subject, time]) => ({
            name: subject,
            value: Math.round(time),
            percentage: 0 // 後で計算
        }))
        .sort((a, b) => b.value - a.value);
};

/**
 * 日別の正解率を取得（折れ線グラフ用）
 * @param {number} days - 取得する日数
 * @returns {Array} 日別正解率の配列
 */
export const getDailyAccuracy = (days = 7) => {
    const history = getStudyHistory(days);

    // 日付の範囲を生成
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    // 日付ごとに正解率を計算
    const dailyAccuracy = dates.map(date => {
        const daySessions = history.filter(s => s.date === date);

        const totalQuestions = daySessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
        const totalCorrect = daySessions.reduce((sum, s) => sum + s.correctAnswers, 0);

        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : null;

        return {
            date,
            dateLabel: formatDate(date),
            accuracy: accuracy !== null ? Math.round(accuracy) : null,
            questions: totalQuestions
        };
    });

    return dailyAccuracy;
};

/**
 * 指定月の日別統計を取得（カレンダー表示用）
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {Object} 日付をキーとした統計オブジェクト
 */
export const getMonthlyStats = (year, month) => {
    const history = getStudyHistory();

    // 月の日数を取得
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthlyStats = {};

    // その月の全日付を生成
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const daySessions = history.filter(s => s.date === date);

        // 科目ごとの学習時間を集計
        const subjectTimes = {};
        let totalMinutes = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;

        daySessions.forEach(session => {
            const subject = session.subject;
            const minutes = session.duration / 60;

            if (!subjectTimes[subject]) {
                subjectTimes[subject] = 0;
            }
            subjectTimes[subject] += minutes;
            totalMinutes += minutes;
            totalQuestions += session.questionsAnswered || 0;
            totalCorrect += session.correctAnswers || 0;
        });

        monthlyStats[date] = {
            date,
            day,
            totalMinutes: Math.round(totalMinutes),
            subjects: subjectTimes,
            accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null,
            sessionCount: daySessions.length,
            intensity: calculateIntensity(totalMinutes)
        };
    }

    return monthlyStats;
};

/**
 * 学習強度を計算（0-4の5段階）
 * @param {number} minutes - 学習時間（分）
 * @returns {number} 強度レベル
 */
const calculateIntensity = (minutes) => {
    if (minutes === 0) return 0;
    if (minutes < 15) return 1;
    if (minutes < 30) return 2;
    if (minutes < 60) return 3;
    return 4;
};

/**
 * 連続学習日数を計算
 * @returns {number} 現在の連続学習日数
 */
export const getStudyStreak = () => {
    const history = getStudyHistory();

    if (history.length === 0) return 0;

    // 日付ごとにグループ化
    const studyDates = new Set(history.map(s => s.date));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // 今日または昨日から遡って連続日数をカウント
    const today = currentDate.toISOString().split('T')[0];
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 今日学習していない場合、昨日から開始
    if (!studyDates.has(today)) {
        if (!studyDates.has(yesterdayStr)) {
            return 0;
        }
        currentDate = yesterday;
    }

    // 連続日数をカウント
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (studyDates.has(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};

/**
 * 月間サマリーを取得
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {Object} 月間統計サマリー
 */
export const getMonthSummary = (year, month) => {
    const monthlyStats = getMonthlyStats(year, month);
    const days = Object.values(monthlyStats);

    const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const studyDays = days.filter(day => day.totalMinutes > 0).length;
    const avgMinutes = studyDays > 0 ? Math.round(totalMinutes / studyDays) : 0;

    return {
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        studyDays,
        avgMinutes,
        daysInMonth: days.length
    };
};

/**
 * 特定日の学習強度を取得
 * @param {string} date - YYYY-MM-DD形式の日付
 * @returns {number} 強度レベル（0-4）
 */
export const getStudyIntensity = (date) => {
    const history = getStudyHistory();
    const daySessions = history.filter(s => s.date === date);
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration / 60, 0);
    return calculateIntensity(totalMinutes);
};

