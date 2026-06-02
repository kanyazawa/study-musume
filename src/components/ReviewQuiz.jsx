import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Clock3, Flame, Target } from 'lucide-react';
import {
    getReviewPriority,
    formatRelativeDate,
    formatReviewProgress,
    formatNextCorrectReviewProgress,
    formatWrongReviewProgress,
    updateReviewResult,
    getReviewChallengeProgressPreview,
} from '../utils/reviewUtils';
import CharacterStage from './character/CharacterStage';
import SceneStageLayout from './layout/SceneStageLayout';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { useSound } from '../contexts/SoundContext';
import BgClassroom from '../assets/images/bg_classroom.webp';
import battleChain1Audio from '../assets/audio/chains/battle-chain-1.mp3';
import battleChain2Audio from '../assets/audio/chains/battle-chain-2.mp3';
import battleChain3Audio from '../assets/audio/chains/battle-chain-3.mp3';
import battleChain4Audio from '../assets/audio/chains/battle-chain-4.mp3';
import battleChain5Audio from '../assets/audio/chains/battle-chain-5.mp3';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { resolveReviewCharacterPose } from '../utils/reviewExpressionState';
import { getReactionEmotion, getReviewFeedbackCopy, resolveReactionVoiceSelection, resolveReviewReactionTone } from '../utils/studyReactionUtils';
import '../pages/MultiplayerMatch.css';
import './ReviewQuiz.css';

const REVIEW_TUTORIAL_STORAGE_KEY = 'hasSeenReviewTutorial';

const hasSeenReviewTutorial = () => {
    if (typeof window === 'undefined') return true;

    try {
        return window.localStorage.getItem(REVIEW_TUTORIAL_STORAGE_KEY) === 'true';
    } catch {
        return true;
    }
};

const shuffleArray = (items = []) => {
    const nextItems = [...items];

    for (let index = nextItems.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
    }

    return nextItems;
};

const normalizeAnswerText = (value = '') => (
    String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.!?;:])/g, '$1')
);

