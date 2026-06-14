import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Home, NotebookPen, Plus, Save, Trash2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import CalendarHeatmap from '../components/CalendarHeatmap';
import CharacterStage from '../components/character/CharacterStage';
import { getVocabByLevel } from '../data/vocabData';
import { getCharacterLabel } from '../data/characterData';
import { loadGoalTodos, saveGoalTodos } from '../utils/goalUtils';
import { updateMissionsOnWriteDailyNote } from '../utils/missionUtils';
import { getMonthlyStats, getStudyStreak } from '../utils/studyHistoryUtils';
import { createHomePose } from '../utils/characterPoseUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { LEVEL_THRESHOLDS } from '../utils/ratingUtils';
import { getVocabLevelProgress } from '../utils/vocabStudyUtils';
import './CalendarPage.css';

const PANEL_OPTIONS = [
    { id: 'calendar', label: '手帳' },
    { id: 'todo', label: 'ToDo' },
    { id: 'vocab', label: '英単語' },
];

const VOCAB_STATUS_META = {
    strong: { label: '得意', color: '#42e695' },
    learning: { label: '学習中', color: '#4ecfff' },
    weak: { label: '不得意', color: '#ff6ba6' },
    unseen: { label: '未着手', color: '#e8d8ca' },
};

const CalendarPage = ({ stats = {}, updateStats }) => {
    const navigate = useNavigate();
    const today = new Date();
    const todayString = new Date().toISOString().split('T')[0];

    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState(todayString);
    const [selectedStats, setSelectedStats] = useState(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [focusDraft, setFocusDraft] = useState('');
    const [goalTodos, setGoalTodos] = useState(() => loadGoalTodos());
    const [todoInput, setTodoInput] = useState('');
    const [activePanel, setActivePanel] = useState('calendar');

    const characterId = stats?.characterId || 'noah';
    const equippedSkin = stats?.equippedSkin || 'default';
    const equippedAccessories = Array.isArray(stats?.equippedAccessories) ? stats.equippedAccessories : [];
    const characterLabel = getCharacterLabel(characterId) || 'ノア';
    const renderer = resolveCharacterRenderer({
        preferredRenderer: hasLive2DModelConfig(characterId, equippedSkin) ? 'live2d' : stats?.characterRenderer,
        characterId,
        skinId: equippedSkin,
    });

    const calendarNotes = useMemo(() => stats?.calendarNotes || {}, [stats?.calendarNotes]);
    const calendarFocuses = useMemo(() => stats?.calendarFocuses || {}, [stats?.calendarFocuses]);
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
    const streak = getStudyStreak();
    const vocabLevelStats = useMemo(() => LEVEL_THRESHOLDS.map((levelMeta) => {
        const progress = getVocabLevelProgress(levelMeta.level, getVocabByLevel(levelMeta.level));
        const pieData = [
            { key: 'strong', value: progress.counts.strong, color: VOCAB_STATUS_META.strong.color, name: VOCAB_STATUS_META.strong.label },
            { key: 'learning', value: progress.counts.learning, color: VOCAB_STATUS_META.learning.color, name: VOCAB_STATUS_META.learning.label },
            { key: 'weak', value: progress.counts.weak, color: VOCAB_STATUS_META.weak.color, name: VOCAB_STATUS_META.weak.label },
            { key: 'unseen', value: progress.counts.unseen, color: VOCAB_STATUS_META.unseen.color, name: VOCAB_STATUS_META.unseen.label },
        ].filter((slice) => slice.value > 0);

        return {
            ...levelMeta,
            progress,
            pieData,
        };
    }), []);

    useEffect(() => {
        const statsForDate = monthlyStats[selectedDate] || null;
        setSelectedStats(statsForDate);
        setNoteDraft(calendarNotes[selectedDate] || '');
        setFocusDraft(calendarFocuses[selectedDate] || '');
    }, [calendarFocuses, calendarNotes, monthlyStats, selectedDate]);

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

    const goToCurrentMonth = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth() + 1);
        setSelectedDate(todayString);
    };

    const handleDayClick = (date, dayStats) => {
        setSelectedDate(date);
        setSelectedStats(dayStats);
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
    const weakWordTotal = vocabLevelStats.reduce((sum, levelStat) => sum + levelStat.progress.counts.weak, 0);
    const studiedWordTotal = vocabLevelStats.reduce((sum, levelStat) => sum + levelStat.progress.studiedWords, 0);

    const coachSpeech = useMemo(() => {
        if (activePanel === 'todo') {
            if (goalTodos.length === 0) {
                return `${characterLabel}のToDoノートはまだ真っ白だよ。今日やることを3つくらいに絞ると進めやすいよ。`;
            }

            return `今のToDoは${completedGoalTodoCount}件完了、残りは${goalTodos.length - completedGoalTodoCount}件。重たいものから片づけていこう。`;
        }

        if (activePanel === 'vocab') {
            if (studiedWordTotal === 0) {
                return `英単語の定着状況はまだこれからだね。まずはやさしい級から触って、円グラフを育てていこう。`;
            }

            if (weakWordTotal > 0) {
                return `英単語は${studiedWordTotal}語ぶん記録があるよ。特に不得意が${weakWordTotal}語あるから、そこを優先すると伸びやすいね。`;
            }

            return `英単語の定着はかなり安定してきてるよ。このまま次の級も埋めていこう。`;
        }

        if (!selectedDate) {
            return `${characterLabel}が今月の予定を預かるよ。日付を選んで、ひとことメモも残していこう。`;
        }

        const selectedMinutes = selectedStats?.totalMinutes || 0;
        const trimmedFocus = focusDraft.trim();
        const trimmedNote = noteDraft.trim();
        const dateLabel = formatDate(selectedDate);

        if (selectedDate === todayString && trimmedFocus) {
            return `${dateLabel}は「${trimmedFocus}」を意識して進めよう。終わったら手帳にちゃんと書いて見せてね。`;
        }

        if (hasSelectedStudy && trimmedNote) {
            return `${dateLabel}は${selectedMinutes}分しっかり進められてるね。メモまで残せていて、かなりいい感じ。`;
        }

        if (hasSelectedStudy) {
            return `${dateLabel}は${selectedMinutes}分がんばれてるよ。この勢いでひとこと振り返りも残しておこう。`;
        }

        if (trimmedFocus) {
            return `${dateLabel}はまだ学習前だね。今日は「${trimmedFocus}」を目印にして、手帳どおりに進めていこう。`;
        }

        return `${dateLabel}の予定はまだ空いてるよ。${characterLabel}と一緒に今日の勉強プランを埋めていこう。`;
    }, [activePanel, characterLabel, completedGoalTodoCount, focusDraft, goalTodos.length, hasSelectedStudy, noteDraft, selectedDate, selectedStats, studiedWordTotal, todayString, weakWordTotal]);

    const coachPose = useMemo(() => {
        const emotion = hasSelectedStudy
            ? 'happy'
            : focusDraft.trim()
                ? 'serious'
                : selectedDate === todayString
                    ? 'normal'
                    : 'smile';
        const live2dFaceAccent = hasSelectedStudy
            ? 'star'
            : noteDraft.trim()
                ? 'shy'
                : '';

        return createHomePose({
            emotion,
            text: coachSpeech,
            live2dFaceAccent,
        });
    }, [coachSpeech, focusDraft, hasSelectedStudy, noteDraft, selectedDate, todayString]);

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
            <div className="calendar-scene-background" aria-hidden="true" />
            <div className="calendar-scene-background-overlay" aria-hidden="true" />
            <div className="calendar-scene-shell">
                <section className="calendar-hero">
                    <div className="calendar-scene-nav">
                        <button
                            type="button"
                            className="back-btn"
                            aria-label="ホームへ戻る"
                            onClick={() => navigate('/home')}
                        >
                            <Home size={18} />
                        </button>
                    </div>
                    <div className="calendar-face-safe-zone" aria-hidden="true" />
                    <div className="calendar-hero-character-zone">
                        <div className="calendar-coach-portrait">
                            <div className="calendar-coach-portrait-glow" aria-hidden="true" />
                            <div className="calendar-coach-portrait-frame">
                                <CharacterStage
                                    characterId={characterId}
                                    renderer={renderer}
                                    skinId={equippedSkin}
                                    accessoryIds={equippedAccessories}
                                    pose={{ ...coachPose, scene: 'home' }}
                                    scene="home"
                                    className="calendar-coach-character"
                                    imageStyle={{
                                        height: '100%',
                                        width: '100%',
                                        '--character-stage-overflow': 'visible',
                                    }}
                                    alt={`${characterLabel} portrait`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="calendar-hero-panel">
                        <div className="calendar-coach-panel">
                            <div className="calendar-coach-speech calendar-speech-bubble">
                                <div className="calendar-coach-name">{characterLabel}</div>
                                <p>{coachSpeech}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="calendar-workspace">
                    <div className="calendar-control-panel">
                        <div className="calendar-panel-switcher" role="tablist" aria-label="表示切り替え">
                            {PANEL_OPTIONS.map((panel) => (
                                <button
                                    key={panel.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={activePanel === panel.id}
                                    className={`calendar-panel-tab ${activePanel === panel.id ? 'is-active' : ''}`}
                                    onClick={() => setActivePanel(panel.id)}
                                >
                                    {panel.label}
                                </button>
                            ))}
                        </div>

                        {activePanel === 'calendar' && (
                            <div className="calendar-panel-stack">
                                <div className="calendar-sheet calendar-book-page">
                                {streak > 0 && (
                                    <div className="streak-banner">
                                        <div className="streak-icon">🔥</div>
                                        <div className="streak-info">
                                            <div className="streak-label">連続学習</div>
                                            <div className="streak-value">{streak}日</div>
                                        </div>
                                        <div className="streak-message">
                                            {streak >= 30 ? '絶好調！' : streak >= 7 ? '仕上がってきたね' : '毎日えらい'}
                                        </div>
                                    </div>
                                )}

                                <div className="month-selector">
                                    <button type="button" className="month-nav-btn" onClick={() => changeMonth(-1)}>
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="month-display">
                                        <span className="year">{currentYear}年</span>
                                        <span className="month">{currentMonth}月</span>
                                    </div>
                                    <button type="button" className="month-nav-btn" onClick={() => changeMonth(1)}>
                                        <ChevronRight size={20} />
                                    </button>
                                    <button type="button" className="today-btn" onClick={goToCurrentMonth}>
                                        今月に戻る
                                    </button>
                                </div>

                                <CalendarHeatmap
                                    year={currentYear}
                                    month={currentMonth}
                                    monthlyStats={monthlyStats}
                                    selectedDate={selectedDate}
                                    onDayClick={handleDayClick}
                                />
                                </div>

                                <div className="calendar-detail-grid">
                                    <div className="calendar-sheet calendar-note-panel">
                                        <div className="calendar-note-header">
                                            <div>
                                                <div className="calendar-note-eyebrow">DAILY NOTE</div>
                                                <h3>
                                                    <NotebookPen size={18} />
                                                    {selectedDate ? `${formatDate(selectedDate)}のメモ` : '日付を選んでメモ'}
                                                </h3>
                                            </div>
                                            <button
                                                type="button"
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
                                                <div className="selected-chip">
                                                    {noteDraft.trim() ? 'メモあり' : 'メモなし'}
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
                                </div>
                            </div>
                        )}

                        {activePanel === 'todo' && (
                            <div className="calendar-single-panel">
                                <div className="calendar-sheet calendar-todo-panel">
                            <div className="calendar-todo-header">
                                <div>
                                    <div className="calendar-note-eyebrow">TASK LIST</div>
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
                            </div>
                        )}

                        {activePanel === 'vocab' && (
                            <div className="calendar-single-panel">
                                <div className="calendar-sheet calendar-vocab-panel">
                            <div className="calendar-todo-header">
                                <div>
                                    <div className="calendar-note-eyebrow">VOCAB PROGRESS</div>
                                    <h3>英単語レベル別の定着状況</h3>
                                    <p className="calendar-vocab-lead">級ごとの得意・学習中・不得意・未着手をここで切り替えなしに確認できます。</p>
                                </div>
                            </div>

                            <div className="calendar-vocab-grid">
                                {vocabLevelStats.map((levelStat) => (
                                    <section key={levelStat.level} className="calendar-vocab-card">
                                        <div className="calendar-vocab-card-head">
                                            <div>
                                                <p className="calendar-vocab-level-tag" style={{ color: levelStat.color }}>
                                                    {levelStat.emoji} {levelStat.label}
                                                </p>
                                                <h4>{levelStat.progress.studiedWords} / {levelStat.progress.totalWords} 語を学習</h4>
                                            </div>
                                            <div className="calendar-vocab-accuracy" style={{ color: levelStat.color }}>
                                                {levelStat.progress.accuracy}%
                                            </div>
                                        </div>

                                        <div className="calendar-vocab-chart-row">
                                            <div className="calendar-vocab-chart-wrap">
                                                <ResponsiveContainer width="100%" height={180}>
                                                    <PieChart>
                                                        <Pie
                                                            data={levelStat.pieData}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={46}
                                                            outerRadius={74}
                                                            paddingAngle={2}
                                                            stroke="none"
                                                        >
                                                            {levelStat.pieData.map((slice) => (
                                                                <Cell key={`${levelStat.level}-${slice.key}`} fill={slice.color} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="calendar-vocab-legend">
                                                {Object.entries(VOCAB_STATUS_META).map(([key, meta]) => (
                                                    <div key={`${levelStat.level}-${key}`} className="calendar-vocab-legend-item">
                                                        <span className="calendar-vocab-dot" style={{ background: meta.color }} />
                                                        <span>{meta.label}</span>
                                                        <strong>{levelStat.progress.counts[key]}</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="calendar-vocab-chip-row">
                                            {levelStat.progress.weakWords.length > 0 ? (
                                                levelStat.progress.weakWords.slice(0, 3).map((word) => (
                                                    <span key={`${levelStat.level}-${word.entryKey}`} className="calendar-vocab-chip is-weak">
                                                        {word.word}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="calendar-vocab-chip is-clear">苦手語なし</span>
                                            )}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </div>
                            </div>
                        )}
                    </div>
                </section>
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
