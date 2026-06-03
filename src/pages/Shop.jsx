import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    Clock3,
    Diamond,
    HelpCircle,
    Image as ImageIcon,
    PackageCheck,
    Shirt,
    Sparkles,
    Volume2,
    Wand2,
    X,
} from 'lucide-react';
import CharacterStage from '../components/character/CharacterStage';
import ItemVisual from '../components/ItemVisual';
import { getCharacterLabel } from '../data/characterData';
import { ALL_ITEMS } from '../data/itemData';
import { updateStatsOnShop } from '../utils/achievementUtils';
import { createHomePose } from '../utils/characterPoseUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { addToInventory, getInventoryItemQuantity, isStackableItem } from '../utils/itemUtils';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import './Shop.css';

const SHOP_HISTORY_KEY = 'shop_purchase_history';

const CATEGORIES = ['おすすめ', 'おたすけ', '衣装', '背景', 'ボイス', 'アクセ', '特別'];

const RARITY_LABELS = {
    SSR: 'プレミアム',
    SR: 'レア',
    R: 'ベーシック',
    N_PLUS: 'ノーマル+',
    N: 'ノーマル',
};

const CATEGORY_SCENE_COPY = {
    おすすめ: {
        badge: 'PICK UP',
        emotion: 'smile',
        intro: 'まずは持っていないもの中心で見やすく並べています。',
        speech: (name) => `今日は「${name}」から見てみよっか。気になるものをひとつずつ選べるよ。`,
        empty: '気になるものから、ゆっくり見ていこっか。',
    },
    おたすけ: {
        badge: 'SUPPORT',
        emotion: 'happy',
        intro: '学習中に使いやすい消耗品をまとめています。',
        speech: (name) => `困ったときは「${name}」みたいなおたすけアイテムが便利だよ。`,
        empty: 'クイズを少し楽にしたいときに使えるよ。',
    },
    衣装: {
        badge: 'DRESS UP',
        emotion: 'happy',
        intro: 'ホームや学習画面の空気を変えたいときの着せ替えです。',
        speech: (name) => `「${name}」に着替えると、いつもの雰囲気もけっこう変わるよ。`,
        empty: '気分を変えたい日に着せ替えを選んでみてね。',
    },
    背景: {
        badge: 'SCENE',
        emotion: 'normal',
        intro: 'いっしょに過ごす場所を変えられる背景コレクションです。',
        speech: (name) => `「${name}」にすると、部屋の空気まで変わる感じがするよ。`,
        empty: '背景を変えると、ホームの印象もがらっと変わるよ。',
    },
    ボイス: {
        badge: 'VOICE',
        emotion: 'smile',
        intro: '節目の演出に向いたボイス系アイテムです。',
        speech: (name) => `「${name}」はコレクション向き。あとで聞き返したくなるかも。`,
        empty: '声まわりのコレクションを少しずつ増やしていけるよ。',
    },
    アクセ: {
        badge: 'ACCENT',
        emotion: 'happy',
        intro: 'Live2D や見た目に小さな変化を足せるアクセです。',
        speech: (name) => `「${name}」みたいな小物は、仕上げに足すとかわいいよ。`,
        empty: '最後のひと味を足したいときにぴったりだよ。',
    },
    特別: {
        badge: 'SPECIAL',
        emotion: 'surprised',
        intro: '記念に残したい特別アイテムだけを集めています。',
        speech: (name) => `「${name}」はちょっと特別。取っておきたくなるラインだよ。`,
        empty: '特別なものだけ、ここにそっと並べてあるよ。',
    },
};

