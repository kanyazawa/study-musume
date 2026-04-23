import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpenText, CheckCircle2 } from 'lucide-react';
import TappableVocabText from '../components/TappableVocabText';
import { READING_PASSAGES, getReadingPassageById, getReadingPassagesByLevel } from '../data/readingPassages';
import { saveStudySession } from '../utils/studyHistoryUtils';
import { updateMissionsOnStudy } from '../utils/missionUtils';
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
            updateStats((currentStats) => ({
                ...currentStats,
                intellect: (currentStats?.intellect || 0) + READING_REWARD_INTELLECT,
                totalStudyTime: (currentStats?.totalStudyTime || 0) + selectedPassage.estimatedMinutes,
                totalSessions: (currentStats?.totalSessions || 0) + 1,
            }));
        }

        setIsFinished(true);
    };

    return (
        <div className="reading-page">
            <header className="reading-header">
                <button type="button" className="reading-back" onClick={() => navigate('/study')}>
                    <ArrowLeft size={18} />
                    授業選択へ
                </button>
                <div>
                    <span className="reading-kicker">Reading Lab</span>
                    <h1>長文読解</h1>
                    <p>本文中の英単語をタップすると、自作単語ノートに追加できます。</p>
                </div>
            </header>

            <section className="reading-passage-switcher" aria-label="長文を選択">
                {visiblePassages.map((passage) => (
                    <div key={passage.id} className={`reading-passage-tab-wrap ${passage.custom ? 'is-custom' : ''}`}>
                        <button
                            type="button"
                            className={`reading-passage-tab ${passage.id === selectedPassage.id ? 'active' : ''}`}
                            onClick={() => handlePassageChange(passage.id)}
                        >
                            <span>{passage.label}</span>
                            <strong>{passage.title}</strong>
                        </button>
                        {passage.custom && (
                            <button
                                type="button"
                                className="reading-delete-custom"
                                onClick={() => handleDeleteCustomPassage(passage.id)}
                            >
                                削除
                            </button>
                        )}
                    </div>
                ))}
            </section>

            <main className="reading-layout">
                <article className="reading-card">
                    <section className="reading-custom-form-section">
                        <div className="reading-custom-form-copy">
                            <span>My Passage</span>
                            <strong>自分の長文を追加</strong>
                            <p>英語の長文を貼り付けると、この画面で単語タップ追加が使えます。</p>
                        </div>
                        <form className="reading-custom-form" onSubmit={handleAddCustomPassage}>
                            <input
                                type="text"
                                value={customTitle}
                                onChange={(event) => setCustomTitle(event.target.value)}
                                placeholder="タイトル 例: My Practice Article"
                            />
                            <textarea
                                value={customText}
                                onChange={(event) => setCustomText(event.target.value)}
                                placeholder="ここに英文の長文を貼り付け"
                                rows={5}
                            />
                            <button type="submit">自作長文として追加</button>
                        </form>
                        {customFeedback && <p className="reading-custom-feedback">{customFeedback}</p>}
                    </section>

                    <div className="reading-card-topline">
                        <span>{selectedPassage.label}</span>
                        <span>{selectedPassage.estimatedMinutes}分目安</span>
                        <span>{selectedPassage.topic}</span>
                    </div>
                    <h2>{selectedPassage.title}</h2>
                    <div className="reading-passage-text">
                        <TappableVocabText text={selectedPassage.passage} />
                    </div>
                </article>

                <aside className="reading-quiz-card">
                    <div className="reading-quiz-header">
                        <BookOpenText size={20} />
                        <div>
                            <span>{hasQuestions ? 'Comprehension Check' : 'Reading Memo'}</span>
                            <strong>{hasQuestions ? `${answeredCount}/${questions.length} 問回答` : '自作長文は本文タップ練習用'}</strong>
                        </div>
                    </div>

                    {hasQuestions ? (
                        <div className="reading-question-list">
                            {questions.map((question, questionIndex) => {
                            const selectedAnswer = answers[questionIndex];
                            const hasAnswered = typeof selectedAnswer === 'number';

                            return (
                                <section key={question.question} className="reading-question">
                                    <h3>{questionIndex + 1}. {question.question}</h3>
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
                            <p>この自作長文には確認問題はありません。本文を読んで、気になる単語をタップして自作単語ノートに追加できます。</p>
                        </div>
                    )}

                    <button
                        type="button"
                        className="reading-finish-btn"
                        onClick={handleFinish}
                        disabled={!allAnswered || isFinished}
                    >
                        {isFinished ? (
                            <>
                                <CheckCircle2 size={18} />
                                {hasQuestions ? `${correctCount}/${questions.length} 正解・記録済み` : '読了として記録済み'}
                            </>
                        ) : allAnswered && hasQuestions ? (
                            '採点して学習記録に保存'
                        ) : !hasQuestions ? (
                            '読了として学習記録に保存'
                        ) : (
                            'すべて回答すると採点できます'
                        )}
                    </button>

                    {isFinished && (
                        <p className="reading-reward-note">
                            学力 +{READING_REWARD_INTELLECT}。気になった単語は本文からそのままノートに足せます。
                        </p>
                    )}
                </aside>
            </main>
        </div>
    );
};

export default Reading;
