import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Clock3, Flame, Target } from 'lucide-react';
import {
    getReviewPriority,
    formatRelativeDate,
    formatReviewLevel,
    getReviewScheduleChoices,
    updateReviewResult
} from '../utils/reviewUtils';
import CharacterStage from './character/CharacterStage';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { useSound } from '../contexts/SoundContext';
import BgClassroom from '../assets/images/bg_classroom.webp';
import battleChain1Audio from '../assets/audio/chains/battle-chain-1.mp3';
import battleChain2Audio from '../assets/audio/chains/battle-chain-2.mp3';
import battleChain3Audio from '../assets/audio/chains/battle-chain-3.mp3';
import battleChain4Audio from '../assets/audio/chains/battle-chain-4.mp3';
import battleChain5Audio from '../assets/audio/chains/battle-chain-5.mp3';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import '../pages/MultiplayerMatch.css';
import './ReviewQuiz.css';

/**
 * ReviewQuiz Component
 * 復習用のクイズコンポーネント
 */
const ReviewQuiz = ({ questions, stats, onComplete, getRewardSummary }) => {
    const { isMuted, playSE } = useSound();
    const [sessionQuestions, setSessionQuestions] = useState(() => questions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
    const [results, setResults] = useState([]); // { questionId, isCorrect }
    const [isCompleted, setIsCompleted] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [scheduleChoices, setScheduleChoices] = useState([]);
    const [selectedScheduleKey, setSelectedScheduleKey] = useState(null);
    const [correctStreak, setCorrectStreak] = useState(0);
    const [persistentEmotion, setPersistentEmotion] = useState(null);
    const chainAudioCacheRef = useRef({});
    const audioContextRef = useRef(null);

    const currentQuestion = sessionQuestions[currentIndex];
    const accuracy = results.length ? Math.round((results.filter((result) => result.isCorrect).length / results.length) * 100) : 100;
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
    const hasReviewLive2D = hasLive2DModelConfig(characterId, skinId);
    const shouldForceReviewLive2D = characterId === 'noah' && hasReviewLive2D;
    const renderer = resolveCharacterRenderer({
        preferredRenderer: shouldForceReviewLive2D ? 'live2d' : stats?.characterRenderer,
        characterId,
        skinId,
    });
    const showIncorrectFeedback = Boolean(currentQuestion.options && feedback === 'incorrect');
    const isChoiceQuestion = Boolean(currentQuestion.options);
    const isAwaitingSchedule = Boolean(feedback);
    const scheduleTitle = feedback === 'correct' ? '次はいつ出す？' : 'もう一度出すタイミングを選ぼう';
    const scheduleHint = feedback === 'correct'
        ? '覚えているうちに少し先まで飛ばせるよ。'
        : '忘れ切る前にもう一度当てると定着しやすい。';
    const reviewFaceAccent = feedback === 'incorrect' || persistentEmotion === 'angry'
        ? null
        : feedback === 'correct' || correctStreak >= 2 || persistentEmotion === 'happy'
            ? 'heart'
            : correctStreak === 1 || persistentEmotion === 'smile'
                ? 'star'
                : null;
    const visibleReviewFaceAccent = renderer === 'live2d' ? null : reviewFaceAccent;
    let poseEmotion;
    if (feedback === 'incorrect' || persistentEmotion === 'angry') {
        poseEmotion = 'angry';
    } else if (feedback === 'correct' || correctStreak >= 2 || persistentEmotion === 'happy') {
        poseEmotion = 'correct';
    } else if (reviewFaceAccent === 'star') {
        poseEmotion = renderer === 'live2d' ? 'smile' : 'happy';
    } else if (renderer === 'live2d') {
        poseEmotion = 'normal';
    } else if ((currentQuestion?.wrongCount || 0) >= 3) {
        poseEmotion = 'serious';
    } else if (priority === 'urgent') {
        poseEmotion = 'surprised';
    } else {
        poseEmotion = 'relaxed';
    }
    const characterPose = {
        emotion: poseEmotion,
        expression: feedback === 'correct' ? 'correct' : poseEmotion,
        scene: 'review',
        intensity: feedback
            ? feedback === 'correct' ? 0.74 : 0.46
            : (currentQuestion?.wrongCount || 0) >= 3 ? 0.42 : priority === 'urgent' ? 0.4 : 0.32,
        motion: null,
        idle: 'gentle',
        gaze: 'camera',
        speaking: feedback === 'correct',
        text: '',
        effect: feedback === 'correct' ? 'glow' : feedback === 'incorrect' ? 'shake' : '',
        live2dEmotion: feedback === 'correct' ? 'correct' : '',
        live2dFaceAccent: reviewFaceAccent,
    };
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

        audio.volume = 0.75;
        audio.play().catch(() => { });
    }, [getChainAudioSrc, isMuted]);

    const handleNextQuestion = () => {
        if (currentIndex + 1 < sessionQuestions.length) {
            // Next question
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setFeedback(null);
            setInputValue('');
            setScheduleChoices([]);
            setSelectedScheduleKey(null);
        } else {
            // Quiz complete
            setTimeout(() => {
                // Show completion screen
                setIsCompleted(true);
            }, 500);
        }
    };

    const handleScheduleSelect = (scheduleChoice) => {
        if (!currentQuestion || !feedback || !scheduleChoice || selectedScheduleKey) return;

        const isCorrect = feedback === 'correct';
        setSelectedScheduleKey(scheduleChoice.key);
        updateReviewResult(currentQuestion.id, isCorrect, scheduleChoice);
        setResults(prev => [...prev, {
            questionId: currentQuestion.id,
            isCorrect
        }]);
        handleNextQuestion();
    };

    const handleAnswerSelect = (answer) => {
        if (feedback) return; // Already answered

        setSelectedAnswer(answer);
        const isCorrect = answer === currentQuestion.correctAnswer;

        setFeedback(isCorrect ? 'correct' : 'incorrect');
        setScheduleChoices(getReviewScheduleChoices(currentQuestion, isCorrect));
        setSelectedScheduleKey(null);
        setCorrectStreak((prev) => {
            const nextStreak = isCorrect ? prev + 1 : 0;
            setPersistentEmotion(isCorrect ? (nextStreak >= 2 ? 'happy' : 'smile') : 'angry');

            if (isCorrect) {
                playSE('se_correct');
                playUiTone(880, 170, { type: 'sine', gain: 0.028 });
                if (nextStreak >= 2) {
                    playChainVoiceClip(Math.min(nextStreak, 5));
                }
            } else {
                playUiTone(182, 180, { type: 'sawtooth', gain: 0.022 });
                playUiTone(146, 240, { type: 'triangle', gain: 0.016, delayMs: 80 });
            }

            return nextStreak;
        });
    };

    const handleInputSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Simple normalization for answer check
        const normalizedInput = inputValue.trim().toLowerCase();
        const normalizedCorrect = currentQuestion.correctAnswer.toLowerCase();

        const isCorrect = normalizedInput === normalizedCorrect;

        // If correct, pass the input. If wrong, pass 'wrong' to differentiate but logic handles boolean
        // Actually handleAnswerSelect expects 'answer' string, but logic uses it to compare.
        // We can just pass the input value and let the logic decide based on comparison result we calculate here?
        // No, let's reuse handleAnswerSelect logic but we need to pass the answer that matches/mismatches properly?
        // Wait, handleAnswerSelect compares `answer === currentQuestion.correctAnswer`.

        // If user input matches, call with correctAnswer. If not, call with input value.
        handleAnswerSelect(isCorrect ? currentQuestion.correctAnswer : inputValue.trim());
    };

    const correctCount = results.filter(r => r.isCorrect).length;
    const incorrectRetryQuestions = useMemo(() => {
        const wrongIds = new Set(results.filter((result) => !result.isCorrect).map((result) => result.questionId));
        return sessionQuestions.filter((question) => wrongIds.has(question.id));
    }, [results, sessionQuestions]);

    const restartQuiz = (nextQuestions) => {
        setSessionQuestions(nextQuestions);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setFeedback(null);
        setResults([]);
        setIsCompleted(false);
        setInputValue('');
        setScheduleChoices([]);
        setSelectedScheduleKey(null);
        setCorrectStreak(0);
        setPersistentEmotion(null);
    };

    const renderScheduleContent = () => {
        if (!feedback) return null;

        return (
            <div className="review-answer-result">
                <div className={`review-feedback-banner ${feedback === 'correct' ? 'is-correct' : 'is-incorrect'}`}>
                    {feedback === 'correct' ? '正解！' : '惜しい、ここで拾い直そう。'}
                </div>
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

                <div className="review-schedule-panel">
                    <div className="review-schedule-copy">
                        <strong>{scheduleTitle}</strong>
                        <span>{scheduleHint}</span>
                    </div>
                    <div className="review-schedule-grid">
                        {scheduleChoices.map((choice) => (
                            <button
                                key={choice.key}
                                type="button"
                                className={`review-schedule-btn ${choice.recommended ? 'is-recommended' : ''} ${choice.complete ? 'is-complete' : ''}`}
                                onClick={() => handleScheduleSelect(choice)}
                                disabled={Boolean(selectedScheduleKey)}
                            >
                                <span className="review-schedule-label">{choice.label}</span>
                                <span className="review-schedule-meta">
                                    {choice.description || (choice.nextReviewDate ? formatRelativeDate(choice.nextReviewDate) : 'リストから外す')}
                                </span>
                                {choice.recommended && (
                                    <span className="review-schedule-recommend">おすすめ</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
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
                    <button className="finish-btn" onClick={() => onComplete({ results, completed: false })}>
                        復習リストに戻る
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
                            </div>
                            {rewardSummary.bonusLabels?.length > 0 && (
                                <div className="completion-bonus-row">
                                    {rewardSummary.bonusLabels.map((label) => (
                                        <div key={label} className="completion-bonus-chip">{label}</div>
                                    ))}
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
                    <button className="finish-btn" onClick={() => onComplete({ results, completed: true })}>
                        復習リストに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`mp-screen mp-playing-screen review-quiz-screen review-mood-${sceneMood}`}>
            <div
                className="mp-background"
                style={{ backgroundImage: `url(${BgClassroom})`, opacity: 0.72 }}
            />

            <div className="review-topbar review-topbar-plain">
                <button className="quiz-back-btn" onClick={() => onComplete({ results, completed: false })}>
                    <ChevronLeft size={18} />
                    戻る
                </button>
            </div>

            <div className={`mp-character-area ${renderer === 'live2d' ? 'is-live2d' : ''}`}>
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
            </div>

            <div className="mp-playing-content-wrapper review-playing-content">
                <div className="mp-question-container review-question-container">
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
                            {formatReviewLevel(currentQuestion.reviewLevel)}
                        </div>
                        <div className="mp-question-pill">
                            <Flame size={14} />
                            ミス {currentQuestion.wrongCount}回
                        </div>
                    </div>

                    <div className="mp-question-card review-question-card">
                        <div className="review-question-subject">{currentQuestion.subject}</div>
                        <div className="mp-question-word review-question-word">
                            {currentQuestion.questionText}
                        </div>
                        <p className="mp-question-hint review-question-hint">
                            {currentQuestion.options ? '正しい答えを選ぼう' : '答えを入力しよう'}
                        </p>
                        <div className="review-question-subhint">
                            復習期限: {formatRelativeDate(currentQuestion.nextReviewDate)}
                        </div>
                    </div>
                    {showIncorrectFeedback && (
                        <div className="review-answer-panel review-answer-panel-inline review-answer-panel-floating">
                            {renderScheduleContent()}
                        </div>
                    )}
                </div>

                <div className={`mp-bottom-area review-bottom-area ${isAwaitingSchedule ? 'has-incorrect-feedback' : ''}`}>
                    {currentQuestion.options ? (
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
                                    {renderScheduleContent()}
                                </div>
                            )}
                        </>
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
                                renderScheduleContent()
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewQuiz;
