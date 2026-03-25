import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Calendar, BookOpen, Sparkles, Clock3, CircleAlert, ArrowRight } from 'lucide-react';
import {
    getReviewQuestions,
    getReviewPriority,
    formatRelativeDate,
    getReviewStats,
    formatReviewLevel,
    sortReviewQuestions,
    buildReviewSessionOrder
} from '../utils/reviewUtils';
import { STUDY_TOPICS } from '../data/studyTopics';
import './Review.css';

const ReviewQuiz = lazy(() => import('../components/ReviewQuiz'));
const INITIAL_VISIBLE_QUESTIONS = 40;
const VISIBLE_QUESTIONS_STEP = 40;
const REVIEW_SESSION_SIZE = 5;
const REVIEW_BASE_DIAMONDS = 8;
const REVIEW_BASE_INTELLECT = 12;
const REVIEW_PER_CORRECT_DIAMONDS = 2;
const REVIEW_PER_CORRECT_INTELLECT = 5;
const REVIEW_PERFECT_BONUS_DIAMONDS = 6;
const REVIEW_PERFECT_BONUS_INTELLECT = 8;

const Review = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [reviewStats, setReviewStats] = useState(null);
    const [isQuizMode, setIsQuizMode] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_QUESTIONS);
    const [lastSessionSummary, setLastSessionSummary] = useState(null);

    function loadReviewData() {
        const allQuestions = getReviewQuestions();
        setQuestions(allQuestions);
        setReviewStats(getReviewStats());
    }

    function applyFilters() {
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
    }

    useEffect(() => {
        loadReviewData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [selectedSubject, selectedPriority, questions]);

    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE_QUESTIONS);
    }, [selectedSubject, selectedPriority, questions]);

    const getSessionRewards = (results = []) => {
        const answeredCount = results.length;
        const correctCount = results.filter((result) => result.isCorrect).length;
        const perfectBonus = answeredCount > 0 && correctCount === answeredCount;
        const sessionScale = answeredCount > 0 ? Math.max(0.35, answeredCount / REVIEW_SESSION_SIZE) : 0;

        return {
            answeredCount,
            correctCount,
            diamonds:
                Math.round(REVIEW_BASE_DIAMONDS * sessionScale) +
                (correctCount * REVIEW_PER_CORRECT_DIAMONDS) +
                (perfectBonus ? REVIEW_PERFECT_BONUS_DIAMONDS : 0),
            intellect:
                Math.round(REVIEW_BASE_INTELLECT * sessionScale) +
                (correctCount * REVIEW_PER_CORRECT_INTELLECT) +
                (perfectBonus ? REVIEW_PERFECT_BONUS_INTELLECT : 0),
            perfectBonus,
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

    const startReview = (startQuestionId = null) => {
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

        setQuizQuestions(orderedQuestions.slice(0, REVIEW_SESSION_SIZE));
        setIsQuizMode(true);
    };

    const handleQuizComplete = ({ results = [], completed = false } = {}) => {
        if (completed && results.length > 0) {
            const rewardSummary = getSessionRewards(results);

            if (updateStats) {
                updateStats({
                    diamonds: (stats?.diamonds || 0) + rewardSummary.diamonds,
                    intellect: (stats?.intellect || 0) + rewardSummary.intellect,
                });
            }

            setLastSessionSummary(rewardSummary);
        }

        setIsQuizMode(false);
        setQuizQuestions([]);
        loadReviewData();
    };

    // 科目リストを取得
    const subjectList = STUDY_TOPICS.map(s => s.name);
    const topSubject = reviewStats
        ? Object.entries(reviewStats.bySubject || {}).sort((a, b) => b[1] - a[1])[0]
        : null;
    const recommendedCount = Math.min(
        REVIEW_SESSION_SIZE,
        (selectedPriority === 'all'
            ? (reviewStats?.due || 0) || filteredQuestions.length
            : filteredQuestions.length) || REVIEW_SESSION_SIZE
    );
    const rewardPreview = getSessionRewards(new Array(recommendedCount).fill({ isCorrect: true }));
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
                <h2 className="review-title">📚 復習</h2>
                <div className="stats-badge">
                    {reviewStats?.due || 0}件
                </div>
            </div>

            <section className="review-hero">
                <div className="review-hero-copy">
                    <span className="hero-kicker">Today's Review</span>
                    <h3>忘れかけを先に片づけよう</h3>
                    <p>
                        {reviewStats?.due
                            ? `今日やるべき問題が ${reviewStats.due} 件あります。短く回して、記憶をつなぎ直そう。`
                            : filteredQuestions.length
                                ? `今すぐの期限はありません。余裕があるうちに ${filteredQuestions.length} 件を整えておくと安心です。`
                                : '復習ストックは空です。学習で間違えた問題がここに集まります。'}
                    </p>
                </div>
                <div className="review-hero-meta">
                    <div className="hero-chip">
                        <span className="hero-chip-label">おすすめセット</span>
                        <strong>{recommendedCount}問で一区切り</strong>
                    </div>
                    <div className="hero-chip">
                        <span className="hero-chip-label">完走報酬めやす</span>
                        <strong>💎 {rewardPreview.diamonds} / 🧠 {rewardPreview.intellect}</strong>
                    </div>
                    {topSubject && (
                        <div className="hero-chip">
                            <span className="hero-chip-label">多い科目</span>
                            <strong>{topSubject[0]} {topSubject[1]}問</strong>
                        </div>
                    )}
                </div>
            </section>

            {lastSessionSummary && (
                <section className="review-session-summary">
                    <div className="review-session-summary-copy">
                        <span className="hero-kicker">Session Clear</span>
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
                    </div>
                </section>
            )}

            {/* 統計情報 */}
            {reviewStats && (
                <div className="review-stats-bar">
                    <div className="stat-item">
                        <span className="stat-label">復習待ち</span>
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
                        <p className="empty-hint">問題を間違えると自動で復習リストに追加されます</p>
                        <button className="empty-action-btn" onClick={() => navigate('/study')}>
                            学習に戻る
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="list-toolbar">
                            <div className="list-count">
                                表示中 {filteredQuestions.length} 問
                            </div>
                            <button className="start-review-btn-inline" onClick={() => startReview()}>
                                まず {Math.min(REVIEW_SESSION_SIZE, filteredQuestions.length)}問やる
                                <span>一区切り</span>
                            </button>
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
                                        <span className="review-level-chip">{formatReviewLevel(question.reviewLevel)}</span>
                                        {question.userAnswer && (
                                            <span className="last-answer-chip">前回: {question.userAnswer}</span>
                                        )}
                                    </div>
                                    <div className="card-footer">
                                        <div className="wrong-count">
                                            ❌ {question.wrongCount}回間違えた
                                        </div>
                                        <div className="next-review">
                                            📅 {formatRelativeDate(question.nextReviewDate)}
                                        </div>
                                    </div>
                                    <div className="card-action">
                                        この問題から始める
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
