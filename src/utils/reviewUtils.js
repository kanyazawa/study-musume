// ============================================
// 復習システムのユーティリティ関数
// ============================================

// 忘却曲線に基づく復習間隔（日数）
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const MAX_REVIEW_LEVEL = 5; // レベル5で完全習得

// ============================================
// データ取得・保存
// ============================================

/**
 * 復習が必要な問題リストを取得
 */
export const getReviewQuestions = () => {
    try {
        const stored = localStorage.getItem('reviewQuestions');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading review questions:', error);
        return [];
    }
};

/**
 * 復習問題を保存
 */
export const saveReviewQuestions = (questions) => {
    try {
        localStorage.setItem('reviewQuestions', JSON.stringify(questions));
    } catch (error) {
        console.error('Error saving review questions:', error);
    }
};

// ============================================
// 問題の追加・更新
// ============================================

/**
 * 間違えた問題を復習リストに追加
 * @param {Object} questionData - 問題データ
 * @param {string} questionData.subject - 科目
 * @param {string} questionData.questionId - 問題ID
 * @param {string} questionData.questionText - 問題文
 * @param {string} questionData.correctAnswer - 正解
 * @param {string} questionData.userAnswer - ユーザーの回答
 */
export const addWrongQuestion = (questionData) => {
    const questions = getReviewQuestions();
    const now = Date.now();

    // 既存の問題をチェック
    const existingIndex = questions.findIndex(
        q => q.subject === questionData.subject && q.questionId === questionData.questionId
    );

    if (existingIndex >= 0) {
        // 既存の問題を更新
        const existing = questions[existingIndex];
        questions[existingIndex] = {
            ...existing,
            wrongCount: existing.wrongCount + 1,
            lastWrongDate: now,
            reviewLevel: 0, // 間違えたのでレベルリセット
            nextReviewDate: calculateNextReviewDate(0),
            options: questionData.options || existing.options || null,
            reviewHistory: [
                ...existing.reviewHistory,
                { date: now, result: 'wrong' }
            ]
        };
    } else {
        // 新しい問題を追加
        questions.push({
            id: `${questionData.subject}-${questionData.questionId}-${now}`,
            subject: questionData.subject,
            questionId: questionData.questionId,
            questionText: questionData.questionText,
            correctAnswer: questionData.correctAnswer,
            userAnswer: questionData.userAnswer,
            options: questionData.options || null,
            wrongCount: 1,
            firstWrongDate: now,
            lastWrongDate: now,
            reviewHistory: [{ date: now, result: 'wrong' }],
            reviewLevel: 0,
            nextReviewDate: calculateNextReviewDate(0)
        });
    }

    saveReviewQuestions(questions);
};

/**
 * 復習完了時に問題を更新
 * @param {string} questionId - 問題ID
 * @param {boolean} isCorrect - 正解したかどうか
 */
export const updateReviewResult = (questionId, isCorrect) => {
    const questions = getReviewQuestions();
    const now = Date.now();

    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex < 0) return;

    const question = questions[questionIndex];
    const newLevel = isCorrect
        ? Math.min(question.reviewLevel + 1, MAX_REVIEW_LEVEL)
        : 0;

    questions[questionIndex] = {
        ...question,
        reviewLevel: newLevel,
        nextReviewDate: calculateNextReviewDate(newLevel),
        reviewHistory: [
            ...question.reviewHistory,
            { date: now, result: isCorrect ? 'correct' : 'wrong' }
        ]
    };

    // レベル5（完全習得）の問題は削除
    if (newLevel >= MAX_REVIEW_LEVEL) {
        questions.splice(questionIndex, 1);
    }

    saveReviewQuestions(questions);
};

// ============================================
// 復習タイミング計算
// ============================================

/**
 * 次回復習日を計算
 * @param {number} reviewLevel - 現在の復習レベル
 * @returns {number} - 次回復習日のタイムスタンプ
 */
