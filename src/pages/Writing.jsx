import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EIKEN_WRITING_PROMPTS, WRITING_LEVELS } from '../data/eikenWritingPrompts';
import {
    clearWritingDraft,
    countEnglishWords,
    getWritingDraft,
    getWritingHistory,
    getWritingSummary,
    saveWritingDraft,
    saveWritingResult,
} from '../utils/writingUtils';

const pageStyle = {
    minHeight: '100%',
    padding: '20px 16px 120px',
    background: 'linear-gradient(180deg, #f7fbff 0%, #fff5f7 100%)',
    color: '#243849',
    overflowY: 'auto',
};

const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid rgba(157, 191, 220, 0.45)',
    borderRadius: '20px',
    padding: '16px',
    boxShadow: '0 10px 24px rgba(36, 52, 73, 0.08)',
};

const buttonStyle = {
    border: 'none',
    borderRadius: '999px',
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
};

const scoreEssay = (wordCount, prompt) => {
    if (!prompt) return 0;

    if (wordCount < prompt.minWords) {
        return Math.max(35, Math.round((wordCount / prompt.minWords) * 70));
    }

    if (wordCount > prompt.maxWords) {
        return Math.max(55, 100 - Math.min(wordCount - prompt.maxWords, 30));
    }

    return 88 + Math.min(wordCount - prompt.minWords, 12);
};

