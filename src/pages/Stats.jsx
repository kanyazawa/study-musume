import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, BookOpen, Target, Clock } from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    ComposedChart
} from 'recharts';
import './Stats.css';
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

const Stats = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState(7); // 7 or 30 days
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'subjects' | 'weak' | 'reports' | 'time'

    // Get data
    const dailyStats = getDailyStats(period);
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

    // Get colors from STUDY_TOPICS
    const subjectColors = {};
    STUDY_TOPICS.forEach(subject => {
        subjectColors[subject.name] = subject.color;
    });

    // Calculate percentages for pie chart
    const total = subjectDistribution.reduce((sum, item) => sum + item.value, 0);
    const distributionWithPercentage = subjectDistribution.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));

    // 科目別正答率データ（棒グラフ用）
    const subjectAccuracyData = Object.entries(subjectAccuracy).map(([subject, data]) => ({
        subject,
        accuracy: data.accuracy,
        fillColor: getAccuracyColor(data.accuracy)
    }));

    // 時間帯別データ（学習時間が0のデータを除外）
    const hourlyDataFiltered = hourlyStats.filter(h => h.totalTime > 0);

    // 曜日別データ（学習時間が0のデータを除外）
    const dayOfWeekDataFiltered = dayOfWeekStats.filter(d => d.totalTime > 0);

    // Custom Tooltips
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
            return (
                <div className="custom-tooltip">
                    <p className="label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {Math.round(entry.value)}分
                        </p>
                    ))}
                    <p className="total">合計: {Math.round(total)}分</p>
                </div>
            );
        }
        return null;
    };

    const PieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip">
                    <p className="label">{data.name}</p>
                    <p>{data.value}分 ({data.percentage}%)</p>
                </div>
            );
        }
        return null;
    };

    const LineTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{label}</p>
                    <p>正解率: {payload[0].value}%</p>
                    <p className="small">問題数: {payload[0].payload.questions}問</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="stats-screen">
            {/* Header */}
            <div className="stats-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ChevronLeft color="white" size={24} />
                </button>
                <h2>学習統計</h2>
                <div /> {/* Spacer */}
            </div>

            {/* Tab Navigation */}
            <div className="stats-tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    概要
                </button>
                <button
                    className={`tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subjects')}
                >
                    科目別
                </button>
                <button
                    className={`tab-btn ${activeTab === 'weak' ? 'active' : ''}`}
                    onClick={() => setActiveTab('weak')}
                >
                    苦手
                </button>
                <button
                    className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    レポート
                </button>
                <button
                    className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
                    onClick={() => setActiveTab('time')}
                >
                    時間分析
                </button>
            </div>

            <div className="stats-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="tab-content">
                        {/* Summary Cards */}
                        <div className="summary-cards">
                            <div className="summary-card">
                                <Clock className="card-icon" size={24} color="#4285F4" />
                                <div className="card-value">{formatDuration(overallStats.totalTime)}</div>
                                <div className="card-label">総学習時間</div>
                            </div>
                            <div className="summary-card">
                                <BookOpen className="card-icon" size={24} color="#34A853" />
                                <div className="card-value">{overallStats.totalQuestions}問</div>
                                <div className="card-label">総問題数</div>
                            </div>
                            <div className="summary-card">
                                <Target className="card-icon" size={24} color={getAccuracyColor(overallStats.accuracy)} />
                                <div className="card-value">{overallStats.accuracy}%</div>
                                <div className="card-label">全体正答率</div>
                            </div>
                        </div>

                        {/* Period Selector */}
                        <div className="period-selector">
                            <button
                                className={period === 7 ? 'active' : ''}
                                onClick={() => setPeriod(7)}
                            >
                                過去7日間
                            </button>
                            <button
                                className={period === 30 ? 'active' : ''}
                                onClick={() => setPeriod(30)}
                            >
                                過去30日間
                            </button>
                        </div>

                        {/* Daily Study Time Chart */}
                        <div className="chart-container">
                            <h3>日別学習時間</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="dateLabel" />
                                    <YAxis label={{ value: '分', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    {usedSubjects.map((subject) => (
                                        <Bar
                                            key={subject}
                                            dataKey={subject}
                                            stackId="a"
                                            fill={subjectColors[subject] || '#999'}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Daily Accuracy Chart */}
                        <div className="chart-container">
                            <h3>日別正解率推移</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={dailyAccuracy}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="dateLabel" />
                                    <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip content={<LineTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="accuracy"
                                        stroke="#4285F4"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        name="正解率"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Subjects Tab */}
                {activeTab === 'subjects' && (
                    <div className="tab-content">
                        <h3>科目別正答率</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={subjectAccuracyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="subject" />
                                    <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Bar dataKey="accuracy" name="正答率">
                                        {subjectAccuracyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fillColor} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <h3>科目別内訳</h3>
                        <div className="subject-details-list">
                            {Object.entries(subjectAccuracy).map(([subject, data]) => (
                                <div key={subject} className="subject-detail-card">
                                    <div className="subject-name">{subject}</div>
                                    <div className="subject-stats">
                                        <div className="stat">
                                            <span className="stat-label">正答率</span>
                                            <span className="stat-value" style={{ color: getAccuracyColor(data.accuracy) }}>
                                                {data.accuracy}%
                                            </span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-label">問題数</span>
                                            <span className="stat-value">{data.totalQuestions}問</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-label">学習時間</span>
                                            <span className="stat-value">{formatDuration(data.totalTime)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h3>科目別学習時間の割合</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={distributionWithPercentage}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name} ${entry.percentage}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {distributionWithPercentage.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={subjectColors[entry.name] || '#999'} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Weak Points Tab */}
                {activeTab === 'weak' && (
                    <div className="tab-content">
                        <h3>よく間違える問題 TOP5</h3>
                        {weakPoints.length > 0 ? (
                            <div className="weak-points-list">
                                {weakPoints.map((point, index) => (
                                    <div key={point.id} className="weak-point-card">
                                        <div className="rank">#{index + 1}</div>
                                        <div className="weak-info">
                                            <div className="subject-badge">{point.subject}</div>
                                            <div className="question-text">{point.questionText}</div>
                                            <div className="wrong-count">❌ {point.wrongCount}回間違えた</div>
                                        </div>
                                        <button
                                            className="review-btn"
                                            onClick={() => navigate('/review')}
                                        >
                                            復習
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>間違えた問題はありません</p>
                                <p className="hint">問題を解くと自動で記録されます</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="tab-content">
                        <h3>📅 週間レポート</h3>
                        <div className="report-card">
                            <div className="report-grid">
                                <div className="report-item">
                                    <div className="report-label">学習時間</div>
                                    <div className="report-value">{formatDuration(weeklyReport.totalTime)}</div>
                                    <div className={`comparison ${weeklyReport.comparison.timeDiff >= 0 ? 'positive' : 'negative'}`}>
                                        {getComparisonText(weeklyReport.comparison.timeDiff)}
                                    </div>
                                </div>
                                <div className="report-item">
                                    <div className="report-label">問題数</div>
                                    <div className="report-value">{weeklyReport.totalQuestions}問</div>
                                    <div className={`comparison ${weeklyReport.comparison.questionsDiff >= 0 ? 'positive' : 'negative'}`}>
                                        {getComparisonText(weeklyReport.comparison.questionsDiff)}
                                    </div>
                                </div>
                                <div className="report-item">
                                    <div className="report-label">正答率</div>
                                    <div className="report-value" style={{ color: getAccuracyColor(weeklyReport.accuracy) }}>
                                        {weeklyReport.accuracy}%
                                    </div>
                                </div>
                                <div className="report-item">
                                    <div className="report-label">セッション数</div>
                                    <div className="report-value">{weeklyReport.sessions}回</div>
                                </div>
                            </div>
                        </div>

                        <h3>📊 月間レポート</h3>
                        <div className="report-card">
                            <div className="report-grid">
                                <div className="report-item">
                                    <div className="report-label">学習時間</div>
                                    <div className="report-value">{formatDuration(monthlyReport.totalTime)}</div>
                                    <div className={`comparison ${monthlyReport.comparison.timeDiff >= 0 ? 'positive' : 'negative'}`}>
                                        {getComparisonText(monthlyReport.comparison.timeDiff)}
                                    </div>
                                </div>
                                <div className="report-item">
                                    <div className="report-label">問題数</div>
                                    <div className="report-value">{monthlyReport.totalQuestions}問</div>
                                    <div className={`comparison ${monthlyReport.comparison.questionsDiff >= 0 ? 'positive' : 'negative'}`}>
                                        {getComparisonText(monthlyReport.comparison.questionsDiff)}
                                    </div>
                                </div>
                                <div className="report-item">
                                    <div className="report-label">正答率</div>
                                    <div className="report-value" style={{ color: getAccuracyColor(monthlyReport.accuracy) }}>
                                        {monthlyReport.accuracy}%
                                    </div>
                                </div>
                                <div className="report-item">
                                    <div className="report-label">セッション数</div>
                                    <div className="report-value">{monthlyReport.sessions}回</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Time Analysis Tab */}
                {activeTab === 'time' && (
                    <div className="tab-content">
                        <h3>⏰ 時間帯別学習時間</h3>
                        <div className="chart-container">
                            {hourlyDataFiltered.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={hourlyDataFiltered}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" label={{ value: '時', position: 'insideBottom', offset: -5 }} />
                                        <YAxis label={{ value: '分', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip />
                                        <Bar dataKey="totalTime" fill="#4285F4" name="学習時間（秒）">
                                            {hourlyDataFiltered.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#4285F4" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state">
                                    <p>データがありません</p>
                                </div>
                            )}
                        </div>

                        <h3>📊 時間帯別正答率</h3>
                        <div className="chart-container">
                            {hourlyDataFiltered.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={hourlyDataFiltered}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" label={{ value: '時', position: 'insideBottom', offset: -5 }} />
                                        <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="accuracy" stroke="#34A853" strokeWidth={2} name="正答率" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state">
                                    <p>データがありません</p>
                                </div>
                            )}
                        </div>

                        <h3>📅 曜日別学習時間</h3>
                        <div className="chart-container">
                            {dayOfWeekDataFiltered.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dayOfWeekDataFiltered}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="dayName" />
                                        <YAxis label={{ value: '分', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip />
                                        <Bar dataKey="totalTime" fill="#EA4335" name="学習時間（秒）">
                                            {dayOfWeekDataFiltered.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#EA4335" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state">
                                    <p>データがありません</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stats;
