import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { getCustomVocabStudyItems } from '../utils/customVocabUtils';
import './CustomVocab.css';

const shuffleItems = (items) => {
    const cloned = [...items];

    for (let index = cloned.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
    }

    return cloned;
};

const CustomVocabFlashcards = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);

    useEffect(() => {
        setCards(getCustomVocabStudyItems());
    }, []);

    const currentCard = cards[currentIndex] || null;
    const progressLabel = useMemo(() => {
        if (!cards.length) return '0 / 0';
        return `${currentIndex + 1} / ${cards.length}`;
    }, [cards.length, currentIndex]);

    const handleMove = (direction) => {
        setCurrentIndex((prev) => {
            const nextIndex = prev + direction;
            if (nextIndex < 0 || nextIndex >= cards.length) {
                return prev;
            }

            return nextIndex;
        });
        setIsAnswerVisible(false);
    };

    const handleShuffle = () => {
        setCards((prev) => shuffleItems(prev));
        setCurrentIndex(0);
        setIsAnswerVisible(false);
    };

    if (!cards.length) {
        return (
            <div className="custom-vocab-page custom-vocab-page-study">
                <header className="custom-vocab-header">
                    <button type="button" className="custom-vocab-back" onClick={() => navigate('/custom-vocab')}>
                        <ArrowLeft size={18} />
                        自作単語ノートへ
                    </button>
                    <div className="custom-vocab-heading">
                        <span className="custom-vocab-kicker">Flashcards</span>
                        <h1>一覧めくり</h1>
                        <p>まずは単語を1語以上登録すると、この画面でタップ暗記が始められます。</p>
                    </div>
                </header>
                <section className="custom-vocab-list-section custom-vocab-empty-panel">
                    単語がまだありません。自作単語ノートで追加してから戻ってきてください。
                </section>
            </div>
        );
    }

    return (
        <div className="custom-vocab-page custom-vocab-page-study">
            <header className="custom-vocab-header">
                <button type="button" className="custom-vocab-back" onClick={() => navigate('/custom-vocab')}>
                    <ArrowLeft size={18} />
                    自作単語ノートへ
                </button>
                <div className="custom-vocab-heading">
                    <span className="custom-vocab-kicker">Flashcards</span>
                    <h1>一覧めくり</h1>
                    <p>表を見て思い出して、タップで答えを確認。初見インプット向けの軽いモードです。</p>
                </div>
            </header>

            <section className="custom-vocab-flashcard-shell">
                <div className="custom-vocab-flashcard-topbar">
                    <div className="custom-vocab-flashcard-progress">{progressLabel}</div>
                    <button type="button" className="custom-vocab-shuffle" onClick={handleShuffle}>
                        <RotateCcw size={16} />
                        シャッフル
                    </button>
                </div>

                <button
                    type="button"
                    className={`custom-vocab-flashcard ${isAnswerVisible ? 'is-revealed' : ''}`}
                    onClick={() => setIsAnswerVisible((prev) => !prev)}
                >
                    <span className="custom-vocab-flashcard-face custom-vocab-flashcard-front">
                        <small>表</small>
                        <strong>{currentCard.word}</strong>
                        <p>意味を思い出したらタップ</p>
                    </span>
                    <span className="custom-vocab-flashcard-face custom-vocab-flashcard-back">
                        <small>裏</small>
                        <strong>{currentCard.meaning}</strong>
                        <p>{currentCard.word}</p>
                    </span>
                </button>

                <div className="custom-vocab-flashcard-actions">
                    <button
                        type="button"
                        className="custom-vocab-nav-btn"
                        onClick={() => handleMove(-1)}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft size={18} />
                        前へ
                    </button>
                    <button
                        type="button"
                        className="custom-vocab-nav-btn is-primary"
                        onClick={() => setIsAnswerVisible((prev) => !prev)}
                    >
                        {isAnswerVisible ? 'もう一度かくす' : '答えを見る'}
                    </button>
                    <button
                        type="button"
                        className="custom-vocab-nav-btn"
                        onClick={() => handleMove(1)}
                        disabled={currentIndex === cards.length - 1}
                    >
                        次へ
                        <ChevronRight size={18} />
                    </button>
                </div>
            </section>
        </div>
    );
};

export default CustomVocabFlashcards;
