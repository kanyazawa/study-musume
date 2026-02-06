import React from 'react';
import './CalendarHeatmap.css';

const CalendarHeatmap = ({ year, month, monthlyStats, onDayClick }) => {
    // 月の最初の日と最後の日を取得
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // 最初の日の曜日（0=日曜, 6=土曜）
    const startDayOfWeek = firstDay.getDay();

    // カレンダーのグリッドを生成
    const calendarDays = [];

    // 前月の空白セルを追加
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.push({ isEmpty: true, key: `empty-${i}` });
    }

    // 実際の日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const stats = monthlyStats[date] || {};

        calendarDays.push({
            day,
            date,
            stats,
            isEmpty: false,
            key: date
        });
    }

    // 強度レベルに応じたクラス名を取得
    const getIntensityClass = (intensity) => {
        if (intensity === 0) return 'intensity-0';
        if (intensity === 1) return 'intensity-1';
        if (intensity === 2) return 'intensity-2';
        if (intensity === 3) return 'intensity-3';
        return 'intensity-4';
    };

    // 曜日ラベル
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    return (
        <div className="calendar-heatmap">
            {/* 曜日ヘッダー */}
            <div className="weekday-header">
                {weekDays.map(day => (
                    <div key={day} className="weekday-label">{day}</div>
                ))}
            </div>

            {/* カレンダーグリッド */}
            <div className="calendar-grid">
                {calendarDays.map(dayData => {
                    if (dayData.isEmpty) {
                        return <div key={dayData.key} className="calendar-day empty"></div>;
                    }

                    const { day, date, stats } = dayData;
                    const intensity = stats.intensity || 0;
                    const isToday = date === new Date().toISOString().split('T')[0];

                    return (
                        <div
                            key={dayData.key}
                            className={`calendar-day ${getIntensityClass(intensity)} ${isToday ? 'today' : ''}`}
                            onClick={() => onDayClick(date, stats)}
                            data-date={date}
                            data-minutes={stats.totalMinutes || 0}
                        >
                            <div className="day-number">{day}</div>
                            {stats.totalMinutes > 0 && (
                                <div className="day-indicator">
                                    <span className="dot"></span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 凡例 */}
            <div className="heatmap-legend">
                <span className="legend-label">学習時間：</span>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-box intensity-0"></div>
                        <span>なし</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-box intensity-1"></div>
                        <span>〜15分</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-box intensity-2"></div>
                        <span>〜30分</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-box intensity-3"></div>
                        <span>〜60分</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-box intensity-4"></div>
                        <span>60分〜</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarHeatmap;
