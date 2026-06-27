import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Heart, Home, NotebookPen, Plus, Trash2 } from 'lucide-react';
import CalendarHeatmap from '../components/CalendarHeatmap';
import CharacterStage from '../components/character/CharacterStage';
import { getCharacterLabel } from '../data/characterData';
import { getVocabLevelTotal } from '../data/vocabStatsMeta';
import { loadGoalTodos, saveGoalTodos } from '../utils/goalUtils';
import { updateMissionsOnWriteDailyNote } from '../utils/missionUtils';
import { getMonthlyStats, getStudyStreak } from '../utils/studyHistoryUtils';
import { createHomePose } from '../utils/characterPoseUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { LEVEL_THRESHOLDS } from '../utils/ratingUtils';
import { getStoredVocabLevelProgress } from '../utils/vocabStudyUtils';
import './CalendarPage.css';

const PANEL_OPTIONS = [
    { id: 'calendar', label: '手帳' },
    { id: 'vocab', label: '英単語' },
    { id: 'happiness', label: '幸福度' },
    { id: 'todo', label: 'ToDo' },
];

const VOCAB_STATUS_META = {
    strong: { label: '得意', color: '#42e695' },
    learning: { label: '学習中', color: '#4ecfff' },
    weak: { label: '不得意', color: '#ff6ba6' },
    unseen: { label: '未着手', color: '#e8d8ca' },
};

const AUTO_SAVE_DELAY_MS = 500;

