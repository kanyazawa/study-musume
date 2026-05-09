import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    BookOpenText,
    ChevronLeft,
    ChevronRight,
    Home,
    Languages,
    NotebookPen,
    Sparkles,
} from 'lucide-react';
import './StudySelect.css';
import { STUDY_TOPICS } from '../data/studyTopics';
import { getLastStudyTopic, saveLastStudyTopicFromItem } from '../data/studyData';

const ENGLISH_SUBJECT_ID = 'english';

const CATEGORY_ACCENTS = {
    eng_vocab: 'vocab',
    eng_grammar: 'grammar',
    eng_reading: 'reading',
    eng_writing: 'writing',
};

const CATEGORY_MENU_LABELS = {
    eng_vocab: 'BATTLE',
    eng_grammar: 'SKILL',
    eng_reading: 'STORY',
    eng_writing: 'CHECK',
};

const stripGloss = (label) => String(label || '').replace(/\s*\([^)]*\)/g, '').trim();

const formatResumePath = (topic) => (
    [topic?.subjectName, topic?.categoryName || topic?.chapterName, topic?.unitName]
        .filter(Boolean)
        .join(' / ')
);

const getChoiceMeta = (item, level) => {
    if (level === 'unit') {
        return item.chapters?.length ? `${item.chapters.length} STAGES` : 'START';
    }

    if (level === 'chapter') {
        if (item.sections?.length) {
            return `${item.sections.length} QUESTS`;
        }
        if (item.level) {
            return 'BATTLE';
        }
        if (item.mode === 'reading') {
            return 'READING';
        }
        if (item.mode === 'writing') {
            return 'AI CHECK';
        }
        return 'LESSON';
    }

    if (level === 'section') {
        return 'START';
    }

    return 'OPEN';
};

const getToneForItem = (currentLevel, selectedCategory, item) => {
    if (currentLevel === 'unit') {
        return CATEGORY_ACCENTS[selectedCategory?.id] || 'grammar';
    }

    if (currentLevel === 'chapter' || currentLevel === 'section') {
        return CATEGORY_ACCENTS[selectedCategory?.id] || 'vocab';
    }

    return CATEGORY_ACCENTS[item.id] || 'support';
};

