import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addCustomVocabEntry } from '../utils/customVocabUtils';
import './TappableVocabText.css';

const WORD_PATTERN = /[A-Za-z]+(?:'[A-Za-z]+)?(?:-[A-Za-z]+)*/g;
const POSSESSIVE_PATTERN = /'s$/i;

let vocabLookupCache = null;
let vocabLookupPromise = null;

const normalizeLookupKey = (value) => (
    String(value || '')
        .toLowerCase()
        .replace(POSSESSIVE_PATTERN, '')
        .replace(/[^a-z\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
);

const getVocabLookup = async () => {
    if (vocabLookupCache) return vocabLookupCache;
    if (vocabLookupPromise) return vocabLookupPromise;

    vocabLookupPromise = import('../data/vocabData').then(({ getAllVocab }) => {
        const lookup = new Map();
        getAllVocab().forEach((entry) => {
            const key = normalizeLookupKey(entry?.word);
            if (key && !lookup.has(key)) {
                lookup.set(key, entry.meaning);
            }
        });

        vocabLookupCache = lookup;
        return lookup;
    });

    return vocabLookupPromise;
};

const getMeaningSuggestion = async (word) => {
    const lookup = await getVocabLookup();
    const key = normalizeLookupKey(word);
    if (!key) return '';

    const candidates = [
        key,
        key.endsWith('s') ? key.slice(0, -1) : '',
        key.endsWith('es') ? key.slice(0, -2) : '',
        key.endsWith('ed') ? key.slice(0, -2) : '',
        key.endsWith('ing') ? key.slice(0, -3) : '',
    ].filter(Boolean);

    for (const candidate of candidates) {
        const meaning = lookup.get(candidate);
        if (meaning) return meaning;
    }

    return '';
};

const tokenizeText = (text) => {
    const source = String(text || '');
    const tokens = [];
    let cursor = 0;

    source.replace(WORD_PATTERN, (match, offset) => {
        if (offset > cursor) {
            tokens.push({ type: 'text', value: source.slice(cursor, offset) });
        }

        tokens.push({ type: 'word', value: match });
        cursor = offset + match.length;
        return match;
    });

    if (cursor < source.length) {
        tokens.push({ type: 'text', value: source.slice(cursor) });
    }

    return tokens;
};

const TappableVocabText = ({ text, className = '' }) => {
    const tokens = useMemo(() => tokenizeText(text), [text]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [meaning, setMeaning] = useState('');
    const [feedback, setFeedback] = useState('');
    const suggestionRequestRef = useRef(0);

    useEffect(() => {
        suggestionRequestRef.current += 1;
        setSelectedWord(null);
        setMeaning('');
        setFeedback('');
    }, [text]);

    const closePanel = (event) => {
        event?.stopPropagation();
        suggestionRequestRef.current += 1;
        setSelectedWord(null);
        setMeaning('');
        setFeedback('');
    };

    const handleWordTap = async (word, event) => {
        event.stopPropagation();
        const cleanedWord = word.replace(POSSESSIVE_PATTERN, '');
        const requestId = suggestionRequestRef.current + 1;
        suggestionRequestRef.current = requestId;

        setSelectedWord(cleanedWord);
        setMeaning('');
        setFeedback('意味候補を探しています...');

        const suggestedMeaning = await getMeaningSuggestion(cleanedWord);
        if (suggestionRequestRef.current !== requestId) return;

        setMeaning((currentMeaning) => currentMeaning || suggestedMeaning);
        setFeedback(suggestedMeaning ? '意味候補を見つけました。必要なら直して追加できます。' : '意味を入力してから追加できます。');
    };

    const handleMeaningChange = (event) => {
        setMeaning(event.target.value);
        setFeedback('');
    };

    const handleAdd = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const result = addCustomVocabEntry({ word: selectedWord, meaning });
        if (!result.ok) {
            setFeedback(
                result.reason === 'duplicate'
                    ? 'この単語と意味はもう自作単語ノートにあります。'
                    : '意味を入力してください。'
            );
            return;
        }

        setFeedback(`「${result.entry.word}」を自作単語ノートに追加しました。`);
    };

    return (
        <>
            <span className={`tappable-vocab-text ${className}`}>
                {tokens.map((token, index) => {
                    if (token.type !== 'word') {
                        return <React.Fragment key={`text-${index}`}>{token.value}</React.Fragment>;
                    }

                    return (
                        <button
                            key={`word-${index}-${token.value}`}
                            type="button"
                            className="tappable-vocab-word"
                            onClick={(event) => handleWordTap(token.value, event)}
                            aria-label={`${token.value} を自作単語ノートに追加`}
                        >
                            {token.value}
                        </button>
                    );
                })}
            </span>

            {selectedWord && (
                <div className="vocab-capture-panel" role="dialog" aria-modal="false" onClick={(event) => event.stopPropagation()}>
                    <form className="vocab-capture-card" onSubmit={handleAdd}>
                        <div className="vocab-capture-header">
                            <span className="vocab-capture-kicker">Tap Vocab</span>
                            <button type="button" className="vocab-capture-close" onClick={closePanel} aria-label="閉じる">
                                x
                            </button>
                        </div>
                        <label className="vocab-capture-field">
                            <span>英単語</span>
                            <input
                                type="text"
                                value={selectedWord}
                                onChange={(event) => {
                                    suggestionRequestRef.current += 1;
                                    setSelectedWord(event.target.value);
                                }}
                            />
                        </label>
                        <label className="vocab-capture-field">
                            <span>意味</span>
                            <input
                                type="text"
                                value={meaning}
                                onChange={handleMeaningChange}
                                placeholder="例: 〜を達成する"
                                autoFocus={!meaning}
                            />
                        </label>
                        {feedback && <p className="vocab-capture-feedback">{feedback}</p>}
                        <button type="submit" className="vocab-capture-submit">
                            自作単語ノートに追加
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default TappableVocabText;
