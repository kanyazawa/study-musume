
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shirt, Image as ImageIcon, Gift } from 'lucide-react';
import './CharacterInteraction.css';
import './Dialogue.css'; // Reuse dialogue styles for consistency

// Images
import CharacterMain from '../assets/images/character_new.png';
import CharacterCasual from '../assets/images/character_casual_v9.png';
// Using happy image for smile reaction
import NoaHappy from '../assets/images/noah_happy.png';

// Utils
import { getSkinFilter, getBackgroundStyle } from '../utils/cosmeticUtils';
import { filterInventoryByType, removeFromInventory } from '../utils/itemUtils';

const CharacterInteraction = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('main'); // main, gift, costume, bg
    const [expression, setExpression] = useState('normal'); // normal, smile

    // Skin mapping
    const skinImages = {
        'default': CharacterMain,
        'skin_casual': CharacterCasual
    };

    // Determine Image to show
    let currentImage = skinImages[stats.equippedSkin] || CharacterMain;

    // Override if smiling (User requested: "If gift received, make her smile")
    // Note: If we use NoaHappy, it might be uniform only. 
    // If the user wants to keep the casual skin but add a smile, we can't do that easily without a specific asset.
    // For now, I will swap to NoaHappy if expression is smile, assuming the user prioritizes the expression.
    if (expression === 'smile') {
        currentImage = NoaHappy;
    }

    const currentSkinFilter = getSkinFilter(stats.equippedSkin);
    const currentBgStyle = getBackgroundStyle(stats.equippedBackground);

    // Filter Gifts
    const giftItems = filterInventoryByType(stats.inventory, 'gift');

    const handleGiveGift = (item) => {
        // Reduce inventory
        const newInventory = removeFromInventory(stats.inventory, item.itemId, 1);

        // Increase Affection
        const newAffection = (stats.affection || 0) + item.affection;

        updateStats({
            inventory: newInventory,
            affection: newAffection
        });

        // Trigger Smile
        setExpression('smile');

        // Reset expression after 3 seconds
        setTimeout(() => {
            setExpression('normal');
        }, 3000);
    };

    return (
        <div className="character-interaction-screen" style={currentBgStyle}>
            {/* Background Placeholder */}
            <div className="room-background"></div>

            {/* Back Button */}
            <button className="ci-back-btn" onClick={() => navigate('/')}>
                <ArrowLeft size={32} color="white" />
            </button>

            {/* Character Figure (Same position as Home) */}
            <div className="character-figure">
                <img
                    src={currentImage}
                    alt="Character"
                    className="char-image"
                    style={{ filter: expression !== 'smile' ? currentSkinFilter : 'none' }}
                />
            </div>

            {/* Bottom Control Panel (Study Scene Style) */}
            <div className="ci-control-panel dialogue-box">
                {mode === 'main' && (
                    <div className="ci-menu-buttons">
                        <button className="ci-btn" onClick={() => setMode('costume')}>
                            <Shirt size={24} />
                            <span>衣装</span>
                        </button>
                        <button className="ci-btn" onClick={() => setMode('bg')}>
                            <ImageIcon size={24} />
                            <span>背景</span>
                        </button>
                        <button className="ci-btn" onClick={() => setMode('gift')}>
                            <Gift size={24} />
                            <span>プレゼント</span>
                        </button>
                    </div>
                )}

                {/* Gift Selection Mode */}
                {mode === 'gift' && (
                    <div className="ci-gift-panel">
                        <div className="ci-panel-header">
                            <span>プレゼントを渡す</span>
                            <button className="ci-close-small" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-gift-list">
                            {giftItems.length === 0 ? (
                                <p className="no-items">プレゼントを持っていません</p>
                            ) : (
                                giftItems.map((item, idx) => (
                                    <div key={idx} className="ci-gift-item" onClick={() => handleGiveGift(item)}>
                                        <span className="ci-gift-emoji">{item.emoji}</span>
                                        <div className="ci-gift-info">
                                            <span className="ci-gift-name">{item.name}</span>
                                            <span className="ci-gift-count">x{item.quantity}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TODO: Implement Costume and BG selection if needed, or just redirect? 
                     User said "Place Costume and BG buttons". Maybe just navigating to Inventory?
                     But "Gift button -> list comes out from bottom" implies inline interaction.
                     For now, let's keep it simple. If they click Costume, maybe show alert or implement similar list.
                 */}
                {(mode === 'costume' || mode === 'bg') && (
                    <div className="ci-temp-panel">
                        <p>機能未実装 (Inventoryから変更してください)</p>
                        <button onClick={() => setMode('main')}>戻る</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharacterInteraction;