const StudySelect = ({ stats }) => {
    const navigate = useNavigate();
    const englishSubject = STUDY_TOPICS.find((subject) => subject.id === ENGLISH_SUBJECT_ID) || null;

    const [currentLevel, setCurrentLevel] = useState('subject');
    const [selectedSubject, setSelectedSubject] = useState(englishSubject);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [lastStudyTopic] = useState(() => getLastStudyTopic());
    if (!englishSubject) {
        return (
            <div className="study-select-screen">
                <div className="study-empty-state">
                    <p>英語コースが見つかりませんでした。</p>
                </div>
            </div>
        );
    }

    const resumePath = formatResumePath(lastStudyTopic);
    const englishCategories = englishSubject.categories || [];
    const categoryMap = Object.fromEntries(englishCategories.map((category) => [category.id, category]));

    const resetToSubject = () => {
        setCurrentLevel('subject');
        setSelectedSubject(englishSubject);
        setSelectedCategory(null);
        setSelectedUnit(null);
        setSelectedChapter(null);
    };

    const navigateToStudyItem = (item, context = {}) => {
        saveLastStudyTopicFromItem(item, {
            subject: context.subject || selectedSubject || englishSubject,
            category: context.category || selectedCategory,
            unit: context.unit || selectedUnit,
        });

        if (item.level) {
            navigate(`/multiplayer-match?mode=solo&level=${item.level}`);
        } else if (item.mode === 'writing') {
            navigate(`/writing${item.writingLevel ? `?level=${item.writingLevel}` : ''}`);
        } else if (item.mode === 'reading') {
            navigate(`/reading${item.readingLevel ? `?level=${item.readingLevel}` : ''}`);
        } else if (item.id === 'eng_vocab_basic' || item.topic === '英単語') {
            navigate('/multiplayer-match?mode=solo');
        } else {
            navigate(`/dialogue?topic=${item.topic}`);
        }
    };

    const openCategory = (category) => {
        setSelectedSubject(englishSubject);
        setSelectedCategory(category);
        setSelectedUnit(null);
        setSelectedChapter(null);

        if (category.units?.length === 1) {
            const [onlyUnit] = category.units;
            setSelectedUnit(onlyUnit);

            if (onlyUnit.chapters?.length) {
                setCurrentLevel('chapter');
                return;
            }

            navigateToStudyItem(onlyUnit, {
                subject: englishSubject,
                category,
                unit: onlyUnit,
            });
            return;
        }

        setCurrentLevel('unit');
    };

    const handleUnitClick = (unit) => {
        if (unit.chapters?.length) {
            setSelectedUnit(unit);
            setSelectedChapter(null);
            setCurrentLevel('chapter');
            return;
        }

        navigateToStudyItem(unit, {
            subject: englishSubject,
            category: selectedCategory,
            unit,
        });
    };

    const handleChapterClick = (chapter) => {
        if (chapter.sections?.length) {
            setSelectedChapter(chapter);
            setCurrentLevel('section');
            return;
        }

        navigateToStudyItem(chapter, {
            subject: englishSubject,
            category: selectedCategory,
            unit: selectedUnit,
        });
    };

    const handleSectionClick = (section) => {
        navigateToStudyItem(section, {
            subject: englishSubject,
            category: selectedCategory,
            unit: selectedUnit,
        });
    };

    const handleBack = () => {
        if (currentLevel === 'subject') {
            navigate('/home');
            return;
        }

        if (currentLevel === 'section') {
            setCurrentLevel('chapter');
            setSelectedChapter(null);
            return;
        }

        if (currentLevel === 'chapter') {
            if ((selectedCategory?.units?.length || 0) > 1) {
                setCurrentLevel('unit');
                setSelectedUnit(null);
                setSelectedChapter(null);
                return;
            }

            resetToSubject();
            return;
        }

        resetToSubject();
    };

    const handleBreadcrumbClick = (level) => {
        if (level === 'subject') {
            resetToSubject();
            return;
        }

        if (level === 'category' && selectedCategory) {
            openCategory(selectedCategory);
            return;
        }

        if (level === 'unit') {
            setCurrentLevel('chapter');
            setSelectedChapter(null);
        }
    };

    const getDisplayData = () => {
        if (currentLevel === 'unit' && selectedCategory) {
            return selectedCategory.units || [];
        }

        if (currentLevel === 'chapter' && selectedUnit) {
            return selectedUnit.chapters || [];
        }

        if (currentLevel === 'section' && selectedChapter) {
            return selectedChapter.sections || [];
        }

        return [];
    };

    const displayData = getDisplayData();

    const breadcrumbs = currentLevel === 'subject'
        ? []
        : [
            { level: 'subject', name: englishSubject.name },
            selectedCategory ? { level: 'category', name: selectedCategory.name } : null,
            selectedUnit && currentLevel !== 'unit' ? { level: 'unit', name: stripGloss(selectedUnit.name) } : null,
            selectedChapter && currentLevel === 'section' ? { level: 'chapter', name: stripGloss(selectedChapter.name) } : null,
        ].filter(Boolean);

    const getTitle = () => {
        if (currentLevel === 'subject') return 'クエスト選択';
        if (currentLevel === 'unit') return '文法ステージ';
        if (currentLevel === 'chapter' && selectedCategory?.id === 'eng_vocab') return '単語ランク';
        if (currentLevel === 'chapter' && selectedCategory?.id === 'eng_reading') return '読解ランク';
        if (currentLevel === 'chapter' && selectedCategory?.id === 'eng_writing') return '作文ランク';
        if (currentLevel === 'chapter') return 'レッスン選択';
        if (currentLevel === 'section') return 'ステージ選択';
        return 'クエスト選択';
    };

    const getLeadText = () => {
        if (currentLevel === 'subject') {
            return 'STAGE SELECT';
        }

        if (currentLevel === 'unit') {
            return 'GRAMMAR';
        }

        if (currentLevel === 'chapter' && selectedCategory?.id === 'eng_vocab') {
            return 'VOCAB';
        }

        if (currentLevel === 'chapter' && selectedCategory?.id === 'eng_reading') {
            return 'READING';
        }

        if (currentLevel === 'chapter' && selectedCategory?.id === 'eng_writing') {
            return 'WRITING';
        }

        if (currentLevel === 'chapter') {
            return 'LESSON';
        }

        return 'QUEST';
    };

    const subjectActions = [
        {
            id: 'eng_vocab',
            title: '英単語',
            badge: 'BATTLE',
            icon: BookOpen,
            tone: 'vocab',
            layout: 'large',
            frame: 'battle',
            onClick: () => openCategory(categoryMap.eng_vocab),
        },
        {
            id: 'eng_grammar',
            title: '文法',
            badge: 'SKILL',
            icon: Languages,
            tone: 'grammar',
            layout: 'large',
            frame: 'resume',
            onClick: () => openCategory(categoryMap.eng_grammar),
        },
        {
            id: 'eng_reading',
            title: '長文読解',
            badge: 'STORY',
            icon: BookOpenText,
            tone: 'reading',
            layout: 'large',
            frame: 'study',
            onClick: () => openCategory(categoryMap.eng_reading),
        },
        {
            id: 'eng_writing',
            title: 'ライティング',
            badge: 'CHECK',
            icon: NotebookPen,
            tone: 'writing',
            layout: 'small',
            frame: 'friend',
            onClick: () => openCategory(categoryMap.eng_writing),
        },
        {
            id: 'review',
            title: '弱点ノート',
            badge: 'SUPPORT',
            icon: Sparkles,
            tone: 'support',
            layout: 'small',
            frame: 'mission',
            onClick: () => navigate('/review'),
        },
        {
            id: 'custom-vocab',
            title: '自作単語',
            badge: 'CUSTOM',
            icon: BookOpen,
            tone: 'support',
            layout: 'small',
            frame: 'event',
            onClick: () => navigate('/custom-vocab'),
        },
    ];

    const mainSubjectActions = subjectActions.filter((action) => action.layout === 'large');
    const sideSubjectActions = subjectActions.filter((action) => action.layout === 'small');

    const gridClassName = [
        'study-choice-grid',
        displayData.length >= 7 ? 'study-choice-grid--compact' : '',
        displayData.length >= 12 ? 'study-choice-grid--dense' : '',
        currentLevel === 'section' ? 'study-choice-grid--wide' : '',
    ]
        .filter(Boolean)
        .join(' ');

    const renderChoiceButton = (item, level, onClick) => (
        <button
            key={item.id}
            type="button"
            className={`study-choice-card is-${getToneForItem(level, selectedCategory, item)}`}
            onClick={onClick}
        >
            <span className="study-choice-kicker">{getChoiceMeta(item, level)}</span>
            <strong>{stripGloss(item.name)}</strong>
            <span className="study-choice-arrow">
                PLAY
                <ChevronRight size={14} />
            </span>
        </button>
    );

    return (
        <div className="study-select-screen">
            <div className="study-header">
                <button type="button" className="back-btn" onClick={handleBack} aria-label="戻る">
                    <ChevronLeft size={20} />
                </button>
                <div className="study-header-copy">
                    <span className="study-header-kicker">ENGLISH MODE</span>
                    <h1>{getTitle()}</h1>
                    <p>{getLeadText()}</p>
                </div>
            </div>

            <div className="study-screen-body">
                {currentLevel === 'subject' ? (
                    <>
                        <section className="study-hero-card study-hero-card--menu">
                            <div className="study-hero-copy">
                                <span className="study-chip">MAIN MENU</span>
                                <h2>英語クエスト</h2>
                                <p>ホーム画面みたいにメニューから選ぶ</p>
                            </div>

                            {lastStudyTopic ? (
                                <button
                                    type="button"
                                    className="resume-study-card"
                                    onClick={() => navigate(lastStudyTopic.routePath)}
                                >
                                    <div className="resume-study-copy">
                                        <span className="resume-study-label">CONTINUE</span>
                                        <strong>{lastStudyTopic.resumeLabel || lastStudyTopic.topicName}</strong>
                                        <span className="resume-study-path">
                                            {resumePath || '前回の続きから再開'}
                                        </span>
                                    </div>
                                    <span className="resume-study-cta">
                                        PLAY
                                        <ChevronRight size={16} />
                                    </span>
                                </button>
                            ) : (
                                <div className="resume-study-card is-empty">
                                    <div className="resume-study-copy">
                                        <span className="resume-study-label">CONTINUE</span>
                                        <strong>NEW GAME</strong>
                                        <span className="resume-study-path">下のボタンからスタート</span>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="study-panel study-panel--fill study-panel--menu">
                            <div className="study-panel-title">
                                <span>HOME STYLE</span>
                                <strong>SELECT QUEST</strong>
                            </div>

                            <div className="study-home-menu">
                                <div className="study-home-main-actions">
                                    {mainSubjectActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.id}
                                                type="button"
                                                className={`study-home-large-btn is-${action.frame}`}
                                                onClick={action.onClick}
                                            >
                                                <span className="study-home-badge">{action.badge}</span>
                                                <div className="study-home-label">
                                                    <span className="study-home-icon">
                                                        <Icon size={16} />
                                                    </span>
                                                    <strong>{action.title}</strong>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="study-home-side-actions">
                                    {sideSubjectActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.id}
                                                type="button"
                                                className={`study-home-side-btn is-${action.frame}`}
                                                onClick={action.onClick}
                                            >
                                                <span className="study-home-side-badge">{action.badge}</span>
                                                <span className="study-home-side-icon">
                                                    <Icon size={16} />
                                                </span>
                                                <strong>{action.title}</strong>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        {breadcrumbs.length > 0 && (
                            <div className="breadcrumbs">
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={crumb.level}>
                                        <button
                                            type="button"
                                            className={`breadcrumb ${index < breadcrumbs.length - 1 ? 'clickable' : ''}`}
                                            onClick={() => index < breadcrumbs.length - 1 && handleBreadcrumbClick(crumb.level)}
                                            disabled={index === breadcrumbs.length - 1}
                                        >
                                            {crumb.name}
                                        </button>
                                        {index < breadcrumbs.length - 1 && <ChevronRight size={12} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        <section className="study-hero-card compact">
                            <div className="study-hero-copy">
                                <span className="study-chip">
                                    {CATEGORY_MENU_LABELS[selectedCategory?.id] || selectedCategory?.name || selectedUnit?.name || 'ENGLISH'}
                                </span>
                                <h2>{getTitle()}</h2>
                            </div>
                        </section>

                        <section className="study-panel study-panel--fill">
                            {displayData.length > 0 ? (
                                <div className={gridClassName}>
                                    {currentLevel === 'unit' && displayData.map((item) => (
                                        renderChoiceButton(item, 'unit', () => handleUnitClick(item))
                                    ))}
                                    {currentLevel === 'chapter' && displayData.map((item) => (
                                        renderChoiceButton(item, 'chapter', () => handleChapterClick(item))
                                    ))}
                                    {currentLevel === 'section' && displayData.map((item) => (
                                        renderChoiceButton(item, 'section', () => handleSectionClick(item))
                                    ))}
                                </div>
                            ) : (
                                <div className="study-empty-state">
                                    <p>このカテゴリにはまだボタンがありません。</p>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>

            <div className="bottom-area">
                <button type="button" className="big-home-btn" onClick={() => navigate('/home')}>
                    <Home size={16} />
                    ホームへ戻る
                </button>
            </div>
        </div>
    );
};

export default StudySelect;
