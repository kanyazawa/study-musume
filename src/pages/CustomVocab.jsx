import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpenText, BookPlus, Play, Search, Trash2 } from 'lucide-react';
import {
    addCustomVocabEntry,
    getCustomVocabEntries,
    removeCustomVocabEntry,
} from '../utils/customVocabUtils';
import './CustomVocab.css';

const MIN_STUDYABLE_WORDS = 2;

const CustomVocab = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [word, setWord] = useState('');
    const [meaning, setMeaning] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        setEntries(getCustomVocabEntries());
    }, []);

    const filteredEntries = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return entries;

        return entries.filter((entry) => (
            entry.word.toLowerCase().includes(query) ||
            entry.meaning.toLowerCase().includes(query)
        ));
    }, [entries, searchQuery]);

    const canStartQuiz = entries.length >= MIN_STUDYABLE_WORDS;
    const canStartFlashcards = entries.length >= 1;

    const handleSubmit = (event) => {
        event.preventDefault();

        const result = addCustomVocabEntry({ word, meaning });
        if (!result.ok) {
            setFeedback(
                result.reason === 'duplicate'
                    ? '同じ単語と意味の組み合わせはもう登録されています。'
                    : '英単語と意味の両方を入れてください。'
            );
            return;
        }

        setEntries(result.entries);
        setWord('');
        setMeaning('');
        setFeedback(`「${result.entry.word}」を追加しました。`);
    };

    const handleDelete = (entryId) => {
        setEntries(removeCustomVocabEntry(entryId));
    };

    return (
        <div className="custom-vocab-page">
            <header className="custom-vocab-header">
                <button type="button" className="custom-vocab-back" onClick={() => navigate('/study')}>
                    <ArrowLeft size={18} />
                    授業選択へ
                </button>
                <div className="custom-vocab-heading">
                    <span className="custom-vocab-kicker">My Deck</span>
                    <h1>自作単語ノート</h1>
                    <p>気になった単語を自分で追加して、そのまま暗記テストに回せます。追加しただけでは弱点ノートに入らず、クイズで取りこぼした語だけ復習へ回ります。</p>
                </div>
            </header>

            <section className="custom-vocab-hero">
                <div className="custom-vocab-stat-card">
                    <span>登録数</span>
                    <strong>{entries.length}語</strong>
                    <small>{canStartQuiz ? 'クイズも一覧めくりも使えます' : canStartFlashcards ? '一覧めくりで確認できます' : 'まずは1語追加してみよう'}</small>
                </div>
                <div className="custom-vocab-stat-card">
                    <span>おすすめの使い方</span>
                    <strong>授業で出た未知語を即追加</strong>
                    <small>追加直後はここで覚えて、間違えた語だけ弱点ノートで回収</small>
                </div>
                <div className="custom-vocab-mode-stack">
                    <button
                        type="button"
                        className="custom-vocab-start custom-vocab-start-flashcards"
                        onClick={() => navigate('/custom-vocab/flashcards')}
                        disabled={!canStartFlashcards}
                    >
                        <BookOpenText size={18} />
                        {canStartFlashcards ? '一覧めくりで見る' : '1語以上で一覧めくり'}
                    </button>
                    <button
                        type="button"
                        className="custom-vocab-start"
                        onClick={() => navigate('/multiplayer-match?mode=solo&level=custom')}
                        disabled={!canStartQuiz}
                    >
                        <Play size={18} />
                        {canStartQuiz ? 'クイズで学ぶ' : '2語以上でクイズ開始'}
                    </button>
                    <small className="custom-vocab-mode-note">
                        弱点ノートに送られるのは、クイズで間違えた語だけです。
                    </small>
                </div>
            </section>

            <section className="custom-vocab-form-section">
                <div className="custom-vocab-section-title">
                    <BookPlus size={18} />
                    単語を追加
                </div>
                <form className="custom-vocab-form" onSubmit={handleSubmit}>
                    <label>
                        <span>英単語・熟語</span>
                        <input
                            type="text"
                            value={word}
                            onChange={(event) => setWord(event.target.value)}
                            placeholder="take off"
                        />
                    </label>
                    <label>
                        <span>意味</span>
                        <input
                            type="text"
                            value={meaning}
                            onChange={(event) => setMeaning(event.target.value)}
                            placeholder="離陸する"
                        />
                    </label>
                    <button type="submit" className="custom-vocab-submit">
                        追加する
                    </button>
                </form>
                {feedback && <p className="custom-vocab-feedback">{feedback}</p>}
            </section>

            <section className="custom-vocab-list-section">
                <div className="custom-vocab-list-header">
                    <div className="custom-vocab-section-title">登録済みの単語</div>
                    <label className="custom-vocab-search">
                        <Search size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="単語や意味で検索"
                        />
                    </label>
                </div>

                {filteredEntries.length === 0 ? (
                    <div className="custom-vocab-empty">
                        {entries.length === 0
                            ? 'まだ単語がありません。下のフォームから1語ずつ追加できます。'
                            : `「${searchQuery}」に合う単語は見つかりませんでした。`}
                    </div>
                ) : (
                    <div className="custom-vocab-list">
                        {filteredEntries.map((entry) => (
                            <div key={entry.id} className="custom-vocab-item">
                                <div className="custom-vocab-item-copy">
                                    <strong>{entry.word}</strong>
                                    <span>{entry.meaning}</span>
                                </div>
                                <button
                                    type="button"
                                    className="custom-vocab-delete"
                                    onClick={() => handleDelete(entry.id)}
                                    aria-label={`${entry.word} を削除`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default CustomVocab;
