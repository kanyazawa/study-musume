// ============================================
// 復習システムのユーティリティ関数
// ============================================

import { getTodayString } from './loginBonusUtils';

// 忘却曲線に基づく復習間隔（日数）
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const MAX_REVIEW_LEVEL = 5; // レベル5で完全習得
const MAX_REVIEW_HISTORY = 12;
export const REVIEW_TICKET_DAILY_LIMIT = 3;
export const REVIEW_TICKET_BONUS_DIAMONDS = 6;
export const REVIEW_TICKET_BONUS_INTELLECT = 10;
export const REVIEW_STREAK_REWARDS = {
    2: { diamonds: 5, intellect: 8, label: '2セット連続ボーナス' },
    3: { diamonds: 12, intellect: 18, label: '3セット連続ボーナス' },
    5: { diamonds: 20, intellect: 30, label: '5セット連続ボーナス' },
};

const normalizeReviewHistory = (history) => {
    if (!Array.isArray(history)) return [];

    return history
        .filter((entry) => entry && Number.isFinite(Number(entry.date)) && (entry.result === 'correct' || entry.result === 'wrong'))
        .slice(-MAX_REVIEW_HISTORY)
        .map((entry) => ({
            date: Number(entry.date),
            result: entry.result,
        }));
};

const normalizeReviewQuestion = (question, index) => {
    if (!question || typeof question !== 'object') return null;

    const subject = String(question.subject || '').trim();
    const questionId = String(question.questionId || question.id || `review-${index}`).trim();
    const questionText = String(question.questionText || '').trim();
    const correctAnswer = String(question.correctAnswer || '').trim();

    if (!subject || !questionId || !questionText || !correctAnswer) {
        return null;
    }

    const wrongCount = Math.max(1, Number(question.wrongCount) || 1);
    const reviewLevel = Math.max(0, Math.min(MAX_REVIEW_LEVEL, Number(question.reviewLevel) || 0));
    const now = Date.now();
    const nextReviewDate = Number.isFinite(Number(question.nextReviewDate))
        ? Number(question.nextReviewDate)
        : now;
    const history = normalizeReviewHistory(question.reviewHistory);

    return {
        id: String(question.id || `${subject}-${questionId}`),
        subject,
        questionId,
        questionText,
        correctAnswer,
        userAnswer: typeof question.userAnswer === 'string' ? question.userAnswer : '',
        options: Array.isArray(question.options) ? question.options.slice(0, 6) : null,
        wrongCount,
        firstWrongDate: Number.isFinite(Number(question.firstWrongDate)) ? Number(question.firstWrongDate) : now,
        lastWrongDate: Number.isFinite(Number(question.lastWrongDate)) ? Number(question.lastWrongDate) : now,
        reviewHistory: history,
        reviewLevel,
        nextReviewDate,
    };
};

// ============================================
// データ取得・保存
// ============================================

/**
 * 復習が必要な問題リストを取得
 */
export const getReviewQuestions = () => {
    try {
        const stored = localStorage.getItem('reviewQuestions');
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];

        const normalized = parsed
            .map((question, index) => normalizeReviewQuestion(question, index))
            .filter(Boolean);

        if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
            saveReviewQuestions(normalized);
        }

        return normalized;
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

/**
 * 復習問題の優先スコアを計算
 * 期限切れ・間違い回数・復習レベルの低さを優先する
 * @param {Object} question - 復習問題
 * @returns {number}
 */
export const getReviewUrgencyScore = (question) => {
    const now = Date.now();
    const overdueDays = Math.max(0, Math.floor((now - question.nextReviewDate) / (24 * 60 * 60 * 1000)));
    const priorityWeight = {
        urgent: 300,
        soon: 160,
        later: 40
    }[getReviewPriority(question.nextReviewDate)] || 0;

    return (
        priorityWeight +
        (overdueDays * 40) +
        ((question.wrongCount || 0) * 18) +
        (Math.max(0, 5 - (question.reviewLevel || 0)) * 12)
    );
};

