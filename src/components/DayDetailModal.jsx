import React from 'react';
import { X } from 'lucide-react';
import { STUDY_TOPICS } from '../data/studyTopics';
import './DayDetailModal.css';

const DayDetailModal = ({ date, stats, onClose }) => {
    if (!stats || stats.totalMinutes === 0) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="day-detail-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>{formatDate(date)}</h3>
                        <button className="close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="no-data-message">
                            <p>📚 この日は学習していません</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 科目の色を取得
    const getSubjectColor = (subject) => {
        const topic = STUDY_TOPICS.find(t => t.name === subject);
        return topic ? topic.color : '#999';
    };

    // 科目データを配列に変換＆ソート
    const subjectData = Object.entries(stats.subjects || {})
        .map(([subject, minutes]) => ({
            subject,
            minutes: Math.round(minutes),
            color: getSubjectColor(subject)
        }))
        .sort((a, b) => b.minutes - a.minutes);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="day-detail-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h3>{formatDate(date)}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* 総合統計 */}
                    <div className="summary-section">
                        <div className="summary-card">
                            <div className="summary-label">総学習時間</div>
                            <div className="summary-value">
                                {stats.totalMinutes} 分
                            </div>
                        </div>
                        {stats.accuracy !== null && (
                            <div className="summary-card">
                                <div className="summary-label">正解率</div>
                                <div className="summary-value">
                                    {stats.accuracy}%
                                </div>
                            </div>
                        )}
                        <div className="summary-card">
                            <div className="summary-label">学習回数</div>
                            <div className="summary-value">
                                {stats.sessionCount} 回
                            </div>
                        </div>
                    </div>

                    {/* 科目別内訳 */}
                    {subjectData.length > 0 && (
                        <div className="subjects-section">
                            <h4>📖 科目別学習時間</h4>
                            <div className="subject-list">
                                {subjectData.map(({ subject, minutes, color }) => {
                                    const percentage = Math.round((minutes / stats.totalMinutes) * 100);
                                    return (
                                        <div key={subject} className="subject-item">
                                            <div className="subject-header">
                                                <div className="subject-name">
                                                    <div
                                                        className="subject-color"
                                                        style={{ background: color }}
                                                    ></div>
                                                    {subject}
                                                </div>
                                                <div className="subject-time">
                                                    {minutes}分 ({percentage}%)
                                                </div>
                                            </div>
                                            <div className="subject-bar-container">
                                                <div
                                                    className="subject-bar"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        background: color
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 日付フォーマット関数
const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekDay = weekDays[date.getDay()];

    return `${year}年${month}月${day}日（${weekDay}）`;
};

export default DayDetailModal;
