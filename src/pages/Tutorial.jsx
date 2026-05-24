import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterStage from '../components/character/CharacterStage';
import {
    TUTORIAL_BACKGROUND_IMAGE,
    TUTORIAL_CHARACTERS,
    TUTORIAL_EVENT_LINES,
    TUTORIAL_HOME_LINE,
    TUTORIAL_OPENING_LINES,
    TUTORIAL_QUIZ_QUESTIONS,
    TUTORIAL_QUIZ_REWARDS,
    TUTORIAL_RESULT_LINES,
} from '../data/tutorialData';
import {
    TUTORIAL_STEPS,
    clearTutorialProgress,
    getDefaultTutorialProgress,
    loadTutorialProgress,
    saveTutorialProgress,
} from '../utils/tutorialStorage';
import './Tutorial.css';

const Tutorial = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(() => loadTutorialProgress());

    const persistProgress = useCallback((updates) => {
        setProgress((currentProgress) => {
            const nextProgress = typeof updates === 'function'
                ? updates(currentProgress)
                : updates;
            return saveTutorialProgress(nextProgress);
        });
    }, []);

    useEffect(() => {
        if (progress.initializedStats) {
            return;
        }

        updateStats?.((currentStats) => ({
            ...currentStats,
            affection: 0,
            diamonds: 0,
            favoriteCharacter: 'emma',
            selectedHeroineId: 'emma',
            inventory: [],
            ownedItems: [],
            tutorialCompleted: false,
            tutorialHomeVariant: 'emma-mvp',
            hasSelectedCharacter: true,
            characterId: 'emma',
            characterRenderer: 'image',
            equippedSkin: 'default',
            needsFirstPlayIntro: false,
            hasCompletedFirstPlayIntro: true,
        }));

        persistProgress((currentProgress) => ({
            ...currentProgress,
            initializedStats: true,
        }));
    }, [persistProgress, progress.initializedStats, updateStats]);

    const selectedCharacter = useMemo(
        () => TUTORIAL_CHARACTERS[0],
        [],
    );
    const currentQuestion = TUTORIAL_QUIZ_QUESTIONS[progress.quizIndex] || TUTORIAL_QUIZ_QUESTIONS[TUTORIAL_QUIZ_QUESTIONS.length - 1];
    const currentOpeningLine = TUTORIAL_OPENING_LINES[progress.openingLineIndex] || TUTORIAL_OPENING_LINES[TUTORIAL_OPENING_LINES.length - 1];
    const currentResultLine = TUTORIAL_RESULT_LINES[progress.resultLineIndex] || TUTORIAL_RESULT_LINES[TUTORIAL_RESULT_LINES.length - 1];
    const currentEventLine = TUTORIAL_EVENT_LINES[progress.eventLineIndex] || TUTORIAL_EVENT_LINES[TUTORIAL_EVENT_LINES.length - 1];
    const hasPendingQuizResult = Boolean(progress.pendingQuizResult);
    const scenePhaseClass = progress.step === TUTORIAL_STEPS.QUIZ
        ? 'is-quiz'
        : progress.step === TUTORIAL_STEPS.RESULT
            ? 'is-result'
            : progress.step === TUTORIAL_STEPS.EVENT
                ? 'is-event'
                : 'is-opening';
    const dialogueLine = progress.step === TUTORIAL_STEPS.OPENING
        ? currentOpeningLine
        : progress.step === TUTORIAL_STEPS.QUIZ
            ? (hasPendingQuizResult ? progress.pendingQuizResult.line : (currentQuestion.lessonHint || '今の理解で答えてみて。'))
            : progress.step === TUTORIAL_STEPS.RESULT
                ? currentResultLine
                : currentEventLine;

    const handleAdvanceOpening = () => {
        const isLastLine = progress.openingLineIndex >= TUTORIAL_OPENING_LINES.length - 1;
        if (isLastLine) {
            persistProgress((currentProgress) => ({
                ...currentProgress,
                step: TUTORIAL_STEPS.QUIZ,
            }));
            return;
        }

        persistProgress((currentProgress) => ({
            ...currentProgress,
            openingLineIndex: currentProgress.openingLineIndex + 1,
        }));
    };

    const handleQuizAnswer = (choiceIndex) => {
        if (progress.pendingQuizResult) {
            return;
        }

        const isCorrect = choiceIndex === currentQuestion.correctIndex;
        const reward = isCorrect ? TUTORIAL_QUIZ_REWARDS.correct : TUTORIAL_QUIZ_REWARDS.incorrect;

        updateStats?.((currentStats) => ({
            ...currentStats,
            affection: Math.max(0, Number(currentStats?.affection || 0)) + reward.affection,
            diamonds: Math.max(0, Number(currentStats?.diamonds || 0)) + reward.gems,
        }));

        persistProgress((currentProgress) => ({
            ...currentProgress,
            correctCount: currentProgress.correctCount + (isCorrect ? 1 : 0),
            affectionEarned: currentProgress.affectionEarned + reward.affection,
            gemsEarned: currentProgress.gemsEarned + reward.gems,
            quizAnswers: [
                ...currentProgress.quizAnswers,
                {
                    questionId: currentQuestion.id,
                    selectedIndex: choiceIndex,
                    isCorrect,
                },
            ],
            pendingQuizResult: {
                selectedIndex: choiceIndex,
                isCorrect,
                line: reward.line,
                affection: reward.affection,
                gems: reward.gems,
            },
        }));
    };

    const handleAdvanceQuiz = () => {
        if (!progress.pendingQuizResult) {
            return;
        }

        const isLastQuestion = progress.quizIndex >= TUTORIAL_QUIZ_QUESTIONS.length - 1;
        if (!isLastQuestion) {
            persistProgress((currentProgress) => ({
                ...currentProgress,
                quizIndex: currentProgress.quizIndex + 1,
                pendingQuizResult: null,
            }));
            return;
        }

        persistProgress((currentProgress) => ({
            ...currentProgress,
            step: TUTORIAL_STEPS.RESULT,
            pendingQuizResult: null,
            resultLineIndex: 0,
        }));
    };

    const handleAdvanceResult = () => {
        const isLastLine = progress.resultLineIndex >= TUTORIAL_RESULT_LINES.length - 1;
        if (isLastLine) {
            persistProgress((currentProgress) => ({
                ...currentProgress,
                step: TUTORIAL_STEPS.EVENT,
            }));
            return;
        }

        persistProgress((currentProgress) => ({
            ...currentProgress,
            resultLineIndex: currentProgress.resultLineIndex + 1,
        }));
    };

    const completeTutorial = () => {
        updateStats?.((currentStats) => ({
            ...currentStats,
            tutorialCompleted: true,
            tutorialHomeVariant: 'emma-mvp',
            favoriteCharacter: 'emma',
            selectedHeroineId: 'emma',
            hasSelectedCharacter: true,
            characterId: 'emma',
            characterRenderer: 'image',
            equippedSkin: 'default',
            needsFirstPlayIntro: false,
            hasCompletedFirstPlayIntro: true,
        }));

        clearTutorialProgress();
        navigate('/home', { replace: true });
    };

    const handleAdvanceEvent = () => {
        const isLastLine = progress.eventLineIndex >= TUTORIAL_EVENT_LINES.length - 1;
        if (isLastLine) {
            completeTutorial();
            return;
        }

        persistProgress((currentProgress) => ({
            ...currentProgress,
            eventLineIndex: currentProgress.eventLineIndex + 1,
        }));
    };

    return (
        <div className="tutorial-screen" style={{ '--tutorial-bg-image': `url(${TUTORIAL_BACKGROUND_IMAGE})` }}>
            <div className="tutorial-backdrop" />
            <div className="tutorial-shell">
                <section className="tutorial-scene">
                    <div className={`tutorial-scene-top ${scenePhaseClass}`}>
                        <div className="tutorial-stage-visual">
                            <div className="tutorial-stage-glow" />
                            <div className="tutorial-stage-floor" />
                            <div className="tutorial-stage-character">
                                <CharacterStage
                                    characterId="emma"
                                    renderer="image"
                                    skinId="default"
                                    scene="preview"
                                    pose={{ emotion: 'normal', expression: 'normal', idleMotion: 'subtle' }}
                                    className="tutorial-character-renderer"
                                    imageClassName="tutorial-stage-character-image"
                                    alt={selectedCharacter.name}
                                />
                            </div>
                        </div>

                        {progress.step === TUTORIAL_STEPS.QUIZ && (
                            <div className="tutorial-lesson-board">
                                <div className="tutorial-lesson-board-copy">
                                    <span className="tutorial-lesson-kicker">{currentQuestion.lessonTitle || 'Grammar'}</span>
                                    <h2>{currentQuestion.prompt}</h2>
                                    <p>空欄に入る形をひとつ選んでね。</p>
                                </div>
                                <div className="tutorial-choice-grid">
                                    {currentQuestion.choices.map((choice, index) => {
                                        const isSelected = progress.pendingQuizResult?.selectedIndex === index;
                                        const isCorrect = currentQuestion.correctIndex === index;

                                        return (
                                            <button
                                                key={choice}
                                                type="button"
                                                className={[
                                                    'tutorial-choice-btn',
                                                    hasPendingQuizResult && isCorrect ? 'is-correct' : '',
                                                    hasPendingQuizResult && isSelected && !isCorrect ? 'is-incorrect' : '',
                                                ].join(' ').trim()}
                                                disabled={hasPendingQuizResult}
                                                onClick={() => handleQuizAnswer(index)}
                                            >
                                                <span className="tutorial-choice-index">{index + 1}</span>
                                                <strong>{choice}</strong>
                                            </button>
                                        );
                                    })}
                                </div>
                                {progress.pendingQuizResult && (
                                    <div className="tutorial-lesson-reward">
                                        {progress.pendingQuizResult.affection > 0 && <span>好感度 +{progress.pendingQuizResult.affection}</span>}
                                        <span>ジェム +{progress.pendingQuizResult.gems}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {progress.step === TUTORIAL_STEPS.RESULT && (
                            <div className="tutorial-result-ribbon">
                                <div className="tutorial-result-card">
                                    <span>正解数</span>
                                    <strong>{progress.correctCount} / {TUTORIAL_QUIZ_QUESTIONS.length}</strong>
                                </div>
                                <div className="tutorial-result-card">
                                    <span>獲得好感度</span>
                                    <strong>+{progress.affectionEarned}</strong>
                                </div>
                                <div className="tutorial-result-card">
                                    <span>獲得ジェム</span>
                                    <strong>+{progress.gemsEarned}</strong>
                                </div>
                                <div className="tutorial-result-card tutorial-result-card--accent">
                                    <span>次の約束</span>
                                    <strong>放課後の続き</strong>
                                </div>
                            </div>
                        )}

                        <div className="tutorial-dialogue-box">
                            <div className="tutorial-name-tag">{selectedCharacter.name}</div>
                            <p className="tutorial-dialogue-text">「{dialogueLine}」</p>

                            {progress.step === TUTORIAL_STEPS.QUIZ && hasPendingQuizResult && (
                                <p className="tutorial-dialogue-reward">
                                    {progress.pendingQuizResult.affection > 0 && `好感度 +${progress.pendingQuizResult.affection} / `}
                                    ジェム +{progress.pendingQuizResult.gems}
                                </p>
                            )}

                            {progress.step === TUTORIAL_STEPS.EVENT && (
                                <div className="tutorial-home-preview">
                                    <span>Home Preview</span>
                                    <strong>{TUTORIAL_HOME_LINE}</strong>
                                </div>
                            )}

                            <div className="tutorial-dialogue-actions">
                                {progress.step === TUTORIAL_STEPS.OPENING && (
                                    <button type="button" className="tutorial-primary-btn" onClick={handleAdvanceOpening}>
                                        {progress.openingLineIndex === TUTORIAL_OPENING_LINES.length - 1 ? '学習を始める' : '次へ'}
                                    </button>
                                )}

                                {progress.step === TUTORIAL_STEPS.QUIZ && hasPendingQuizResult && (
                                    <button type="button" className="tutorial-primary-btn" onClick={handleAdvanceQuiz}>
                                        {progress.quizIndex === TUTORIAL_QUIZ_QUESTIONS.length - 1 ? '結果を見る' : '次の問題へ'}
                                    </button>
                                )}

                                {progress.step === TUTORIAL_STEPS.RESULT && (
                                    <button type="button" className="tutorial-primary-btn" onClick={handleAdvanceResult}>
                                        {progress.resultLineIndex === TUTORIAL_RESULT_LINES.length - 1 ? '次の約束へ' : '次へ'}
                                    </button>
                                )}

                                {progress.step === TUTORIAL_STEPS.EVENT && (
                                    <button type="button" className="tutorial-primary-btn" onClick={handleAdvanceEvent}>
                                        {progress.eventLineIndex === TUTORIAL_EVENT_LINES.length - 1 ? 'ホームへ' : '次へ'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export const resetTutorialProgressForDebug = () => {
    clearTutorialProgress();
    return getDefaultTutorialProgress();
};

export default Tutorial;
