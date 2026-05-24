import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    ChevronLeft,
    Clock3,
    Diamond,
    Heart,
    HelpCircle,
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
import { ALL_GACHA_ITEMS, RARITY } from '../data/gachaItems';
import { getAffectionLevel, getAffectionProgress, getNextLevel } from '../utils/affectionUtils';
import ItemVisual from '../components/ItemVisual';
import './Gacha.css';

const IS_LITE_DEPLOY = import.meta.env.VITE_LITE_DEPLOY === 'true';

const GACHA_VIDEO = '/gacha_animation (2).mp4';
const GACHA_AUDIO = '/audio/gacha.mp3';
const JACKPOT_CHARACTER = '/jackpot_character.jpg';

const PITY_LIMIT = 100;

const ITEM_TYPE_LABELS = {
    accessory: 'アクセ',
    assist: 'おたすけ',
    background: '背景',
    boost: 'ブースト',
    gift: 'ギフト',
    illustration: '思い出',
    skin: '衣装',
    special: '特別',
    story_unlock: '物語',
    voice: 'ボイス',
};

const getItemById = (itemId) => ALL_GACHA_ITEMS.find((item) => item.id === itemId) || null;

const SECTION_CONFIG = {
    pickup: {
        label: 'ピックアップ',
        kicker: '学習のごほうび',
        title: '放課後ピックアップ',
        subtitle: 'ボイスや思い出を集めて、二人の時間を少しずつ解放',
        description: '学習後に引きたい、関係進行寄りのごほうび枠。会話・思い出・ストーリーキーを前に出します。',
        rateLines: ['SSR 1% / SR 5%', 'ストーリーキー・ボイス中心'],
        rewardHeadline: '次の約束につながる報酬',
        rewardCopy: '復習やミッションで集めたジェムを、会話や思い出の解放に変える導線です。',
        singleBadge: 'おすすめ',
        featuredItemIds: ['story_unlock_after_school', 'voice_after_school_invite', 'illustration_library_smile'],
        accentClass: 'pickup',
    },
    premium: {
        label: 'プレミアム',
        kicker: '着せ替えを増やす',
        title: 'プレミアムガチャ',
        subtitle: '衣装や背景でホームの空気感をまるごと更新',
        description: 'ホーム画面の見た目を変える衣装・背景・アクセ中心の枠。集めたあとも変化が見えやすい報酬です。',
        rateLines: ['SSR 1% / SR 5%', '衣装・背景・アクセ中心'],
        rewardHeadline: 'ホームを着せ替える報酬',
        rewardCopy: '看板になる衣装や背景を狙いたい時の枠。日々のホーム体験を少しずつ豪華にできます。',
        singleBadge: '衣装狙い',
        featuredItemIds: ['skin_casual_fall', 'bg_sunset', 'accessory_witch_hat'],
        accentClass: 'premium',
    },
    normal: {
        label: 'ノーマル',
        kicker: '毎日の積み上げ',
        title: 'デイリーごほうび',
        subtitle: '学習補助や小さなギフトを気軽に回収',
        description: 'おたすけや日常系アイテムを集める軽めの枠。ちょっと回して使える報酬を増やす想定です。',
        rateLines: ['SSR 1% / SR 5%', 'おたすけ・小物中心'],
        rewardHeadline: '軽く回せる補助報酬',
        rewardCopy: '消耗品や小さなごほうびを足して、次の学習を少し進めやすくするための枠です。',
        singleBadge: '気軽に',
        featuredItemIds: ['assist_eliminate_choice', 'assist_chain_guard', 'assist_time_extend'],
        accentClass: 'normal',
    },
};

const FEATURED_ITEMS_BY_SECTION = {
    pickup: SECTION_CONFIG.pickup.featuredItemIds.map(getItemById).filter(Boolean),
    premium: SECTION_CONFIG.premium.featuredItemIds.map(getItemById).filter(Boolean),
    normal: SECTION_CONFIG.normal.featuredItemIds.map(getItemById).filter(Boolean),
};

