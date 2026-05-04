import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import './StudySelect.css';
import { STUDY_TOPICS } from '../data/studyTopics';
import { saveLastStudyTopicFromItem } from '../data/studyData';

const StudySelect = ({ stats }) => {
    const navigate = useNavigate();

    // 階層管理
    const [currentLevel, setCurrentLevel] = useState('subject'); // 'subject' | 'category' | 'unit' | 'chapter' | 'section'
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);

    // 検索
    const [searchQuery, setSearchQuery] = useState('');

    const navigateToStudyItem = (item) => {
        saveLastStudyTopicFromItem(item, {
            subject: selectedSubject,
            category: selectedCategory,
            unit: selectedUnit,
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

    const handleDirectModeClick = (item, path) => {
        saveLastStudyTopicFromItem(item, {
            subject: selectedSubject,
            category: selectedCategory,
            unit: selectedUnit,
        });
        navigate(path);
    };

    // パンくずリスト
    const breadcrumbs = [];
    if (selectedSubject) {
        breadcrumbs.push({ level: 'subject', name: selectedSubject.name });
    }
    if (selectedCategory) {
        breadcrumbs.push({ level: 'category', name: selectedCategory.name });
    }
    if (selectedUnit) {
        breadcrumbs.push({ level: 'unit', name: selectedUnit.name });
    }
    if (selectedChapter) {
        breadcrumbs.push({ level: 'chapter', name: selectedChapter.name });
    }

    // 科目選択
    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        setSelectedCategory(null);
        setSelectedUnit(null);
        setSelectedChapter(null);
        setCurrentLevel('category');
        setSearchQuery('');
    };

    // カテゴリー選択
    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setSelectedUnit(null);
        setSelectedChapter(null);
        setCurrentLevel('unit');
        setSearchQuery('');
    };

    // 単元選択
    const handleUnitClick = (unit) => {
        if (unit.chapters && unit.chapters.length > 0) {
            // 章がある場合は章選択へ
            setSelectedUnit(unit);
            setSelectedChapter(null);
            setCurrentLevel('chapter');
            setSearchQuery('');
        } else {
            // 章がない場合は直接学習へ
            navigateToStudyItem(unit);
        }
    };

    // 章選択
    const handleChapterClick = (chapter) => {
        if (chapter.sections && chapter.sections.length > 0) {
            // 節（セクション）がある場合は節選択へ
            setSelectedChapter(chapter);
            setCurrentLevel('section');
            setSearchQuery('');
        } else {
            navigateToStudyItem(chapter);
        }
    };

    // 節（セクション）選択
    const handleSectionClick = (section) => {
        navigateToStudyItem(section);
    };

    // 戻る
    const handleBack = () => {
        if (currentLevel === 'section') {
            setCurrentLevel('chapter');
            setSelectedChapter(null);
            setSearchQuery('');
        } else if (currentLevel === 'chapter') {
            setCurrentLevel('unit');
            setSelectedUnit(null);
            setSelectedChapter(null); // Clear chapter when going back to unit
            setSearchQuery('');
        } else if (currentLevel === 'unit') {
            setCurrentLevel('category');
            setSelectedCategory(null);
            setSelectedUnit(null);
            setSearchQuery('');
        } else if (currentLevel === 'category') {
            setCurrentLevel('subject');
            setSelectedSubject(null);
            setSearchQuery('');
        } else {
            navigate('/home');
        }
    };

    // パンくずクリック
    const handleBreadcrumbClick = (level) => {
        if (level === 'subject') {
            setCurrentLevel('category');
            setSelectedCategory(null);
            setSelectedUnit(null);
            setSelectedChapter(null);
            setSearchQuery('');
        } else if (level === 'category') {
            setCurrentLevel('unit');
            setSelectedUnit(null);
            setSelectedChapter(null);
            setSearchQuery('');
        } else if (level === 'unit') {
            setCurrentLevel('chapter');
            setSelectedChapter(null);
            setSearchQuery('');
        }
    };

    // 表示データの取得とフィルタリング
    const getDisplayData = () => {
        const query = searchQuery.toLowerCase();

        if (currentLevel === 'subject') {
            return STUDY_TOPICS.filter(subject =>
                !query || subject.name.toLowerCase().includes(query)
            );
        }

        if (currentLevel === 'category' && selectedSubject) {
            return selectedSubject.categories.filter(category =>
                !query || category.name.toLowerCase().includes(query)
            );
        }

        if (currentLevel === 'unit' && selectedCategory) {
            return selectedCategory.units.filter(unit =>
                !query || unit.name.toLowerCase().includes(query)
            );
        }

        if (currentLevel === 'chapter' && selectedUnit) {
            return selectedUnit.chapters.filter(chapter =>
                !query || chapter.name.toLowerCase().includes(query)
            );
        }

        if (currentLevel === 'section' && selectedChapter) {
            return selectedChapter.sections.filter(section =>
                !query || section.name.toLowerCase().includes(query)
            );
        }

        return [];
    };

    const displayData = getDisplayData();

    // タイトルを取得
    const getTitle = () => {
        if (currentLevel === 'subject') return '今日の授業を選ぶ';
        if (currentLevel === 'category') return '分野を選ぶ';
        if (currentLevel === 'unit') return '単元を選ぶ';
        if (currentLevel === 'chapter') return '章を選ぶ';
        if (currentLevel === 'section') return '演習テーマ';
        return '今日の授業を選ぶ';
    };

    // タイトルを取得
    return (
        <div className="study-select-screen">
            {/* ヘッダー */}
            <div className="study-header">
                <button className="back-btn" onClick={handleBack}>
                    <ChevronLeft color="white" size={24} />
                </button>
                <h2>{getTitle()}</h2>
            </div>

            {/* パンくずリスト */}
            {breadcrumbs.length > 0 && (
                <div className="breadcrumbs">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <span
                                className={`breadcrumb ${index < breadcrumbs.length - 1 ? 'clickable' : ''}`}
                                onClick={() => index < breadcrumbs.length - 1 && handleBreadcrumbClick(crumb.level)}
                            >
                                {crumb.name}
                            </span>
                            {index < breadcrumbs.length - 1 && <ChevronRight size={16} />}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* 検索バー */}
            <div className="search-bar">
                <Search size={20} color="#999" />
                <input
                    type="text"
                    placeholder={
                        currentLevel === 'subject' ? '授業を検索...' :
                            currentLevel === 'category' ? '分野を検索...' :
                                currentLevel === 'unit' ? '単元を検索...' :
                                    currentLevel === 'chapter' ? '章を検索...' :
                                        'テーマを検索...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* コンテンツ */}
            <div className="study-content">
                {/* 科目選択 */}
                {currentLevel === 'subject' && (
                    <>
                        <div className="subject-grid">
                            {displayData.map((subject) => (
                                <div
                                    key={subject.id}
                                    className="subject-card"
                                    onClick={() => handleSubjectClick(subject)}
                                >
                                    <div className="subject-icon" style={{ backgroundColor: subject.color }}>
                                        <subject.icon size={32} color="white" />
                                    </div>
                                    <span className="subject-name">{subject.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* 復習モードボタン */}
                        <div className="review-mode-container">
                            <button
                                className="review-mode-btn"
                                onClick={() => navigate('/review')}
                            >
                                <span className="review-icon">📚</span>
                                <span className="review-label">弱点ノート</span>
                                <span className="review-hint">つまずいた問題だけ回収</span>
                            </button>
                            <button
                                className="writing-mode-btn"
                                onClick={() => handleDirectModeClick({
                                    id: 'eng_reading',
                                    name: '長文読解',
                                    topic: '長文読解',
                                    mode: 'reading',
                                }, '/reading')}
                            >
                                <span className="review-icon">R</span>
                                <span className="review-label">長文読解</span>
                                <span className="review-hint">読んで単語も拾う</span>
                            </button>
                            <button
                                className="writing-mode-btn"
                                onClick={() => handleDirectModeClick({
                                    id: 'eng_writing',
                                    name: '英検ライティング',
                                    topic: '英検ライティング',
                                    mode: 'writing',
                                }, '/writing')}
                            >
                                <span className="review-icon">W</span>
                                <span className="review-label">英検ライティング</span>
                                <span className="review-hint">問題を見てAI採点</span>
                            </button>
                            <button
                                className="reorder-mode-btn"
                                onClick={() => navigate('/reorder-practice')}
                            >
                                <span className="review-icon">↔</span>
                                <span className="review-label">並び替えクイズ</span>
                                <span className="review-hint">語順をまとめて練習</span>
                            </button>
                            <button
                                className="custom-vocab-mode-btn"
                                onClick={() => navigate('/custom-vocab')}
                            >
                                <span className="review-icon">N</span>
                                <span className="review-label">自作単語ノート</span>
                                <span className="review-hint">単語を追加して覚える</span>
                            </button>
                        </div>
                    </>
                )}

                {/* カテゴリー選択 */}
                {currentLevel === 'category' && (
                    <div className="category-list">
                        {displayData.map((category) => (
                            <div
                                key={category.id}
                                className="category-card"
                                onClick={() => handleCategoryClick(category)}
                            >
                                <span className="category-name">{category.name}</span>
                                <ChevronRight size={20} color="#999" />
                            </div>
                        ))}
                    </div>
                )}

                {/* 単元選択 */}
                {currentLevel === 'unit' && (
                    <div className="unit-list">
                        {displayData.map((unit) => (
                            <div
                                key={unit.id}
                                className="unit-card"
                                onClick={() => handleUnitClick(unit)}
                            >
                                <span className="unit-name">{unit.name}</span>
                                <ChevronRight size={20} color="#999" />
                            </div>
                        ))}
                    </div>
                )}

                {/* 章選択 */}
                {currentLevel === 'chapter' && (
                    <div className="unit-list">
                        {displayData.map((chapter) => (
                            <div
                                key={chapter.id}
                                className="unit-card"
                                onClick={() => handleChapterClick(chapter)}
                            >
                                <span className="unit-name">{chapter.name}</span>
                                <ChevronRight size={20} color="#999" />
                            </div>
                        ))}
                    </div>
                )}

                {/* 節(セクション)選択 */}
                {currentLevel === 'section' && (
                    <div className="unit-list">
                        {displayData.map((section) => (
                            <div
                                key={section.id}
                                className="unit-card"
                                onClick={() => handleSectionClick(section)}
                            >
                                <span className="unit-name">{section.name}</span>
                                <ChevronRight size={20} color="#999" />
                            </div>
                        ))}
                    </div>
                )}

                {/* 検索結果なし */}
                {displayData.length === 0 && searchQuery && (
                    <div className="no-results">
                        <p>「{searchQuery}」に合う授業は見つかりませんでした</p>
                    </div>
                )}
            </div>

            {/* ホームボタン */}
            <div className="bottom-area">
                <button className="big-home-btn" onClick={() => navigate('/home')}>
                    ホームへ戻る
                </button>
            </div>
        </div>
    );
};

export default StudySelect;
