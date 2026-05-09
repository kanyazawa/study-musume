import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TUTORIAL_BACKGROUND_IMAGE,
    TUTORIAL_CHARACTERS,
    TUTORIAL_EVENT_LINES,
    TUTORIAL_GACHA_RESULTS,
    TUTORIAL_HOME_LINE,
    TUTORIAL_OPENING_LINES,
    TUTORIAL_QUIZ_QUESTIONS,
    TUTORIAL_QUIZ_REWARDS,
} from '../data/tutorialData';
import {
    TUTORIAL_STEPS,
    clearTutorialProgress,
    getDefaultTutorialProgress,
    loadTutorialProgress,
    saveTutorialProgress,
} from '../utils/tutorialStorage';
import './Tutorial.css';

const STEP_LABELS = {
    [TUTORIAL_STEPS.OPENING]: '出会い',
    [TUTORIAL_STEPS.CHARACTER]: '推し選択',
    [TUTORIAL_STEPS.QUIZ]: '英単語クイズ',
    [TUTORIAL_STEPS.RESULT]: '結果',
    [TUTORIAL_STEPS.GACHA]: '初回ガチャ',
    [TUTORIAL_STEPS.EVENT]: 'ミニイベント',
};

const TOTAL_STEPS = Object.keys(STEP_LABELS).length;

const buildInventoryEntries = (results = []) => {
    const inventoryMap = new Map();

    results.forEach((item) => {
        const current = inventoryMap.get(item.name);
        if (current) {
            inventoryMap.set(item.name, {
                ...current,
                quantity: current.quantity + 1,
            });
            return;
        }

        inventoryMap.set(item.name, {
            itemId: item.id,
            name: item.name,
            rarity: item.rarity,
            type: item.type,
            emoji: item.emoji,
            description: item.description,
            quantity: 1,
        });
    });

    return Array.from(inventoryMap.values());
};

const mergeInventoryEntries = (existing = [], incoming = []) => {
    const inventoryMap = new Map();

    [...existing, ...incoming].forEach((item) => {
        const key = item.itemId || item.name;
        const current = inventoryMap.get(key);
        if (current) {
            inventoryMap.set(key, {
                ...current,
                quantity: Number(current.quantity || 0) + Number(item.quantity || 0),
            });
            return;
        }

        inventoryMap.set(key, {
            ...item,
            quantity: Number(item.quantity || 0) || 1,
        });
    });

    return Array.from(inventoryMap.values());
};