const PRODUCT_DETAIL_COPY = {
    assist: {
        icon: Sparkles,
        headline: 'ソロの早押しクイズで使える学習補助アイテムです',
        usage: '持っている分だけソロクイズ中に使えます。使うと1個消費されます。',
        highlights: ['消耗品として複数所持可能', 'ソロ対戦中にのみ使用', '1プレイで各種類1回まで'],
    },
    skin: {
        icon: Shirt,
        headline: '着せ替えでホームの雰囲気を変えられます',
        usage: '交換後はアイテムボックスから装備できます。',
        highlights: ['キャラ画面で装備可能', 'ホームや学習画面に反映', 'Live2D未対応時は静止画で表示'],
    },
    background: {
        icon: ImageIcon,
        headline: 'お気に入りの場所で一緒に過ごせます',
        usage: '交換後はアイテムボックスから背景を変更できます。',
        highlights: ['背景プレビューつき', 'ホームの空気感を変更', '衣装と組み合わせ可能'],
    },
    voice: {
        icon: Volume2,
        headline: '学習の節目を彩るボイスコレクションです',
        usage: '交換後はコレクションとして保持されます。演出追加にあわせて使える予定です。',
        highlights: ['ボイス演出用アイテム', 'コレクション対象', '今後のホーム演出に拡張予定'],
    },
    accessory: {
        icon: Sparkles,
        headline: 'Live2Dの見た目にワンポイントを足せます',
        usage: '交換後はアイテムボックスから装備できます。ホームのLive2D表示に反映されます。',
        highlights: ['Live2Dパーツ連動', 'アイテムボックスで着脱', '衣装や背景と組み合わせ可能'],
    },
    special: {
        icon: Sparkles,
        headline: '特別な演出や思い出を残すための記念アイテムです',
        usage: '交換後は大切な特別アイテムとして保存されます。',
        highlights: ['限定感のある記念品', '思い出演出向け', 'コレクション対象'],
    },
};

const SHOP_CATALOG = [
    { itemId: 'assist_eliminate_choice', price: 60, category: 'おたすけ' },
    { itemId: 'assist_chain_guard', price: 90, category: 'おたすけ' },
    { itemId: 'assist_time_extend', price: 70, category: 'おたすけ' },
    { itemId: 'skin_casual', price: 320, category: '衣装' },
    { itemId: 'skin_casual_fall', price: 340, category: '衣装' },
    { itemId: 'skin_gym', price: 220, category: '衣装' },
    { itemId: 'skin_casual_gray_hoodie', price: 240, category: '衣装' },
    { itemId: 'bg_library', price: 280, category: '背景' },
    { itemId: 'bg_cafe', price: 260, category: '背景' },
    { itemId: 'bg_sunset', price: 420, category: '背景' },
    { itemId: 'voice_cheer_pack', price: 360, category: 'ボイス' },
    { itemId: 'voice_goodnight_pack', price: 340, category: 'ボイス' },
    { itemId: 'accessory_glasses', price: 180, category: 'アクセ' },
    { itemId: 'accessory_witch_hat', price: 420, category: 'アクセ' },
    { itemId: 'special_name_call_ticket', price: 520, category: '特別' },
    { itemId: 'special_memory_album', price: 480, category: '特別' },
];