/**
 * 復習向けに問題を並び替える
 * @param {Array} questions - 問題リスト
 * @returns {Array}
 */
export const sortReviewQuestions = (questions) => {
    return [...questions].sort((a, b) => {
        const scoreDiff = getReviewUrgencyScore(b) - getReviewUrgencyScore(a);
        if (scoreDiff !== 0) return scoreDiff;

        const dateDiff = a.nextReviewDate - b.nextReviewDate;
        if (dateDiff !== 0) return dateDiff;

        return (b.wrongCount || 0) - (a.wrongCount || 0);
    });
};

/**
 * 同じ科目が連続しすぎないように復習セッション順を作る
 * 優先度を保ちつつ、可能なら科目を交互に出す
 * @param {Array} questions - 問題リスト
 * @returns {Array}
 */
export const buildReviewSessionOrder = (questions) => {
    const sorted = sortReviewQuestions(questions);
    const groups = sorted.reduce((acc, question) => {
        if (!acc[question.subject]) acc[question.subject] = [];
        acc[question.subject].push(question);
        return acc;
    }, {});

    const ordered = [];
    let lastSubject = null;

    while (ordered.length < sorted.length) {
        const candidateSubjects = Object.keys(groups)
            .filter((subject) => groups[subject].length > 0)
            .sort((a, b) => getReviewUrgencyScore(groups[b][0]) - getReviewUrgencyScore(groups[a][0]));

        const nextSubject =
            candidateSubjects.find((subject) => subject !== lastSubject) ||
            candidateSubjects[0];

        if (!nextSubject) break;

        ordered.push(groups[nextSubject].shift());
        lastSubject = nextSubject;
    }

    return ordered;
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

/**
 * 連続セット報酬の次の節目を取得
 * @param {number} sessionStreak
 * @returns {Object|null}
 */
export const getNextReviewStreakMilestone = (sessionStreak = 0) => {
    const upcomingMilestone = Object.keys(REVIEW_STREAK_REWARDS)
        .map(Number)
        .sort((a, b) => a - b)
        .find((milestone) => milestone > sessionStreak);

    if (!upcomingMilestone) return null;

    return {
        sessionCount: upcomingMilestone,
        ...REVIEW_STREAK_REWARDS[upcomingMilestone],
    };
};

/**
 * 今日の復習進捗を正規化して返す
 * @param {Object} stats
 * @returns {{today: string, reviewSetsToday: number, reviewTicketsRemaining: number}}
 */
export const getNormalizedDailyReviewProgress = (stats) => {
    const today = getTodayString();
    const isToday = stats?.reviewRewardDate === today;
    const parsedTickets = Number(stats?.reviewTicketsRemaining);

    return {
        today,
        reviewSetsToday: isToday ? Math.max(0, Number(stats?.reviewSetsToday) || 0) : 0,
        reviewTicketsRemaining: isToday
            ? Math.max(
                0,
                Math.min(
                    REVIEW_TICKET_DAILY_LIMIT,
                    Number.isFinite(parsedTickets) ? parsedTickets : REVIEW_TICKET_DAILY_LIMIT
                )
            )
            : REVIEW_TICKET_DAILY_LIMIT,
    };
};

/**
 * 最優先の復習問題を取得
 * @param {Array} [questions] - 復習問題リスト
 * @returns {Object|null}
 */
export const getRecommendedReviewQuestion = (questions = getReviewQuestions()) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return null;
    }

    return sortReviewQuestions(questions)[0] || null;
};

/**
 * ホーム画面向けの復習サマリーを作る
 * @param {Object} [currentStats]
 * @returns {Object}
 */
