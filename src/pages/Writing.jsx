import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    BarChart3,
    BookText,
    CheckCircle2,
    ChevronLeft,
    FilePenLine,
    LoaderCircle,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import CharacterStage from '../components/character/CharacterStage';
import { EIKEN_WRITING_PROMPTS, WRITING_LEVELS } from '../data/eikenWritingPrompts';
import { saveLastStudyTopic } from '../data/studyData';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { saveStudySession } from '../utils/studyHistoryUtils';
import {
    clearWritingDraft,
    countEnglishWords,
    getWritingDraft,
    getWritingHistory,
    getWritingSummary,
    saveWritingDraft,
    saveWritingResult,
} from '../utils/writingUtils';
import './Writing.css';

const CLOUDFLARE_WRITING_ENDPOINT = 'https://study-musume.hide20080422.workers.dev/api/writing';
const PASSING_SCORE = 10;

const getWritingEndpoints = () => {
    if (typeof window === 'undefined') {
        return ['/api/writing', CLOUDFLARE_WRITING_ENDPOINT];
    }

    const hostname = window.location.hostname || '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return ['/api/writing', '/.netlify/functions/writing', CLOUDFLARE_WRITING_ENDPOINT];
    }

    if (hostname.endsWith('.netlify.app') || hostname.endsWith('.netlify.live')) {
        return ['/.netlify/functions/writing', '/api/writing', CLOUDFLARE_WRITING_ENDPOINT];
    }

    return ['/api/writing', CLOUDFLARE_WRITING_ENDPOINT];
};

const formatWritingError = (errorMessage, endpoint) => {
    const message = String(errorMessage || '').trim();

    if (!message) {
        return '採点にうまくつながりませんでした。少し時間を置いてからもう一度試してください。';
    }

    if (message.includes('GEMINI_API_KEY or OPENAI_API_KEY is not set on the server')) {
        return 'AI採点用のAPIキーがまだ設定されていないようです。サーバー設定を確認してください。';
    }

    if (message.includes('quota') || message.includes('billing')) {
        return 'AI採点の利用上限に達している可能性があります。課金設定や残高を確認してください。';
    }

    if (message.includes('404')) {
        return `採点APIがまだ反映されていないようです。再デプロイ後にもう一度試してください。 (${endpoint})`;
    }

    return message;
};

const requestWritingEvaluation = async (payload) => {
    let lastError = new Error('採点に失敗しました。');

    for (const endpoint of getWritingEndpoints()) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const contentType = response.headers.get('content-type') || '';
            const responseBody = contentType.includes('application/json')
                ? await response.json().catch(() => ({}))
                : {};

            if (!response.ok) {
                throw new Error(formatWritingError(responseBody.error || `サーバー応答: ${response.status}`, endpoint));
            }

            if (responseBody.evaluation) {
                return responseBody;
            }

            throw new Error(`採点結果を受け取れませんでした。 (${endpoint})`);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('採点に失敗しました。');
        }
    }

    throw lastError;
};

