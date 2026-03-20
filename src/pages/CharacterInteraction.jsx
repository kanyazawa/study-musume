import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shirt, Image as ImageIcon, Gift, MessageCircle } from 'lucide-react';
import './CharacterInteraction.css';
import './Dialogue.css'; // Reuse dialogue styles for consistency
import CharacterSelect from '../components/CharacterSelect';
import NoaChatBox from '../components/NoaChatBox';
import CharacterStage from '../components/character/CharacterStage';

// Utils
import { getGiftReaction } from '../utils/affectionUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { getBackgroundStyle, getOwnedSkins, getOwnedBackgrounds } from '../utils/cosmeticUtils';
import { createGiftPose, normalizeCharacterEmotion } from '../utils/characterPoseUtils';
import { filterInventoryByType, removeFromInventory } from '../utils/itemUtils';

const IS_LITE_DEPLOY = import.meta.env.VITE_LITE_DEPLOY === 'true';

const CharacterInteraction = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('main'); // main, gift, costume, bg, chat
    const [expression, setExpression] = useState('normal'); // normal, smile
    const [showCharSelect, setShowCharSelect] = useState(false);
    const [giftReaction, setGiftReaction] = useState(null);

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

    const characterId = stats.characterId || 'noah';
    const currentBgStyle = getBackgroundStyle(stats.equippedBackground);
    const preferredRenderer = stats?.characterRenderer;
    const renderer = resolveCharacterRenderer({
        preferredRenderer,
        characterId,
        skinId: stats.equippedSkin || 'default',
        canUseVrm: stats.characterId === 'noah' && !IS_LITE_DEPLOY && localStorage.getItem('characterMode') === '3d',
    });
    const interactionPose = giftReaction
        ? createGiftPose(giftReaction)
        : {
            emotion: normalizeCharacterEmotion(expression),
            expression: normalizeCharacterEmotion(expression),
            intensity: expression === 'smile' ? 0.8 : 0.4,
            motion: null,
            idle: 'gentle',
            gaze: 'camera',
            speaking: false,
            text: '',
            effect: '',
        };

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
        const reaction = getGiftReaction({
            characterId,
            affection: stats.affection || 0,
            item,
        });

        updateStats({
            inventory: newInventory,
            affection: newAffection
        });

        setGiftReaction(reaction);
        setExpression(reaction.emotion === 'happy' ? 'smile' : 'normal');

        // Reset expression and item after 3 seconds
        setTimeout(() => {
            setExpression('normal');
            setGivingItem(null);
            setGiftReaction(null);
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
                            {'「'}
                            {giftReaction?.text || `わぁ、${givingItem.name}！ありがとう、嬉しいな♪`}
                            {'」'}
                        </div>
                    </div>
                </div>
            )}

            {/* Character Figure (Same position as Home) */}
            <div className={`character-figure ${givingItem ? 'receiving' : ''} ${renderer === 'live2d' ? 'is-live2d' : ''}`} onClick={() => setShowCharSelect(true)}>
                <CharacterStage
                    characterId={characterId}
                    renderer={renderer}
                    skinId={stats.equippedSkin || 'default'}
                    scene="interaction"
                    pose={interactionPose}
                    className="vrm-interaction"
                    imageClassName="char-image"
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
                        <button className="ci-btn" onClick={() => setMode('chat')}>
                            <MessageCircle size={24} />
                            <span>話す</span>
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

                {mode === 'chat' && (
                    <div className="ci-chat-panel">
                        <NoaChatBox
                            stats={stats}
                            embedded
                            onClose={() => setMode('main')}
                        />
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
