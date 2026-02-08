import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Calendar, BookOpen } from 'lucide-react';
import {
    getReviewQuestions,
    filterBySubject,
    filterByPriority,
    getReviewPriority,
    formatRelativeDate,
    getReviewStats
} from '../utils/reviewUtils';
import { STUDY_TOPICS } from '../data/studyTopics';
import ReviewQuiz from '../components/ReviewQuiz';
import './Review.css';

const Review = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [stats, setStats] = useState(null);
    const [isQuizMode, setIsQuizMode] = useState(false);

    useEffect(() => {
        loadReviewData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [selectedSubject, selectedPriority, questions]);

    const loadReviewData = () => {
        const allQuestions = getReviewQuestions();
        setQuestions(allQuestions);
        setStats(getReviewStats());
    };

    const applyFilters = () => {
        let filtered = questions;

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
        filtered.sort((a, b) => a.nextReviewDate - b.nextReviewDate);

        setFilteredQuestions(filtered);
    };

    const getPriorityBadge = (nextReviewDate) => {
        const priority = getReviewPriority(nextReviewDate);
        const badges = {
            urgent: { text: '今日', className: 'priority-urgent' },
            soon: { text: '近日中', className: 'priority-soon' },
            later: { text: '余裕あり', className: 'priority-later' }
        };
        return badges[priority] || badges.later;
    };

    const startReview = () => {
        if (filteredQuestions.length === 0) {
            alert('復習する問題がありません');
            return;
        }
        setIsQuizMode(true);
    };

    const handleQuizComplete = (results) => {
        setIsQuizMode(false);
        loadReviewData(); // Reload to reflect updated review statuses
    };

    // 科目リストを取得
    const subjectList = STUDY_TOPICS.map(s => s.name);

    // If in quiz mode, show ReviewQuiz component
    if (isQuizMode) {
        return (
            <div className="review-page">
                <ReviewQuiz
                    questions={filteredQuestions}
                    onComplete={handleQuizComplete}
                />
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
                    {stats?.due || 0}件
                </div>
            </div>

            {/* 統計情報 */}
            {stats && (
                <div className="review-stats-bar">
                    <div className="stat-item">
                        <span className="stat-label">復習待ち</span>
                        <span className="stat-value urgent">{stats.byPriority.urgent}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">近日中</span>
                        <span className="stat-value soon">{stats.byPriority.soon}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">全体</span>
                        <span className="stat-value">{stats.total}</span>
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

            {/* 問題リスト */}
            <div className="questions-list">
                {filteredQuestions.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={48} color="#ccc" />
                        <p className="empty-text">復習する問題がありません</p>
                        <p className="empty-hint">問題を間違えると自動で復習リストに追加されます</p>
                    </div>
                ) : (
                    filteredQuestions.map((question) => {
                        const badge = getPriorityBadge(question.nextReviewDate);
                        return (
                            <div key={question.id} className="question-card">
                                <div className="card-header">
                                    <span className="subject-tag">{question.subject}</span>
                                    <span className={`priority-badge ${badge.className}`}>
                                        {badge.text}
                                    </span>
                                </div>
                                <div className="question-preview">
                                    {question.questionText}
                                </div>
                                <div className="card-footer">
                                    <div className="wrong-count">
                                        ❌ {question.wrongCount}回間違えた
                                    </div>
                                    <div className="next-review">
                                        📅 {formatRelativeDate(question.nextReviewDate)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 復習開始ボタン */}
            {filteredQuestions.length > 0 && (
                <button className="start-review-btn" onClick={startReview}>
                    復習を開始（{filteredQuestions.length}問）
                </button>
            )}
        </div>
    );
};

export default Review;