const NAV_ITEMS = [
    { id: 'home', label: 'ホーム', icon: Home, to: '/home' },
    { id: 'study', label: '学習', icon: BookOpen, to: '/study' },
    { id: 'gacha', label: 'ガチャ', icon: Sparkles, to: '/gacha' },
    { id: 'character', label: 'キャラ', icon: Users, to: '/character' },
    { id: 'menu', label: 'メニュー', icon: Menu, to: '/home' },
];

const formatNumber = (value) => Number(value || 0).toLocaleString('ja-JP');

const annotateResultsWithInventoryState = (results = [], inventory = []) => {
    const ownedItemIds = new Set((inventory || []).map((entry) => entry.itemId));
    const seenDuringDraw = new Set(ownedItemIds);

    return results.map((item) => {
        const isNew = item.type !== 'dummy' && !seenDuringDraw.has(item.id);
        seenDuringDraw.add(item.id);

        return {
            ...item,
            isNew,
        };
    });
};

const getResultDestination = (results = []) => {
    if (results.some((item) => item.type === 'voice')) {
        return {
            label: 'ボイスを見る',
            to: '/voice-collection',
        };
    }

    return {
        label: 'アイテムを見る',
        to: '/inventory',
    };
};

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
    const pityRemaining = Math.max(PITY_LIMIT - pityCount, 0);
    const stageLeadItem = featuredItems[1] || featuredItems[0] || null;
    const stageSideItems = featuredItems.filter((item) => item?.id !== stageLeadItem?.id).slice(0, 2);
    const featuredTypeLabels = useMemo(
        () => [...new Set(featuredItems.map((item) => ITEM_TYPE_LABELS[item.type] || '報酬'))].slice(0, 3),
        [featuredItems],
    );
    const latestHistory = history[0] || null;
    const resultDestination = useMemo(() => getResultDestination(gachaResults || []), [gachaResults]);
    const newResultCount = useMemo(
        () => (gachaResults || []).filter((item) => item.isNew).length,
        [gachaResults],
    );

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

        const results = annotateResultsWithInventoryState(
            performGacha(count),
            stats?.inventory || [],
        );
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
            audioRef.current.play().catch(() => { });
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
            <div className="gacha-page-frame">
                <header className="gacha-topbar">
                    <div className="gacha-topbar-left">
                        <button className="gacha-back-btn" type="button" onClick={() => navigate('/shop')} aria-label="購買部へ戻る">
                            <ChevronLeft size={28} />
                        </button>

                        <div className="gacha-title-block">
                            <h1>ガチャ</h1>
                            <button className="gacha-help-btn" type="button" onClick={() => setShowRates(true)} aria-label="提供割合を見る">
                                <HelpCircle size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="gacha-topbar-stats">
                        <div className="gacha-stat-card">
                            <div className="gacha-stat-head">
                                <Diamond size={18} />
                                <span>ジェム</span>
                            </div>
                            <strong>{formatNumber(diamonds)}</strong>
                        </div>

                        <div className="gacha-stat-card affection">
                            <div className="gacha-stat-head">
                                <Heart size={18} />
                                <span>好感度</span>
                            </div>
                            <div className="gacha-affection-row">
                                <span className="gacha-affection-level">Lv.{affectionLevelInfo.level}</span>
                                <span className="gacha-affection-progress">
                                    {formatNumber(affection)}
                                    {nextAffectionLevel ? ` / ${formatNumber(nextAffectionLevel.points)}` : ' / MAX'}
                                </span>
                            </div>
                            <div className="gacha-affection-bar">
                                <div className="gacha-affection-fill" style={{ width: `${affectionProgress}%` }} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="gacha-stage-layout">
                    <aside className="gacha-side-tabs" aria-label="ガチャ種別">
                        {Object.entries(SECTION_CONFIG).map(([sectionKey, section]) => (
                            <button
                                key={sectionKey}
                                type="button"
                                className={`gacha-side-tab ${activeSection === sectionKey ? 'is-active' : ''}`}
                                onClick={() => setActiveSection(sectionKey)}
                            >
                                <span className="gacha-side-tab-kicker">{sectionKey === 'pickup' ? '✦' : sectionKey === 'premium' ? '◈' : '○'}</span>
                                <span>{section.label}</span>
                            </button>
                        ))}
                    </aside>

                    <section className={`gacha-stage-card is-${currentSection.accentClass}`}>
                        <div className="gacha-stage-backdrop" />
                        <div className="gacha-stage-sparkles" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <div className="gacha-mobile-hero">
                            <div className="gacha-mobile-copy">
                                <p className="gacha-mobile-kicker">{currentSection.kicker}</p>
                                <h2>{currentSection.title}</h2>
                                <p className="gacha-mobile-rate">{currentSection.rateLines[0]}</p>
                            </div>

                            {stageLeadItem && (
                                <article className={`gacha-mobile-reward-card rarity-${stageLeadItem.rarity}`}>
                                    <ItemVisual item={stageLeadItem} className="gacha-mobile-reward-visual" alt={stageLeadItem.name} />
                                    <div className="gacha-mobile-reward-copy">
                                        <span className="gacha-mobile-reward-type">
                                            {ITEM_TYPE_LABELS[stageLeadItem.type] || '報酬'}
                                        </span>
                                        <strong>{stageLeadItem.name}</strong>
                                        <span className="gacha-mobile-reward-rarity">{stageLeadItem.rarity}</span>
                                    </div>
                                </article>
                            )}

                            <div className="gacha-mobile-chip-row" aria-hidden="true">
                                {featuredTypeLabels.slice(0, 2).map((label) => (
                                    <span key={label}>{label}</span>
                                ))}
                            </div>
                        </div>

                        <div className="gacha-stage-main">
                            <div className="gacha-stage-art">
                                <div className="gacha-placeholder-caption">Reward Focus</div>
                                <div className="gacha-stage-type-chips" aria-hidden="true">
                                    {featuredTypeLabels.map((label) => (
                                        <span key={label}>{label}</span>
                                    ))}
                                </div>
                                <div className="gacha-stage-showcase">
                                    {stageSideItems[0] && (
                                        <article className="gacha-stage-side-card is-left">
                                            <div className="gacha-stage-side-rarity">{stageSideItems[0].rarity}</div>
                                            <ItemVisual item={stageSideItems[0]} className="gacha-stage-side-visual" alt={stageSideItems[0].name} />
                                            <strong>{stageSideItems[0].name}</strong>
                                        </article>
                                    )}

                                    {stageLeadItem && (
                                        <article className={`gacha-stage-hero-card rarity-${stageLeadItem.rarity}`}>
                                            <div className="gacha-stage-hero-badge">
                                                {ITEM_TYPE_LABELS[stageLeadItem.type] || '報酬'}
                                            </div>
                                            <ItemVisual item={stageLeadItem} className="gacha-stage-hero-visual" alt={stageLeadItem.name} />
                                            <div className="gacha-stage-hero-copy">
                                                <span>{stageLeadItem.rarity}</span>
                                                <strong>{stageLeadItem.name}</strong>
                                                <p>{stageLeadItem.description}</p>
                                            </div>
                                        </article>
                                    )}

                                    {stageSideItems[1] && (
                                        <article className="gacha-stage-side-card is-right">
                                            <div className="gacha-stage-side-rarity">{stageSideItems[1].rarity}</div>
                                            <ItemVisual item={stageSideItems[1]} className="gacha-stage-side-visual" alt={stageSideItems[1].name} />
                                            <strong>{stageSideItems[1].name}</strong>
                                        </article>
                                    )}
                                </div>
                            </div>

                            <div className="gacha-stage-copy">
                                <div className="gacha-stage-copy-inner">
                                    <p className="gacha-stage-kicker">{currentSection.kicker}</p>
                                    <h2>{currentSection.title}</h2>
                                    <p className="gacha-stage-subtitle">{currentSection.subtitle}</p>
                                    <p className="gacha-stage-description">{currentSection.description}</p>

                                    <div className="gacha-rate-summary">
                                        {currentSection.rateLines.map((line) => (
                                            <span key={line}>{line}</span>
                                        ))}
                                    </div>

                                    <div className="gacha-stage-loop-card">
                                        <strong>{currentSection.rewardHeadline}</strong>
                                        <p>{currentSection.rewardCopy}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="gacha-stage-tools">
                                <button type="button" className="gacha-square-tool" onClick={() => setShowHistory(true)}>
                                    <Clock3 size={22} />
                                    <span>ガチャ履歴</span>
                                </button>

                                <button type="button" className="gacha-square-tool" onClick={() => setShowRates(true)}>
                                    <Percent size={22} />
                                    <span>提供割合</span>
                                </button>

                                <button type="button" className="gacha-detail-link" onClick={() => navigate('/character')}>
                                    <Search size={18} />
                                    <span>キャラ詳細</span>
                                </button>
                            </div>
                        </div>

                        <div className="gacha-draw-area">
                            <div className="gacha-wallet-pill">
                                <div className="gacha-wallet-left">
                                    <Diamond size={18} />
                                    <span>所持ジェム</span>
                                </div>
                                <strong>{formatNumber(diamonds)}</strong>
                                <button type="button" className="gacha-wallet-plus" onClick={() => navigate('/missions')} aria-label="ジェムを集める">
                                    +
                                </button>
                            </div>

                            <div className="gacha-mobile-shortcuts">
                                <button type="button" className="gacha-mobile-shortcut" onClick={() => setShowHistory(true)}>
                                    ガチャ履歴
                                </button>
                                <button type="button" className="gacha-mobile-shortcut" onClick={() => setShowRates(true)}>
                                    提供割合
                                </button>
                            </div>

                            <div className="gacha-draw-buttons">
                                <button
                                    type="button"
                                    className="gacha-draw-btn is-single"
                                    onClick={() => handleGacha(1)}
                                    disabled={showVideo}
                                >
                                    <span className="gacha-draw-badge">{currentSection.singleBadge}</span>
                                    <strong>1回引く</strong>
                                    <span className="gacha-draw-subcopy">気軽に1回</span>
                                    <span className="gacha-draw-cost">
                                        <Diamond size={16} />
                                        {GACHA_COST.SINGLE}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="gacha-draw-btn is-ten"
                                    onClick={() => handleGacha(10)}
                                    disabled={showVideo}
                                >
                                    <strong>10回引く</strong>
                                    <span className="gacha-draw-subcopy">一気に集める</span>
                                    <span className="gacha-draw-cost">
                                        <Diamond size={16} />
                                        {GACHA_COST.TEN}
                                    </span>
                                    <span className="gacha-draw-badge bottom">SR以上1枚確定！</span>
                                </button>
                            </div>

                            <p className="gacha-draw-note">
                                学習やミッションでジェムを集めて、あと
                                {' '}
                                <strong>{pityRemaining}</strong>
                                {' '}
                                回でSSR確定です。
                            </p>
                        </div>
                    </section>
                </div>

                <section className="gacha-featured-section">
                    <div className="gacha-section-title">✧ {currentSection.label}注目報酬 ✧</div>

                    <div className="gacha-featured-grid">
                        {featuredItems.map((item, index) => (
                            <article
                                key={`${activeSection}-${item.id}-${index}`}
                                className={`gacha-feature-card ${index === 1 ? 'is-center' : ''}`}
                            >
                                <div className={`gacha-feature-visual rarity-${item.rarity}`}>
                                    <span className="gacha-feature-tag">
                                        {index === 1 ? 'NEW!' : item.rarity}
                                    </span>
                                    <ItemVisual item={item} className="gacha-feature-item-visual" alt={item.name} />
                                    <div className="gacha-feature-placeholder-label">
                                        {ITEM_TYPE_LABELS[item.type] || 'Reward'}
                                    </div>
                                </div>

                                <div className="gacha-feature-copy">
                                    <div className="gacha-feature-rarity">{item.rarity}</div>
                                    <strong>{item.name}</strong>
                                    <p>{item.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="gacha-feature-dots" aria-hidden="true">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <span key={index} className={index === 3 ? 'is-active' : ''} />
                        ))}
                    </div>
                </section>

                <section className="gacha-progress-row">
                    <button type="button" className="gacha-exchange-card" onClick={() => navigate(resultDestination.to)}>
                        <div className="gacha-mini-icon">🎁</div>
                        <div className="gacha-progress-copy">
                            <strong>{resultDestination.label}</strong>
                            <span>{latestHistory ? `最新 ${latestHistory.count} 件` : '集めた報酬を確認'}</span>
                        </div>
                        {latestHistory && (
                            <div className="gacha-recent-icons" aria-hidden="true">
                                {latestHistory.results.slice(0, 4).map((item, index) => (
                                    <span key={`${latestHistory.id}-${item.id}-${index}`}>{item.emoji || '✦'}</span>
                                ))}
                            </div>
                        )}
                    </button>

                    <article className="gacha-point-card">
                        <div className="gacha-progress-copy">
                            <strong>ガチャポイント</strong>
                            <span>{pityCount} / 100</span>
                        </div>
                        <div className="gacha-point-bar">
                            <div className="gacha-point-fill" style={{ width: `${pityProgress}%` }} />
                        </div>
                        <span className="gacha-point-note">100ptでSSR確定！</span>
                    </article>
                </section>

                <nav className="gacha-bottom-nav" aria-label="下部メニュー">
                    {NAV_ITEMS.map(({ id, label, icon: Icon, to }) => (
                        <button
                            key={id}
                            type="button"
                            className={`gacha-bottom-item ${id === 'gacha' ? 'is-active' : ''}`}
                            onClick={() => navigate(to)}
                        >
                            <Icon size={24} />
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
                        {Array.from({ length: 24 }).map((_, index) => (
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
                            <X size={22} />
                        </button>

                        <div className="result-title-area">
                            <h3 className="result-title-rich">ガチャ結果</h3>
                            <div className="result-summary">
                                {gachaResults.length}件獲得
                                {newResultCount > 0 && <span className="summary-new">NEW {newResultCount}</span>}
                                {gachaResults.some((item) => item.rarity === 'SSR') && <span className="summary-ssr">SSR!</span>}
                                {gachaResults.some((item) => item.rarity === 'SR') && <span className="summary-sr">SR!</span>}
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

                                    <ItemVisual item={item} className="gacha-result-item-visual" alt={item.name} />
                                    <div className="card-name">{item.name}</div>
                                    <div className="card-rarity-label" style={{ color: RARITY[item.rarity]?.color }}>
                                        {item.rarity}
                                    </div>

                                    {item.isPity && <div className="badge-pity">天井</div>}
                                    {item.isNew && <div className="badge-new">NEW</div>}
                                </div>
                            ))}
                        </div>

                        <div className="result-action-row">
                            <button
                                className="result-secondary-btn"
                                type="button"
                                onClick={() => {
                                    closeResults();
                                    navigate(resultDestination.to);
                                }}
                            >
                                {resultDestination.label}
                            </button>
                            <button className="close-btn-result-rich" type="button" onClick={closeResults}>
                                OK
                            </button>
                        </div>
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
                            <p className="rate-note-small">学習のごほうび導線として、ボイスや思い出の報酬を集める想定です</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gacha;