export const calculateNextReviewDate = (reviewLevel) => {
    const days = REVIEW_INTERVALS[reviewLevel] || REVIEW_INTERVALS[0];
    return Date.now() + (days * 24 * 60 * 60 * 1000);
};

/**
 * 復習が必要かどうかを判定
 * @param {number} nextReviewDate - 次回復習日
 * @returns {boolean}
 */
export const needsReview = (nextReviewDate) => {
    return Date.now() >= nextReviewDate;
};

/**
 * 復習優先度を取得
 * @param {number} nextReviewDate - 次回復習日
 * @returns {string} - 'urgent' | 'soon' | 'later'
 */
export const getReviewPriority = (nextReviewDate) => {
    const now = Date.now();
    const daysDiff = (nextReviewDate - now) / (24 * 60 * 60 * 1000);

    if (daysDiff <= 0) return 'urgent';      // 今日以前
    if (daysDiff <= 2) return 'soon';        // 2日以内
    return 'later';                          // それ以降
};

// ============================================
// フィルタリング
// ============================================

/**
 * 科目別に復習問題をフィルタリング
 * @param {string} subject - 科目名（'all'ですべて）
 * @returns {Array} - フィルタリングされた問題リスト
 */
export const filterBySubject = (subject) => {
    const questions = getReviewQuestions();
    if (subject === 'all') return questions;
    return questions.filter(q => q.subject === subject);
};

/**
 * 優先度別に復習問題をフィルタリング
 * @param {string} priority - 優先度（'urgent' | 'soon' | 'all'）
 * @returns {Array} - フィルタリングされた問題リスト
 */
export const filterByPriority = (priority) => {
    const questions = getReviewQuestions();
    if (priority === 'all') return questions;

    return questions.filter(q => {
        const qPriority = getReviewPriority(q.nextReviewDate);
        if (priority === 'urgent') return qPriority === 'urgent';
        if (priority === 'soon') return qPriority === 'urgent' || qPriority === 'soon';
        return true;
    });
};

/**
 * 復習すべき問題を取得（今日または期限切れ）
 * @returns {Array} - 復習すべき問題リスト
 */
export const getDueReviewQuestions = () => {
    const questions = getReviewQuestions();
    return questions.filter(q => needsReview(q.nextReviewDate));
};

// ============================================
// 統計情報
// ============================================

/**
 * 復習統計を取得
 * @returns {Object} - 統計情報
 */
export const getReviewStats = () => {
    const questions = getReviewQuestions();
    const dueCount = getDueReviewQuestions().length;

    return {
        total: questions.length,
        due: dueCount,
        bySubject: questions.reduce((acc, q) => {
            acc[q.subject] = (acc[q.subject] || 0) + 1;
            return acc;
        }, {}),
        byPriority: {
            urgent: questions.filter(q => getReviewPriority(q.nextReviewDate) === 'urgent').length,
            soon: questions.filter(q => getReviewPriority(q.nextReviewDate) === 'soon').length,
            later: questions.filter(q => getReviewPriority(q.nextReviewDate) === 'later').length
        }
    };
};

// ============================================
// ヘルパー関数
// ============================================

/**
 * 日時を相対的な文字列に変換
 * @param {number} timestamp - タイムスタンプ
 * @returns {string} - 相対日時文字列
 */
export const formatRelativeDate = (timestamp) => {
    const now = Date.now();
    const diff = timestamp - now;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days < 0) return `${Math.abs(days)}日前`;
    if (days === 0) return '今日';
    if (days === 1) return '明日';
    return `${days}日後`;
};

/**
 * 復習レベルを文字列に変換
 * @param {number} level - 復習レベル
 * @returns {string} - レベル文字列
 */
export const formatReviewLevel = (level) => {
    const labels = ['初回', '2回目', '3回目', '4回目', '5回目', '完全習得'];
    return labels[level] || '不明';
};
