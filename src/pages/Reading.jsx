import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpenText, CheckCircle2, ChevronLeft, Clock3, MessageCircle, Sparkles, Trash2 } from 'lucide-react';
import CharacterStage from '../components/character/CharacterStage';
import SceneStageLayout from '../components/layout/SceneStageLayout';
import TappableVocabText from '../components/TappableVocabText';
import { READING_PASSAGES, getReadingPassageById, getReadingPassagesByLevel } from '../data/readingPassages';
import { getCharacterLabel } from '../data/characterData';
import { saveLastStudyTopic } from '../data/studyData';
import { saveStudySession } from '../utils/studyHistoryUtils';
import { applyCharacterEvaluationResult } from '../utils/characterEvaluationUtils';
import { buildDailyLoopPhasePatch } from '../utils/dailyLoopUtils';
import { updateMissionsOnStudy } from '../utils/missionUtils';
import { applyRelationshipActivity, getRelationshipActivityAffectionDelta } from '../utils/relationshipEventUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { getBackgroundStyle } from '../utils/cosmeticUtils';
import './Reading.css';

const READING_REWARD_INTELLECT = 18;
const CUSTOM_READING_STORAGE_KEY = 'customReadingPassages';

const normalizeCustomPassage = (passage, index = 0) => {
    const title = String(passage?.title || '').trim();
    const text = String(passage?.passage || '').trim();

    if (!title || !text) {
        return null;
    }

    return {
        id: String(passage?.id || `custom-reading-${index}`).trim(),
        level: 'custom',
        label: '自作',
        title,
        estimatedMinutes: Math.max(1, Number(passage?.estimatedMinutes || Math.ceil(text.split(/\s+/).length / 90)) || 3),
        topic: String(passage?.topic || '自作長文').trim() || '自作長文',
        passage: text,
        questions: [],
        custom: true,
        createdAt: Number.isFinite(Number(passage?.createdAt)) ? Number(passage.createdAt) : Date.now(),
    };
};

const loadCustomReadingPassages = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(CUSTOM_READING_STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((passage, index) => normalizeCustomPassage(passage, index))
            .filter(Boolean)
            .sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0));
    } catch (error) {
        console.error('Error loading custom reading passages:', error);
        return [];
    }
};

const saveCustomReadingPassages = (passages) => {
    localStorage.setItem(CUSTOM_READING_STORAGE_KEY, JSON.stringify(passages));
};