const Writing = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialLevel = searchParams.get('level') || 'all';
    const [selectedLevel, setSelectedLevel] = useState(initialLevel);
    const [selectedPromptId, setSelectedPromptId] = useState('');
    const [essay, setEssay] = useState('');
    const [history, setHistory] = useState(() => getWritingHistory());
    const [notice, setNotice] = useState('');

    const prompts = useMemo(() => (
        selectedLevel === 'all'
            ? EIKEN_WRITING_PROMPTS
            : EIKEN_WRITING_PROMPTS.filter((prompt) => prompt.level === selectedLevel)
    ), [selectedLevel]);

    const selectedPrompt = useMemo(() => (
        prompts.find((prompt) => prompt.id === selectedPromptId) || prompts[0] || null
    ), [prompts, selectedPromptId]);

    const summary = useMemo(() => getWritingSummary(history), [history]);
    const wordCount = useMemo(() => countEnglishWords(essay), [essay]);

    useEffect(() => {
        if (!prompts.length) {
            setSelectedPromptId('');
            setEssay('');
            return;
        }

        if (!prompts.some((prompt) => prompt.id === selectedPromptId)) {
            setSelectedPromptId(prompts[0].id);
        }
    }, [prompts, selectedPromptId]);

    useEffect(() => {
        if (!selectedPrompt) {
            setEssay('');
            return;
        }

        setEssay(getWritingDraft(selectedPrompt.id));
    }, [selectedPrompt]);

    const handleLevelChange = (nextLevel) => {
        setSelectedLevel(nextLevel);
        setSearchParams(nextLevel === 'all' ? {} : { level: nextLevel });
        setNotice('');
    };

    const handleDraftSave = () => {
        if (!selectedPrompt) return;

        saveWritingDraft(selectedPrompt.id, essay);
        setNotice('下書きを保存しました。');
    };

    const handleSubmit = () => {
        if (!selectedPrompt) return;

        const overallScore = scoreEssay(wordCount, selectedPrompt);
        const result = {
            promptId: selectedPrompt.id,
            title: selectedPrompt.title,
            level: selectedPrompt.level,
            essay,
            wordCount,
            evaluatedAt: Date.now(),
            evaluation: {
                overallScore,
                comment: wordCount < selectedPrompt.minWords
                    ? '語数が少なめです。理由をもう一つ足すと安定します。'
                    : wordCount > selectedPrompt.maxWords
                        ? '少し長めです。結論を残して一文削ると収まりやすいです。'
                        : '語数レンジに収まっています。構成の型を保てていて良いです。',
            },
        };

        const nextHistory = saveWritingResult(result);
        clearWritingDraft(selectedPrompt.id);
        setHistory(nextHistory);
        setNotice(`保存しました。簡易スコア ${overallScore} / 100`);
    };

    return (
        <div style={pageStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <button type="button" onClick={() => navigate('/study')} style={{ ...buttonStyle, background: '#ddeaf6', color: '#23415b' }}>
                    ← 戻る
                </button>
                <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>英検ライティング</div>
                <div style={{ minWidth: 68, textAlign: 'right', fontSize: '0.85rem', fontWeight: 700 }}>
                    {summary.attempts}回
                </div>
            </div>

            <div style={{ ...cardStyle, marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {WRITING_LEVELS.map((level) => (
                        <button
                            key={level.id}
                            type="button"
                            onClick={() => handleLevelChange(level.id)}
                            style={{
                                ...buttonStyle,
                                padding: '8px 12px',
                                background: selectedLevel === level.id ? '#5f93ba' : '#eef4f8',
                                color: selectedLevel === level.id ? 'white' : '#34536d',
                            }}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                    {prompts.map((prompt) => (
                        <button
                            key={prompt.id}
                            type="button"
                            onClick={() => {
                                setSelectedPromptId(prompt.id);
                                setNotice('');
                            }}
                            style={{
                                border: prompt.id === selectedPrompt?.id ? '2px solid #f28fb1' : '1px solid #d7e3ec',
                                borderRadius: 16,
                                padding: '12px 14px',
                                background: prompt.id === selectedPrompt?.id ? '#fff3f7' : 'white',
                                textAlign: 'left',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ fontWeight: 900, color: '#2b4a63' }}>{prompt.levelLabel} / {prompt.title}</div>
                            <div style={{ marginTop: 4, fontSize: '0.84rem', color: '#617487' }}>{prompt.instruction}</div>
                        </button>
                    ))}
                </div>
            </div>

            {selectedPrompt && (
                <div style={{ ...cardStyle, marginBottom: 14 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#91546f', marginBottom: 6 }}>
                        POINTS: {selectedPrompt.points.join(' / ')}
                    </div>
                    <div style={{ lineHeight: 1.6, fontWeight: 700, marginBottom: 8 }}>{selectedPrompt.instruction}</div>
                    <div style={{ fontSize: '0.86rem', color: '#6c6274', marginBottom: 12 }}>
                        {selectedPrompt.supportJa}
                    </div>
                    <textarea
                        value={essay}
                        onChange={(event) => {
                            setEssay(event.target.value);
                            setNotice('');
                        }}
                        placeholder="ここに英作文を書く"
                        style={{
                            width: '100%',
                            minHeight: 220,
                            resize: 'vertical',
                            borderRadius: 18,
                            border: '1px solid #d3dfeb',
                            padding: 14,
                            font: 'inherit',
                            lineHeight: 1.6,
                            boxSizing: 'border-box',
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.88rem', color: '#52667a', fontWeight: 700 }}>
                            {wordCount} words / 目安 {selectedPrompt.minWords}-{selectedPrompt.maxWords}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" onClick={handleDraftSave} style={{ ...buttonStyle, background: '#e7f0f8', color: '#2d5370' }}>
                                下書き保存
                            </button>
                            <button type="button" onClick={handleSubmit} style={{ ...buttonStyle, background: '#f28fb1', color: 'white' }}>
                                結果を保存
                            </button>
                        </div>
                    </div>
                    {notice && (
                        <div style={{ marginTop: 10, fontSize: '0.88rem', fontWeight: 700, color: '#91546f' }}>
                            {notice}
                        </div>
                    )}
                </div>
            )}

            <div style={cardStyle}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>最近の記録</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, color: '#4e6479', fontWeight: 700 }}>
                    <span>提出数: {summary.attempts}</span>
                    <span>平均: {summary.averageScore}</span>
                    <span>最高: {summary.bestScore}</span>
                </div>
                {history.length === 0 ? (
                    <div style={{ color: '#708396' }}>まだ保存されたライティング結果はありません。</div>
                ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                        {history.slice(0, 5).map((entry) => (
                            <div
                                key={`${entry.promptId}-${entry.evaluatedAt}`}
                                style={{
                                    border: '1px solid #d7e3ec',
                                    borderRadius: 14,
                                    padding: '10px 12px',
                                    background: '#fbfdff',
                                }}
                            >
                                <div style={{ fontWeight: 800 }}>{entry.title}</div>
                                <div style={{ marginTop: 4, fontSize: '0.84rem', color: '#607487' }}>
                                    {entry.wordCount} words / score {entry.evaluation?.overallScore || 0}
                                </div>
                                <div style={{ marginTop: 4, fontSize: '0.84rem', color: '#6f6270' }}>
                                    {entry.evaluation?.comment || ''}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Writing;
