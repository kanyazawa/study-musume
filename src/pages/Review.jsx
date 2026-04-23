import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Calendar, BookOpen, Sparkles, Clock3, CircleAlert, ArrowRight } from 'lucide-react';
import {
    getReviewQuestions,
    getReviewPriority,
    formatRelativeDate,
    getReviewStats,
    formatReviewProgress,
    formatNextCorrectReviewProgress,
    formatWrongReviewProgress,
    sortReviewQuestions,
    buildReviewSessionOrder,
    getNormalizedDailyReviewProgress,
    getNextReviewStreakMilestone,
    REVIEW_STREAK_REWARDS,
    REVIEW_TICKET_BONUS_DIAMONDS,
    REVIEW_TICKET_BONUS_INTELLECT,
    REVIEW_TICKET_DAILY_LIMIT,
} from '../utils/reviewUtils';
import { STUDY_TOPICS } from '../data/studyTopics';
import './Review.css';

const ReviewQuiz = lazy(() => import('../components/ReviewQuiz'));
const INITIAL_VISIBLE_QUESTIONS = 40;
const VISIBLE_QUESTIONS_STEP = 40;
const REVIEW_SESSION_SIZE = 10;
const REVIEW_SESSION_OPTIONS = [
    { size: 10, label: '放課後', eta: '約1分' },
    { size: 20, label: '補習', eta: '約2分' },
    { size: 50, label: '追い込み', eta: '約5分' },
];
const REVIEW_BASE_DIAMONDS = 8;
const REVIEW_BASE_INTELLECT = 12;
const REVIEW_PER_CORRECT_DIAMONDS = 2;
const REVIEW_PER_CORRECT_INTELLECT = 5;
const REVIEW_PERFECT_BONUS_DIAMONDS = 6;
const REVIEW_PERFECT_BONUS_INTELLECT = 8;
const EMPTY_STREAK_REWARD = { diamonds: 0, intellect: 0, label: '' };

const getReviewStreakReward = (sessionStreak) => REVIEW_STREAK_REWARDS[sessionStreak] || EMPTY_STREAK_REWARD;

const getNoaReviewRewardMessage = ({ rewardSummary, dueReduced, totalReduced, nextMilestone }) => {
    if (!rewardSummary) return '短い補習で切れる形にしてあるから、また気が向いたらすぐ戻っておいで。';

    if (rewardSummary.sessionStreak >= 5) {
        return 'ここまで来たらかなり強いよ。今日はもう十分やり切ってる。';
    }

    if (rewardSummary.perfectBonus && rewardSummary.ticketBonusActive) {
        return 'パーフェクトにごほうびチケットまで乗ったね。今の補習、かなりおいしい。';
    }

    if (dueReduced >= 5) {
        return `弱点を${dueReduced}件回収できたよ。ここで止めてもちゃんと前進してる。`;
    }

    if (totalReduced > 0) {
        return `完全習得も${totalReduced}件進んだね。ノートがちゃんと軽くなってる。`;
    }

    if (nextMilestone) {
        return `次はあと${Math.max(nextMilestone.sessionCount - rewardSummary.sessionStreak, 0)}セットで${nextMilestone.label}だよ。`;
    }

    return 'いい区切りだよ。ここで終わっても、もう今日の補習は前より軽い。';
};