const formatDateTime = (timestamp) => {
    if (!timestamp) return '';

    return new Date(timestamp).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getWordCountTone = (wordCount, prompt) => {
    if (!prompt) return 'is-neutral';
    if (wordCount < prompt.minWords) return 'is-low';
    if (wordCount > prompt.maxWords) return 'is-high';
    return 'is-good';
};

const getScoreTone = (score) => {
    if (score >= 13) return 'is-strong';
    if (score >= PASSING_SCORE) return 'is-good';
    return 'is-grow';
};

const CHARACTER_LABELS = {
    noah: 'ノア',
    ren: 'レン',
};

const Writing = ({ stats }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialLevel = new URLSearchParams(location.search).get('level');
    const normalizedInitialLevel = WRITING_LEVELS.some((level) => level.id === initialLevel) ? initialLevel : 'all';
    const characterId = stats?.characterId || 'noah';
    const skinId = stats?.equippedSkin || 'default';
    const preferredRenderer = stats?.characterRenderer;
    const hasWritingLive2D = hasLive2DModelConfig(characterId, skinId);
    const shouldForceWritingLive2D = characterId === 'noah' && hasWritingLive2D;
    const renderer = resolveCharacterRenderer({
        preferredRenderer: shouldForceWritingLive2D ? 'live2d' : preferredRenderer,
        characterId,
        skinId,
    });
    const characterLabel = CHARACTER_LABELS[characterId] || 'コーチ';

    const [selectedLevel, setSelectedLevel] = useState(normalizedInitialLevel);
    const [selectedPromptId, setSelectedPromptId] = useState('');
    const [draft, setDraft] = useState('');
    const [history, setHistory] = useState(() => getWritingHistory());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [latestEvaluation, setLatestEvaluation] = useState(null);
    const sessionStartedAtRef = useRef(Date.now());
    const isHydratingDraftRef = useRef(false);

    const filteredPrompts = useMemo(() => (
        selectedLevel === 'all'
            ? EIKEN_WRITING_PROMPTS
            : EIKEN_WRITING_PROMPTS.filter((prompt) => prompt.level === selectedLevel)
    ), [selectedLevel]);

    useEffect(() => {
        if (filteredPrompts.length === 0) {
            setSelectedPromptId('');
            return;
        }

        const stillVisible = filteredPrompts.some((prompt) => prompt.id === selectedPromptId);
        if (!stillVisible) {
            setSelectedPromptId(filteredPrompts[0].id);
        }
    }, [filteredPrompts, selectedPromptId]);

    const selectedPrompt = useMemo(
        () => filteredPrompts.find((prompt) => prompt.id === selectedPromptId) || filteredPrompts[0] || null,
        [filteredPrompts, selectedPromptId]
    );

    useEffect(() => {
        if (!selectedPrompt?.id) return;

        isHydratingDraftRef.current = true;
        setDraft(getWritingDraft(selectedPrompt.id));
        setError('');
        sessionStartedAtRef.current = Date.now();
    }, [selectedPrompt?.id]);

    useEffect(() => {
        if (!selectedPrompt?.id) return;
        if (isHydratingDraftRef.current) {
            isHydratingDraftRef.current = false;
            return;
        }
        saveWritingDraft(selectedPrompt.id, draft);
    }, [draft, selectedPrompt?.id]);

    const wordCount = useMemo(() => countEnglishWords(draft), [draft]);
    const summary = useMemo(() => getWritingSummary(history), [history]);
    const latestSavedForPrompt = useMemo(
        () => history.find((entry) => entry.promptId === selectedPrompt?.id) || null,
        [history, selectedPrompt?.id]
    );
    const currentResult = latestEvaluation?.promptId === selectedPrompt?.id ? latestEvaluation : latestSavedForPrompt;
    const recentHistory = history.slice(0, 5);
    const coachState = useMemo(() => {
        if (isSubmitting) {
            return {
                title: '採点中',
                line: 'いま内容と構成を見ています。少しだけ待っていてください。',
                emotion: 'surprised',
                faceAccent: 'star',
                intensity: 0.48,
            };
        }

        if (error) {
            return {
                title: '通信チェック',
                line: '接続が不安定かもしれません。答案は残っているので、そのまま再送できます。',
                emotion: 'serious',
                faceAccent: '',
                intensity: 0.38,
            };
        }

        if (currentResult?.evaluation) {
            const score = currentResult.evaluation.overallScore || 0;

            if (score >= 13) {
                return {
                    title: 'かなり良いです',
                    line: currentResult.evaluation.encouragement || 'このままでも十分戦えます。次は語彙の厚みを少し足しましょう。',
                    emotion: 'happy',
                    faceAccent: 'heart',
                    intensity: 0.56,
                };
            }

            if (score >= PASSING_SCORE) {
                return {
                    title: '合格ライン',
                    line: currentResult.evaluation.encouragement || '軸はできています。あと一段、語彙か文法を整えると安定します。',
                    emotion: 'normal',
                    faceAccent: 'star',
                    intensity: 0.42,
                };
            }

            return {
                title: '伸びしろあり',
                line: currentResult.evaluation.encouragement || '大筋は見えています。まずは短くても理由が伝わる形に寄せていきましょう。',
                emotion: 'serious',
                faceAccent: '',
                intensity: 0.4,
            };
        }

        if (draft.trim() && selectedPrompt) {
            if (wordCount < selectedPrompt.minWords) {
                return {
                    title: 'もう少し書けます',
                    line: `いま ${wordCount} words です。理由を1文足すだけでもかなり安定します。`,
                    emotion: 'serious',
                    faceAccent: '',
                    intensity: 0.34,
                };
            }

            if (wordCount > selectedPrompt.maxWords) {
                return {
                    title: '少し長めです',
                    line: '内容は悪くないので、重なっている説明を1文削ると締まります。',
                    emotion: 'surprised',
                    faceAccent: 'star',
                    intensity: 0.4,
                };
            }

            return {
                title: '下書きいい感じ',
                line: '立場を先に言って、そのあと理由をつなげる流れを意識すると読みやすくなります。',
                emotion: 'normal',
                faceAccent: '',
                intensity: 0.32,
            };
        }

        return {
            title: '書き始めましょう',
            line: 'まずは賛成か反対かを先に決めて、理由を2つ置く形からで大丈夫です。',
            emotion: 'normal',
            faceAccent: '',
            intensity: 0.28,
        };
    }, [currentResult, draft, error, isSubmitting, selectedPrompt, wordCount]);
    const coachPose = useMemo(() => ({
        emotion: coachState.emotion,
        expression: coachState.emotion,
        scene: 'writing',
        intensity: coachState.intensity,
        speaking: false,
        text: coachState.line,
        live2dFaceAccent: coachState.faceAccent,
    }), [coachState]);

    const handleClearDraft = () => {
        if (!selectedPrompt?.id) return;
        setDraft('');
        clearWritingDraft(selectedPrompt.id);
        sessionStartedAtRef.current = Date.now();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedPrompt || !draft.trim() || isSubmitting) {
            return;
        }

        setError('');
        setIsSubmitting(true);

        const trimmedAnswer = draft.trim();
        const durationSeconds = Math.max(60, Math.round((Date.now() - sessionStartedAtRef.current) / 1000));

        try {
            saveLastStudyTopic('english', 'eng_writing', selectedPrompt.id, selectedPrompt.title, '英検ライティング');

            const response = await requestWritingEvaluation({
                promptId: selectedPrompt.id,
                level: selectedPrompt.level,
                levelLabel: selectedPrompt.levelLabel,
                title: selectedPrompt.title,
                instruction: selectedPrompt.instruction,
                points: selectedPrompt.points,
                minWords: selectedPrompt.minWords,
                maxWords: selectedPrompt.maxWords,
                wordCount,
                answer: trimmedAnswer,
            });

            const historyEntry = {
                promptId: selectedPrompt.id,
                promptTitle: selectedPrompt.title,
                level: selectedPrompt.level,
                levelLabel: selectedPrompt.levelLabel,
                answer: trimmedAnswer,
                wordCount,
                evaluatedAt: Date.now(),
                evaluation: response.evaluation,
                provider: response.provider || '',
                model: response.model || '',
            };

            const nextHistory = saveWritingResult(historyEntry);
            setHistory(nextHistory);
            setLatestEvaluation(historyEntry);

            saveStudySession({
                subject: '英語',
                category: 'ライティング',
                unit: selectedPrompt.levelLabel,
                duration: durationSeconds,
                questionsAnswered: 1,
                correctAnswers: response.evaluation?.overallScore >= PASSING_SCORE ? 1 : 0,
            });
        } catch (requestError) {
            setError(requestError.message || '採点に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="writing-page">
            <header className="writing-header">
                <button className="writing-back-button" onClick={() => navigate('/study')}>
                    <ChevronLeft size={24} />
                </button>
                <div className="writing-header-copy">
                    <span className="writing-header-kicker">Eiken-style Practice</span>
                    <h1>英検ライティング</h1>
                </div>
                <div className="writing-header-note">AI採点</div>
            </header>

            <section className="writing-hero">
                <div className="writing-hero-copy">
                    <span className="writing-chip is-accent">練習用の英検風問題</span>
                    <h2>問題を選んで、そのまま英文を書いて採点</h2>
                    <p>
                        4観点のスコア、改善ポイント、書き直し例、模範解答までまとめて返します。
                        公式採点ではなく、練習用の参考評価です。
                    </p>
                </div>

                <div className="writing-hero-metrics">
                    <div className="writing-metric-card">
                        <BarChart3 size={18} />
                        <div>
                            <span>平均スコア</span>
                            <strong>{summary.averageScore}/16</strong>
                        </div>
                    </div>
                    <div className="writing-metric-card">
                        <CheckCircle2 size={18} />
                        <div>
                            <span>最高スコア</span>
                            <strong>{summary.bestScore}/16</strong>
                        </div>
                    </div>
                    <div className="writing-metric-card">
                        <FilePenLine size={18} />
                        <div>
                            <span>提出回数</span>
                            <strong>{summary.attempts}回</strong>
                        </div>
                    </div>
                </div>

                <div className="writing-level-filter" aria-label="級フィルター">
                    {WRITING_LEVELS.map((level) => (
                        <button
                            key={level.id}
                            type="button"
                            className={`writing-level-pill ${selectedLevel === level.id ? 'active' : ''}`}
                            onClick={() => setSelectedLevel(level.id)}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>

                <div className={`writing-coach-card ${renderer === 'live2d' ? 'is-live2d' : ''}`}>
                    <div className="writing-coach-copy">
                        <span className="writing-section-kicker">Coach</span>
                        <h3>{characterLabel}</h3>
                        <strong>{coachState.title}</strong>
                        <p>{coachState.line}</p>
                    </div>
                    <div className="writing-coach-stage-wrap">
                        <CharacterStage
                            characterId={characterId}
                            renderer={renderer}
                            skinId={skinId}
                            scene="writing"
                            pose={coachPose}
                            className="writing-character-stage"
                            imageClassName="writing-character-figure"
                            alt={`${characterLabel} coach`}
                        />
                    </div>
                </div>
            </section>

            <div className="writing-layout">
                <section className="writing-panel">
                    <div className="writing-panel-header">
                        <div>
                            <span className="writing-section-kicker">Prompt Select</span>
                            <h3>問題を選ぶ</h3>
                        </div>
                        <span className="writing-selection-count">{filteredPrompts.length}題</span>
                    </div>

                    <div className="writing-prompt-list">
                        {filteredPrompts.map((prompt) => (
                            <button
                                key={prompt.id}
                                type="button"
                                className={`writing-prompt-card ${selectedPrompt?.id === prompt.id ? 'active' : ''}`}
                                onClick={() => setSelectedPromptId(prompt.id)}
                            >
                                <span className="writing-chip">{prompt.levelLabel}</span>
                                <strong>{prompt.title}</strong>
                                <p>{prompt.instruction}</p>
                                <div className="writing-prompt-meta">
                                    <span>{prompt.minWords}-{prompt.maxWords} words</span>
                                    <span>{prompt.timeLimitMinutes} min</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {selectedPrompt && (
                        <article className="writing-task-card">
                            <div className="writing-task-header">
                                <div>
                                    <span className="writing-section-kicker">Current Task</span>
                                    <h3>{selectedPrompt.title}</h3>
                                </div>
                                <span className="writing-chip is-accent">{selectedPrompt.levelLabel}</span>
                            </div>

                            <p className="writing-task-instruction">{selectedPrompt.instruction}</p>

                            <div className="writing-points">
                                {selectedPrompt.points.map((point) => (
                                    <span key={point} className="writing-point-tag">
                                        POINT: {point}
                                    </span>
                                ))}
                            </div>

                            <div className="writing-task-footer">
                                <div className="writing-task-meta">
                                    <BookText size={16} />
                                    <span>{selectedPrompt.minWords}-{selectedPrompt.maxWords} words</span>
                                </div>
                                <div className="writing-task-meta">
                                    <Sparkles size={16} />
                                    <span>{selectedPrompt.supportJa}</span>
                                </div>
                            </div>
                        </article>
                    )}
                </section>

                <section className="writing-panel">
                    <div className="writing-panel-header">
                        <div>
                            <span className="writing-section-kicker">Write</span>
                            <h3>英文を書く</h3>
                        </div>
                        <button type="button" className="writing-reset-button" onClick={handleClearDraft}>
                            <RotateCcw size={14} />
                            <span>下書きを消す</span>
                        </button>
                    </div>

                    <form className="writing-editor" onSubmit={handleSubmit}>
                        <label className="writing-editor-label" htmlFor="writing-answer">
                            Answer
                        </label>
                        <textarea
                            id="writing-answer"
                            className="writing-textarea"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder="Write your answer in English here."
                            rows={12}
                        />

                        <div className="writing-editor-footer">
                            <div className={`writing-word-count ${getWordCountTone(wordCount, selectedPrompt)}`}>
                                <span>{wordCount} words</span>
                                {selectedPrompt && (
                                    <strong>
                                        target {selectedPrompt.minWords}-{selectedPrompt.maxWords}
                                    </strong>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="writing-submit-button"
                                disabled={isSubmitting || !draft.trim()}
                            >
                                {isSubmitting ? <LoaderCircle size={16} className="writing-spinner" /> : <Sparkles size={16} />}
                                <span>{isSubmitting ? '採点中...' : 'AIで採点する'}</span>
                            </button>
                        </div>
                    </form>

                    {error && <p className="writing-error">{error}</p>}

                    {currentResult && (
                        <article className="writing-result-card">
                            <div className="writing-result-header">
                                <div>
                                    <span className="writing-section-kicker">Feedback</span>
                                    <h3>今回の採点結果</h3>
                                </div>
                                <div className={`writing-score-badge ${getScoreTone(currentResult.evaluation.overallScore)}`}>
                                    <strong>{currentResult.evaluation.overallScore}</strong>
                                    <span>/ {currentResult.evaluation.maxScore}</span>
                                </div>
                            </div>

                            <p className="writing-result-summary">{currentResult.evaluation.summary}</p>

                            <div className="writing-score-grid">
                                {Object.entries(currentResult.evaluation.breakdown).map(([key, value]) => (
                                    <div key={key} className="writing-score-item">
                                        <span>{key}</span>
                                        <strong>{value}/4</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="writing-feedback-columns">
                                <div className="writing-feedback-block">
                                    <h4>よかった点</h4>
                                    <ul>
                                        {currentResult.evaluation.strengths.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="writing-feedback-block">
                                    <h4>次に直したい点</h4>
                                    <ul>
                                        {currentResult.evaluation.improvements.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {currentResult.evaluation.revisedAnswer && (
                                <div className="writing-example-block">
                                    <h4>あなたの答案を整えた例</h4>
                                    <p>{currentResult.evaluation.revisedAnswer}</p>
                                </div>
                            )}

                            {currentResult.evaluation.modelAnswer && (
                                <div className="writing-example-block is-highlight">
                                    <h4>模範解答例</h4>
                                    <p>{currentResult.evaluation.modelAnswer}</p>
                                </div>
                            )}

                            <div className="writing-result-footer">
                                <p>{currentResult.evaluation.encouragement}</p>
                                <span>
                                    {formatDateTime(currentResult.evaluatedAt)}
                                    {currentResult.provider ? ` ・ ${currentResult.provider}` : ''}
                                </span>
                            </div>
                        </article>
                    )}
                </section>
            </div>

            <section className="writing-history-panel">
                <div className="writing-panel-header">
                    <div>
                        <span className="writing-section-kicker">History</span>
                        <h3>最近の提出</h3>
                    </div>
                </div>

                {recentHistory.length === 0 ? (
                    <div className="writing-history-empty">
                        まだ提出履歴はありません。1本書いてみると、ここに採点結果が残ります。
                    </div>
                ) : (
                    <div className="writing-history-list">
                        {recentHistory.map((entry) => (
                            <button
                                key={`${entry.promptId}-${entry.evaluatedAt}`}
                                type="button"
                                className="writing-history-item"
                                onClick={() => {
                                    setSelectedLevel(entry.level);
                                    setSelectedPromptId(entry.promptId);
                                    setLatestEvaluation(entry);
                                }}
                            >
                                <div className="writing-history-main">
                                    <span className="writing-chip">{entry.levelLabel}</span>
                                    <strong>{entry.promptTitle}</strong>
                                    <p>{entry.evaluation?.summary}</p>
                                </div>
                                <div className={`writing-history-score ${getScoreTone(entry.evaluation?.overallScore || 0)}`}>
                                    {entry.evaluation?.overallScore || 0}/16
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Writing;