const loadShopHistory = () => {
    try {
        const raw = localStorage.getItem(SHOP_HISTORY_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (error) {
        console.error('Error loading shop history:', error);
        return [];
    }
};

const saveShopHistory = (history) => {
    try {
        localStorage.setItem(SHOP_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving shop history:', error);
    }
};

const appendShopHistory = (entry) => {
    const currentHistory = loadShopHistory();
    const nextHistory = [entry, ...currentHistory].slice(0, 20);
    saveShopHistory(nextHistory);
};

const getCategoryLabel = (type) => {
    switch (type) {
        case 'assist':
            return 'おたすけ';
        case 'skin':
            return '衣装';
        case 'background':
            return '背景';
        case 'voice':
            return 'ボイス';
        case 'accessory':
            return 'アクセ';
        case 'special':
            return '特別';
        default:
            return 'おすすめ';
    }
};

const getProductDetailCopy = (product) => PRODUCT_DETAIL_COPY[product?.type] || {
    icon: PackageCheck,
    headline: '学習を少し楽しくしてくれるアイテムです',
    usage: '交換後はアイテムボックスで確認できます。',
    highlights: ['アイテムボックスに追加', '所持数を管理', '必要なタイミングで使用'],
};

const getRarityLabel = (rarity) => RARITY_LABELS[rarity] || rarity || 'ITEM';

const Shop = ({ stats, updateStats, onClose }) => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('おすすめ');
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [purchaseComplete, setPurchaseComplete] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [purchaseHistory, setPurchaseHistory] = useState(() => loadShopHistory());

    const diamonds = stats?.diamonds ?? 0;
    const inventory = stats?.inventory || [];
    const characterId = stats?.characterId || 'noah';
    const characterLabel = getCharacterLabel(characterId) || 'ノア';
    const equippedSkin = stats?.equippedSkin || 'default';
    const equippedAccessories = Array.isArray(stats?.equippedAccessories) ? stats.equippedAccessories : [];
    const preferredRenderer = stats?.characterRenderer;
    const canUseLive2D = hasLive2DModelConfig(characterId, equippedSkin);

    const ownedIds = useMemo(() => new Set(inventory.map((item) => item.itemId)), [inventory]);
    const inventoryQuantityById = useMemo(() => Object.fromEntries(
        inventory.map((item) => [item.itemId, Math.max(0, Number(item?.quantity) || 0)]),
    ), [inventory]);
    const renderer = useMemo(() => resolveCharacterRenderer({
        preferredRenderer: canUseLive2D ? 'live2d' : preferredRenderer,
        characterId,
        skinId: equippedSkin,
    }), [canUseLive2D, characterId, equippedSkin, preferredRenderer]);

    const products = useMemo(() => SHOP_CATALOG
        .map((catalogItem) => {
            const item = ALL_ITEMS.find((candidate) => candidate.id === catalogItem.itemId);
            if (!item) return null;

            return {
                ...item,
                price: catalogItem.price,
                category: catalogItem.category || getCategoryLabel(item.type),
            };
        })
        .filter(Boolean), []);

    const productMap = useMemo(
        () => Object.fromEntries(products.map((product) => [product.id, product])),
        [products],
    );
    const selectedProduct = selectedProductId ? productMap[selectedProductId] : null;

    const filteredProducts = useMemo(() => {
        if (activeCategory === 'おすすめ') {
            return products
                .filter((product) => isStackableItem(product) || !ownedIds.has(product.id))
                .slice(0, 6);
        }

        return products.filter((product) => product.category === activeCategory);
    }, [activeCategory, ownedIds, products]);

    const featuredProduct = selectedProduct || filteredProducts[0] || products[0] || null;
    const categorySceneCopy = CATEGORY_SCENE_COPY[activeCategory] || CATEGORY_SCENE_COPY.おすすめ;
    const heroCopy = featuredProduct
        ? categorySceneCopy.speech(featuredProduct.name)
        : categorySceneCopy.empty;
    const heroPose = useMemo(() => createHomePose({
        emotion: categorySceneCopy.emotion,
        text: heroCopy,
    }), [categorySceneCopy.emotion, heroCopy]);

    const handleBack = () => {
        if (onClose) {
            onClose();
            return;
        }

        navigate('/home');
    };

    const handleProductClick = (product) => {
        setSelectedProductId(product.id);
        setPurchaseComplete(false);
    };

    const closeModal = () => {
        setSelectedProductId(null);
        setShowConfirmDialog(false);
        setPurchaseComplete(false);
    };

    const handleConfirmPurchase = () => {
        if (!selectedProduct || diamonds < selectedProduct.price) {
            return;
        }

        const stackable = isStackableItem(selectedProduct);
        if (!stackable && ownedIds.has(selectedProduct.id)) {
            return;
        }

        updateStats?.((currentStats) => {
            const currentInventory = currentStats?.inventory || [];
            const currentOwned = currentInventory.some((item) => item.itemId === selectedProduct.id);

            if (currentOwned && !stackable) {
                return currentStats;
            }

            return {
                ...currentStats,
                diamonds: (currentStats?.diamonds || 0) - selectedProduct.price,
                inventory: addToInventory(currentInventory, selectedProduct, 1),
            };
        });

        appendShopHistory({
            id: `${selectedProduct.id}-${Date.now()}`,
            itemId: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            category: selectedProduct.category,
            timestamp: Date.now(),
        });
        setPurchaseHistory(loadShopHistory());
        setPurchaseComplete(true);
        setShowConfirmDialog(false);
        updateStatsOnShop();
    };

    const renderProductDetail = () => {
        if (!selectedProduct) return null;

        const owned = ownedIds.has(selectedProduct.id);
        const quantity = getInventoryItemQuantity(inventory, selectedProduct.id);
        const stackable = isStackableItem(selectedProduct);
        const detail = getProductDetailCopy(selectedProduct);
        const DetailIcon = detail.icon;
        const balanceAfterPurchase = diamonds - selectedProduct.price;

        return (
            <div className={`product-detail-shell product-detail-${selectedProduct.type}`}>
                <div className="product-detail-hero">
                    <div className="product-detail-art">
                        <ItemVisual
                            item={selectedProduct}
                            className="preview-image"
                            fallbackText={selectedProduct.name.charAt(0)}
                            alt={selectedProduct.name}
                        />
                    </div>
                    <div className="product-detail-badges">
                        <span className={`detail-rarity rarity-${selectedProduct.rarity}`}>
                            {selectedProduct.rarity}
                        </span>
                        <span className="detail-category">
                            <DetailIcon size={14} />
                            {selectedProduct.category}
                        </span>
                    </div>
                </div>

                <div className="product-detail-body">
                    <div className="modal-header-block">
                        <span className="modal-category">{getRarityLabel(selectedProduct.rarity)}</span>
                        <h2 className="modal-title">{selectedProduct.name}</h2>
                    </div>

                    <p className="detail-headline">{detail.headline}</p>
                    <p className="modal-description">{selectedProduct.description}</p>

                    <div className="detail-highlight-grid">
                        {detail.highlights.map((highlight) => (
                            <div key={highlight} className="detail-highlight-card">
                                <Wand2 size={15} />
                                <span>{highlight}</span>
                            </div>
                        ))}
                    </div>

                    {selectedProduct.type === 'voice' && (
                        <div className="voice-preview-panel" aria-label="ボイスプレビューのイメージ">
                            <Volume2 size={18} />
                            <div className="voice-wave" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                                <span />
                                <span />
                            </div>
                            <span>ボイスパック</span>
                        </div>
                    )}

                    <div className="detail-usage-note">
                        <PackageCheck size={16} />
                        <span>{detail.usage}</span>
                    </div>

                    <div className="detail-purchase-summary">
                        <div>
                            <span className="summary-label">価格</span>
                            <strong className="summary-price">
                                <Diamond size={16} className="diamond-icon-small" />
                                {selectedProduct.price}
                            </strong>
                        </div>
                        <div>
                            <span className="summary-label">所持数</span>
                            <strong className="summary-balance">×{quantity}</strong>
                        </div>
                        {(!owned || stackable) && (
                            <div>
                                <span className="summary-label">交換後</span>
                                <strong className={balanceAfterPurchase < 0 ? 'summary-balance insufficient' : 'summary-balance'}>
                                    {balanceAfterPurchase.toLocaleString()} ダイヤ
                                </strong>
                            </div>
                        )}
                    </div>

                    {purchaseComplete ? (
                        <div className="purchase-complete">
                            <Check size={20} />
                            <span>{stackable ? '追加しました' : '交換しました'}</span>
                        </div>
                    ) : owned && !stackable ? (
                        <div className="already-owned">
                            <Check size={16} />
                            <span>所持しています</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className={`purchase-btn ${diamonds < selectedProduct.price ? 'disabled' : ''}`}
                            onClick={() => setShowConfirmDialog(true)}
                            disabled={diamonds < selectedProduct.price}
                        >
                            <Diamond size={18} className="diamond-icon" />
                            <span>{selectedProduct.price} で交換する</span>
                        </button>
                    )}

                    {!owned && diamonds < selectedProduct.price && (
                        <p className="insufficient-notice">ダイヤが不足しています</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="shop-page">
            <div className="shop-scene-background" aria-hidden="true" />
            <div className="shop-scene-background-overlay" aria-hidden="true" />

            <div className="shop-container">
                <section className="shop-hero">
                    <div className="shop-scene-nav">
                        {onClose ? (
                            <button type="button" className="header-btn shop-nav-btn" onClick={handleBack} aria-label="戻る">
                                <ArrowLeft size={22} />
                            </button>
                        ) : (
                            <div className="shop-scene-badge">購買部</div>
                        )}

                        <div className="shop-nav-actions">
                            <button
                                type="button"
                                className="header-btn shop-nav-btn"
                                aria-label="購入履歴"
                                onClick={() => setShowHistory(true)}
                            >
                                <Clock3 size={19} />
                            </button>
                            <button
                                type="button"
                                className="header-btn shop-nav-btn"
                                aria-label="ヘルプ"
                                onClick={() => setShowHelp(true)}
                            >
                                <HelpCircle size={19} />
                            </button>
                        </div>
                    </div>

                    <div className="currency-bar">
                        <div className="currency-display">
                            <Diamond size={17} className="diamond-icon" />
                            <span className="currency-amount">{diamonds.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="shop-hero-character-zone" aria-hidden="true">
                        <div className="shop-hero-glow" />
                        <div className="shop-hero-character-frame">
                            <CharacterStage
                                characterId={characterId}
                                renderer={renderer}
                                skinId={equippedSkin}
                                accessoryIds={equippedAccessories}
                                pose={{ ...heroPose, scene: 'home' }}
                                scene="home"
                                className="shop-hero-character"
                                imageStyle={{
                                    height: '100%',
                                    width: '100%',
                                    '--character-stage-overflow': 'visible',
                                }}
                                alt={`${characterLabel} portrait`}
                            />
                        </div>
                    </div>

                    <div className="shop-hero-panel">
                        <div className="shop-scene-eyebrow">{categorySceneCopy.badge}</div>
                        <div className="shop-coach-card shop-speech-bubble">
                            <div className="shop-coach-name">{characterLabel}</div>
                            <p>{heroCopy}</p>
                        </div>
                    </div>
                </section>

                <section className="shop-workspace">
                    <div className="shop-control-panel">
                        <nav className="category-tabs" aria-label="カテゴリ">
                            {CATEGORIES.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    className={`tab-btn ${activeCategory === category ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </nav>

                        <main className="products-grid">
                            {filteredProducts.map((product) => {
                                const owned = ownedIds.has(product.id);
                                const quantity = inventoryQuantityById[product.id] || 0;
                                const stackable = isStackableItem(product);

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        className={`product-card ${owned && !stackable ? 'owned' : ''}`}
                                        onClick={() => handleProductClick(product)}
                                    >
                                        <div className="product-image-wrapper">
                                            <div className="product-card-topline">
                                                <span className="product-category">{product.category}</span>
                                                {(!owned || stackable) && (
                                                    <span className="product-price-chip">
                                                        <Diamond size={12} className="diamond-icon-small" />
                                                        {product.price}
                                                    </span>
                                                )}
                                            </div>

                                            <ItemVisual
                                                item={product}
                                                className="product-image"
                                                fallbackText={product.name.charAt(0)}
                                                alt={product.name}
                                            />

                                            {owned && (
                                                <div className="owned-badge">
                                                    <Check size={12} />
                                                    <span>{stackable ? `×${quantity}` : '所持中'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="product-info">
                                            <h3 className="product-name">{product.name}</h3>
                                            <p className="product-description">{product.description}</p>
                                            <div className="product-card-footer">
                                                <span className="product-rarity">{getRarityLabel(product.rarity)}</span>
                                                <span className="product-action-hint">詳細</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </main>
                    </div>
                </section>
            </div>

            {selectedProduct && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-handle" />
                        <button type="button" className="modal-close" onClick={closeModal} aria-label="閉じる">
                            <X size={20} />
                        </button>

                        <div className="modal-content">{renderProductDetail()}</div>
                    </div>
                </div>
            )}

            {showConfirmDialog && selectedProduct && (
                <div className="confirm-overlay" onClick={() => setShowConfirmDialog(false)}>
                    <div className="confirm-dialog" onClick={(event) => event.stopPropagation()}>
                        <h3 className="confirm-title">交換確認</h3>
                        <p className="confirm-message">
                            「{selectedProduct.name}」を
                            <br />
                            <strong>{selectedProduct.price} ダイヤ</strong>で交換しますか？
                        </p>
                        <div className="confirm-balance">
                            交換後の残高: {(diamonds - selectedProduct.price).toLocaleString()} ダイヤ
                        </div>
                        <div className="confirm-actions">
                            <button type="button" className="confirm-cancel" onClick={() => setShowConfirmDialog(false)}>
                                キャンセル
                            </button>
                            <button type="button" className="confirm-ok" onClick={handleConfirmPurchase}>
                                交換する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHistory && (
                <div className="confirm-overlay" onClick={() => setShowHistory(false)}>
                    <div className="sheet-dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="sheet-header">
                            <h3>購入履歴</h3>
                            <button type="button" className="sheet-close" onClick={() => setShowHistory(false)} aria-label="閉じる">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="sheet-body">
                            {purchaseHistory.length === 0 ? (
                                <p className="sheet-empty">まだ交換履歴はありません。</p>
                            ) : (
                                purchaseHistory.map((entry) => (
                                    <div key={entry.id} className="history-entry">
                                        <div>
                                            <p className="history-name">{entry.name}</p>
                                            <p className="history-meta">
                                                {entry.category} ・ {new Date(entry.timestamp).toLocaleString('ja-JP')}
                                            </p>
                                        </div>
                                        <div className="history-price">
                                            <Diamond size={14} className="diamond-icon-small" />
                                            <span>{entry.price}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showHelp && (
                <div className="confirm-overlay" onClick={() => setShowHelp(false)}>
                    <div className="sheet-dialog" onClick={(event) => event.stopPropagation()}>
                        <div className="sheet-header">
                            <h3>購買部について</h3>
                            <button type="button" className="sheet-close" onClick={() => setShowHelp(false)} aria-label="閉じる">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="sheet-body">
                            <p className="sheet-copy">
                                集めたダイヤで衣装や背景を交換できます。まずは下のカテゴリから気になるものを選んでください。
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shop;