const Reading = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialLevel = searchParams.get('level') || '';
    const initialPassageId = searchParams.get('passage') || '';
    const characterId = stats?.characterId || 'noah';
    const skinId = stats?.equippedSkin || 'default';
    const equippedBackground = stats?.equippedBackground || 'default';
    const equippedAccessories = Array.isArray(stats?.equippedAccessories) ? stats.equippedAccessories : [];
    const renderer = resolveCharacterRenderer({
        preferredRenderer: hasLive2DModelConfig(characterId, skinId) ? 'live2d' : stats?.characterRenderer,
        characterId,
        skinId,
    });
    const characterLabel = getCharacterLabel(characterId) || 'コーチ';
    const backgroundStyle = getBackgroundStyle(equippedBackground);
    const [customPassages, setCustomPassages] = useState(() => loadCustomReadingPassages());
    const [customTitle, setCustomTitle] = useState('');
    const [customText, setCustomText] = useState('');
    const [customFeedback, setCustomFeedback] = useState('');
    const visiblePassages = useMemo(() => (
        [...customPassages, ...getReadingPassagesByLevel(initialLevel)]
    ), [customPassages, initialLevel]);
    const fallbackPassage = visiblePassages[0] || READING_PASSAGES[0];
    const [selectedPassageId, setSelectedPassageId] = useState(initialPassageId || fallbackPassage.id);
    const selectedPassage = visiblePassages.find((passage) => passage.id === selectedPassageId)
        || getReadingPassageById(selectedPassageId)
        || fallbackPassage;
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (!selectedPassage?.id) {
            return;
        }

        const params = new URLSearchParams();
        if (selectedPassage.level) {
            params.set('level', selectedPassage.level);
        }
        params.set('passage', selectedPassage.id);

        saveLastStudyTopic('english', 'eng_reading', selectedPassage.id, selectedPassage.title, '長文読解', {
            routePath: `/reading?${params.toString()}`,
            subjectName: '英語',
            categoryName: '読解',
            mode: 'reading',
            modeLabel: '長文読解',
            level: selectedPassage.level || initialLevel,
            resumeLabel: `${selectedPassage.label || '長文'} ${selectedPassage.title}`,
        });
    }, [initialLevel, selectedPassage]);

    useEffect(() => {
        if (!visiblePassages.some((passage) => passage.id === selectedPassageId)) {
            setSelectedPassageId(fallbackPassage.id);
        }
    }, [fallbackPassage.id, selectedPassageId, visiblePassages]);

    const questions = selectedPassage.questions || [];
    const correctCount = questions.reduce((count, question, index) => (
        answers[index] === question.answerIndex ? count + 1 : count
    ), 0);
    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === questions.length;
    const hasQuestions = questions.length > 0;
    const progressRatio = hasQuestions ? Math.min(1, answeredCount / questions.length) : 1;
    const coachState = useMemo(() => {
        if (isFinished && hasQuestions) {
            if (correctCount === questions.length) {
                return {
                    title: '読み切れました',
                    line: '内容もしっかり取れています。このまま次の長文にも進めそうです。',
                    emotion: 'happy',
                    faceAccent: 'heart',
                    intensity: 0.56,
                };
            }

            return {
                title: '振り返り中',
                line: '読みの軸はできています。解説を見ながら、根拠の拾い方だけもう一度確認しましょう。',
                emotion: 'normal',
                faceAccent: 'star',
                intensity: 0.44,
            };
        }

        if (!hasQuestions) {
            return {
                title: '単語ひろい用',
                line: '本文を読みながら、気になった単語をそのままノートに足していけます。',
                emotion: 'normal',
                faceAccent: '',
                intensity: 0.3,
            };
        }

        if (allAnswered) {
            return {
                title: '採点できます',
                line: '全部選べています。このまま結果を出して、理解度を確認しましょう。',
                emotion: 'surprised',
                faceAccent: 'star',
                intensity: 0.42,
            };
        }

        if (answeredCount > 0) {
            return {
                title: '読み進め中',
                line: `${answeredCount}/${questions.length} 問えらべています。本文に戻りながらでも大丈夫です。`,
                emotion: 'normal',
                faceAccent: '',
                intensity: 0.32,
            };
        }

        return {
            title: 'まずは本文から',
            line: '先にざっと読んで流れをつかんでから、下の設問に入ると答えやすいです。',
            emotion: 'normal',
            faceAccent: '',
            intensity: 0.28,
        };
    }, [allAnswered, answeredCount, correctCount, hasQuestions, isFinished, questions.length]);
    const coachPose = useMemo(() => ({
        emotion: coachState.emotion,
        expression: coachState.emotion,
        scene: 'reading',
        intensity: coachState.intensity,
        speaking: false,
        text: coachState.line,
        live2dFaceAccent: coachState.faceAccent,
    }), [coachState]);

    const handlePassageChange = (passageId) => {
        setSelectedPassageId(passageId);
        setAnswers({});
        setIsFinished(false);
        setSearchParams((params) => {
            const nextParams = new URLSearchParams(params);
            nextParams.set('passage', passageId);
            return nextParams;
        });
    };

    const handleAddCustomPassage = (event) => {
        event.preventDefault();
        const normalized = normalizeCustomPassage({
            id: `custom-reading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: customTitle,
            passage: customText,
            createdAt: Date.now(),
        });

        if (!normalized) {
            setCustomFeedback('タイトルと本文を入力してください。');
            return;
        }

        const nextCustomPassages = [normalized, ...customPassages];
        saveCustomReadingPassages(nextCustomPassages);
        setCustomPassages(nextCustomPassages);
        setCustomTitle('');
        setCustomText('');
        setCustomFeedback(`「${normalized.title}」を追加しました。`);
        handlePassageChange(normalized.id);
    };

    const handleDeleteCustomPassage = (passageId) => {
        const nextCustomPassages = customPassages.filter((passage) => passage.id !== passageId);
        saveCustomReadingPassages(nextCustomPassages);
        setCustomPassages(nextCustomPassages);
        setCustomFeedback('自作長文を削除しました。');

        if (selectedPassageId === passageId) {
            const nextPassage = nextCustomPassages[0] || getReadingPassagesByLevel(initialLevel)[0] || READING_PASSAGES[0];
            handlePassageChange(nextPassage.id);
        }
    };

    const handleAnswer = (questionIndex, optionIndex) => {
        if (isFinished) return;
        setAnswers((current) => ({
            ...current,
            [questionIndex]: optionIndex,
        }));
    };

    const handleFinish = () => {
        if (!allAnswered || isFinished) return;

        saveStudySession({
            subject: '英語',
            category: '長文読解',
            unit: selectedPassage.label,
            duration: selectedPassage.estimatedMinutes * 60,
            questionsAnswered: questions.length,
            correctAnswers: correctCount,
        });

        updateMissionsOnStudy({
            subject: '英語',
            duration: selectedPassage.estimatedMinutes,
            score: correctCount,
            totalQuestions: questions.length,
        });

        if (typeof updateStats === 'function') {
            updateStats((currentStats) => {
                const nextStats = {
                    ...currentStats,
                    intellect: (currentStats?.intellect || 0) + READING_REWARD_INTELLECT,
                    totalStudyTime: (currentStats?.totalStudyTime || 0) + selectedPassage.estimatedMinutes,
                    totalSessions: (currentStats?.totalSessions || 0) + 1,
                };
                const dailyLoopPatch = buildDailyLoopPhasePatch(nextStats, 'practice');
                const dailyLoopStats = dailyLoopPatch
                    ? { ...nextStats, ...dailyLoopPatch }
                    : nextStats;
                const relationshipStats = applyRelationshipActivity(dailyLoopStats, {
                    type: 'study',
                    summary: `${selectedPassage.label}の長文を読み切った`,
                    detail: hasQuestions && correctCount === questions.length
                        ? '最後まで集中して読み切って、かなり息の合う学習時間になった。'
                        : '一緒に文章を追う時間が、着実な信頼に変わっていく。',
                    affectionDelta: getRelationshipActivityAffectionDelta(dailyLoopStats, 'study') + (hasQuestions && correctCount === questions.length ? 4 : 0),
                }).nextStats;
                return applyCharacterEvaluationResult(relationshipStats, {
                    activityType: 'practice',
                    answeredCount: questions.length,
                    correctCount,
                    accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 100,
                    completed: true,
                    durationMinutes: selectedPassage.estimatedMinutes,
                    perfect: hasQuestions && correctCount === questions.length,
                }).nextStats;
            });
        }

        setIsFinished(true);
    };

    return (
        <div className="reading-screen">
            <header className="reading-header">
                <button type="button" className="reading-back" onClick={() => navigate('/study')} aria-label="戻る">
                    <ChevronLeft size={20} />
                </button>
                <div className="reading-header-copy">
                    <span className="reading-kicker">READING</span>
                    <h1>長文読解</h1>
                </div>
                <div className="reading-header-note">TAP VOCAB</div>
            </header>

            <SceneStageLayout
                rootClassName="reading-room-container"
                rootStyle={equippedBackground !== 'default' ? backgroundStyle : undefined}
                backgroundClassName={equippedBackground === 'default' ? 'reading-room-background' : ''}
                characterLayerClassName="reading-room-character-layer"
                character={(
                    <div className={`reading-character-shell ${renderer === 'live2d' ? 'is-live2d' : ''}`}>
                        <div className="reading-character-touch-target character-touch-target">
                            <CharacterStage
                                characterId={characterId}
                                renderer={renderer}
                                skinId={skinId}
                                accessoryIds={equippedAccessories}
                                pose={coachPose}
                                scene="reading"
                                className="reading-character-stage"
                                imageClassName="reading-character-figure"
                                imageStyle={{
                                    height: '100%',
                                    width: '100%',
                                    '--character-stage-overflow': 'visible',
                                }}
                                alt={`${characterLabel} coach`}
                            />
                        </div>
                    </div>
                )}
            >
                <div className="reading-scene-note">
                    <span className="reading-scene-note-kicker">{selectedPassage.label}</span>
                    <strong>{coachState.title}</strong>
                    <p>{coachState.line}</p>
                </div>

                <section className="reading-bottom-sheet">
                    <div className="reading-sheet-handle" aria-hidden="true" />

                    <div className="reading-sheet-heading">
                        <div>
                            <span className="reading-section-kicker">Passage</span>
                            <h2>{selectedPassage.title}</h2>
                        </div>
                        <div className="reading-sheet-status">
                            <div className="reading-summary-pill">
                                <Clock3 size={14} />
                                <span>{selectedPassage.estimatedMinutes}分</span>
                            </div>
                            <div className="reading-summary-pill">
                                <BookOpenText size={14} />
                                <span>{hasQuestions ? `${answeredCount}/${questions.length}問` : '本文のみ'}</span>
                            </div>
                            <div className="reading-summary-pill">
                                <Sparkles size={14} />
                                <span>{selectedPassage.topic}</span>
                            </div>
                        </div>
                    </div>

                    <section className="reading-section-card">
                        <div className="reading-section-head">
                            <span className="reading-section-kicker">Select</span>
                            <span className="reading-selection-count">{visiblePassages.length}本</span>
                        </div>

                        <div className="reading-passage-switcher" aria-label="長文を選択">
                            {visiblePassages.map((passage) => (
                                <button
                                    type="button"
                                    key={passage.id}
                                    className={`reading-passage-tab ${passage.id === selectedPassage.id ? 'active' : ''}`}
                                    onClick={() => handlePassageChange(passage.id)}
                                >
                                    <div className="reading-passage-tab-top">
                                        <span className={`reading-chip ${passage.custom ? 'is-accent' : ''}`}>{passage.label}</span>
                                        {passage.custom && (
                                            <span className="reading-passage-tab-badge">MY</span>
                                        )}
                                    </div>
                                    <strong>{passage.title}</strong>
                                </button>
                            ))}
                        </div>
                    </section>

                    <article className="reading-passage-card">
                        <div className="reading-card-topline">
                            <span>{selectedPassage.label}</span>
                            <span>{selectedPassage.estimatedMinutes}分目安</span>
                            <span>{selectedPassage.topic}</span>
                        </div>
                        <div>
                            <h3>{selectedPassage.title}</h3>
                            <p className="reading-passage-note">本文中の英単語をタップすると、自作単語ノートに追加できます。</p>
                        </div>
                        <div className="reading-passage-text">
                            <TappableVocabText text={selectedPassage.passage} />
                        </div>
                    </article>

                    <section className="reading-quiz-card">
                        <div className="reading-quiz-header">
                            <div>
                                <span className="reading-section-kicker">Check</span>
                                <h3>{hasQuestions ? '内容確認' : 'Reading Memo'}</h3>
                            </div>
                            <div className="reading-progress-pill">
                                <span>{Math.round(progressRatio * 100)}%</span>
                            </div>
                        </div>

                        {hasQuestions ? (
                            <div className="reading-question-list">
                                {questions.map((question, questionIndex) => {
                                    const selectedAnswer = answers[questionIndex];
                                    const hasAnswered = typeof selectedAnswer === 'number';

                                    return (
                                        <section key={question.question} className="reading-question">
                                            <h4>{questionIndex + 1}. {question.question}</h4>
                                            <div className="reading-options">
                                                {question.options.map((option, optionIndex) => {
                                                    const isSelected = selectedAnswer === optionIndex;
                                                    const isCorrect = question.answerIndex === optionIndex;
                                                    const revealClass = isFinished
                                                        ? isCorrect
                                                            ? 'is-correct'
                                                            : isSelected
                                                                ? 'is-wrong'
                                                                : ''
                                                        : isSelected
                                                            ? 'is-selected'
                                                            : '';

                                                    return (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            className={`reading-option ${revealClass}`}
                                                            onClick={() => handleAnswer(questionIndex, optionIndex)}
                                                        >
                                                            {option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {isFinished && (
                                                <p className="reading-explanation">{question.explanation}</p>
                                            )}
                                            {!isFinished && hasAnswered && (
                                                <p className="reading-selected-note">選択済み</p>
                                            )}
                                        </section>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="reading-empty-quiz">
                                <p>この自作長文には確認問題はありません。単語チェック用として使えます。</p>
                            </div>
                        )}

                        <button
                            type="button"
                            className="reading-finish-btn"
                            onClick={handleFinish}
                            disabled={hasQuestions ? (!allAnswered || isFinished) : isFinished}
                        >
                            {isFinished ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    {hasQuestions ? `${correctCount}/${questions.length} 正解・記録済み` : '読了として記録済み'}
                                </>
                            ) : allAnswered && hasQuestions ? (
                                '採点して保存'
                            ) : !hasQuestions ? (
                                '読了として保存'
                            ) : (
                                'すべて回答すると採点できます'
                            )}
                        </button>

                        {isFinished && (
                            <p className="reading-reward-note">
                                学力 +{READING_REWARD_INTELLECT}。気になった単語はそのまま本文から追加できます。
                            </p>
                        )}
                    </section>

                    <section className="reading-section-card reading-custom-form-section">
                        <div className="reading-custom-form-copy">
                            <span className="reading-section-kicker">My Passage</span>
                            <h3>自分の長文を追加</h3>
                            <p>英文を貼ると、この画面で単語タップ練習に使えます。</p>
                        </div>
                        <form className="reading-custom-form" onSubmit={handleAddCustomPassage}>
                            <input
                                type="text"
                                value={customTitle}
                                onChange={(event) => setCustomTitle(event.target.value)}
                                placeholder="タイトル"
                            />
                            <textarea
                                value={customText}
                                onChange={(event) => setCustomText(event.target.value)}
                                placeholder="ここに英文の長文を貼り付け"
                                rows={5}
                            />
                            <button type="submit">追加する</button>
                        </form>
                        {customFeedback && <p className="reading-custom-feedback">{customFeedback}</p>}

                        {customPassages.length > 0 && (
                            <div className="reading-custom-list">
                                {customPassages.map((passage) => (
                                    <div key={passage.id} className="reading-custom-item">
                                        <button
                                            type="button"
                                            className={`reading-custom-select ${passage.id === selectedPassage.id ? 'active' : ''}`}
                                            onClick={() => handlePassageChange(passage.id)}
                                        >
                                            <span className="reading-chip is-accent">{passage.label}</span>
                                            <strong>{passage.title}</strong>
                                        </button>
                                        <button
                                            type="button"
                                            className="reading-delete-custom"
                                            onClick={() => handleDeleteCustomPassage(passage.id)}
                                            aria-label={`${passage.title} を削除`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="reading-bottom-note">
                        <MessageCircle size={14} />
                        <span>{characterLabel} と一緒に、上で読んで下で確認する流れです。</span>
                    </div>
                </section>
            </SceneStageLayout>
        </div>
    );
};

export default Reading;