const getStepIndex = (step) => {
    const stepIds = Object.keys(STEP_LABELS);
    const index = stepIds.indexOf(step);
    return index >= 0 ? index + 1 : 1;
};

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
            favoriteCharacter: null,
            inventory: [],
            ownedItems: [],
            tutorialCompleted: false,
            tutorialHomeVariant: null,
            hasSelectedCharacter: false,
            characterId: 'noah',
            needsFirstPlayIntro: false,
            hasCompletedFirstPlayIntro: true,
        }));

        persistProgress((currentProgress) => ({
            ...currentProgress,
            initializedStats: true,
        }));
    }, [persistProgress, progress.initializedStats, updateStats]);

    const selectedCharacter = useMemo(
        () => TUTORIAL_CHARACTERS.find((character) => character.id === progress.selectedCharacterId) || TUTORIAL_CHARACTERS[0],
        [progress.selectedCharacterId],
    );
    const currentQuestion = TUTORIAL_QUIZ_QUESTIONS[progress.quizIndex] || TUTORIAL_QUIZ_QUESTIONS[TUTORIAL_QUIZ_QUESTIONS.length - 1];
    const currentEventLine = TUTORIAL_EVENT_LINES[progress.eventLineIndex] || TUTORIAL_EVENT_LINES[TUTORIAL_EVENT_LINES.length - 1];
    const gems = Number(stats?.diamonds || 0);
    const affection = Number(stats?.affection || 0);

    const handleMoveToCharacterStep = () => {
        persistProgress((currentProgress) => ({
            ...currentProgress,
            step: TUTORIAL_STEPS.CHARACTER,
        }));
    };

    const handleCharacterChoice = (characterId) => {
        persistProgress((currentProgress) => ({
            ...currentProgress,
            selectedCharacterId: characterId,
        }));
    };

    const handleCharacterConfirm = () => {
        if (!progress.selectedCharacterId) {
            return;
        }

        updateStats?.((currentStats) => ({
            ...currentStats,
            favoriteCharacter: progress.selectedCharacterId,
            hasSelectedCharacter: true,
            characterId: 'noah',
        }));

        persistProgress((currentProgress) => ({
            ...currentProgress,
            step: TUTORIAL_STEPS.QUIZ,
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

        if (!progress.bonusGemsAwarded) {
            updateStats?.((currentStats) => ({
                ...currentStats,
                diamonds: Math.max(0, Number(currentStats?.diamonds || 0)) + TUTORIAL_QUIZ_REWARDS.resultBonusGems,
            }));
        }

        persistProgress((currentProgress) => ({
            ...currentProgress,
            step: TUTORIAL_STEPS.RESULT,
            pendingQuizResult: null,
            bonusGemsAwarded: currentProgress.bonusGemsAwarded || TUTORIAL_QUIZ_REWARDS.resultBonusGems,
        }));
    };

    const handleMoveToGacha = () => {
        persistProgress((currentProgress) => ({
            ...currentProgress,
            step: TUTORIAL_STEPS.GACHA,
        }));
    };

    const handleDrawTutorialGacha = () => {
        if (progress.gachaDrawn) {
            return;
        }

        const inventoryEntries = buildInventoryEntries(TUTORIAL_GACHA_RESULTS);

        updateStats?.((currentStats) => {
            const mergedInventory = mergeInventoryEntries(currentStats?.inventory || [], inventoryEntries);

            return {
                ...currentStats,
                inventory: mergedInventory,
                ownedItems: mergedInventory,
            };
        });

        persistProgress((currentProgress) => ({
            ...currentProgress,
            gachaDrawn: true,
            gachaResults: TUTORIAL_GACHA_RESULTS,
        }));
    };

    const handleMoveToEvent = () => {
        persistProgress((currentProgress) => ({
            ...currentProgress,
            step: TUTORIAL_STEPS.EVENT,
        }));
    };

    const completeTutorial = () => {
        updateStats?.((currentStats) => ({
            ...currentStats,
            tutorialCompleted: true,
            tutorialHomeVariant: null,
            favoriteCharacter: progress.selectedCharacterId || currentStats?.favoriteCharacter || 'noah',
            hasSelectedCharacter: true,
            characterId: 'noah',
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

    const stepIndex = getStepIndex(progress.step);
    const totalGemsDisplay = progress.gemsEarned + progress.bonusGemsAwarded;
    const progressLabel = STEP_LABELS[progress.step] || STEP_LABELS[TUTORIAL_STEPS.OPENING];

    return (
        <div className="tutorial-screen" style={{ '--tutorial-bg-image': `url(${TUTORIAL_BACKGROUND_IMAGE})` }}>
            <div className="tutorial-backdrop" />
            <div className="tutorial-shell">
                <header className="tutorial-status-card">
                    <div>
                        <p className="tutorial-kicker">First Meeting</p>
                        <h1>はじめての学習体験</h1>
                    </div>
                    <div className="tutorial-badges">
                        <span>{stepIndex} / {TOTAL_STEPS}</span>
                        <span>{progressLabel}</span>
                    </div>
                </header>

                <section className="tutorial-stage-card">
                    {progress.step === TUTORIAL_STEPS.OPENING && (
                        <div className="tutorial-panel tutorial-opening">
                            <div className="tutorial-portrait-wrap">
                                <img className="tutorial-main-portrait" src={TUTORIAL_CHARACTERS[0].image} alt="ノア" />
                            </div>
                            <div className="tutorial-dialogue-card">
                                <p>ノア</p>
                                {TUTORIAL_OPENING_LINES.map((line) => (
                                    <p key={line} className="tutorial-line">「{line}」</p>
                                ))}
                                <button type="button" className="tutorial-primary-btn" onClick={handleMoveToCharacterStep}>
                                    はじめる
                                </button>
                            </div>
                        </div>
                    )}

                    {progress.step === TUTORIAL_STEPS.CHARACTER && (
                        <div className="tutorial-panel">
                            <div className="tutorial-section-head">
                                <p className="tutorial-kicker">Favorite</p>
                                <h2>推しを選ぶ</h2>
                                <p>最初の3人から1人だけ選べます。選んだ推しは `favoriteCharacter` に保存されます。</p>
                            </div>

                            <div className="tutorial-character-grid">
                                {TUTORIAL_CHARACTERS.map((character) => (
                                    <button
                                        key={character.id}
                                        type="button"
                                        className={`tutorial-character-card ${progress.selectedCharacterId === character.id ? 'is-selected' : ''}`}
                                        onClick={() => handleCharacterChoice(character.id)}
                                    >
                                        <img src={character.image} alt={character.name} className="tutorial-character-image" />
                                        <div className="tutorial-character-copy">
                                            <strong>{character.name}</strong>
                                            <span>{character.archetype}</span>
                                            <p>{character.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="tutorial-primary-btn"
                                onClick={handleCharacterConfirm}
                                disabled={!progress.selectedCharacterId}
                            >
                                この子と始める
                            </button>
                        </div>
                    )}

                    {progress.step === TUTORIAL_STEPS.QUIZ && (
                        <div className="tutorial-panel">
                            <div className="tutorial-section-head">
                                <p className="tutorial-kicker">Quiz</p>
                                <h2>やさしい英単語クイズ</h2>
                                <p>{progress.quizIndex + 1} / {TUTORIAL_QUIZ_QUESTIONS.length} 問目</p>
                            </div>

                            <div className="tutorial-quiz-card">
                                <div className="tutorial-quiz-word">{currentQuestion.prompt}</div>
                                <div className="tutorial-choice-grid">
                                    {currentQuestion.choices.map((choice, index) => {
                                        const isAnswered = Boolean(progress.pendingQuizResult);
                                        const isSelected = progress.pendingQuizResult?.selectedIndex === index;
                                        const isCorrect = currentQuestion.correctIndex === index;

                                        return (
                                            <button
                                                key={choice}
                                                type="button"
                                                className={[
                                                    'tutorial-choice-btn',
                                                    isAnswered && isCorrect ? 'is-correct' : '',
                                                    isAnswered && isSelected && !isCorrect ? 'is-incorrect' : '',
                                                ].join(' ').trim()}
                                                disabled={isAnswered}
                                                onClick={() => handleQuizAnswer(index)}
                                            >
                                                {choice}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="tutorial-reward-strip">
                                <span>好感度 {affection}</span>
                                <span>ジェム {gems}</span>
                            </div>

                            {progress.pendingQuizResult && (
                                <div className="tutorial-feedback-card">
                                    <p className="tutorial-feedback-speaker">ノア</p>
                                    <p className="tutorial-line">「{progress.pendingQuizResult.line}」</p>
                                    <p className="tutorial-feedback-reward">
                                        {progress.pendingQuizResult.affection > 0 && `好感度 +${progress.pendingQuizResult.affection} `}
                                        ジェム +{progress.pendingQuizResult.gems}
                                    </p>
                                    <button type="button" className="tutorial-primary-btn" onClick={handleAdvanceQuiz}>
                                        {progress.quizIndex === TUTORIAL_QUIZ_QUESTIONS.length - 1 ? '結果を見る' : '次の問題へ'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {progress.step === TUTORIAL_STEPS.RESULT && (
                        <div className="tutorial-panel">
                            <div className="tutorial-section-head">
                                <p className="tutorial-kicker">Result</p>
                                <h2>初回結果</h2>
                            </div>

                            <div className="tutorial-summary-grid">
                                <div className="tutorial-summary-card">
                                    <span>正解数</span>
                                    <strong>{progress.correctCount} / {TUTORIAL_QUIZ_QUESTIONS.length}</strong>
                                </div>
                                <div className="tutorial-summary-card">
                                    <span>獲得好感度</span>
                                    <strong>+{progress.affectionEarned}</strong>
                                </div>
                                <div className="tutorial-summary-card">
                                    <span>獲得ジェム</span>
                                    <strong>+{progress.gemsEarned}</strong>
                                </div>
                                <div className="tutorial-summary-card is-bonus">
                                    <span>初回ボーナス</span>
                                    <strong>+{progress.bonusGemsAwarded}</strong>
                                </div>
                            </div>

                            <div className="tutorial-dialogue-card compact">
                                <p>ノア</p>
                                <p className="tutorial-line">「初回にしては悪くないじゃん」</p>
                                <p className="tutorial-line">「…特別に、10連引かせてあげる」</p>
                            </div>

                            <div className="tutorial-reward-strip">
                                <span>合計好感度 {affection}</span>
                                <span>合計ジェム {totalGemsDisplay}</span>
                            </div>

                            <button type="button" className="tutorial-primary-btn" onClick={handleMoveToGacha}>
                                10連ガチャへ
                            </button>
                        </div>
                    )}

                    {progress.step === TUTORIAL_STEPS.GACHA && (
                        <div className="tutorial-panel">
                            <div className="tutorial-section-head">
                                <p className="tutorial-kicker">Gacha</p>
                                <h2>初回10連ガチャ</h2>
                                <p>初回10連は SSR 1枚確定です。</p>
                            </div>

                            {!progress.gachaDrawn && (
                                <div className="tutorial-dialogue-card compact">
                                    <p>ノア</p>
                                    <p className="tutorial-line">「今日はここまでやったんだし、ごほうびくらいあってもいいでしょ」</p>
                                    <button type="button" className="tutorial-primary-btn" onClick={handleDrawTutorialGacha}>
                                        無料で10連を引く
                                    </button>
                                </div>
                            )}

                            {progress.gachaDrawn && (
                                <>
                                    <div className="tutorial-gacha-grid">
                                        {progress.gachaResults.map((item, index) => (
                                            <article
                                                key={`${item.id}-${index}`}
                                                className={`tutorial-gacha-card rarity-${item.rarity} ${item.rarity === 'SSR' ? 'is-ssr' : ''}`}
                                            >
                                                <span className="tutorial-gacha-rarity">{item.rarity}</span>
                                                <div className="tutorial-gacha-emoji">{item.emoji}</div>
                                                <strong>{item.name}</strong>
                                                <p>{item.description}</p>
                                            </article>
                                        ))}
                                    </div>

                                    <button type="button" className="tutorial-primary-btn" onClick={handleMoveToEvent}>
                                        イベントを見る
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {progress.step === TUTORIAL_STEPS.EVENT && (
                        <div className="tutorial-panel tutorial-event">
                            <div className="tutorial-portrait-wrap">
                                <img className="tutorial-main-portrait" src={TUTORIAL_CHARACTERS[0].image} alt="ノア" />
                            </div>
                            <div className="tutorial-dialogue-card">
                                <p>ノア</p>
                                <p className="tutorial-line">「{currentEventLine}」</p>
                                <div className="tutorial-reward-strip">
                                    <span>推し: {selectedCharacter.name}</span>
                                    <span>{TUTORIAL_HOME_LINE}</span>
                                </div>
                                <button type="button" className="tutorial-primary-btn" onClick={handleAdvanceEvent}>
                                    {progress.eventLineIndex === TUTORIAL_EVENT_LINES.length - 1 ? 'ホームへ' : '次へ'}
                                </button>
                            </div>
                        </div>
                    )}
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