const buildReorderTokenBank = (question) => {
    const sourceTokens = Array.isArray(question?.tokens) && question.tokens.length > 0
        ? question.tokens
        : String(question?.correctAnswer || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    return shuffleArray(
        sourceTokens.map((token, index) => ({
            id: `${question?.id || 'review'}-token-${index}`,
            text: String(token || '').trim(),
        })).filter((token) => token.text)
    );
};

const prepareSessionQuestions = (questions = []) => (
    questions.map((question) => {
        const isReorderQuestion = question?.questionType === 'reorder'
            || (Array.isArray(question?.tokens) && question.tokens.length > 0);

        if (!isReorderQuestion) {
            return {
                ...question,
                questionType: Array.isArray(question?.options) && question.options.length > 0 ? 'choice' : 'input',
            };
        }

        return {
            ...question,
            questionType: 'reorder',
            reorderTokens: buildReorderTokenBank(question),
        };
    })
);

const formatReorderAnswer = (tokens = []) => normalizeAnswerText(
    tokens.map((token) => token.text).join(' ')
);

/**
 * ReviewQuiz Component
 * 復習用のクイズコンポーネント
 */
const ReviewQuiz = ({
    questions,
    stats,
    updateStats,
    dailyChallenge,
    onComplete,
    getRewardSummary,
    exitLabel = '復習リストに戻る',
    uiDensity = 'default',
    manualAdvanceOnReorderIncorrect = false,
}) => {
    const { isMuted, playSE, playVoice, voiceVolume, acquireVoiceFocus } = useSound();
    const [sessionQuestions, setSessionQuestions] = useState(() => prepareSessionQuestions(questions));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
    const [results, setResults] = useState([]); // { questionId, isCorrect }
    const [isCompleted, setIsCompleted] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedReorderTokenIds, setSelectedReorderTokenIds] = useState([]);
    const [correctStreak, setCorrectStreak] = useState(0);
    const [maxCorrectStreak, setMaxCorrectStreak] = useState(0);
    const [persistentEmotion, setPersistentEmotion] = useState(null);
    const [feedbackTone, setFeedbackTone] = useState(null);
    const [isFeverFxActive, setIsFeverFxActive] = useState(false);
    const [feverFxKey, setFeverFxKey] = useState(0);
    const [showTutorial, setShowTutorial] = useState(() => !hasSeenReviewTutorial());
    const chainAudioCacheRef = useRef({});
    const audioContextRef = useRef(null);
    const autoAdvanceTimeoutRef = useRef(null);
    const feverFxTimeoutRef = useRef(null);

    const currentQuestion = sessionQuestions[currentIndex];
    const isMinimalUi = uiDensity === 'minimal';
    const accuracy = results.length ? Math.round((results.filter((result) => result.isCorrect).length / results.length) * 100) : 100;
    const isChoiceQuestion = currentQuestion?.questionType === 'choice';
    const isReorderQuestion = currentQuestion?.questionType === 'reorder';
    const reorderTokenBank = currentQuestion?.reorderTokens || [];
    const selectedReorderTokens = useMemo(() => {
        const tokenMap = new Map(reorderTokenBank.map((token) => [token.id, token]));
        return selectedReorderTokenIds.map((tokenId) => tokenMap.get(tokenId)).filter(Boolean);
    }, [reorderTokenBank, selectedReorderTokenIds]);
    const availableReorderTokens = useMemo(() => {
        const selectedTokenIds = new Set(selectedReorderTokenIds);
        return reorderTokenBank.filter((token) => !selectedTokenIds.has(token.id));
    }, [reorderTokenBank, selectedReorderTokenIds]);
    const isReorderReady = isReorderQuestion
        && reorderTokenBank.length > 0
        && selectedReorderTokenIds.length === reorderTokenBank.length;
    const priority = getReviewPriority(currentQuestion?.nextReviewDate);
    const priorityLabel = {
        urgent: '今すぐ復習',
        soon: '近日中',
        later: '余裕あり'
    }[priority];
    const sceneMood = feedback
        ? feedback === 'correct'
            ? 'success'
            : 'mistake'
        : (currentQuestion?.wrongCount || 0) >= 3
            ? 'focus'
            : priority === 'urgent'
                ? 'urgent'
                : 'calm';
    const characterId = stats?.characterId || 'noah';
    const skinId = stats?.equippedSkin || 'default';
    const preferredRenderer = stats?.characterRenderer;
    const hasReviewLive2D = hasLive2DModelConfig(characterId, skinId);
    const shouldForceReviewLive2D = characterId === 'noah' && hasReviewLive2D;
    const renderer = resolveCharacterRenderer({
        preferredRenderer: shouldForceReviewLive2D ? 'live2d' : preferredRenderer,
        characterId,
        skinId,
    });
    const showIncorrectFeedback = Boolean(isChoiceQuestion && feedback === 'incorrect');
    const isShowingFeedback = Boolean(feedback);
    const questionHintText = isChoiceQuestion
        ? '正しい答えを選ぼう'
        : isReorderQuestion
            ? '単語を順に押して正しい文にしよう'
            : '答えを入力しよう';
    const shouldManualAdvanceCurrentQuestion = Boolean(
        manualAdvanceOnReorderIncorrect
        && isReorderQuestion
        && feedback === 'incorrect'
    );
    const shouldHideIncorrectFeedbackCopy = isMinimalUi && shouldManualAdvanceCurrentQuestion;
    const tutorialActionLabel = hasSeenReviewTutorial() ? '復習に戻る' : 'はじめる';
    const { characterPose, visibleReviewFaceAccent } = resolveReviewCharacterPose({
        renderer,
        feedback,
        feedbackTone,
        persistentEmotion,
        correctStreak,
        wrongCount: currentQuestion?.wrongCount || 0,
        priority,
    });

    useEffect(() => {
        if (!shouldForceReviewLive2D || !updateStats || preferredRenderer === 'live2d') {
            return;
        }

        updateStats({ characterRenderer: 'live2d' });
    }, [preferredRenderer, shouldForceReviewLive2D, updateStats]);
    const getChainAudioSrc = useCallback((streak) => {
        if (streak <= 1) return battleChain1Audio;
        if (streak === 2) return battleChain2Audio;
        if (streak === 3) return battleChain3Audio;
        if (streak === 4) return battleChain4Audio;
        return battleChain5Audio;
    }, []);

    useEffect(() => {
        const sources = [1, 2, 3, 4, 5].map(getChainAudioSrc);
        const uniqueSources = [...new Set(sources)];
        uniqueSources.forEach((src) => {
            if (!chainAudioCacheRef.current[src]) {
                const audio = new Audio(src);
                audio.preload = 'auto';
                audio.load();
                chainAudioCacheRef.current[src] = audio;
            }
        });
    }, [getChainAudioSrc]);

    useEffect(() => () => {
        if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
        }
        if (feverFxTimeoutRef.current) {
            clearTimeout(feverFxTimeoutRef.current);
        }
    }, []);

    const playUiTone = useCallback((frequency, durationMs, { type = 'sine', gain = 0.03, delayMs = 0 } = {}) => {
        if (isMuted || typeof window === 'undefined') return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
        }

        const audioContext = audioContextRef.current;
        if (!audioContext) return;

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => { });
        }

        const now = audioContext.currentTime + (delayMs / 1000);
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (durationMs / 1000));

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + (durationMs / 1000) + 0.02);
    }, [isMuted]);

    const playChainVoiceClip = useCallback((streak) => {
        if (isMuted || typeof window === 'undefined') return;

        const voiceSrc = getChainAudioSrc(streak);
        if (!voiceSrc) return;

        let audio = chainAudioCacheRef.current[voiceSrc];
        if (audio) {
            audio.currentTime = 0;
        } else {
            audio = new window.Audio(voiceSrc);
            chainAudioCacheRef.current[voiceSrc] = audio;
        }

        const releaseVoiceFocus = acquireVoiceFocus();
        audio.volume = voiceVolume;
        audio.onended = releaseVoiceFocus;
        audio.onerror = releaseVoiceFocus;
        audio.play().catch(() => {
            releaseVoiceFocus();
        });
    }, [acquireVoiceFocus, getChainAudioSrc, isMuted, voiceVolume]);
    const triggerFeverFx = useCallback(() => {
        if (feverFxTimeoutRef.current) {
            clearTimeout(feverFxTimeoutRef.current);
        }

        setFeverFxKey((prev) => prev + 1);
        setIsFeverFxActive(true);
        feverFxTimeoutRef.current = setTimeout(() => {
            setIsFeverFxActive(false);
            feverFxTimeoutRef.current = null;
        }, 920);
    }, []);
    const playReactionVoice = useCallback((tone, streak = 0) => {
        const selection = resolveReactionVoiceSelection({ characterId, tone, streak });
        if (selection.shouldTriggerFeverFx) {
            triggerFeverFx();
        }
        if (!selection.file) return;

        playVoice(selection.file, {
            channel: 'study-reaction',
        }).catch(() => { });
    }, [characterId, playVoice, triggerFeverFx]);

    const closeTutorial = () => {
        try {
            window.localStorage.setItem(REVIEW_TUTORIAL_STORAGE_KEY, 'true');
        } catch {
            // localStorage が使えない環境でも、その場では閉じられるようにする。
        }
        setShowTutorial(false);
    };

    const handleNextQuestion = () => {
        if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
            autoAdvanceTimeoutRef.current = null;
        }

        if (currentIndex + 1 < sessionQuestions.length) {
            // Next question
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setFeedback(null);
            setFeedbackTone(null);
            setInputValue('');
            setSelectedReorderTokenIds([]);
        } else {
            // Quiz complete
            setTimeout(() => {
                // Show completion screen
                setIsCompleted(true);
            }, 500);
        }
    };

    const handleAnswerSelect = (answer) => {
        if (feedback || showTutorial) return; // Already answered or tutorial is open

        setSelectedAnswer(answer);
        const isCorrect = isReorderQuestion
            ? normalizeAnswerText(answer) === normalizeAnswerText(currentQuestion.correctAnswer)
            : answer === currentQuestion.correctAnswer;
        const nextStreak = isCorrect ? correctStreak + 1 : 0;
        const nextFeedbackTone = resolveReviewReactionTone({
            isCorrect,
            nextCorrectStreak: nextStreak,
            previousResult: results.length > 0
                ? (results[results.length - 1].isCorrect ? 'correct' : 'incorrect')
                : null,
            questionType: currentQuestion?.questionType,
            wrongCount: currentQuestion?.wrongCount || 0,
            priority,
            reviewLevel: currentQuestion?.reviewLevel || 0,
        });

        setFeedback(isCorrect ? 'correct' : 'incorrect');
        setFeedbackTone(nextFeedbackTone);
        setCorrectStreak(nextStreak);
        setMaxCorrectStreak((currentMax) => Math.max(currentMax, nextStreak));
        setPersistentEmotion(getReactionEmotion(nextFeedbackTone, isCorrect ? 'smile' : 'angry'));

        if (isCorrect) {
            playSE('se_correct');
            playUiTone(880, 170, { type: 'sine', gain: 0.028 });
            const shouldPlayReactionVoice = nextFeedbackTone === 'chain_correct'
                || nextFeedbackTone === 'hard_correct'
                || nextFeedbackTone === 'comeback_correct';
            if (shouldPlayReactionVoice) {
                playReactionVoice(nextFeedbackTone, nextStreak);
            }
            if (nextStreak >= 2 && !shouldPlayReactionVoice) {
                playChainVoiceClip(Math.min(nextStreak, 5));
            }
        } else {
            playUiTone(182, 180, { type: 'sawtooth', gain: 0.022 });
            playUiTone(146, 240, { type: 'triangle', gain: 0.016, delayMs: 80 });
        }

        updateReviewResult(currentQuestion.id, isCorrect);
        setResults(prev => [...prev, {
            questionId: currentQuestion.id,
            isCorrect
        }]);

        const shouldAutoAdvance = !(manualAdvanceOnReorderIncorrect && isReorderQuestion && !isCorrect);
        if (shouldAutoAdvance) {
            autoAdvanceTimeoutRef.current = setTimeout(() => {
                autoAdvanceTimeoutRef.current = null;
                handleNextQuestion();
            }, isCorrect ? 800 : 1400);
        }
    };

    const handleReorderTokenSelect = (tokenId) => {
        if (feedback || showTutorial) return;

        setSelectedReorderTokenIds((prev) => (
            prev.includes(tokenId) ? prev : [...prev, tokenId]
        ));
    };

    const handleReorderTokenRemove = (tokenId) => {
        if (feedback || showTutorial) return;

        setSelectedReorderTokenIds((prev) => prev.filter((currentTokenId) => currentTokenId !== tokenId));
    };

    const handleReorderReset = () => {
        if (feedback || showTutorial) return;
        setSelectedReorderTokenIds([]);
    };

    const handleReorderSubmit = () => {
        if (!isReorderReady) return;
        handleAnswerSelect(formatReorderAnswer(selectedReorderTokens));
    };

    const handleInputSubmit = (e) => {
        e.preventDefault();
        if (showTutorial) return;
        if (!inputValue.trim()) return;

        const normalizedInput = normalizeAnswerText(inputValue.toLowerCase());
        const normalizedCorrect = normalizeAnswerText(currentQuestion.correctAnswer.toLowerCase());
        handleAnswerSelect(normalizedInput === normalizedCorrect ? currentQuestion.correctAnswer : inputValue.trim());
    };

    const correctCount = results.filter(r => r.isCorrect).length;
    const sessionChallengeProgress = dailyChallenge
        ? getReviewChallengeProgressPreview(dailyChallenge, {
            answeredCount: results.length,
            correctCount,
            accuracy: results.length ? Math.round((correctCount / results.length) * 100) : 0,
            maxCombo: maxCorrectStreak,
            dueReduced: 0,
        })
        : 0;
    const incorrectRetryQuestions = useMemo(() => {
        const wrongIds = new Set(results.filter((result) => !result.isCorrect).map((result) => result.questionId));
        return sessionQuestions.filter((question) => wrongIds.has(question.id));
    }, [results, sessionQuestions]);

    const restartQuiz = (nextQuestions) => {
        setSessionQuestions(prepareSessionQuestions(nextQuestions));
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setFeedback(null);
        setFeedbackTone(null);
        setResults([]);
        setIsCompleted(false);
        setInputValue('');
        setSelectedReorderTokenIds([]);
        setCorrectStreak(0);
        setMaxCorrectStreak(0);
        setPersistentEmotion(null);
        setIsFeverFxActive(false);
    };

    const renderFeedbackContent = () => {
        if (!feedback) return null;
        const feedbackCopy = getReviewFeedbackCopy({
            feedback,
            tone: feedbackTone,
            manualAdvance: shouldManualAdvanceCurrentQuestion,
        });

        return (
            <div className="review-answer-result">
                {!shouldHideIncorrectFeedbackCopy && (
                    <div className={`review-feedback-banner ${feedback === 'correct' ? 'is-correct' : 'is-incorrect'}`}>
                        {feedbackCopy.banner}
                    </div>
                )}
                {feedback === 'incorrect' && (
                    <div className="answer-reveal">
                        <span className="label">正解:</span> {currentQuestion.correctAnswer}
                    </div>
                )}
                <div className={`user-answer-display ${feedback === 'correct' ? 'is-correct' : ''}`}>
                    <span className="label">あなたの回答:</span> {selectedAnswer}
                </div>
                {currentQuestion.userAnswer && !isChoiceQuestion && (
                    <div className="past-answer-display">
                        <span className="label">前回の回答:</span> {currentQuestion.userAnswer}
                    </div>
                )}

                {!shouldHideIncorrectFeedbackCopy && (
                    <div className={`review-auto-next-message ${feedback === 'incorrect' ? 'is-reset' : ''}`}>
                        {feedbackCopy.detail}
                    </div>
                )}
                {shouldManualAdvanceCurrentQuestion && (
                    <button
                        type="button"
                        className="review-manual-next-btn"
                        onClick={handleNextQuestion}
                    >
                        次の問題へ
                    </button>
                )}
            </div>
        );
    };

    if (!currentQuestion) {
        return (
            <div className="review-quiz completion-screen">
                <div className="completion-content">
                    <div className="completion-icon">📚</div>
                    <h2>復習を準備中です</h2>
                    <p className="completion-coach-message">
                        問題の読み込みに失敗したので、いったん復習リストに戻します。
                    </p>
                    <button className="finish-btn" onClick={() => onComplete({ results, completed: false, maxCorrectStreak })}>
                        {exitLabel}
                    </button>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        const completionCoachMessage = correctCount === results.length
            ? '完璧。今日はかなり仕上がってるよ。'
            : correctCount >= results.length / 2
                ? 'いい復習だったね。苦手がちゃんと見えてきたよ。'
                : '今日は土台づくりの日。次の一周でかなり変わるよ。';
        const rewardSummary = typeof getRewardSummary === 'function' ? getRewardSummary(results) : null;

        return (
            <div className="review-quiz completion-screen">
                <div className="completion-content">
                    <div className="completion-icon">🎉</div>
                    <h2>復習完了！</h2>
                    <div className="completion-stats">
                        <div className="stat-circle">
                            <span className="stat-value">{correctCount}</span>
                            <span className="stat-label">正解</span>
                        </div>
                        <div className="stat-divider">/</div>
                        <div className="stat-total">
                            <span className="total-value">{results.length}</span>
                            <span className="total-label">問</span>
                        </div>
                    </div>
                    <p className="completion-message">
                        {correctCount === results.length ? '完璧です！素晴らしい！' :
                            correctCount >= results.length / 2 ? 'よく頑張りました！' :
                                '次はもっと頑張りましょう！'}
                    </p>
                    <p className="completion-coach-message">{completionCoachMessage}</p>
                    {rewardSummary && rewardSummary.answeredCount > 0 && (
                        <>
                            <div className="completion-reward-row">
                                <div className="completion-reward-chip">💎 +{rewardSummary.diamonds}</div>
                                <div className="completion-reward-chip">🧠 +{rewardSummary.intellect}</div>
                                {maxCorrectStreak >= 2 && (
                                    <div className="completion-reward-chip">🔥 MAX {maxCorrectStreak}チェイン</div>
                                )}
                            </div>
                            {rewardSummary.bonusLabels?.length > 0 && (
                                <div className="completion-bonus-row">
                                    {rewardSummary.bonusLabels.map((label) => (
                                        <div key={label} className="completion-bonus-chip">{label}</div>
                                    ))}
                                </div>
                            )}
                            {dailyChallenge && (
                                <div className="completion-bonus-row">
                                    <div className="completion-bonus-chip">
                                        {`🕹️ ${dailyChallenge.title} ${sessionChallengeProgress} / ${dailyChallenge.target}${dailyChallenge.unit}`}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {incorrectRetryQuestions.length > 0 && (
                        <button
                            className="retry-incorrect-btn"
                            onClick={() => restartQuiz(incorrectRetryQuestions)}
                        >
                            間違えた {incorrectRetryQuestions.length} 問だけもう一度
                        </button>
                    )}
                    <button className="finish-btn" onClick={() => onComplete({ results, completed: true, maxCorrectStreak })}>
                        {exitLabel}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <SceneStageLayout
            rootClassName={`mp-screen mp-playing-screen review-quiz-screen review-quiz-scene ${isMinimalUi ? 'review-quiz-screen-minimal' : ''} review-mood-${sceneMood} ${isFeverFxActive ? 'review-fx-fever' : ''}`}
            backgroundClassName="mp-background"
            backgroundStyle={{ backgroundImage: `url(${BgClassroom})`, opacity: 0.72 }}
            characterLayerClassName={`mp-character-area ${renderer === 'live2d' ? 'is-live2d' : ''}`}
            character={(
                <>
                    <CharacterStage
                        characterId={characterId}
                        renderer={renderer}
                        skinId={skinId}
                        scene="review"
                        pose={characterPose}
                        className="character-match review-character-stage"
                        imageClassName="mp-center-character"
                        alt="Review Character"
                    />
                    {visibleReviewFaceAccent && (
                        <div className={`mp-face-accent mp-face-accent-${visibleReviewFaceAccent} review-face-accent`} aria-hidden="true">
                            {visibleReviewFaceAccent === 'heart' && (
                                <>
                                    <span className="mp-face-heart-orbit mp-face-heart-orbit-left">♥</span>
                                    <span className="mp-face-heart-orbit mp-face-heart-orbit-right">♥</span>
                                </>
                            )}
                            <span className="mp-face-eye mp-face-eye-left">{visibleReviewFaceAccent === 'heart' ? '♥' : '★'}</span>
                            <span className="mp-face-eye mp-face-eye-right">{visibleReviewFaceAccent === 'heart' ? '♥' : '★'}</span>
                        </div>
                    )}
                </>
            )}
        >
            {isFeverFxActive && (
                <div className="review-fever-burst" key={`review-fever-${feverFxKey}`} aria-hidden="true">
                    <span className="review-fever-kicker">RARE VOICE</span>
                    <strong>FEVER</strong>
                    <i className="review-fever-spark review-fever-spark-1" />
                    <i className="review-fever-spark review-fever-spark-2" />
                    <i className="review-fever-spark review-fever-spark-3" />
                    <i className="review-fever-spark review-fever-spark-4" />
                    <i className="review-fever-spark review-fever-spark-5" />
                </div>
            )}

            <div className="review-topbar review-topbar-plain">
                <button className="quiz-back-btn" onClick={() => onComplete({ results, completed: false, maxCorrectStreak })}>
                    <ChevronLeft size={18} />
                    戻る
                </button>
                <button
                    className="review-help-btn"
                    type="button"
                    onClick={() => setShowTutorial(true)}
                    aria-label="復習の説明を見る"
                    title="復習の説明"
                >
                    ?
                </button>
            </div>

            {showTutorial && (
                <div className="review-tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="review-tutorial-title">
                    <div className="review-tutorial-panel">
                        <div className="review-tutorial-kicker">弱点ノート</div>
                        <h2 id="review-tutorial-title">答えるだけで復習間隔を調整するよ</h2>
                        <p>
                            正解できた単語や問題は、次に出るタイミングが少し先に伸びます。
                            間違えたらレベルを戻して、近いうちにもう一度出します。
                        </p>
                        <div className="review-tutorial-steps">
                            <div className="review-tutorial-step">
                                <span>1</span>
                                <strong>まず答える</strong>
                            </div>
                            <div className="review-tutorial-step">
                                <span>2</span>
                                <strong>正解で間隔アップ</strong>
                            </div>
                            <div className="review-tutorial-step">
                                <span>3</span>
                                <strong>ミスでリセット</strong>
                            </div>
                        </div>
                        <button className="review-tutorial-start-btn" type="button" onClick={closeTutorial}>
                            {tutorialActionLabel}
                        </button>
                    </div>
                </div>
            )}

            <div className={`mp-playing-content-wrapper review-playing-content ${isMinimalUi ? 'is-minimal' : ''}`}>
                <div className={`mp-question-container review-question-container ${isMinimalUi ? 'is-minimal' : ''}`}>
                    {isMinimalUi ? (
                        <div className="mp-question-meta-row">
                            <div className="mp-question-pill mp-question-pill-primary">
                                {currentIndex + 1} / {sessionQuestions.length}
                            </div>
                        </div>
                    ) : (
                        <div className="mp-question-meta-row">
                            <div className="mp-question-pill mp-question-pill-primary">
                                第{currentIndex + 1}問
                            </div>
                            <div className="mp-question-pill">
                                あと {Math.max(sessionQuestions.length - currentIndex - 1, 0)} 問
                            </div>
                            <div className="mp-question-pill mp-question-pill-neutral">
                                <Target size={14} />
                                正答率 {accuracy}%
                            </div>
                            <div className="mp-question-pill">
                                <Clock3 size={14} />
                                {priorityLabel}
                            </div>
                            <div className="mp-question-pill">
                                {formatReviewProgress(currentQuestion.reviewLevel)}
                            </div>
                            <div className="mp-question-pill mp-question-pill-growth">
                                {formatNextCorrectReviewProgress(currentQuestion.reviewLevel)}
                            </div>
                            <div className={`mp-question-pill review-chain-pill ${correctStreak >= 2 ? 'is-hot' : ''}`}>
                                <Flame size={14} />
                                {correctStreak > 0 ? `${correctStreak}チェイン` : 'チェイン待機'}
                            </div>
                            <div className="mp-question-pill">
                                <Flame size={14} />
                                ミス {currentQuestion.wrongCount}回
                            </div>
                        </div>
                    )}

                    <div className="mp-question-card review-question-card">
                        {!isMinimalUi && (
                            <div className="review-question-subject">{currentQuestion.subject}</div>
                        )}
                        <div className={`mp-question-word review-question-word ${isMinimalUi ? 'is-minimal' : ''}`}>
                            {currentQuestion.questionText}
                        </div>
                        {!isMinimalUi && (
                            <>
                                <p className="mp-question-hint review-question-hint">
                                    {questionHintText}
                                </p>
                                <div className="review-question-subhint">
                                    次回 {formatRelativeDate(currentQuestion.nextReviewDate)} · {formatWrongReviewProgress()}
                                </div>
                            </>
                        )}
                    </div>
                    {dailyChallenge && (
                        <div className={`review-inline-challenge ${dailyChallenge.claimed ? 'is-complete' : ''}`}>
                            <div className="review-inline-challenge-head">
                                <span>DAILY CHALLENGE</span>
                                <strong>{dailyChallenge.progress > 0 || sessionChallengeProgress > 0
                                    ? `${sessionChallengeProgress} / ${dailyChallenge.target}${dailyChallenge.unit}`
                                    : `0 / ${dailyChallenge.target}${dailyChallenge.unit}`}</strong>
                            </div>
                            <div className="review-inline-challenge-title">{dailyChallenge.title}</div>
                            <div className="review-inline-challenge-bar" aria-hidden="true">
                                <div
                                    className="review-inline-challenge-fill"
                                    style={{ width: `${Math.min((sessionChallengeProgress / dailyChallenge.target) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                    {showIncorrectFeedback && (
                        <div className="review-answer-panel review-answer-panel-inline review-answer-panel-floating">
                            {renderFeedbackContent()}
                        </div>
                    )}
                </div>

                <div className={`mp-bottom-area review-bottom-area ${isShowingFeedback ? 'has-incorrect-feedback' : ''}`}>
                    {isChoiceQuestion ? (
                        <>
                            <div className="mp-options-grid review-options-grid">
                                {currentQuestion.options.map((option, index) => {
                                    let btnClass = 'mp-option-btn';
                                    if (feedback) {
                                        if (option === currentQuestion.correctAnswer) {
                                            btnClass += ' mp-option-correct';
                                        } else if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
                                            btnClass += ' mp-option-wrong';
                                        } else {
                                            btnClass += ' mp-option-disabled';
                                        }
                                    }

                                    return (
                                        <button
                                            key={index}
                                            className={btnClass}
                                            onClick={() => handleAnswerSelect(option)}
                                            disabled={feedback !== null}
                                        >
                                            <span className="mp-option-text">{option}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {feedback === 'correct' && (
                                <div className="review-answer-panel review-answer-panel-inline review-next-action">
                                    {renderFeedbackContent()}
                                </div>
                            )}
                        </>
                    ) : isReorderQuestion ? (
                        <div className="review-answer-panel review-reorder-panel">
                            <div className="review-reorder-builder">
                                {!isMinimalUi && (
                                    <div className="review-reorder-label">つくった文</div>
                                )}
                                <div className={`review-reorder-dropzone ${selectedReorderTokens.length > 0 ? 'has-answer' : ''}`}>
                                    {selectedReorderTokens.length > 0 ? (
                                        selectedReorderTokens.map((token) => (
                                            <button
                                                key={token.id}
                                                type="button"
                                                className="review-reorder-picked-token"
                                                onClick={() => handleReorderTokenRemove(token.id)}
                                                disabled={feedback !== null}
                                            >
                                                {token.text}
                                            </button>
                                        ))
                                    ) : (
                                        <span className="review-reorder-placeholder">下の単語を順に押して並べてね</span>
                                    )}
                                </div>
                            </div>
                            {!feedback ? (
                                <>
                                    <div className="review-reorder-action-row">
                                        <button
                                            type="button"
                                            className="review-reorder-secondary-btn"
                                            onClick={handleReorderReset}
                                            disabled={selectedReorderTokenIds.length === 0}
                                        >
                                            リセット
                                        </button>
                                        <button
                                            type="button"
                                            className="review-reorder-submit-btn"
                                            onClick={handleReorderSubmit}
                                            disabled={!isReorderReady}
                                        >
                                            答え合わせ
                                        </button>
                                    </div>
                                    <div className="review-reorder-bank">
                                        {availableReorderTokens.map((token) => (
                                            <button
                                                key={token.id}
                                                type="button"
                                                className="review-reorder-token-btn"
                                                onClick={() => handleReorderTokenSelect(token.id)}
                                            >
                                                {token.text}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="review-answer-panel-inline">
                                    {renderFeedbackContent()}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="review-answer-panel">
                            {!feedback ? (
                                <form onSubmit={handleInputSubmit} className="quiz-input-form">
                                    <input
                                        type="text"
                                        className="quiz-input-field"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="答えを入力してね"
                                        autoFocus
                                    />
                                    <button type="submit" className="quiz-submit-btn" disabled={!inputValue.trim()}>
                                        回答する
                                    </button>
                                </form>
                            ) : (
                                renderFeedbackContent()
                            )}
                        </div>
                    )}
                </div>
            </div>
        </SceneStageLayout>
    );
};

export default ReviewQuiz;
