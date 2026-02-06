import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import CalendarHeatmap from '../components/CalendarHeatmap';
import DayDetailModal from '../components/DayDetailModal';
import { getMonthlyStats, getMonthSummary, getStudyStreak } from '../utils/studyHistoryUtils';
import './CalendarPage.css';

const CalendarPage = () => {
    const navigate = useNavigate();
    const today = new Date();

    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStats, setSelectedStats] = useState(null);

    // データ取得
    const monthlyStats = getMonthlyStats(currentYear, currentMonth);
    const monthSummary = getMonthSummary(currentYear, currentMonth);
    const streak = getStudyStreak();

    // 月を変更
    const changeMonth = (delta) => {
        let newMonth = currentMonth + delta;
        let newYear = currentYear;

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    // 今月に戻る
    const goToCurrentMonth = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth() + 1);
    };

    // 日付クリックハンドラー
    const handleDayClick = (date, stats) => {
        setSelectedDate(date);
        setSelectedStats(stats);
    };

    // モーダルを閉じる
    const closeModal = () => {
        setSelectedDate(null);
        setSelectedStats(null);
    };

    return (
        <div className="calendar-page">
            {/* ヘッダー */}
            <div className="calendar-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ChevronLeft size={24} />
                </button>
                <h2>📅 学習カレンダー</h2>
            </div>

            {/* 連続学習バナー */}
            {streak > 0 && (
                <div className="streak-banner">
                    <div className="streak-icon">🔥</div>
                    <div className="streak-info">
                        <div className="streak-label">連続学習</div>
                        <div className="streak-value">{streak}日</div>
                    </div>
                    <div className="streak-message">
                        {streak >= 30 ? '素晴らしい！' : streak >= 7 ? '頑張ってる！' : 'いい調子！'}
                    </div>
                </div>
            )}

            {/* 月選択 */}
            <div className="month-selector">
                <button className="month-nav-btn" onClick={() => changeMonth(-1)}>
                    <ChevronLeft size={20} />
                </button>
                <div className="month-display">
                    <span className="year">{currentYear}年</span>
                    <span className="month">{currentMonth}月</span>
                </div>
                <button className="month-nav-btn" onClick={() => changeMonth(1)}>
                    <ChevronRight size={20} />
                </button>
                <button className="today-btn" onClick={goToCurrentMonth}>
                    今月
                </button>
            </div>

            {/* カレンダーヒートマップ */}
            <CalendarHeatmap
                year={currentYear}
                month={currentMonth}
                monthlyStats={monthlyStats}
                onDayClick={handleDayClick}
            />

            {/* 月間サマリー */}
            <div className="month-summary">
                <h3>📊 月間統計</h3>
                <div className="summary-grid">
                    <div className="summary-item">
                        <div className="summary-label">総学習時間</div>
                        <div className="summary-value">
                            {monthSummary.totalHours} 時間
                        </div>
                        <div className="summary-detail">
                            {monthSummary.totalMinutes}分
                        </div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">学習日数</div>
                        <div className="summary-value">
                            {monthSummary.studyDays} 日
                        </div>
                        <div className="summary-detail">
                            /{monthSummary.daysInMonth}日
                        </div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">平均学習時間</div>
                        <div className="summary-value">
                            {monthSummary.avgMinutes} 分
                        </div>
                        <div className="summary-detail">
                            /日
                        </div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">学習率</div>
                        <div className="summary-value">
                            {Math.round((monthSummary.studyDays / monthSummary.daysInMonth) * 100)}%
                        </div>
                        <div className="summary-detail">
                            達成度
                        </div>
                    </div>
                </div>
            </div>

            {/* ホームボタン */}
            <div className="bottom-area">
                <button className="big-home-btn" onClick={() => navigate('/')}>
                    <Home size={20} />
                    ホーム
                </button>
            </div>

            {/* 日詳細モーダル */}
            {selectedDate && (
                <DayDetailModal
                    date={selectedDate}
                    stats={selectedStats}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default CalendarPage;