export const getHomeReviewSummary = (currentStats = null) => {
    const questions = getReviewQuestions();
    const stats = getReviewStats();
    const dailyProgress = getNormalizedDailyReviewProgress(currentStats);
    const nextMilestone = getNextReviewStreakMilestone(dailyProgress.reviewSetsToday);
    const recommendedQuestion = getRecommendedReviewQuestion(questions);
    const topSubjectEntry = Object.entries(stats.bySubject || {})
        .sort((a, b) => b[1] - a[1])[0] || null;
    const topSubject = topSubjectEntry
        ? { name: topSubjectEntry[0], count: topSubjectEntry[1] }
        : null;

    if (!recommendedQuestion) {
        return {
            hasReviews: false,
            mode: 'empty',
            total: 0,
            due: 0,
            urgentCount: 0,
            soonCount: 0,
            laterCount: 0,
            sessionSize: 0,
            headline: '復習ストックはまだ空',
            body: '間違えた問題はここに集まるよ。今日は新しい問題を進めよう。',
            ctaLabel: '勉強へ',
            topSubject: null,
            recommendedQuestion: null,
            recommendedPreview: '',
            recommendedMeta: '',
            priorityLabel: '準備OK',
            reviewSetsToday: dailyProgress.reviewSetsToday,
            reviewTicketsRemaining: dailyProgress.reviewTicketsRemaining,
            nextMilestone: null,
            bonusHints: [],
        };
    }

    const sessionSize = Math.min(stats.due > 0 ? stats.due : questions.length, 10);
    const urgentCount = stats.byPriority?.urgent || 0;
    const soonCount = stats.byPriority?.soon || 0;
    const laterCount = stats.byPriority?.later || 0;
    const priority = getReviewPriority(recommendedQuestion.nextReviewDate);
    const basePreview = String(recommendedQuestion.questionText || '').replace(/\s+/g, ' ').trim();
    const recommendedPreview = basePreview.length > 42 ? `${basePreview.slice(0, 42)}...` : basePreview;

    let mode = 'later';
    let headline = `余裕があるうちに ${sessionSize}問`;
    let body = topSubject
        ? `${topSubject.name} が ${topSubject.count} 問たまってる。軽く整えておくと後が楽。`
        : '今すぐの期限はないけど、先に少しだけ片づけると後がかなり軽くなる。';
    let ctaLabel = `${sessionSize}問だけ復習`;
    let priorityLabel = 'あとでOK';

    if (stats.due > 0) {
        mode = 'due';
        headline = `今日の復習 ${stats.due}件`;
        body = soonCount > 0
            ? `今すぐ ${urgentCount} 件、近日中 ${soonCount} 件。重いところから先に片づけよう。`
            : `今すぐやる分が ${urgentCount} 件あるよ。短く回して復習負債を軽くしよう。`;
        ctaLabel = `${sessionSize}問すぐやる`;
        priorityLabel = '今すぐ';
    } else if (soonCount > 0) {
        mode = 'soon';
        headline = `近日中の復習 ${soonCount}件`;
        body = topSubject
            ? `${topSubject.name} を先に触っておくと期限前に余裕が作れる。`
            : '今は切れてないけど、近いうちに必要になる問題が待ってる。';
        ctaLabel = `${sessionSize}問先回り`;
        priorityLabel = '近日中';
    }

    const bonusHints = [];
    if (dailyProgress.reviewTicketsRemaining > 0) {
        bonusHints.push(`🎫 次のセットで +${REVIEW_TICKET_BONUS_DIAMONDS} / +${REVIEW_TICKET_BONUS_INTELLECT}`);
    }
    if (nextMilestone) {
        bonusHints.push(`🔥 あと${Math.max(nextMilestone.sessionCount - dailyProgress.reviewSetsToday, 0)}セットで ${nextMilestone.label}`);
    }

    return {
        hasReviews: true,
        mode,
        total: stats.total,
        due: stats.due,
        urgentCount,
        soonCount,
        laterCount,
        sessionSize,
        headline,
        body,
        ctaLabel,
        topSubject,
        recommendedQuestion,
        recommendedPreview,
        recommendedMeta: `${recommendedQuestion.subject} · ${formatRelativeDate(recommendedQuestion.nextReviewDate)} · ❌ ${recommendedQuestion.wrongCount}回`,
        priorityLabel,
        reviewSetsToday: dailyProgress.reviewSetsToday,
        reviewTicketsRemaining: dailyProgress.reviewTicketsRemaining,
        nextMilestone,
        bonusHints,
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
