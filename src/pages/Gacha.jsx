import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    ChevronLeft,
    Clock3,
    Diamond,
    Heart,
    Home,
    Menu,
    Percent,
    Search,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import {
    performGacha,
    getGachaHistory,
    getCurrentPity,
    GACHA_COST,
} from '../utils/gachaUtils';
import { GACHA_POOL, RARITY } from '../data/gachaItems';
import { getAffectionLevel, getAffectionProgress, getNextLevel } from '../utils/affectionUtils';
import BgClassroom from '../assets/images/bg_classroom.webp';
import NoahNormal from '../assets/images/noah_normal.webp';
import './Gacha.css';

const IS_LITE_DEPLOY = import.meta.env.VITE_LITE_DEPLOY === 'true';

const GACHA_VIDEO = '/gacha_animation (2).mp4';
const GACHA_AUDIO = '/audio/gacha.mp3';
const JACKPOT_CHARACTER = '/jackpot_character.jpg';

const SECTION_CONFIG = {
    pickup: {
        label: 'ピックアップ',
        kicker: '放課後',
        title: '限定',
        subtitle: '今だけの衣装',
        note: 'SSR 5%',
        rateLines: ['SSR 5%', '10連 SR+'],
        accentClass: 'pickup',
    },
    premium: {
        label: 'プレミアム',
        kicker: '特別枠',
        title: '豪華',
        subtitle: '衣装と背景',
        note: '演出強め',
        rateLines: ['SR狙い', '演出UP'],
        accentClass: 'premium',
    },
    normal: {
        label: 'ノーマル',
        kicker: '毎日',
        title: '定番',
        subtitle: '素材と小物',
        note: '軽く回す',
        rateLines: ['単発向け', '素材集め'],
        accentClass: 'normal',
    },
};

const FEATURED_ITEMS_BY_SECTION = {
    pickup: [
        GACHA_POOL.SR?.[0],
        GACHA_POOL.SSR?.[0],
        GACHA_POOL.SR?.[1] || GACHA_POOL.SR?.[0],
    ],
    premium: [
        GACHA_POOL.SSR?.[1] || GACHA_POOL.SSR?.[0],
        GACHA_POOL.SSR?.[2] || GACHA_POOL.SSR?.[0],
        GACHA_POOL.SR?.[0],
    ],
    normal: [
        GACHA_POOL.R?.[0],
        GACHA_POOL.N_PLUS?.[0],
        GACHA_POOL.N?.[0],
    ],
};

const NAV_ITEMS = [
    { id: 'home', label: 'ホーム', icon: Home, to: '/home' },
    { id: 'study', label: '学習', icon: BookOpen, to: '/study' },
    { id: 'gacha', label: 'ガチャ', icon: Sparkles, to: '/gacha' },
    { id: 'character', label: 'キャラ', icon: Users, to: '/character' },
    { id: 'menu', label: 'メニュー', icon: Menu, to: '/home' },
];

const formatNumber = (value) => Number(value || 0).toLocaleString('ja-JP');

const buildInventoryEntry = (item) => ({
    itemId: item.id,
    name: item.name,
    type: item.type,
    rarity: item.rarity,
    emoji: item.emoji,
    description: item.description,
    quantity: 1,
});

const addResultsToInventory = (inventory = [], results = []) => {
    const nextInventory = [...inventory];

    results.forEach((item) => {
        if (item.type === 'dummy') {
            return;
        }

        const existingIndex = nextInventory.findIndex((entry) => entry.itemId === item.id);
        if (existingIndex >= 0) {
            nextInventory[existingIndex] = {
                ...nextInventory[existingIndex],
                quantity: Number(nextInventory[existingIndex].quantity || 0) + 1,
            };
            return;
        }

        nextInventory.push(buildInventoryEntry(item));
    });

    return nextInventory;
};

