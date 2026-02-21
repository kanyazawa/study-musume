import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Home as HomeIcon, Sparkles, Users, BarChart3, Clock, BookOpen, Target, TrendingUp, Settings, Star } from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    ComposedChart,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import './Stats.css';
import CharacterMain from '../assets/images/character_new.png';
import CharacterCasual from '../assets/images/character_casual_v9.png';
import CharacterGym from '../assets/images/character_gym.jpg';
import CharacterCasualGray from '../assets/images/character_casual_gray_hoodie.jpg';
import CharacterCasualBlack from '../assets/images/character_casual_hoodie.png';
import CharacterRen from '../assets/images/character_ren.png';
import { getDailyStats, getUsedSubjects, getSubjectDistribution, getDailyAccuracy } from '../utils/studyHistoryUtils';
import {
    calculateSubjectAccuracy,
    getOverallStats,
    getWeakPoints,
    getWeeklyReport,
    getMonthlyReport,
    getHourlyStats,
    getDailyStats as getDayOfWeekStats,
    formatDuration,
    getAccuracyColor,
    getComparisonText
} from '../utils/statsUtils';
import { STUDY_TOPICS } from '../data/studyTopics';

const Stats = ({ stats = {} }) => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState(7); // 7 or 30 days
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'subjects' | 'calendar'

    // V0 Tabs Configuration
    const tabs = [
        { id: "overview", label: "概要", icon: "📋" },
        { id: "subjects", label: "科目別", icon: "📚" },
        { id: "calendar", label: "カレンダー", icon: "📅" },
    ];

    // Character Image Logic for Header
    const noahImages = {
        'default': CharacterMain,
        'skin_casual': CharacterCasual,
        'skin_gym': CharacterGym,
        'skin_casual_gray_hoodie': CharacterCasualGray,
        'skin_casual_hoodie': CharacterCasualBlack
    };
    // Add Ren support if needed, or stick to main char for now
    const currentSkinImage = stats.characterId === 'ren' ? CharacterRen : (noahImages[stats.equippedSkin] || CharacterMain);

    // Character Name Logic
    const characterName = stats.characterId === 'ren' ? 'レン' : 'ノア';

    // Get data
    const dailyStatsData = getDailyStats(period);
    const usedSubjects = getUsedSubjects();
    const subjectDistribution = getSubjectDistribution(period);
    const dailyAccuracy = getDailyAccuracy(period);

    // Get detailed stats
    const overallStats = getOverallStats();
    const subjectAccuracy = calculateSubjectAccuracy();
    const weakPoints = getWeakPoints(5);
    const weeklyReport = getWeeklyReport();
    const monthlyReport = getMonthlyReport();
    const hourlyStats = getHourlyStats();
    const dayOfWeekStats = getDayOfWeekStats();

    // Character Banner Message Logic based on Stats
    const getBannerMessage = () => {
        // 1. High Achievement
        if (overallStats.accuracy >= 90 && overallStats.totalQuestions > 20) return "素晴らしい正解率！天才的な才能を感じるよ！";
        // 2. High Study Time
        if (overallStats.totalTime > 3600 * 5) return "たくさん勉強したね！努力は裏切らないよ！";
        // 3. Streak Encouragement
        if ((stats.loginStreak || 0) >= 3) return `${stats.loginStreak}日連続！すごい継続力だね！`;
        // 4. Low Accuracy Encouragement
        if (overallStats.accuracy < 60 && overallStats.totalQuestions > 10) return "間違えた問題を見直そう！基礎が大事だよ！";
        // 5. Start Encouragement (No data)
        if (overallStats.totalQuestions === 0) return "さあ、一緒に勉強を始めよう！";

        // 6. Default Random Messages
        const bannerMessages = [
            "今日もがんばったね!",
            "もっと上を目指そう!",
            "その調子だよ!",
            "一緒に勉強できて嬉しいな♪",
            "焦らずマイペースでいこう！"
        ];
        return bannerMessages[Math.floor(Date.now() / 86400000) % bannerMessages.length];
    };

    const bannerMessage = getBannerMessage();

    // Calendar Data Logic (V0 Mock + Real Data blending)
    const generateCalendarData = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDow = firstDay.getDay(); // 0 = Sun

        const days = [];
        // Empty slots for start of month
        for (let i = 0; i < startDow; i++) days.push(null);

        // Days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            // Check if we have real data for this day
            // Note: dailyStatsData is usually last 7 or 30 days. 
            // We might not have data for the whole month if not fetched, but we'll try matching.
            const statsForDay = dailyStatsData.find(s => {
                // Approximate matching by dateLabel (MM/DD)
                const label = `${month + 1}/${d}`;
                return s.dateLabel === label;
            });

            // Mock randomness if no real data (for visual demo as requested)
            // OR strictly real data. Let's use real data if available, else 0, unless strict demo mode.
            // User asked to "copy perfect", V0 had mock data. 
            // Let's blend: Real data if exists, otherwise 0.

            // Actually, let's just make it look good for now: 
            // If it's today or past 7 days, use real data.
            let minutes = 0;
            if (statsForDay) {
                // Sum all subjects
                usedSubjects.forEach(sub => minutes += (statsForDay[sub] || 0));
            }

            days.push({
                date: date,
                day: d,
                minutes: minutes
            });
        }
        return { year, month, days };
    };

    const calendarData = generateCalendarData();

    const getIntensityClass = (minutes) => {
        if (minutes === 0) return 'intensity-0';
        if (minutes < 15) return 'intensity-1';
        if (minutes < 30) return 'intensity-2';
        if (minutes < 60) return 'intensity-3';
        return 'intensity-4';
    };

    // Data for Weekly Trend (Map dailyStats to V0 format)
    const weeklyTrendData = dailyStatsData.map(day => {
        const totalTime = usedSubjects.reduce((sum, subj) => sum + (day[subj] || 0), 0);
        const accData = dailyAccuracy.find(d => d.dateLabel === day.dateLabel);
        return {
            day: day.dateLabel,
            study: totalTime,
            correct: accData ? accData.accuracy : 0
        };
    });

    // V0 Summary Cards Data
    const summaryCardsData = [
        {
            icon: <Clock size={20} />,
            label: "総学習時間",
            value: formatDuration(overallStats.totalTime).replace(/時間/g, 'h').replace(/分/g, 'm'),
            sub: "Total",
            gradient: "linear-gradient(135deg, #ff6ba6, #ff8fbe)",
            iconBg: "rgba(255, 107, 166, 0.2)",
            color: "#ff6ba6"
        },
        {
            icon: <BookOpen size={20} />,
            label: "完了問題数",
            value: `${overallStats.totalQuestions}`,
            sub: "Questions",
            gradient: "linear-gradient(135deg, #4ecfff, #7bdeff)",
            iconBg: "rgba(78, 207, 255, 0.2)",
            color: "#4ecfff"
        },
        {
            icon: <Target size={20} />,
            label: "正解率",
            value: `${overallStats.accuracy}%`,
            sub: "Accuracy",
            gradient: "linear-gradient(135deg, #ffd642, #ffe57a)",
            iconBg: "rgba(255, 214, 66, 0.2)",
            color: "#ffd642"
        },
        {
            icon: <TrendingUp size={20} />,
            label: "連続日数",
            value: `${stats.loginStreak || 1}日`,
            sub: "Streak",
            gradient: "linear-gradient(135deg, #42e695, #6feda8)",
            iconBg: "rgba(66, 230, 149, 0.2)",
            color: "#42e695"
        },
    ];

    // Radar Data
    const radarData = Object.entries(subjectAccuracy)
        .filter(([subject]) => subject && subject !== '不明')
        .map(([subject, data]) => ({
            subject,
            value: data.accuracy,
            fullMark: 100
        }));

    // Helper to calculate grade (S, A, B, C, D)
    const getGrade = (accuracy) => {
        if (accuracy >= 90) return { grade: 'S', color: '#ff6ba6' }; // Pink
        if (accuracy >= 80) return { grade: 'A', color: '#4ecfff' }; // Blue
        if (accuracy >= 70) return { grade: 'B', color: '#8e44ad' }; // Purple
        if (accuracy >= 60) return { grade: 'C', color: '#ffd642' }; // Yellow
        return { grade: 'D', color: '#666' };
    };

    // Subject Study Time Data (Bar Chart)
    const subjectStudyTimeData = usedSubjects.map(subject => {
        const totalMinutes = dailyStatsData.reduce((acc, day) => acc + (day[subject] || 0), 0);
        return {
            subject,
            minutes: totalMinutes,
            color: STUDY_TOPICS.find(t => t.name === subject)?.color || '#8884d8'
        };
    }).sort((a, b) => b.minutes - a.minutes);

    return (
        <div className="stats-screen">
            {/* Character Banner (V0) */}
            <div className="px-4 pt-4">
                <div className="character-banner-v0">
                    <div className="sparkles-container">
                        <div className="sparkle sparkle-1" />
                        <div className="sparkle sparkle-2" />
                        <div className="sparkle sparkle-3" />
                    </div>

                    <div className="banner-content-v0">
                        <div className="banner-img-container-v0">
                            <img src={currentSkinImage} className="banner-char-img-v0" alt="Character" />
                            <div className="banner-img-frame-v0" />
                        </div>
                        <div className="banner-bubble-v0">
                            <div className="bubble-tail-v0" />
                            <p className="text-sm font-bold text-[var(--uma-white)]">{bannerMessage}</p>
                            <p className="mt-0.5 text-[10px] text-[var(--game-gold)]">- {characterName}</p>
                        </div>
                    </div>
                </div>
            </div>

            <header className="stats-header">
                <div className="header-content">
                    <button className="back-btn-integrated" onClick={() => navigate('/home')}>
                        <ChevronLeft size={24} color="white" />
                    </button>
                    <div className="flex-1 text-center font-bold text-lg">学習統計</div>
                    <button className="settings-btn-new">
                        <Settings size={16} />
                    </button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="game-tabs-container">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`game-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                        {activeTab === tab.id && (
                            <>
                                <div className="game-tabs-glow" />
                                <div className="tab-deco-top" />
                                <div className="tab-deco-bottom" />
                            </>
                        )}
                    </button>
                ))}
            </div>

            <div className="stats-content">
                {/* Overview Tab (Renamed to "Weekly" to better fit?) - actually user just wanted Calendar logic to be main */}
                {activeTab === 'overview' && (
                    <div className="tab-content animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Streak Banner (Moved from Calendar) */}
                        <div className="streak-banner">
                            <div className="streak-content">
                                <div className="streak-badge">
                                    <span className="streak-count">{stats.loginStreak || 1}</span>
                                    <span className="streak-label">DAYS</span>
                                </div>
                                <div className="streak-text">
                                    <div className="streak-title">連続学習記録を更新中！</div>
                                    <div className="streak-subtitle">あと1日で新しいバッジを獲得!</div>
                                    <div className="progress-bar-bg mt-2" style={{ height: '4px', background: 'rgba(0,0,0,0.1)' }}>
                                        <div className="progress-bar-fill" style={{ width: '90%', background: 'var(--game-pink)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards (Moved to Overview) */}
                        <div className="summary-cards-v0">
                            {summaryCardsData.map((item, index) => (
                                <div key={index} className="summary-card-v0" style={{ '--card-color': item.color }}>
                                    <div className="card-glow-v0" style={{ background: item.gradient }} />
                                    <div className="card-header-v0">
                                        <div className="card-icon-bg-v0" style={{ background: item.iconBg, color: item.color }}>
                                            {item.icon}
                                        </div>
                                        <div className="card-label-v0">{item.label}</div>
                                    </div>
                                    <div className="card-value-v0">{item.value}</div>
                                    <div className="card-sub-v0" style={{ color: item.color }}>{item.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Weekly Trend */}
                        <div className="weekly-trend-v0">
                            <div className="trend-header-v0">
                                <div className="trend-icon-v0"><BarChart3 size={16} /></div>
                                <h3 className="text-sm font-bold text-[var(--uma-white)]">週間学習トレンド</h3>
                            </div>
                            <div style={{ width: '100%', height: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a103a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="study" radius={[4, 4, 0, 0]}>
                                            {weeklyTrendData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.correct >= 80 ? '#FFD642' : '#4ECFFF'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subjects Tab */}
                {activeTab === 'subjects' && (
                    <div className="tab-content animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Accuracy Radar */}
                        <div className="accuracy-radar-v0">
                            <div className="radar-header-v0">
                                <div className="radar-icon-bg-v0">🎯</div>
                                <h3 className="text-sm font-bold text-[var(--uma-white)]">科目別正解率</h3>
                            </div>
                            <div style={{ width: '100%', height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(248,240,255,0.7)", fontSize: 11, fontWeight: 600 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="正解率"
                                            dataKey="value"
                                            stroke="#42e695"
                                            strokeWidth={2}
                                            fill="#42e695"
                                            fillOpacity={0.2}
                                            dot={{ fill: "#42e695", r: 4, strokeWidth: 0 }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Subject Study Time Chart (New) */}
                        <div className="subject-time-chart-v0">
                            <div className="subject-time-header-v0">
                                <div className="time-header-group-v0">
                                    <div className="time-icon-bg-v0"><BarChart3 size={16} /></div>
                                    <h3 className="text-sm font-bold text-[var(--uma-white)]">科目別学習時間</h3>
                                </div>
                                <div className="period-badge-v0">今週</div>
                            </div>
                            <div style={{ width: '100%', height: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectStudyTimeData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a103a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            labelStyle={{ color: '#fff' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                            {subjectStudyTimeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Subject List (Grade Cards) */}
                        <div className="subject-details-list">
                            {Object.entries(subjectAccuracy)
                                .filter(([subject]) => subject && subject !== '不明')
                                .map(([subject, data], idx) => {
                                    const gradeInfo = getGrade(data.accuracy);
                                    const subjectColor = STUDY_TOPICS.find(t => t.name === subject)?.color || '#999';

                                    return (
                                        <div key={idx} className="subject-grade-card-v0">
                                            {/* Grade Badge */}
                                            <div className="grade-badge-v0" style={{ background: gradeInfo.color }}>
                                                {gradeInfo.grade}
                                            </div>

                                            {/* Info Column */}
                                            <div className="subject-info-col">
                                                <div className="subject-name-row">
                                                    <span className="subject-name-text">{subject}</span>
                                                    <span className="subject-acc-text" style={{ color: gradeInfo.color }}>{data.accuracy}%</span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="grade-progress-bg">
                                                    <div
                                                        className="grade-progress-fill"
                                                        style={{ width: `${data.accuracy}%`, background: subjectColor, boxShadow: `0 0 10px ${subjectColor}` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Calendar Tab */}
                {activeTab === 'calendar' && (
                    <div className="tab-content animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Calendar Heatmap (V0) */}
                        <div className="calendar-heatmap-v0">
                            <div className="heatmap-header-v0">
                                <div className="heatmap-title-group-v0">
                                    <div className="heatmap-icon-bg-v0"><Flame size={16} /></div>
                                    <h3 className="text-sm font-bold text-[var(--uma-white)]">学習カレンダー</h3>
                                </div>
                                <div className="heatmap-streak-badge-v0">
                                    <Flame size={12} color="var(--game-gold)" />
                                    <span className="text-xs font-bold text-[var(--game-gold)]">{stats.loginStreak || 1}日連続</span>
                                </div>
                            </div>

                            <div className="heatmap-nav-v0">
                                <button className="heatmap-nav-btn-v0"><ChevronLeft size={12} /></button>
                                <span className="text-sm font-bold text-[var(--uma-white)]">{calendarData.year}年{calendarData.month + 1}月</span>
                                <button className="heatmap-nav-btn-v0"><ChevronRight size={12} /></button>
                            </div>

                            <div className="heatmap-grid-v0">
                                {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                                    <div key={d} className="heatmap-weekday-v0">{d}</div>
                                ))}
                                {calendarData.days.map((day, i) => (
                                    day ? (
                                        <div
                                            key={i}
                                            className={`heatmap-cell-v0 ${getIntensityClass(day.minutes)} ${day.date.getDate() === new Date().getDate() ? 'today' : ''}`}
                                            title={`${day.minutes}分`}
                                        >
                                            <span className="text-[10px] font-medium text-[rgba(255,255,255,0.8)]">{day.day}</span>
                                        </div>
                                    ) : (
                                        <div key={i} />
                                    )
                                ))}
                            </div>

                            <div className="heatmap-legend-v0">
                                <span className="text-[10px] text-[rgba(255,255,255,0.5)]">少</span>
                                {[0, 1, 2, 3, 4].map(l => (
                                    <div key={l} className={`legend-box-v0 intensity-${l}`} />
                                ))}
                                <span className="text-[10px] text-[rgba(255,255,255,0.5)]">多</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Nav (V0) */}
            <div className="bottom-nav-v0">
                <div className="bottom-nav-container-v0">
                    <button className="nav-item-v0" onClick={() => navigate('/story')}>
                        <BookOpen size={20} />
                        <span className="text-[10px] font-bold">ストーリー</span>
                    </button>
                    <button className="nav-item-v0 active">
                        <BarChart3 size={20} />
                        <span className="text-[10px] font-bold">統計</span>
                    </button>
                    <button className="nav-center-btn-v0" onClick={() => navigate('/home')}>
                        <div className="nav-center-circle-v0">
                            <HomeIcon size={24} color="#0a0520" />
                        </div>
                        <span className="nav-center-label-v0">ホーム</span>
                    </button>
                    <button className="nav-item-v0" onClick={() => navigate('/gacha')}>
                        <Sparkles size={20} />
                        <span className="text-[10px] font-bold">ガチャ</span>
                    </button>
                    <button className="nav-item-v0" onClick={() => navigate('/characters')}>
                        <Users size={20} />
                        <span className="text-[10px] font-bold">キャラ</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Stats;
