import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock3, HelpCircle, Diamond, X, Check } from 'lucide-react';
import { ALL_ITEMS } from '../data/itemData';
import ItemVisual from '../components/ItemVisual';
import { updateStatsOnShop } from '../utils/achievementUtils';
import './Shop.css';

const SHOP_HISTORY_KEY = 'shop_purchase_history';

const CATEGORIES = ['おすすめ', '衣装', '背景', 'ボイス', '特別'];

const SHOP_CATALOG = [
    { itemId: 'skin_casual', price: 320, category: '衣装' },
    { itemId: 'skin_casual_fall', price: 340, category: '衣装' },
    { itemId: 'skin_gym', price: 220, category: '衣装' },
    { itemId: 'skin_casual_gray_hoodie', price: 240, category: '衣装' },
    { itemId: 'bg_library', price: 280, category: '背景' },
    { itemId: 'bg_cafe', price: 260, category: '背景' },
    { itemId: 'bg_sunset', price: 420, category: '背景' },
    { itemId: 'voice_cheer_pack', price: 360, category: 'ボイス' },
    { itemId: 'voice_goodnight_pack', price: 340, category: 'ボイス' },
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

const buildInventoryEntry = (item) => ({
    itemId: item.id,
    name: item.name,
    type: item.type,
    rarity: item.rarity,
    emoji: item.emoji,
    description: item.description,
    quantity: 1,
});

const getCategoryLabel = (type) => {
    switch (type) {
        case 'skin':
            return '衣装';
        case 'background':
            return '背景';
        case 'voice':
            return 'ボイス';
        case 'special':
            return '特別';
        default:
            return 'おすすめ';
    }
};

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
    const ownedIds = useMemo(() => new Set(inventory.map((item) => item.itemId)), [inventory]);

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

    const productMap = useMemo(() => Object.fromEntries(products.map((product) => [product.id, product])), [products]);
    const selectedProduct = selectedProductId ? productMap[selectedProductId] : null;

    const filteredProducts = useMemo(() => {
        if (activeCategory === 'おすすめ') {
            return products
                .filter((product) => !ownedIds.has(product.id))
                .slice(0, 6);
        }

        return products.filter((product) => product.category === activeCategory);
    }, [activeCategory, ownedIds, products]);

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
        if (!selectedProduct || ownedIds.has(selectedProduct.id) || diamonds < selectedProduct.price) {
            return;
        }

        updateStats?.((currentStats) => {
            const currentInventory = currentStats?.inventory || [];
            const currentOwned = currentInventory.some((item) => item.itemId === selectedProduct.id);

            if (currentOwned) {
                return currentStats;
            }

            return {
                ...currentStats,
                diamonds: (currentStats?.diamonds || 0) - selectedProduct.price,
                inventory: [...currentInventory, buildInventoryEntry(selectedProduct)],
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

    return (
        <div className="shop-page">
            <div className="shop-container">
                <header className="shop-header">
                    <button className="header-btn" onClick={handleBack} aria-label="戻る">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="header-title">購買部</h1>
                    <div className="header-actions">
                        <button className="header-btn" aria-label="購入履歴" onClick={() => setShowHistory(true)}>
                            <Clock3 size={20} />
                        </button>
                        <button className="header-btn" aria-label="ヘルプ" onClick={() => setShowHelp(true)}>
                            <HelpCircle size={20} />
                        </button>
                    </div>
                </header>

                <div className="currency-bar">
                    <div className="currency-display">
                        <Diamond size={18} className="diamond-icon" />
                        <span className="currency-amount">{diamonds.toLocaleString()}</span>
                    </div>
                </div>

                <div className="shop-intro-card">
                    <p className="intro-heading">欲しいものを選んで交換できます</p>
                    <p className="intro-text">
                        衣装や背景、ボイスなどをダイヤで交換できます。
                        ダイヤはミッションや学習の積み重ねで集まります。
                    </p>
                </div>

                <nav className="category-tabs">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
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

                        return (
                            <button
                                key={product.id}
                                className={`product-card ${owned ? 'owned' : ''}`}
                                onClick={() => handleProductClick(product)}
                            >
                                <div className="product-image-wrapper">
                                    <ItemVisual
                                        item={product}
                                        className="product-image"
                                        fallbackText={product.name.charAt(0)}
                                        alt={product.name}
                                    />
                                    {owned && (
                                        <div className="owned-badge">
                                            <Check size={12} />
                                            <span>所持中</span>
                                        </div>
                                    )}
                                </div>
                                <div className="product-info">
                                    <div className="product-category">{product.category}</div>
                                    <h3 className="product-name">{product.name}</h3>
                                    <p className="product-description">{product.description}</p>
                                    {!owned && (
                                        <div className="product-price">
                                            <Diamond size={14} className="diamond-icon-small" />
                                            <span>{product.price}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </main>
            </div>

            {selectedProduct && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-handle" />
                        <button className="modal-close" onClick={closeModal} aria-label="閉じる">
                            <X size={20} />
                        </button>

                        <div className="modal-content">
                            <div className="modal-preview">
                                <ItemVisual
                                    item={selectedProduct}
                                    className="preview-image"
                                    fallbackText={selectedProduct.name.charAt(0)}
                                    alt={selectedProduct.name}
                                />
                            </div>

                            <div className="modal-info">
                                <div className="modal-header-block">
                                    <span className="modal-category">{selectedProduct.category}</span>
                                    <h2 className="modal-title">{selectedProduct.name}</h2>
                                </div>

                                <p className="modal-description">{selectedProduct.description}</p>

                                {purchaseComplete ? (
                                    <div className="purchase-complete">
                                        <Check size={20} />
                                        <span>交換しました</span>
                                    </div>
                                ) : ownedIds.has(selectedProduct.id) ? (
                                    <div className="already-owned">
                                        <Check size={16} />
                                        <span>所持しています</span>
                                    </div>
                                ) : (
                                    <button
                                        className={`purchase-btn ${diamonds < selectedProduct.price ? 'disabled' : ''}`}
                                        onClick={() => setShowConfirmDialog(true)}
                                        disabled={diamonds < selectedProduct.price}
                                    >
                                        <Diamond size={18} className="diamond-icon" />
                                        <span>{selectedProduct.price} で交換する</span>
                                    </button>
                                )}

                                {!ownedIds.has(selectedProduct.id) && diamonds < selectedProduct.price && (
                                    <p className="insufficient-notice">ダイヤが不足しています</p>
                                )}
                            </div>
                        </div>
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
                            <button className="confirm-cancel" onClick={() => setShowConfirmDialog(false)}>
                                キャンセル
                            </button>
                            <button className="confirm-ok" onClick={handleConfirmPurchase}>
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
                            <button className="sheet-close" onClick={() => setShowHistory(false)} aria-label="閉じる">
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
                            <button className="sheet-close" onClick={() => setShowHelp(false)} aria-label="閉じる">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="sheet-body">
                            <p className="sheet-copy">
                                購買部では、集めたダイヤを使って衣装や背景などを交換できます。
                                手に入れたアイテムはアイテムボックスやキャラ画面で確認できます。
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shop;
