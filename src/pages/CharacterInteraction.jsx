
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shirt, Image as ImageIcon, Gift } from 'lucide-react';
import './CharacterInteraction.css';
import './Dialogue.css'; // Reuse dialogue styles for consistency
import CharacterSelect from '../components/CharacterSelect';
import VrmViewer from '../components/VrmViewer';

// Images
import CharacterMain from '../assets/images/character_new.png';
import CharacterCasual from '../assets/images/character_casual_v9.png';
import CharacterCasualFall from '../assets/images/noa_casual_fall.png';
import CharacterRen from '../assets/images/character_ren.png'; // Added Ren
// Using happy image for smile reaction
import NoaHappy from '../assets/images/noah_happy.png';

// Utils
import { getSkinFilter, getBackgroundStyle, getSkinImage, getOwnedSkins, getOwnedBackgrounds } from '../utils/cosmeticUtils';
import { filterInventoryByType, removeFromInventory } from '../utils/itemUtils';

const CharacterInteraction = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('main'); // main, gift, costume, bg
    const [expression, setExpression] = useState('normal'); // normal, smile
    const [showCharSelect, setShowCharSelect] = useState(false);

    const handleCharSelectComplete = (newStats) => {
        if (updateStats) {
            updateStats(newStats);
        }
        setShowCharSelect(false);
    };

    // Owned Cosmetics
    const ownedSkins = getOwnedSkins(stats.inventory || []);
    const ownedBackgrounds = getOwnedBackgrounds(stats.inventory || []);

    const handleEquipSkin = (skinId) => {
        updateStats({ equippedSkin: skinId });
    };

    const handleEquipBackground = (bgId) => {
        updateStats({ equippedBackground: bgId });
    };

    // スキン画像のマッピング
    // Noah (Female)
    const noahImages = {
        'default': CharacterMain,
        'skin_casual': CharacterCasual,
        'skin_casual_fall': CharacterCasualFall
    };

    // Ren (Male)
    const renImages = {
        'default': CharacterRen, // Import CharacterRen at top
        'skin_casual': CharacterRen, // Fallback for now
        'skin_casual_fall': CharacterRen
    };

    const characterId = stats.characterId || 'noah';
    const skinImages = characterId === 'ren' ? renImages : noahImages;

    // Use utility or map to get skin image
    const currentSkinImage = skinImages[stats.equippedSkin] || skinImages['default'];

    // Override if smiling
    let displayImage = currentSkinImage;
    if (expression === 'smile') {
        displayImage = characterId === 'ren' ? CharacterRen : NoaHappy;
    }

    const currentSkinFilter = getSkinFilter(stats.equippedSkin);
    const currentBgStyle = getBackgroundStyle(stats.equippedBackground);

    // Filter Gifts
    const giftItems = filterInventoryByType(stats.inventory, 'gift');

    const [givingItem, setGivingItem] = useState(null);

    // ... (existing code)

    const handleGiveGift = (item) => {
        // Set giving item for animation
        setGivingItem(item);

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

        // Reset expression and item after 3 seconds
        setTimeout(() => {
            setExpression('normal');
            setGivingItem(null);
        }, 3000);
    };

    const isDefaultBg = stats.equippedBackground === 'default';

    return (
        <div className="character-interaction-screen" style={!isDefaultBg ? currentBgStyle : {}}>
            {/* Background Placeholder */}
            {isDefaultBg && <div className="room-background"></div>}

            {/* Back Button */}
            <button className="ci-back-btn" onClick={() => navigate('/home')}>
                <ArrowLeft size={32} color="white" />
            </button>

            {/* Gift Animation Overlay */}
            {givingItem && (
                <div className="gift-effect-overlay">
                    <div className="gift-effect-content">
                        <div className="gift-effect-emoji">{givingItem.emoji}</div>
                        <div className="gift-effect-message">
                            「わぁ、{givingItem.name}！<br />ありがとう、嬉しいな♪」
                        </div>
                    </div>
                </div>
            )}

            {/* Character Figure (Same position as Home) */}
            <div className={`character-figure ${givingItem ? 'receiving' : ''}`} onClick={() => setShowCharSelect(true)}>
                {stats.characterId === 'noah' && localStorage.getItem('characterMode') === '3d' ? (
                    <VrmViewer
                        emotion={expression}
                        className="vrm-interaction"
                    />
                ) : (
                    <img
                        src={displayImage}
                        alt="Character"
                        className="char-image"
                        style={{ filter: expression !== 'smile' ? currentSkinFilter : 'none' }}
                    />
                )}
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
// ... (imports are handled in next step or already present)

                {/* Costume Selection Mode */}
                {mode === 'costume' && (
                    <div className="ci-gift-panel">
                        <div className="ci-panel-header">
                            <span>衣装を着替える</span>
                            <button className="ci-close-small" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-gift-list">
                            {ownedSkins.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`ci-gift-item ${stats.equippedSkin === item.id ? 'equipped' : ''}`}
                                    onClick={() => handleEquipSkin(item.id)}
                                >
                                    <span className="ci-gift-emoji">{item.emoji}</span>
                                    <div className="ci-gift-info">
                                        <span className="ci-gift-name">{item.name}</span>
                                        {stats.equippedSkin === item.id && <span className="equipped-badge">装備中</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Background Selection Mode */}
                {mode === 'bg' && (
                    <div className="ci-gift-panel">
                        <div className="ci-panel-header">
                            <span>背景を変更する</span>
                            <button className="ci-close-small" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-gift-list">
                            {ownedBackgrounds.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`ci-gift-item ${stats.equippedBackground === item.id ? 'equipped' : ''}`}
                                    onClick={() => handleEquipBackground(item.id)}
                                >
                                    <span className="ci-gift-emoji">{item.emoji}</span>
                                    <div className="ci-gift-info">
                                        <span className="ci-gift-name">{item.name}</span>
                                        {stats.equippedBackground === item.id && <span className="equipped-badge">装備中</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Character Selection Overlay */}
            {showCharSelect && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2000,
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }}>
                    <CharacterSelect onComplete={handleCharSelectComplete} />
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowCharSelect(false); }}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            zIndex: 2001,
                            background: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            fontSize: '24px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

export default CharacterInteraction;
