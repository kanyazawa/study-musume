import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inventory.css';

import { filterInventoryByType, getItemById, removeFromInventory } from '../utils/itemUtils';
import { GIFT_REACTIONS } from '../data/affectionData';
import { checkLevelUp } from '../utils/affectionUtils';

const Inventory = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showGiftModal, setShowGiftModal] = useState(false);

    // タイプ別にアイテムをフィルタリング
    const filteredItems = filterInventoryByType(stats.inventory, selectedType);

    // アイテム詳細モーダルを開く
    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    // モーダルを閉じる
    const closeModal = () => {
        setSelectedItem(null);
        setShowGiftModal(false);
    };

    // プレゼントを実行
    const handleGift = () => {
        if (!selectedItem || selectedItem.type !== 'gift') return;

        const oldAffection = stats.affection;
        const newAffection = oldAffection + selectedItem.affection;

        // インベントリからアイテムを削除
        const newInventory = removeFromInventory(stats.inventory, selectedItem.itemId, 1);

        // 好感度を更新
        updateStats({
            inventory: newInventory,
            affection: newAffection
        });

        // レベルアップチェック
        const levelUpInfo = checkLevelUp(oldAffection, newAffection);

        // ギフトモーダルを表示
        setShowGiftModal({
            affectionGained: selectedItem.affection,
            reaction: getRandomReaction(selectedItem.rarity),
            levelUp: levelUpInfo
        });

        setSelectedItem(null);
    };

    // レアリティに応じたランダムなリアクションを取得
    const getRandomReaction = (rarity) => {
        const reactions = GIFT_REACTIONS[rarity] || GIFT_REACTIONS.R;
        return reactions[Math.floor(Math.random() * reactions.length)];
    };

    return (
        <div className="inventory-screen">
            {/* ヘッダー */}
            <div className="inventory-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ← 戻る
                </button>
                <h1 className="inventory-title">アイテムボックス</h1>
                <div className="inventory-count">
                    {filteredItems.length} / {stats.inventory.length}
                </div>
            </div>

            {/* タブ */}
            <div className="inventory-tabs">
                <button
                    className={`tab ${selectedType === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedType('all')}
                >
                    全て
                </button>
                <button
                    className={`tab ${selectedType === 'gift' ? 'active' : ''}`}
                    onClick={() => setSelectedType('gift')}
                >
                    💝 プレゼント
                </button>
                <button
                    className={`tab ${selectedType === 'boost' ? 'active' : ''}`}
                    onClick={() => setSelectedType('boost')}
                >
                    ⚡ ブースト
                </button>
                <button
                    className={`tab ${selectedType === 'skin' ? 'active' : ''}`}
                    onClick={() => setSelectedType('skin')}
                >
                    👗 スキン
                </button>
                <button
                    className={`tab ${selectedType === 'background' ? 'active' : ''}`}
                    onClick={() => setSelectedType('background')}
                >
                    🖼️ 背景
                </button>
            </div>

            {/* アイテムリスト */}
            <div className="inventory-grid">
                {filteredItems.length === 0 ? (
                    <div className="empty-message">
                        <p>アイテムがありません</p>
                        {/* リンク削除 */}
                    </div>
                ) : (
                    filteredItems.map((item, index) => (
                        <div
                            key={`${item.itemId}-${index}`}
                            className={`item-card rarity-${item.rarity} ${stats.equippedSkin === item.itemId || stats.equippedBackground === item.itemId ? 'equipped' : ''
                                }`}
                            onClick={() => handleItemClick(item)}
                        >
                            <div className="item-icon">{item.emoji}</div>
                            <div className="item-name">{item.name}</div>
                            <div className="item-quantity">×{item.quantity}</div>
                            {(stats.equippedSkin === item.itemId || stats.equippedBackground === item.itemId) && (
                                <div className="equipped-badge">装備中</div>
                            )}
                            <div className={`item-rarity rarity-${item.rarity}`}>
                                {item.rarity}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* アイテム詳細モーダル */}
            {selectedItem && !showGiftModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>×</button>

                        <div className={`modal-icon rarity-${selectedItem.rarity}`}>
                            {selectedItem.emoji}
                        </div>

                        <h2 className="modal-title">{selectedItem.name}</h2>
                        <div className={`modal-rarity rarity-${selectedItem.rarity}`}>
                            {selectedItem.rarity}
                        </div>

                        <p className="modal-description">{selectedItem.description}</p>

                        <div className="modal-details">
                            {selectedItem.type === 'gift' && (
                                <p>💝 好感度 +{selectedItem.affection}</p>
                            )}
                            {selectedItem.type === 'boost' && (
                                <p>⚡ 経験値 ×{selectedItem.multiplier} ({selectedItem.duration}分)</p>
                            )}
                            <p>所持数: {selectedItem.quantity}</p>
                        </div>

                        {selectedItem.type === 'gift' && (
                            <button className="gift-btn" onClick={handleGift}>
                                ノアにプレゼントする 💝
                            </button>
                        )}

                        {selectedItem.type === 'skin' && stats.equippedSkin !== selectedItem.itemId && (
                            <button className="equip-btn" onClick={() => {
                                updateStats({ equippedSkin: selectedItem.itemId });
                                closeModal();
                            }}>
                                着せ替える 👗
                            </button>
                        )}

                        {selectedItem.type === 'background' && stats.equippedBackground !== selectedItem.itemId && (
                            <button className="equip-btn" onClick={() => {
                                updateStats({ equippedBackground: selectedItem.itemId });
                                closeModal();
                            }}>
                                背景を変更する 🖼️
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ギフトリアクションモーダル */}
            {showGiftModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="gift-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="gift-character">
                            {/* キャラクター画像をここに追加できます */}
                            <div className="character-placeholder">💖</div>
                        </div>

                        <div className="gift-bubble">
                            <p>{showGiftModal.reaction}</p>
                        </div>

                        <div className="affection-gain">
                            好感度 +{showGiftModal.affectionGained}
                        </div>

                        {showGiftModal.levelUp && (
                            <div className="level-up-notice">
                                <h3>レベルアップ！</h3>
                                <p>Lv.{showGiftModal.levelUp.oldLevel} → Lv.{showGiftModal.levelUp.newLevel}</p>
                                <p className="level-title">{showGiftModal.levelUp.levelInfo.title}</p>
                            </div>
                        )}

                        <button className="modal-ok-btn" onClick={closeModal}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