const Review = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [reviewStats, setReviewStats] = useState(null);
    const [isQuizMode, setIsQuizMode] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [selectedSessionSize, setSelectedSessionSize] = useState(REVIEW_SESSION_SIZE);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_QUESTIONS);
    const [lastSessionSummary, setLastSessionSummary] = useState(null);
    const [sessionSnapshot, setSessionSnapshot] = useState(null);
    const hasConsumedAutoStartRef = useRef(false);

    const loadReviewData = useCallback(() => {
        const allQuestions = getReviewQuestions();
        setQuestions(allQuestions);
        setReviewStats(getReviewStats());
    }, []);

    const applyFilters = useCallback(() => {
        let filtered = [...questions];

        // 科目フィルター
        if (selectedSubject !== 'all') {
            filtered = filtered.filter(q => q.subject === selectedSubject);
        }

        // 優先度フィルター
        if (selectedPriority !== 'all') {
            filtered = filtered.filter(q => {
                const priority = getReviewPriority(q.nextReviewDate);
                if (selectedPriority === 'urgent') return priority === 'urgent';
                if (selectedPriority === 'soon') return priority === 'urgent' || priority === 'soon';
                return true;
            });
        }

        // ソート（優先度順）
        setFilteredQuestions(sortReviewQuestions(filtered));
    }, [questions, selectedPriority, selectedSubject]);

    useEffect(() => {
        loadReviewData();
    }, [loadReviewData]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE_QUESTIONS);
    }, [selectedSubject, selectedPriority, questions]);

    useEffect(() => {
        if (!location.state?.autoStart) {
            hasConsumedAutoStartRef.current = false;
        }
    }, [location.state]);

    const { reviewSetsToday, reviewTicketsRemaining } = getNormalizedDailyReviewProgress(stats);

    const getSessionRewards = (results = [], overrides = {}) => {
        const answeredCount = results.length;
        const correctCount = results.filter((result) => result.isCorrect).length;
        const perfectBonus = answeredCount > 0 && correctCount === answeredCount;
        const sessionSize = Math.max(1, overrides.sessionSize || selectedSessionSize || REVIEW_SESSION_SIZE);
        const completedSetsToday = overrides.completedSetsToday ?? reviewSetsToday;
        const ticketsRemaining = overrides.ticketsRemaining ?? reviewTicketsRemaining;
        const sessionScale = answeredCount > 0 ? Math.max(0.35, answeredCount / sessionSize) : 0;
        const sessionStreak = answeredCount > 0 ? completedSetsToday + 1 : completedSetsToday;
        const streakReward = answeredCount > 0 ? getReviewStreakReward(sessionStreak) : EMPTY_STREAK_REWARD;
        const ticketBonusActive = answeredCount > 0 && ticketsRemaining > 0;
        const ticketBonusDiamonds = ticketBonusActive ? REVIEW_TICKET_BONUS_DIAMONDS : 0;
        const ticketBonusIntellect = ticketBonusActive ? REVIEW_TICKET_BONUS_INTELLECT : 0;
        const diamonds =
            Math.round(REVIEW_BASE_DIAMONDS * sessionScale) +
            (correctCount * REVIEW_PER_CORRECT_DIAMONDS) +
            (perfectBonus ? REVIEW_PERFECT_BONUS_DIAMONDS : 0) +
            streakReward.diamonds +
            ticketBonusDiamonds;
        const intellect =
            Math.round(REVIEW_BASE_INTELLECT * sessionScale) +
            (correctCount * REVIEW_PER_CORRECT_INTELLECT) +
            (perfectBonus ? REVIEW_PERFECT_BONUS_INTELLECT : 0) +
            streakReward.intellect +
            ticketBonusIntellect;

        return {
            answeredCount,
            correctCount,
            diamonds,
            intellect,
            perfectBonus,
            sessionSize,
            sessionStreak,
            streakReward,
            ticketBonusActive,
            ticketBonusDiamonds,
            ticketBonusIntellect,
            bonusLabels: [
                ticketBonusActive ? `🎫 復習チケット +${ticketBonusDiamonds} / +${ticketBonusIntellect}` : null,
                streakReward.label ? `🔥 ${streakReward.label}` : null,
                perfectBonus ? '✨ パーフェクトボーナス' : null,
            ].filter(Boolean),
        };
    };

    const getPriorityBadge = (nextReviewDate) => {
        const priority = getReviewPriority(nextReviewDate);
        const badges = {
            urgent: { text: '今すぐ', className: 'priority-urgent', icon: CircleAlert },
            soon: { text: '近日中', className: 'priority-soon', icon: Clock3 },
            later: { text: 'あとでOK', className: 'priority-later', icon: Sparkles }
        };
        return badges[priority] || badges.later;
    };

    const startReview = useCallback((startQuestionId = null, sessionSize = selectedSessionSize) => {
        if (filteredQuestions.length === 0) {
            alert('復習する問題がありません');
            return;
        }

        const prioritizedQuestions = buildReviewSessionOrder(filteredQuestions);

        const orderedQuestions = startQuestionId
            ? [
                ...prioritizedQuestions.filter((question) => question.id === startQuestionId),
                ...prioritizedQuestions.filter((question) => question.id !== startQuestionId)
            ]
            : prioritizedQuestions;
        const sessionPool = orderedQuestions.filter(Boolean);

        if (sessionPool.length === 0) {
            alert('復習を開始できませんでした。リストを更新してからもう一度試してください。');
            loadReviewData();
            return;
        }

        const actualSessionSize = Math.min(sessionSize, sessionPool.length);
        const sessionOption = REVIEW_SESSION_OPTIONS.find((option) => option.size === sessionSize) || REVIEW_SESSION_OPTIONS[0];

        setSelectedSessionSize(sessionSize);

        setSessionSnapshot({
            dueBefore: reviewStats?.due || 0,
            totalBefore: reviewStats?.total || questions.length,
            sessionSize: actualSessionSize,
            eta: sessionOption.eta,
            label: sessionOption.label,
        });
        setQuizQuestions(sessionPool.slice(0, actualSessionSize));
        setIsQuizMode(true);
    }, [filteredQuestions, loadReviewData, questions.length, reviewStats?.due, reviewStats?.total, selectedSessionSize]);

    useEffect(() => {
        const autoStartConfig = location.state;
        if (!autoStartConfig?.autoStart || hasConsumedAutoStartRef.current) {
            return;
        }

        if (filteredQuestions.length === 0 || isQuizMode) {
            return;
        }

        hasConsumedAutoStartRef.current = true;
        startReview(autoStartConfig.startQuestionId || null, autoStartConfig.sessionSize || REVIEW_SESSION_SIZE);
        navigate(location.pathname, { replace: true, state: null });
    }, [filteredQuestions, isQuizMode, location.pathname, location.state, navigate, startReview]);

    const handleQuizComplete = ({ results = [], completed = false } = {}) => {
        if (completed && results.length > 0) {
            const dailyProgress = getNormalizedDailyReviewProgress(stats);
            const rewardSummary = getSessionRewards(results, {
                sessionSize: sessionSnapshot?.sessionSize,
                completedSetsToday: dailyProgress.reviewSetsToday,
                ticketsRemaining: dailyProgress.reviewTicketsRemaining,
            });
            const afterReviewStats = getReviewStats();
            const dueBefore = sessionSnapshot?.dueBefore ?? reviewStats?.due ?? 0;
            const totalBefore = sessionSnapshot?.totalBefore ?? reviewStats?.total ?? questions.length;
            const dueAfter = afterReviewStats?.due ?? 0;
            const totalAfter = afterReviewStats?.total ?? 0;
            const dueReduced = Math.max(dueBefore - dueAfter, 0);
            const totalReduced = Math.max(totalBefore - totalAfter, 0);
            const nextMilestone = getNextReviewStreakMilestone(rewardSummary.sessionStreak);

            if (updateStats) {
                updateStats({
                    diamonds: (stats?.diamonds || 0) + rewardSummary.diamonds,
                    intellect: (stats?.intellect || 0) + rewardSummary.intellect,
                    reviewRewardDate: dailyProgress.today,
                    reviewSetsToday: dailyProgress.reviewSetsToday + 1,
                    reviewTicketsRemaining: Math.max(
                        dailyProgress.reviewTicketsRemaining - (rewardSummary.ticketBonusActive ? 1 : 0),
                        0
                    ),
                });
            }

            setLastSessionSummary({
                ...rewardSummary,
                dueBefore,
                dueAfter,
                dueReduced,
                totalBefore,
                totalAfter,
                totalReduced,
                nextMilestone,
                coachMessage: getNoaReviewRewardMessage({
                    rewardSummary,
                    dueReduced,
                    totalReduced,
                    nextMilestone,
                }),
            });
        }

        setIsQuizMode(false);
        setQuizQuestions([]);
        setSessionSnapshot(null);
        loadReviewData();
    };

    // 科目リストを取得
    const subjectList = STUDY_TOPICS.map(s => s.name);
    const topSubject = reviewStats
        ? Object.entries(reviewStats.bySubject || {}).sort((a, b) => b[1] - a[1])[0]
        : null;
    const selectedSessionOption = REVIEW_SESSION_OPTIONS.find((option) => option.size === selectedSessionSize) || REVIEW_SESSION_OPTIONS[0];
    const availableQuestionCount = selectedSubject === 'all' && selectedPriority === 'all'
        ? ((reviewStats?.due || 0) > 0 ? (reviewStats?.due || 0) : filteredQuestions.length)
        : filteredQuestions.length;
    const activeSessionCount = Math.min(selectedSessionSize, availableQuestionCount);
    const rewardPreview = getSessionRewards(
        new Array(Math.max(activeSessionCount, 0)).fill({ isCorrect: true }),
        { sessionSize: Math.max(selectedSessionSize, 1) }
    );
    const nextMilestone = getNextReviewStreakMilestone(reviewSetsToday);
    const visibleQuestions = filteredQuestions.slice(0, visibleCount);
    const remainingQuestionCount = Math.max(filteredQuestions.length - visibleQuestions.length, 0);

    // If in quiz mode, show ReviewQuiz component
    if (isQuizMode) {
        return (
            <div className="review-page review-page-quiz">
                <Suspense fallback={<div className="review-page">復習モードを準備中...</div>}>
                    <ReviewQuiz
                        key={quizQuestions.map((question) => question.id).join('-')}
                        questions={quizQuestions}
                        stats={stats}
                        getRewardSummary={getSessionRewards}
                        onComplete={handleQuizComplete}
                    />
                </Suspense>
            </div>
        );
    }

    return (
        <div className="review-page">
            {/* ヘッダー */}
            <div className="review-header">
                <button className="back-btn-review" onClick={() => navigate('/study')}>
                    <ChevronLeft size={24} />
                </button>
                <h2 className="review-title">📚 弱点ノート</h2>
                <div className="stats-badge">
                    {reviewStats?.due || 0}件
                </div>
            </div>

            <section className="review-hero">
                <div className="review-hero-copy">
                    <span className="hero-kicker">今日の補習</span>
                    <h3>忘れかけを先に回収しよう</h3>
                    <p>
                        {reviewStats?.due
                            ? `今日やるべき問題が ${reviewStats.due} 件あります。今回は ${Math.max(activeSessionCount, 1)} 問・${selectedSessionOption.eta} でひと区切りまで持っていけます。`
                            : filteredQuestions.length
                                ? `今すぐの期限はありません。余裕があるうちに ${Math.max(activeSessionCount, 1)} 問だけ触っておくと次の授業がかなり楽です。`
                                : '弱点ノートはまだ空です。授業でつまずいた問題がここに集まります。'}
                    </p>
                </div>
                <div className="review-session-options" aria-label="復習セット選択">
                    {REVIEW_SESSION_OPTIONS.map((option) => {
                        const previewCount = Math.min(option.size, filteredQuestions.length);
                        const previewRewards = getSessionRewards(
                            new Array(Math.max(previewCount, 0)).fill({ isCorrect: true }),
                            { sessionSize: option.size }
                        );

                        return (
                            <button
                                key={option.size}
                                type="button"
                                className={`review-session-option ${selectedSessionSize === option.size ? 'active' : ''}`}
                                onClick={() => startReview(null, option.size)}
                            >
                                <span className="review-session-option-kicker">{option.label}</span>
                                <strong>{option.size}問</strong>
                                <span>{option.eta}</span>
                                <span>💎 {previewRewards.diamonds} / 🧠 {previewRewards.intellect}</span>
                                <span className="review-session-option-action">選んだらそのまま補習開始</span>
                            </button>
                        );
                    })}
                </div>
                <div className="review-hero-meta">
                    <div className="hero-chip">
                        <span className="hero-chip-label">今回のセット</span>
                        <strong>{Math.max(activeSessionCount, 1)}問 / {selectedSessionOption.eta}</strong>
                    </div>
                    <div className="hero-chip">
                        <span className="hero-chip-label">完走報酬めやす</span>
                        <strong>💎 {rewardPreview.diamonds} / 🧠 {rewardPreview.intellect}</strong>
                    </div>
                    <div className="hero-chip">
                        <span className="hero-chip-label">復習チケット</span>
                        <strong>{reviewTicketsRemaining}/{REVIEW_TICKET_DAILY_LIMIT} 回</strong>
                    </div>
                    <div className="hero-chip">
                        <span className="hero-chip-label">今日の連続セット</span>
                        <strong>{reviewSetsToday} セット</strong>
                    </div>
                    {topSubject && (
                        <div className="hero-chip">
                            <span className="hero-chip-label">多い科目</span>
                            <strong>{topSubject[0]} {topSubject[1]}問</strong>
                        </div>
                    )}
                </div>
                <div className="review-bonus-strip">
                    <div className="review-bonus-pill is-highlight">
                        タップしたセットでそのまま補習スタート
                    </div>
                    <div className={`review-bonus-pill ${reviewTicketsRemaining > 0 ? 'is-highlight' : 'is-muted'}`}>
                        {reviewTicketsRemaining > 0
                            ? `🎫 次のセットは追加で 💎 ${REVIEW_TICKET_BONUS_DIAMONDS} / 🧠 ${REVIEW_TICKET_BONUS_INTELLECT}`
                            : '🎫 今日のチケット報酬は受け取り済み'}
                    </div>
                    {nextMilestone && (
                        <div className="review-bonus-pill">
                            {`🔥 あと${nextMilestone.sessionCount - reviewSetsToday}セットで ${nextMilestone.label}`}
                        </div>
                    )}
                </div>
            </section>

            {lastSessionSummary && (
                <section className="review-session-summary">
                    <div className="review-session-summary-copy">
                        <span className="hero-kicker">補習リザルト</span>
                        <h3>{lastSessionSummary.answeredCount}問でいったん区切り。</h3>
                        <p>
                            {lastSessionSummary.correctCount}問正解。
                            {lastSessionSummary.perfectBonus ? ' パーフェクトボーナスも獲得したよ。' : ' ここでやめても十分前進。'}
                        </p>
                    </div>
                    <div className="review-session-summary-rewards">
                        <div className="hero-chip">
                            <span className="hero-chip-label">獲得</span>
                            <strong>💎 {lastSessionSummary.diamonds}</strong>
                        </div>
                        <div className="hero-chip">
                            <span className="hero-chip-label">知力</span>
                            <strong>🧠 {lastSessionSummary.intellect}</strong>
                        </div>
                        <div className="hero-chip">
                            <span className="hero-chip-label">今日の連続セット</span>
                            <strong>🔥 {lastSessionSummary.sessionStreak}</strong>
                        </div>
                        {lastSessionSummary.streakReward.label && (
                            <div className="hero-chip">
                                <span className="hero-chip-label">連続報酬</span>
                                <strong>{lastSessionSummary.streakReward.label}</strong>
                            </div>
                        )}
                    </div>
                    {lastSessionSummary.bonusLabels.length > 0 && (
                        <div className="review-session-summary-badges">
                            {lastSessionSummary.bonusLabels.map((label) => (
                                <span key={label} className="review-bonus-pill">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="review-session-summary-progress">
                        <div className="hero-chip">
                            <span className="hero-chip-label">今日の復習待ち</span>
                            <strong>{lastSessionSummary.dueBefore} → {lastSessionSummary.dueAfter}</strong>
                        </div>
                        <div className="hero-chip">
                            <span className="hero-chip-label">今回片づけた</span>
                            <strong>{lastSessionSummary.dueReduced}件</strong>
                        </div>
                        <div className="hero-chip">
                            <span className="hero-chip-label">残りストック</span>
                            <strong>{lastSessionSummary.totalAfter}件</strong>
                        </div>
                        {lastSessionSummary.totalReduced > 0 && (
                            <div className="hero-chip">
                                <span className="hero-chip-label">完全習得</span>
                                <strong>{lastSessionSummary.totalReduced}件</strong>
                            </div>
                        )}
                    </div>
                    <p className="review-session-summary-coach">{lastSessionSummary.coachMessage}</p>
                </section>
            )}

            {/* 統計情報 */}
            {reviewStats && (
                <div className="review-stats-bar">
                    <div className="stat-item">
                        <span className="stat-label">今日ぶん</span>
                        <span className="stat-value urgent">{reviewStats.byPriority.urgent}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">近日中</span>
                        <span className="stat-value soon">{reviewStats.byPriority.soon}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">全体</span>
                        <span className="stat-value">{reviewStats.total}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">余裕あり</span>
                        <span className="stat-value later">{reviewStats.byPriority.later}</span>
                    </div>
                </div>
            )}

            {/* フィルターエリア */}
            <div className="filter-area">
                <div className="filter-section">
                    <Filter size={16} />
                    <span className="filter-label">科目:</span>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">すべて</option>
                        {subjectList.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-section">
                    <Calendar size={16} />
                    <span className="filter-label">期限:</span>
                    <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">すべて</option>
                        <option value="urgent">今日</option>
                        <option value="soon">近日中</option>
                    </select>
                </div>
            </div>

            <div className="priority-pills" aria-label="優先度クイックフィルター">
                {[
                    { value: 'all', label: '全部みる' },
                    { value: 'urgent', label: '今すぐ' },
                    { value: 'soon', label: '近日中まで' }
                ].map((pill) => (
                    <button
                        key={pill.value}
                        type="button"
                        className={`priority-pill ${selectedPriority === pill.value ? 'active' : ''}`}
                        onClick={() => setSelectedPriority(pill.value)}
                    >
                        {pill.label}
                    </button>
                ))}
            </div>

            {/* 問題リスト */}
            <div className="questions-list">
                {filteredQuestions.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={48} color="#ccc" />
                        <p className="empty-text">復習する問題がありません</p>
                        <p className="empty-hint">授業で間違えた問題が自動でここにたまります</p>
                        <button className="empty-action-btn" onClick={() => navigate('/study')}>
                            授業へ戻る
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="list-toolbar">
                            <div className="list-count">
                                表示中 {filteredQuestions.length} 問
                            </div>
                            <div className="review-toolbar-hint">
                                上のセットを選ぶとそのまま補習スタート
                            </div>
                        </div>

                        {visibleQuestions.map((question) => {
                            const badge = getPriorityBadge(question.nextReviewDate);
                            const BadgeIcon = badge.icon;
                            return (
                                <button
                                    key={question.id}
                                    type="button"
                                    className="question-card"
                                    onClick={() => startReview(question.id)}
                                >
                                    <div className="card-header">
                                        <span className="subject-tag">{question.subject}</span>
                                        <span className={`priority-badge ${badge.className}`}>
                                            <BadgeIcon size={14} />
                                            {badge.text}
                                        </span>
                                    </div>
                                    <div className="question-preview">
                                        {question.questionText}
                                    </div>
                                    <div className="question-meta-row">
                                        <span className="review-level-chip">{formatReviewProgress(question.reviewLevel)}</span>
                                        <span className="review-growth-chip">{formatNextCorrectReviewProgress(question.reviewLevel)}</span>
                                        <span className="review-reset-chip">{formatWrongReviewProgress()}</span>
                                        {question.userAnswer && (
                                            <span className="last-answer-chip">前回: {question.userAnswer}</span>
                                        )}
                                    </div>
                                    <div className="card-footer">
                                        <div className="wrong-count">
                                            ❌ {question.wrongCount}回間違えた
                                        </div>
                                        <div className="next-review">
                                            📅 次回 {formatRelativeDate(question.nextReviewDate)}
                                        </div>
                                    </div>
                                    <div className="card-action">
                                        この問題から補習する
                                        <ArrowRight size={16} />
                                    </div>
                                </button>
                            );
                        })}

                        {remainingQuestionCount > 0 && (
                            <button
                                type="button"
                                className="start-review-btn-inline"
                                onClick={() => setVisibleCount((count) => count + VISIBLE_QUESTIONS_STEP)}
                            >
                                さらに表示
                                <span>残り {remainingQuestionCount}問</span>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Review;
