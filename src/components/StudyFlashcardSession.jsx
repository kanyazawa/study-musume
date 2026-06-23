import React, { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import BgClassroom from '../assets/images/bg_classroom.webp';
import CharacterStage from './character/CharacterStage';
import SceneStageLayout from './layout/SceneStageLayout';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import './StudyFlashcardSession.css';

const StudyFlashcardSession = ({
    cards = [],
    title = 'フラッシュカード',
    subtitle = '',
    emptyTitle = 'カードがありません',
    emptyMessage = 'このセットには表示できるカードがありません。',
    exitLabel = '戻る',
    completionTitle = 'フラッシュカード完了',
    completionMessage = 'このセットはここで一区切りです。',
    getChoices,
    onApplyChoice,
    onComplete,
    characterId = 'noah',
    skinId = 'default',
    preferredRenderer = 'auto',
    characterScene = 'review',
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);
    const [results, setResults] = useState([]);
    const [isApplyingChoice, setIsApplyingChoice] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const currentCard = cards[currentIndex] || null;
    const scheduleChoices = useMemo(
        () => (currentCard && typeof getChoices === 'function' ? getChoices(currentCard) : []),
        [currentCard, getChoices]
    );
    const correctCount = results.filter((result) => result.isCorrect).length;
    const renderer = resolveCharacterRenderer({
        preferredRenderer,
        characterId,
        skinId,
    });
    const isLive2D = renderer === 'live2d';

    const finishSession = (completed) => {
        onComplete?.({
            results,
            completed,
            maxCorrectStreak: 0,
        });
    };

    const renderCharacter = () => (
        <CharacterStage
            characterId={characterId}
            renderer={renderer}
            skinId={skinId}
            scene={characterScene}
            className="study-flashcard-character-stage"
            imageClassName="study-flashcard-character"
            alt="Study Character"
        />
    );

    const renderSceneShell = (content, rootStateClass = '') => (
        <SceneStageLayout
            rootClassName={`study-flashcard-screen ${rootStateClass}`.trim()}
            backgroundClassName="study-flashcard-background"
            backgroundStyle={{ backgroundImage: `url(${BgClassroom})` }}
            characterLayerClassName={`study-flashcard-character-layer ${isLive2D ? 'is-live2d' : ''}`}
            character={renderCharacter()}
            afterCharacter={<div className="study-flashcard-scene-shade" aria-hidden="true" />}
        >
            {content}
        </SceneStageLayout>
    );

    const handleChoiceSelect = async (choice) => {
        if (!currentCard || isApplyingChoice) return;

        setIsApplyingChoice(true);

        try {
            const applyResult = await onApplyChoice?.(currentCard, choice);
            const nextResults = [
                ...results,
                {
                    questionId: currentCard.questionId || currentCard.id,
                    isCorrect: Boolean(applyResult?.isCorrect),
                    choiceKey: choice.key,
                },
            ];

            setResults(nextResults);

            if (currentIndex + 1 < cards.length) {
                setCurrentIndex((prev) => prev + 1);
                setIsAnswerVisible(false);
            } else {
                setIsCompleted(true);
            }
        } finally {
            setIsApplyingChoice(false);
        }
    };

    if (!cards.length || !currentCard) {
        return renderSceneShell(
            <div className="study-flashcard-overlay">
                <div className="study-flashcard-topbar">
                    <button type="button" className="study-flashcard-back" onClick={() => finishSession(false)}>
                        <ChevronLeft size={18} />
                        {exitLabel}
                    </button>
                </div>
                <div className="study-flashcard-sheet">
                    <div className="study-flashcard-panel is-empty">
                        <div className="study-flashcard-copy">
                            <span className="study-flashcard-kicker">Flashcard Mode</span>
                            <h2>{emptyTitle}</h2>
                            <p>{emptyMessage}</p>
                        </div>
                    </div>
                </div>
            </div>,
            'is-empty'
        );
    }

    if (isCompleted) {
        return renderSceneShell(
            <div className="study-flashcard-overlay">
                <div className="study-flashcard-topbar">
                    <button type="button" className="study-flashcard-back" onClick={() => finishSession(true)}>
                        <ChevronLeft size={18} />
                        {exitLabel}
                    </button>
                </div>
                <div className="study-flashcard-sheet">
                    <div className="study-flashcard-panel is-complete">
                        <div className="study-flashcard-complete-badge">Flashcards</div>
                        <h2>{completionTitle}</h2>
                        <div className="study-flashcard-complete-stats">
                            <div>
                                <strong>{results.length}</strong>
                                <span>枚</span>
                            </div>
                            <div>
                                <strong>{correctCount}</strong>
                                <span>先送り</span>
                            </div>
                        </div>
                        <p>{completionMessage}</p>
                        <button type="button" className="study-flashcard-finish" onClick={() => finishSession(true)}>
                            {exitLabel}
                        </button>
                    </div>
                </div>
            </div>,
            'is-complete'
        );
    }

    return renderSceneShell(
        <div className="study-flashcard-overlay">
            <div className="study-flashcard-topbar">
                <button type="button" className="study-flashcard-back" onClick={() => finishSession(false)}>
                    <ChevronLeft size={18} />
                    {exitLabel}
                </button>
                <div className="study-flashcard-progress">{currentIndex + 1} / {cards.length}</div>
            </div>

            <div className="study-flashcard-sheet">
                <div className="study-flashcard-panel">
                    <div className="study-flashcard-copy">
                        <span className="study-flashcard-kicker">Flashcard Mode</span>
                        <h2>{title}</h2>
                        {subtitle && <p>{subtitle}</p>}
                    </div>

                    <button
                        type="button"
                        className={`study-flashcard-card ${isAnswerVisible ? 'is-revealed' : ''}`}
                        onClick={() => setIsAnswerVisible((prev) => !prev)}
                    >
                        <span className="study-flashcard-face study-flashcard-front">
                            <small>表</small>
                            <strong>{currentCard.prompt}</strong>
                            <p>{currentCard.frontHint || '思い出せたらタップで答えを見ます'}</p>
                        </span>
                        <span className="study-flashcard-face study-flashcard-back">
                            <small>裏</small>
                            <strong>{currentCard.answer}</strong>
                            <p>{currentCard.backHint || currentCard.prompt}</p>
                        </span>
                    </button>

                    <div className="study-flashcard-actions">
                        <button
                            type="button"
                            className="study-flashcard-toggle"
                            onClick={() => setIsAnswerVisible((prev) => !prev)}
                        >
                            {isAnswerVisible ? 'もう一度かくす' : '答えを見る'}
                        </button>
                    </div>

                    <div className="study-flashcard-schedule">
                        <div className="study-flashcard-schedule-copy">
                            <strong>次はいつ出す？</strong>
                            <span>{isAnswerVisible ? '答えを見たあとで選んでも、そのまま先に選んでも大丈夫です。' : 'めくる前でも先に選べます。必要なら答えを見てから決めてください。'}</span>
                        </div>
                        <div className="study-flashcard-schedule-grid">
                            {scheduleChoices.map((choice) => (
                                <button
                                    key={choice.key}
                                    type="button"
                                    className={`study-flashcard-schedule-btn ${choice.recommended ? 'is-recommended' : ''} ${choice.complete ? 'is-complete' : ''}`}
                                    onClick={() => handleChoiceSelect(choice)}
                                    disabled={isApplyingChoice}
                                >
                                    <span className="study-flashcard-schedule-label">{choice.label}</span>
                                    {choice.description && (
                                        <span className="study-flashcard-schedule-meta">{choice.description}</span>
                                    )}
                                    {choice.recommended && (
                                        <span className="study-flashcard-schedule-badge">おすすめ</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyFlashcardSession;
