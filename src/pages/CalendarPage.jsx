import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Check, ChevronLeft, ChevronRight, Home, NotebookPen, Plus, Save, Trash2 } from 'lucide-react';
import CalendarHeatmap from '../components/CalendarHeatmap';
import { loadGoalTodos, saveGoalTodos } from '../utils/goalUtils';
import { updateMissionsOnWriteDailyNote } from '../utils/missionUtils';
import { getMonthlyStats, getMonthSummary, getStudyStreak } from '../utils/studyHistoryUtils';
import './CalendarPage.css';

const CalendarPage = ({ stats = {}, updateStats }) => {
    const navigate = useNavigate();
    const today = new Date();
    const todayString = new Date().toISOString().split('T')[0];

    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedDate, setSelectedDate] = useState(todayString);
    const [selectedStats, setSelectedStats] = useState(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [focusDraft, setFocusDraft] = useState('');
    const [goalTodos, setGoalTodos] = useState(() => loadGoalTodos());
    const [todoInput, setTodoInput] = useState('');

    // データ取得
    const calendarNotes = stats?.calendarNotes || {};
    const calendarFocuses = stats?.calendarFocuses || {};
    const monthlyStats = useMemo(() => {
        const baseMonthlyStats = getMonthlyStats(currentYear, currentMonth);

        return Object.fromEntries(
            Object.entries(baseMonthlyStats).map(([date, dayStats]) => [
                date,
                {
                    ...dayStats,
                    note: calendarNotes[date] || '',
                    focus: calendarFocuses[date] || '',
                },
            ]),
        );
    }, [calendarFocuses, calendarNotes, currentMonth, currentYear]);
    const monthSummary = useMemo(
        () => getMonthSummary(currentYear, currentMonth),
        [currentMonth, currentYear],
    );
    const streak = getStudyStreak();

    useEffect(() => {
        const statsForDate = monthlyStats[selectedDate] || null;
        setSelectedStats(statsForDate);
        setNoteDraft(calendarNotes[selectedDate] || '');
        setFocusDraft(calendarFocuses[selectedDate] || '');
    }, [calendarFocuses, calendarNotes, monthlyStats, selectedDate]);

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
        setSelectedDate(`${newYear}-${String(newMonth).padStart(2, '0')}-01`);
    };

    // 今月に戻る
    const goToCurrentMonth = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth() + 1);
        setSelectedDate(todayString);
    };

    // 日付クリックハンドラー
    const handleDayClick = (date, stats) => {
        setSelectedDate(date);
        setSelectedStats(stats);
        setNoteDraft(calendarNotes[date] || '');
        setFocusDraft(calendarFocuses[date] || '');
    };

    const handleSaveNote = () => {
        if (!updateStats || !selectedDate) {
            return;
        }

        const trimmedNote = noteDraft.trim();
        const trimmedFocus = focusDraft.trim();
        const hadSavedNote = String(calendarNotes[selectedDate] || '').trim().length > 0;
        const shouldTrackDailyNoteMission = (
            selectedDate === todayString
            && trimmedNote.length > 0
            && !hadSavedNote
        );

        updateStats((currentStats) => {
            const nextNotes = { ...(currentStats?.calendarNotes || {}) };
            const nextFocuses = { ...(currentStats?.calendarFocuses || {}) };

            if (trimmedNote) {
                nextNotes[selectedDate] = trimmedNote;
            } else {
                delete nextNotes[selectedDate];
            }

            if (trimmedFocus) {
                nextFocuses[selectedDate] = trimmedFocus;
            } else {
                delete nextFocuses[selectedDate];
            }

            return {
                calendarNotes: nextNotes,
                calendarFocuses: nextFocuses,
            };
        });

        if (shouldTrackDailyNoteMission) {
            updateMissionsOnWriteDailyNote();
        }
    };

    const selectedNoteLength = noteDraft.length;
    const hasSelectedStudy = (selectedStats?.totalMinutes || 0) > 0;
    const completedGoalTodoCount = goalTodos.filter((todo) => todo.completed).length;

    const persistGoalTodos = (nextTodos) => {
        const result = saveGoalTodos(nextTodos);
        if (!result.ok) {
            return false;
        }

        setGoalTodos(result.todos);
        if (updateStats) {
            updateStats((currentStats) => ({ ...currentStats }));
        }
        return true;
    };

    const handleAddTodo = () => {
        const trimmedInput = todoInput.trim();
        if (!trimmedInput) {
            return;
        }

        const saved = persistGoalTodos([
            ...goalTodos,
            { id: Date.now(), text: trimmedInput, completed: false },
        ]);

        if (saved) {
            setTodoInput('');
        }
    };

    const handleToggleTodo = (todoId) => {
        persistGoalTodos(goalTodos.map((todo) => (
            todo.id === todoId
                ? { ...todo, completed: !todo.completed }
                : todo
        )));
    };

    const handleDeleteTodo = (todoId) => {
        persistGoalTodos(goalTodos.filter((todo) => todo.id !== todoId));
    };

    return (
        <div className="calendar-page">
            {/* ヘッダー */}
            <div className="calendar-header">
                <button className="back-btn" onClick={() => navigate('/home')}>
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

            <div className="calendar-note-panel">
                <div className="calendar-note-header">
                    <div>
                        <div className="calendar-note-eyebrow">DAILY NOTE</div>
                        <h3>
                            <NotebookPen size={18} />
                            {selectedDate ? `${formatDate(selectedDate)}のメモ` : '日付を選んでメモ'}
                        </h3>
                    </div>
                    <button
                        className="note-save-btn"
                        onClick={handleSaveNote}
                        disabled={!selectedDate}
                    >
                        <Save size={16} />
                        保存
                    </button>
                </div>

                {selectedDate && (
                    <div className="selected-day-summary">
                        <div className="selected-chip">
                            学習時間 {selectedStats?.totalMinutes || 0}分
                        </div>
                        <div className="selected-chip">
                            学習回数 {selectedStats?.sessionCount || 0}回
                        </div>
                        <div className="selected-chip">
                            {hasSelectedStudy ? '学習あり' : '学習なし'}
                        </div>
                    </div>
                )}

                <textarea
                    className="calendar-note-input"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value.slice(0, 300))}
                    placeholder="その日の勉強メモ、やること、振り返りを書けます"
                    disabled={!selectedDate}
                />

                <div className="calendar-focus-block">
                    <div className="calendar-focus-label">
                        ホームに出すひとこと目標
                    </div>
                    <input
                        className="calendar-focus-input"
                        type="text"
                        value={focusDraft}
                        onChange={(event) => setFocusDraft(event.target.value.slice(0, 80))}
                        placeholder="例: 英単語20個だけ終わらせる"
                        disabled={!selectedDate}
                    />
                    <div className="calendar-focus-help">
                        この日付が次の日の予定になるタイミングで、ホームに表示されます
                    </div>
                </div>

                <div className="calendar-note-footer">
                    <span>選択した日付ごとに保存されます</span>
                    <span>{selectedNoteLength}/300</span>
                </div>
            </div>

            <div className="calendar-todo-panel">
                <div className="calendar-todo-header">
                    <div>
                        <div className="calendar-note-eyebrow">TODO</div>
                        <h3>やることリスト</h3>
                    </div>
                    <div className="calendar-todo-progress">
                        {completedGoalTodoCount}/{goalTodos.length || 0}
                    </div>
                </div>

                <div className="calendar-todo-input-row">
                    <input
                        className="calendar-todo-input"
                        type="text"
                        value={todoInput}
                        onChange={(event) => setTodoInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleAddTodo();
                            }
                        }}
                        placeholder="今週やることを追加"
                    />
                    <button
                        type="button"
                        className="calendar-todo-add-btn"
                        onClick={handleAddTodo}
                    >
                        <Plus size={16} />
                        追加
                    </button>
                </div>

                <div className="calendar-todo-list">
                    {goalTodos.length > 0 ? goalTodos.map((todo) => (
                        <div
                            key={todo.id}
                            className={`calendar-todo-item ${todo.completed ? 'completed' : ''}`}
                        >
                            <button
                                type="button"
                                className="calendar-todo-toggle"
                                onClick={() => handleToggleTodo(todo.id)}
                                aria-label={todo.completed ? '未完了に戻す' : '完了にする'}
                            >
                                {todo.completed && <Check size={14} />}
                            </button>
                            <span className="calendar-todo-text">{todo.text}</span>
                            <button
                                type="button"
                                className="calendar-todo-delete"
                                onClick={() => handleDeleteTodo(todo.id)}
                                aria-label="削除"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    )) : (
                        <div className="calendar-todo-empty">
                            まだToDoはありません。明日の目標と一緒にここで整理できます。
                        </div>
                    )}
                </div>
            </div>

            {/* 月間サマリー */}
            <div className="month-summary">
                <div className="month-summary-header">
                    <h3>📊 月間統計</h3>
                    <button
                        className="stats-link-btn"
                        onClick={() => navigate('/stats')}
                    >
                        <BarChart3 size={16} />
                        統計を見る
                    </button>
                </div>
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
                <button className="big-home-btn" onClick={() => navigate('/home')}>
                    <Home size={20} />
                    ホーム
                </button>
            </div>

        </div>
    );
};

const formatDate = (dateString) => {
    const date = new Date(`${dateString}T00:00:00`);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${month}月${day}日（${weekDays[date.getDay()]}）`;
};

export default CalendarPage;