const buildConicGradient = (slices) => {
    const total = slices.reduce((sum, slice) => sum + Math.max(0, Number(slice?.value) || 0), 0);

    if (total <= 0) {
        return 'conic-gradient(rgba(255,255,255,0.16) 0deg 360deg)';
    }

    let currentAngle = 0;

    const segments = slices.map((slice) => {
        const value = Math.max(0, Number(slice?.value) || 0);
        const startAngle = currentAngle;
        const sweepAngle = (value / total) * 360;
        currentAngle += sweepAngle;
        return `${slice.color} ${startAngle}deg ${currentAngle}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
};

const clampHappinessValue = (value) => {
    const normalized = Number(value);

    if (!Number.isFinite(normalized)) {
        return null;
    }

    const rounded = Math.round(normalized);
    return rounded >= 1 && rounded <= 10 ? rounded : null;
};

const buildMonthlyHappinessSeries = (year, month, happinessByDate = {}) => {
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        return {
            day,
            date,
            value: clampHappinessValue(happinessByDate[date]),
        };
    });
};

const buildHappinessChart = (series) => {
    const width = 320;
    const height = 196;
    const padding = { top: 18, right: 14, bottom: 30, left: 28 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const dayCount = Math.max(series.length - 1, 1);
    const plottedPoints = series
        .filter((point) => point.value !== null)
        .map((point) => {
            const x = padding.left + ((point.day - 1) / dayCount) * innerWidth;
            const y = padding.top + ((10 - point.value) / 9) * innerHeight;

            return {
                ...point,
                x,
                y,
            };
        });

    const linePath = plottedPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');

    const areaPath = plottedPoints.length > 0
        ? [
            `M ${plottedPoints[0].x.toFixed(2)} ${(height - padding.bottom).toFixed(2)}`,
            ...plottedPoints.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
            `L ${plottedPoints[plottedPoints.length - 1].x.toFixed(2)} ${(height - padding.bottom).toFixed(2)}`,
            'Z',
        ].join(' ')
        : '';

    const yTicks = Array.from({ length: 10 }, (_, index) => {
        const value = 10 - index;
        return {
            value,
            y: padding.top + ((10 - value) / 9) * innerHeight,
        };
    });
    const xTickDays = Array.from(new Set([
        1,
        Math.max(1, Math.round(series.length / 2)),
        series.length,
    ])).sort((left, right) => left - right);
    const xTicks = xTickDays.map((day) => ({
        day,
        x: padding.left + ((day - 1) / dayCount) * innerWidth,
    }));

    return {
        width,
        height,
        padding,
        plottedPoints,
        linePath,
        areaPath,
        yTicks,
        xTicks,
        chartBottom: height - padding.bottom,
    };
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
    const [happinessDraft, setHappinessDraft] = useState(null);
    const [goalTodos, setGoalTodos] = useState(() => loadGoalTodos());
    const [todoInput, setTodoInput] = useState('');
    const [activePanel, setActivePanel] = useState('calendar');
    const noteMissionTrackedRef = useRef(new Set());

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
    const calendarHappiness = useMemo(() => stats?.calendarHappiness || {}, [stats?.calendarHappiness]);
    const monthlyStats = useMemo(() => {
        const baseMonthlyStats = getMonthlyStats(currentYear, currentMonth);

        return Object.fromEntries(
            Object.entries(baseMonthlyStats).map(([date, dayStats]) => [
                date,
                {
                    ...dayStats,
                    note: calendarNotes[date] || '',
                    focus: calendarFocuses[date] || '',
                    happiness: clampHappinessValue(calendarHappiness[date]),
                },
            ]),
        );
    }, [calendarFocuses, calendarHappiness, calendarNotes, currentMonth, currentYear]);
    const streak = getStudyStreak();
    const vocabLevelStats = useMemo(() => LEVEL_THRESHOLDS.map((levelMeta) => {
        const progress = getStoredVocabLevelProgress(levelMeta.level, {
            totalWords: getVocabLevelTotal(levelMeta.level),
        });
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
            donutBackground: buildConicGradient(pieData),
        };
    }), []);
    const monthlyHappinessSeries = useMemo(
        () => buildMonthlyHappinessSeries(currentYear, currentMonth, calendarHappiness),
        [calendarHappiness, currentMonth, currentYear],
    );
    const savedHappinessForSelectedDate = clampHappinessValue(calendarHappiness[selectedDate]);
    const happinessChart = useMemo(
        () => buildHappinessChart(monthlyHappinessSeries),
        [monthlyHappinessSeries],
    );
    const recordedHappinessSeries = useMemo(
        () => monthlyHappinessSeries.filter((point) => point.value !== null),
        [monthlyHappinessSeries],
    );
    const averageHappiness = recordedHappinessSeries.length > 0
        ? (recordedHappinessSeries.reduce((sum, point) => sum + point.value, 0) / recordedHappinessSeries.length).toFixed(1)
        : null;
    const highestHappiness = recordedHappinessSeries.length > 0
        ? Math.max(...recordedHappinessSeries.map((point) => point.value))
        : null;
    const latestHappiness = recordedHappinessSeries.length > 0
        ? recordedHappinessSeries[recordedHappinessSeries.length - 1]
        : null;
    const selectedHappinessNote = noteDraft.trim();
    const selectedHappinessFocus = focusDraft.trim();

    useEffect(() => {
        const statsForDate = monthlyStats[selectedDate] || null;
        setSelectedStats(statsForDate);
        setNoteDraft(calendarNotes[selectedDate] || '');
        setFocusDraft(calendarFocuses[selectedDate] || '');
        setHappinessDraft(clampHappinessValue(calendarHappiness[selectedDate]));
    }, [calendarFocuses, calendarHappiness, calendarNotes, monthlyStats, selectedDate]);

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
        setHappinessDraft(clampHappinessValue(calendarHappiness[date]));
    };

    const persistNoteDraft = () => {
        if (!updateStats || !selectedDate) {
            return;
        }

        const trimmedNote = noteDraft.trim();
        const trimmedFocus = focusDraft.trim();
        const savedNote = String(calendarNotes[selectedDate] || '').trim();
        const savedFocus = String(calendarFocuses[selectedDate] || '').trim();
        const hasChanges = trimmedNote !== savedNote || trimmedFocus !== savedFocus;

        if (!hasChanges) {
            return;
        }

        const hadSavedNote = savedNote.length > 0;
        const shouldTrackDailyNoteMission = (
            selectedDate === todayString
            && trimmedNote.length > 0
            && !hadSavedNote
            && !noteMissionTrackedRef.current.has(selectedDate)
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
            noteMissionTrackedRef.current.add(selectedDate);
            updateMissionsOnWriteDailyNote();
        }
    };

    const persistHappinessDraft = () => {
        if (!updateStats || !selectedDate) {
            return;
        }

        const normalizedHappiness = clampHappinessValue(happinessDraft);
        const savedHappiness = clampHappinessValue(calendarHappiness[selectedDate]);

        if (normalizedHappiness === savedHappiness) {
            return;
        }

        updateStats((currentStats) => {
            const nextHappiness = { ...(currentStats?.calendarHappiness || {}) };

            if (normalizedHappiness !== null) {
                nextHappiness[selectedDate] = normalizedHappiness;
            } else {
                delete nextHappiness[selectedDate];
            }

            return {
                calendarHappiness: nextHappiness,
            };
        });
    };

    useEffect(() => {
        if (!selectedDate) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            persistNoteDraft();
        }, AUTO_SAVE_DELAY_MS);

        return () => window.clearTimeout(timeoutId);
    }, [calendarFocuses, calendarNotes, focusDraft, noteDraft, selectedDate, todayString, updateStats]);

    useEffect(() => {
        if (!selectedDate) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            persistHappinessDraft();
        }, AUTO_SAVE_DELAY_MS);

        return () => window.clearTimeout(timeoutId);
    }, [calendarHappiness, happinessDraft, selectedDate, updateStats]);

    const handleHappinessDateChange = (nextDate) => {
        if (!nextDate) {
            return;
        }

        const parsed = new Date(`${nextDate}T00:00:00`);
        setCurrentYear(parsed.getFullYear());
        setCurrentMonth(parsed.getMonth() + 1);
        setSelectedDate(nextDate);
    };

    const handleHappinessPointSelect = (date) => {
        if (!date) {
            return;
        }

        setSelectedDate(date);
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

        if (activePanel === 'happiness') {
            if (recordedHappinessSeries.length === 0) {
                return `${characterLabel}と一緒に、その日の幸福度を10段階で残していこう。少しずつ並ぶと、調子の波が見えやすくなるよ。`;
            }

            if (savedHappinessForSelectedDate !== null) {
                return `${formatDate(selectedDate)}の幸福度は${savedHappinessForSelectedDate}/10で記録中だよ。気分が動いた日ほど、あとで見返すヒントになるね。`;
            }

            return `今月の幸福度は平均${averageHappiness}/10くらい。折れ線の山と谷を見ながら、勉強しやすい日を探してみよう。`;
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
    }, [activePanel, averageHappiness, characterLabel, completedGoalTodoCount, focusDraft, goalTodos.length, hasSelectedStudy, noteDraft, recordedHappinessSeries.length, savedHappinessForSelectedDate, selectedDate, selectedStats, studiedWordTotal, todayString, weakWordTotal]);

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
                                            <div className="calendar-auto-save-badge">
                                                自動保存
                                            </div>
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
                                                <div className="selected-chip">
                                                    {savedHappinessForSelectedDate !== null ? `幸福度 ${savedHappinessForSelectedDate}/10` : '幸福度 未入力'}
                                                </div>
                                            </div>
                                        )}

                                        <textarea
                                            className="calendar-note-input"
                                            value={noteDraft}
                                            onChange={(event) => setNoteDraft(event.target.value.slice(0, 300))}
                                            placeholder="その日の勉強メモ、やること、振り返り、今日の感謝を3つ書きましょう"
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
                                                <div
                                                    style={{
                                                        width: '148px',
                                                        height: '148px',
                                                        borderRadius: '999px',
                                                        background: levelStat.donutBackground,
                                                        position: 'relative',
                                                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                                                    }}
                                                    aria-label={`${levelStat.label} の進捗内訳`}
                                                    role="img"
                                                >
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            inset: '30px',
                                                            borderRadius: '999px',
                                                            background: 'rgba(251, 246, 241, 0.96)',
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            textAlign: 'center',
                                                            boxShadow: '0 0 0 1px rgba(120, 78, 52, 0.08)',
                                                        }}
                                                    >
                                                        <div>
                                                            <strong style={{ display: 'block', fontSize: '22px', color: '#6d4c3d' }}>
                                                                {levelStat.progress.accuracy}%
                                                            </strong>
                                                            <span style={{ fontSize: '10px', color: 'rgba(109,76,61,0.62)' }}>
                                                                accuracy
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
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

                        {activePanel === 'happiness' && (
                            <div className="calendar-single-panel">
                                <div className="calendar-sheet calendar-happiness-panel">
                                    <div className="calendar-happiness-header">
                                        <div>
                                            <div className="calendar-note-eyebrow">HAPPINESS TRACKER</div>
                                            <h3>
                                                <Heart size={18} />
                                                幸福度の記録
                                            </h3>
                                            <p className="calendar-vocab-lead">日ごとの幸福度を10段階で残して、月の流れを折れ線で見返せます。</p>
                                        </div>
                                        <div className="calendar-auto-save-badge">
                                            自動保存
                                        </div>
                                    </div>

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

                                    <div className="calendar-happiness-input-card">
                                        <label className="calendar-happiness-date-field">
                                            <span>記録する日付</span>
                                            <input
                                                className="calendar-happiness-date-input"
                                                type="date"
                                                value={selectedDate}
                                                onChange={(event) => handleHappinessDateChange(event.target.value)}
                                            />
                                        </label>

                                        <div className="calendar-happiness-score-row">
                                            <div className="calendar-happiness-score-copy">
                                                <span className="calendar-happiness-score-label">選択中の幸福度</span>
                                                <strong>{happinessDraft !== null ? happinessDraft : '--'}</strong>
                                                <small>/ 10</small>
                                            </div>
                                            <button
                                                type="button"
                                                className="calendar-happiness-clear-btn"
                                                onClick={() => setHappinessDraft(null)}
                                            >
                                                未入力にする
                                            </button>
                                        </div>

                                        <div className="calendar-happiness-scale" role="group" aria-label="幸福度を10段階で選ぶ">
                                            {Array.from({ length: 10 }, (_, index) => {
                                                const score = index + 1;
                                                const isActive = happinessDraft === score;

                                                return (
                                                    <button
                                                        key={score}
                                                        type="button"
                                                        className={`calendar-happiness-score-btn ${isActive ? 'is-active' : ''}`}
                                                        aria-pressed={isActive}
                                                        onClick={() => setHappinessDraft(score)}
                                                    >
                                                        <span>{score}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="calendar-happiness-summary">
                                        <div className="calendar-overview-pill warm">
                                            <span className="overview-label">平均</span>
                                            <strong>{averageHappiness ? `${averageHappiness} / 10` : '--'}</strong>
                                            <small>今月の入力日の平均</small>
                                        </div>
                                        <div className="calendar-overview-pill mint">
                                            <span className="overview-label">最高</span>
                                            <strong>{highestHappiness !== null ? `${highestHappiness} / 10` : '--'}</strong>
                                            <small>いちばん高かった日</small>
                                        </div>
                                        <div className="calendar-overview-pill sky">
                                            <span className="overview-label">最新</span>
                                            <strong>{latestHappiness ? `${latestHappiness.value} / 10` : '--'}</strong>
                                            <small>{latestHappiness ? formatDate(latestHappiness.date) : 'まだ未記録'}</small>
                                        </div>
                                    </div>

                                    <div className="calendar-happiness-graph-card">
                                        <div className="calendar-happiness-graph-head">
                                            <div>
                                                <h4>{currentMonth}月の折れ線グラフ</h4>
                                                <p>入力した日のみ点が付きます</p>
                                            </div>
                                            <div className="calendar-happiness-record-count">
                                                {recordedHappinessSeries.length}日分
                                            </div>
                                        </div>

                                        <div className="calendar-happiness-chart-wrap">
                                            <svg
                                                className="calendar-happiness-chart"
                                                viewBox={`0 0 ${happinessChart.width} ${happinessChart.height}`}
                                                role="img"
                                                aria-label={`${currentMonth}月の幸福度折れ線グラフ`}
                                            >
                                                {happinessChart.yTicks.map((tick) => (
                                                    <g key={tick.value}>
                                                        <line
                                                            x1={happinessChart.padding.left}
                                                            y1={tick.y}
                                                            x2={happinessChart.width - happinessChart.padding.right}
                                                            y2={tick.y}
                                                            className="calendar-happiness-grid-line"
                                                        />
                                                        <text
                                                            x={happinessChart.padding.left - 8}
                                                            y={tick.y + 4}
                                                            textAnchor="end"
                                                            className="calendar-happiness-axis-label"
                                                        >
                                                            {tick.value}
                                                        </text>
                                                    </g>
                                                ))}

                                                {happinessChart.xTicks.map((tick) => (
                                                    <text
                                                        key={tick.day}
                                                        x={tick.x}
                                                        y={happinessChart.height - 8}
                                                        textAnchor="middle"
                                                        className="calendar-happiness-axis-label"
                                                    >
                                                        {tick.day}日
                                                    </text>
                                                ))}

                                                {happinessChart.areaPath && (
                                                    <path d={happinessChart.areaPath} className="calendar-happiness-area" />
                                                )}
                                                {happinessChart.linePath && (
                                                    <path d={happinessChart.linePath} className="calendar-happiness-line" />
                                                )}

                                                {happinessChart.plottedPoints.map((point) => (
                                                    <g
                                                        key={point.date}
                                                        role="button"
                                                        tabIndex={0}
                                                        className="calendar-happiness-point-trigger"
                                                        aria-label={`${formatDate(point.date)}の幸福度 ${point.value}/10 のメモを表示`}
                                                        onClick={() => handleHappinessPointSelect(point.date)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter' || event.key === ' ') {
                                                                event.preventDefault();
                                                                handleHappinessPointSelect(point.date);
                                                            }
                                                        }}
                                                    >
                                                        <circle
                                                            cx={point.x}
                                                            cy={point.y}
                                                            r="14"
                                                            className="calendar-happiness-point-hit"
                                                        />
                                                        <circle
                                                            cx={point.x}
                                                            cy={point.y}
                                                            r="4.5"
                                                            className={`calendar-happiness-point ${point.date === selectedDate ? 'is-selected' : ''}`}
                                                        />
                                                        {point.date === selectedDate && (
                                                            <text
                                                                x={point.x}
                                                                y={point.y - 12}
                                                                textAnchor="middle"
                                                                className="calendar-happiness-point-label"
                                                            >
                                                                {point.value}
                                                            </text>
                                                        )}
                                                    </g>
                                                ))}
                                            </svg>

                                            {recordedHappinessSeries.length === 0 && (
                                                <div className="calendar-happiness-empty">
                                                    まだ幸福度の記録がありません。今日の気分から1つ入れてみましょう。
                                                </div>
                                            )}
                                        </div>

                                        <div className="calendar-happiness-note-card">
                                            <div className="calendar-happiness-note-head">
                                                <strong>{selectedDate ? formatDate(selectedDate) : '日付未選択'}</strong>
                                                <span>{savedHappinessForSelectedDate !== null ? `幸福度 ${savedHappinessForSelectedDate}/10` : '幸福度 未入力'}</span>
                                            </div>
                                            {selectedHappinessNote ? (
                                                <p className="calendar-happiness-note-text">{selectedHappinessNote}</p>
                                            ) : (
                                                <p className="calendar-happiness-note-empty">この日のメモはまだありません。</p>
                                            )}
                                            {selectedHappinessFocus && (
                                                <div className="calendar-happiness-note-focus">
                                                    ひとこと目標: {selectedHappinessFocus}
                                                </div>
                                            )}
                                        </div>
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