const Gacha = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('pickup');
    const [showVideo, setShowVideo] = useState(false);
    const [gachaResults, setGachaResults] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showRates, setShowRates] = useState(false);
    const [showJackpot, setShowJackpot] = useState(false);
    const [history, setHistory] = useState([]);
    const [pityCount, setPityCount] = useState(0);
    const [pendingResults, setPendingResults] = useState(null);
    const audioRef = useRef(null);
    const videoRef = useRef(null);

    const diamonds = stats?.diamonds || 0;
    const affection = stats?.affection || 0;
    const affectionLevelInfo = getAffectionLevel(affection);
    const affectionProgress = getAffectionProgress(affection);
    const nextAffectionLevel = getNextLevel(affectionLevelInfo.level);
    const currentSection = SECTION_CONFIG[activeSection] || SECTION_CONFIG.pickup;
    const featuredItems = useMemo(
        () => (FEATURED_ITEMS_BY_SECTION[activeSection] || FEATURED_ITEMS_BY_SECTION.pickup).filter(Boolean).slice(0, 3),
        [activeSection],
    );
    const historyCount = history.length;
    const pityProgress = Math.min((pityCount / 100) * 100, 100);
    const affectionLabel = nextAffectionLevel
        ? `${formatNumber(affection)} / ${formatNumber(nextAffectionLevel.points)}`
        : 'MAX';

    useEffect(() => {
        setPityCount(getCurrentPity());
        setHistory(getGachaHistory());
    }, []);

    const refreshGachaState = () => {
        setPityCount(getCurrentPity());
        setHistory(getGachaHistory());
    };

    const showGachaResults = (results) => {
        const hasSSR = results.some((result) => result.rarity === 'SSR');

        if (hasSSR) {
            setShowJackpot(true);
            setTimeout(() => {
                setShowJackpot(false);
                setGachaResults(results);
            }, 3000);
        } else {
            setGachaResults(results);
        }

        setShowVideo(false);
        setPendingResults(null);
        refreshGachaState();

        updateStats?.((currentStats) => ({
            inventory: addResultsToInventory(currentStats?.inventory || [], results),
        }));
    };

    const handleGacha = (count) => {
        const cost = count === 1 ? GACHA_COST.SINGLE : GACHA_COST.TEN;

        if (diamonds < cost) {
            alert(`ジェムが不足しています\n必要: ${cost}\n所持: ${diamonds}`);
            return;
        }

        updateStats?.({ diamonds: diamonds - cost });

        const results = performGacha(count);
        setPendingResults(results);

        if (IS_LITE_DEPLOY) {
            showGachaResults(results);
            return;
        }

        setShowVideo(true);

        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            audioRef.current = new Audio(GACHA_AUDIO);
            audioRef.current.play().catch(() => {});
        } catch {
            // noop
        }
    };

    const stopGachaAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    const handleVideoEnded = () => {
        if (pendingResults) {
            showGachaResults(pendingResults);
        }
        stopGachaAudio();
    };

    const handleSkip = () => {
        if (pendingResults) {
            showGachaResults(pendingResults);
        }
        stopGachaAudio();
    };

    const closeResults = () => {
        setGachaResults(null);
    };

    return (
        <div className="gacha-shell-page">
            <div className="gacha-mobile-frame">
                <header className="gacha-header">
                    <button className="gacha-back-btn" type="button" onClick={() => navigate('/home')} aria-label="ホームへ戻る">
                        <ChevronLeft size={22} />
                    </button>

                    <div className="gacha-header-copy">
                        <span>{currentSection.kicker}</span>
                        <h1>ガチャ</h1>
                    </div>

                    <div className="gacha-header-wallet" aria-label="所持ジェム">
                        <Diamond size={16} />
                        <strong>{formatNumber(diamonds)}</strong>
                    </div>
                </header>

                <section
                    className={`gacha-scene is-${currentSection.accentClass}`}
                    style={{ '--gacha-scene-bg': `url(${BgClassroom})` }}
                >
                    <div className="gacha-scene-overlay" aria-hidden="true" />

                    <div className="gacha-scene-top">
                        <div className="gacha-tabs" aria-label="ガチャ種別">
                            {Object.entries(SECTION_CONFIG).map(([sectionKey, section]) => (
                                <button
                                    key={sectionKey}
                                    type="button"
                                    className={`gacha-tab ${activeSection === sectionKey ? 'is-active' : ''}`}
                                    onClick={() => setActiveSection(sectionKey)}
                                >
                                    {section.label}
                                </button>
                            ))}
                        </div>

                        <div className="gacha-hero-bubble">
                            <p className="gacha-hero-kicker">{currentSection.kicker}</p>
                            <h2>{currentSection.title}</h2>
                            <p className="gacha-hero-subtitle">{currentSection.subtitle}</p>

                            <div className="gacha-hero-tags">
                                {currentSection.rateLines.map((line) => (
                                    <span key={line}>{line}</span>
                                ))}
                            </div>

                            <div className="gacha-hero-affection">
                                <span className="gacha-hero-affection-level">
                                    <Heart size={14} />
                                    Lv.{affectionLevelInfo.level}
                                </span>
                                <span className="gacha-hero-affection-progress">{affectionLabel}</span>
                            </div>
                            <div className="gacha-hero-affection-bar" aria-hidden="true">
                                <div className="gacha-hero-affection-fill" style={{ width: `${affectionProgress}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="gacha-character-zone" aria-hidden="true">
                        <div className="gacha-character-halo" />
                        <img className="gacha-character-image" src={NoahNormal} alt="" />
                    </div>

                    <section className="gacha-bottom-sheet">
                        <div className="gacha-bottom-sheet-body">
                            <div className="gacha-sheet-head">
                                <div>
                                    <p className="gacha-sheet-label">{currentSection.label}</p>
                                    <strong>{currentSection.note}</strong>
                                </div>

                                <button type="button" className="gacha-sheet-link" onClick={() => navigate('/missions')}>
                                    集める
                                </button>
                            </div>

                            <div className="gacha-sheet-stats">
                                <article className="gacha-sheet-stat">
                                    <span>ジェム</span>
                                    <strong>{formatNumber(diamonds)}</strong>
                                </article>

                                <article className="gacha-sheet-stat is-progress">
                                    <div className="gacha-sheet-stat-row">
                                        <span>ポイント</span>
                                        <strong>{pityCount} / 100</strong>
                                    </div>
                                    <div className="gacha-point-bar">
                                        <div className="gacha-point-fill" style={{ width: `${pityProgress}%` }} />
                                    </div>
                                </article>
                            </div>

                            <div className="gacha-feature-strip" aria-label="注目アイテム">
                                {featuredItems.map((item, index) => (
                                    <article key={`${activeSection}-${item.id}-${index}`} className="gacha-feature-card">
                                        <span className={`gacha-feature-rarity rarity-${item.rarity}`}>
                                            {index === 1 ? 'NEW' : item.rarity}
                                        </span>
                                        <div className="gacha-feature-emoji">{item.emoji || '✦'}</div>
                                        <strong>{item.name}</strong>
                                    </article>
                                ))}
                            </div>

                            <div className="gacha-tool-row">
                                <button type="button" className="gacha-tool-button" onClick={() => setShowHistory(true)}>
                                    <Clock3 size={16} />
                                    <span>履歴 {historyCount}</span>
                                </button>

                                <button type="button" className="gacha-tool-button" onClick={() => setShowRates(true)}>
                                    <Percent size={16} />
                                    <span>割合</span>
                                </button>

                                <button type="button" className="gacha-tool-button" onClick={() => navigate('/character')}>
                                    <Search size={16} />
                                    <span>キャラ</span>
                                </button>
                            </div>
                        </div>

                        <div className="gacha-bottom-sheet-footer">
                            <div className="gacha-draw-buttons">
                                <button
                                    type="button"
                                    className="gacha-draw-btn is-single"
                                    onClick={() => handleGacha(1)}
                                    disabled={showVideo}
                                >
                                    <span className="gacha-draw-label">1回</span>
                                    <strong>{GACHA_COST.SINGLE}</strong>
                                    <span className="gacha-draw-cost">
                                        <Diamond size={14} />
                                        単発
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="gacha-draw-btn is-ten"
                                    onClick={() => handleGacha(10)}
                                    disabled={showVideo}
                                >
                                    <span className="gacha-draw-badge">SR+</span>
                                    <span className="gacha-draw-label">10回</span>
                                    <strong>{GACHA_COST.TEN}</strong>
                                    <span className="gacha-draw-cost">
                                        <Diamond size={14} />
                                        10連
                                    </span>
                                </button>
                            </div>
                        </div>
                    </section>
                </section>

                <nav className="gacha-bottom-nav" aria-label="下部メニュー">
                    {NAV_ITEMS.map(({ id, label, icon: Icon, to }) => (
                        <button
                            key={id}
                            type="button"
                            className={`gacha-bottom-item ${id === 'gacha' ? 'is-active' : ''}`}
                            onClick={() => navigate(to)}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {showVideo && (
                <div className="video-overlay" onClick={handleSkip}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="gacha-video"
                        onEnded={handleVideoEnded}
                        onError={() => {
                            if (pendingResults) {
                                showGachaResults(pendingResults);
                            }
                        }}
                    >
                        <source src={GACHA_VIDEO} type="video/mp4" />
                    </video>
                    <div className="skip-hint">タップでスキップ</div>
                </div>
            )}

            {showJackpot && (
                <div className="jackpot-overlay">
                    <div className="jackpot-content">
                        <h1 className="jackpot-title">SSR!</h1>
                        <img src={JACKPOT_CHARACTER} alt="SSR visual" className="jackpot-character" />
                        <div className="jackpot-sparkles">✨ ✨ ✨</div>
                    </div>
                </div>
            )}

            {gachaResults && (
                <div className="result-overlay" onClick={closeResults}>
                    <div className="result-particles">
                        {Array.from({ length: 20 }).map((_, index) => (
                            <div
                                key={index}
                                className={`particle particle-${index % 5}`}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2.2}s`,
                                    animationDuration: `${2.2 + Math.random() * 2.8}s`,
                                }}
                            />
                        ))}
                    </div>

                    <div className="results-modal-rich" onClick={(event) => event.stopPropagation()}>
                        <button className="close-btn-x" type="button" onClick={closeResults} aria-label="閉じる">
                            <X size={20} />
                        </button>

                        <div className="result-title-area">
                            <h3 className="result-title-rich">ガチャ結果</h3>
                            <div className="result-summary">
                                {gachaResults.length}件
                                {gachaResults.some((item) => item.rarity === 'SSR') && <span className="summary-ssr">SSR</span>}
                                {gachaResults.some((item) => item.rarity === 'SR') && <span className="summary-sr">SR</span>}
                            </div>
                        </div>

                        <div className="results-grid-rich">
                            {gachaResults.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className={`result-card-rich rarity-${item.rarity}`}
                                    style={{ animationDelay: `${index * 0.09}s` }}
                                >
                                    {(item.rarity === 'SSR' || item.rarity === 'SR') && (
                                        <div className={`card-glow glow-${item.rarity}`} />
                                    )}

                                    <div className={`rarity-ribbon ribbon-${item.rarity}`}>
                                        {RARITY[item.rarity]?.label || item.rarity}
                                    </div>

                                    <div className="card-emoji">{item.emoji}</div>
                                    <div className="card-name">{item.name}</div>
                                    <div className="card-rarity-label" style={{ color: RARITY[item.rarity]?.color }}>
                                        {item.rarity}
                                    </div>

                                    {item.isPity && <div className="badge-pity">天井</div>}
                                    {item.isNew && <div className="badge-new">NEW</div>}
                                </div>
                            ))}
                        </div>

                        <button className="close-btn-result-rich" type="button" onClick={closeResults}>
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showHistory && (
                <div className="modal-overlay" onClick={() => setShowHistory(false)}>
                    <div className="history-modal-cute" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header-cute">
                            <h3>ガチャ履歴</h3>
                            <button type="button" onClick={() => setShowHistory(false)} aria-label="閉じる">×</button>
                        </div>

                        <div className="history-list">
                            {history.length === 0 ? (
                                <p className="empty-message">まだ履歴はありません</p>
                            ) : (
                                history.map((entry) => (
                                    <div key={entry.id} className="history-entry">
                                        <div className="entry-header">
                                            <span className="entry-date">{new Date(entry.timestamp).toLocaleString('ja-JP')}</span>
                                            <span className="entry-count">{entry.count}回</span>
                                        </div>
                                        <div className="entry-results">
                                            {entry.results.map((item, index) => (
                                                <span
                                                    key={`${entry.id}-${index}`}
                                                    className="mini-result"
                                                    style={{ color: RARITY[item.rarity]?.color }}
                                                >
                                                    {item.emoji}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showRates && (
                <div className="modal-overlay" onClick={() => setShowRates(false)}>
                    <div className="history-modal-cute rates-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header-cute">
                            <h3>提供割合</h3>
                            <button type="button" onClick={() => setShowRates(false)} aria-label="閉じる">×</button>
                        </div>

                        <div className="history-list">
                            <div className="rates-list-compact">
                                {Object.entries(RARITY).reverse().map(([rarityKey, rarityData]) => (
                                    <div key={rarityKey} className="rate-item-compact">
                                        <span className="rate-rarity" style={{ color: rarityData.color }}>
                                            {rarityKey}
                                        </span>
                                        <strong>{rarityData.rate}%</strong>
                                    </div>
                                ))}
                            </div>
                            <p className="rate-note-small">10連でSR以上1個確定</p>
                            <p className="rate-note-small">100pt到達でSSR確定</p>
                            <p className="rate-note-small">レイアウト優先の軽い構成です</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gacha;
