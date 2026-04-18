import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shirt, Image as ImageIcon, Gift, MessageCircle, BookOpen } from 'lucide-react';
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
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { getRelationshipEventState, getRelationshipSnapshot } from '../utils/relationshipUtils';
import { getRelationshipEventsByCharacter } from '../data/relationshipEvents';
import { applyRelationshipProgress, getUnreadRelationshipEvents } from '../utils/relationshipEventUtils';

const CharacterInteraction = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState('main'); // main, gift, costume, bg, chat
    const [expression, setExpression] = useState('normal');
    const [showCharSelect, setShowCharSelect] = useState(false);
    const [giftReaction, setGiftReaction] = useState(null);
    const [chatSpeechText, setChatSpeechText] = useState('');
    const [isChatSpeaking, setIsChatSpeaking] = useState(false);

    const handleCharSelectComplete = (newStats) => {
        if (updateStats) {
            updateStats(newStats);
        }
        setShowCharSelect(false);
    };

    // Owned Cosmetics
    const ownedSkins = getOwnedSkins(stats.inventory || []);
    const ownedBackgrounds = getOwnedBackgrounds(stats.inventory || []);
    const relationshipSnapshot = useMemo(() => getRelationshipSnapshot(stats), [stats]);
    const relationshipEventState = useMemo(() => getRelationshipEventState(stats), [stats]);

    const handleEquipSkin = (skinId) => {
        updateStats({ equippedSkin: skinId });
    };

    const handleEquipBackground = (bgId) => {
        updateStats({ equippedBackground: bgId });
    };

    const characterId = stats.characterId || 'noah';
    const currentBgStyle = getBackgroundStyle(stats.equippedBackground);
    const preferredRenderer = stats?.characterRenderer;
    const hasInteractionLive2D = hasLive2DModelConfig(characterId, stats.equippedSkin || 'default');
    const shouldForceInteractionLive2D = characterId === 'noah' && hasInteractionLive2D;
    const renderer = resolveCharacterRenderer({
        preferredRenderer: shouldForceInteractionLive2D ? 'live2d' : preferredRenderer,
        characterId,
        skinId: stats.equippedSkin || 'default',
    });
    const currentExpression = normalizeCharacterEmotion(expression);
    const expressionIntensity = useMemo(() => {
        if (currentExpression === 'shy') {
            return 0.68;
        }

        if (currentExpression === 'serious') {
            return 0.58;
        }

        return ['happy', 'smile', 'angry', 'surprised'].includes(currentExpression) ? 0.82 : 0.42;
    }, [currentExpression]);
    const interactionPose = giftReaction
        ? createGiftPose(giftReaction)
        : {
            emotion: currentExpression,
            expression: currentExpression,
            intensity: expressionIntensity,
            motion: null,
            idle: 'gentle',
            gaze: 'camera',
            speaking: isChatSpeaking,
            text: chatSpeechText,
            effect: '',
        };

    useEffect(() => {
        if (mode === 'chat') {
            return;
        }

        setIsChatSpeaking(false);
        setChatSpeechText('');
        setExpression('normal');
    }, [mode]);

    useEffect(() => {
        if (!shouldForceInteractionLive2D || !updateStats || preferredRenderer === 'live2d') {
            return;
        }

        updateStats({ characterRenderer: 'live2d' });
    }, [preferredRenderer, shouldForceInteractionLive2D, updateStats]);

    // Filter Gifts
    const giftItems = filterInventoryByType(stats.inventory, 'gift');
    const allRelationshipEvents = useMemo(() => getRelationshipEventsByCharacter(characterId), [characterId]);
    const unreadRelationshipEvents = useMemo(() => getUnreadRelationshipEvents(stats), [stats]);

    const [givingItem, setGivingItem] = useState(null);

    // ... (existing code)

    useEffect(() => {
        if (location.state?.openPanel === 'events') {
            setMode('events');
        }
    }, [location.state]);

    const getEventStatus = (eventId) => {
        if (!relationshipEventState.unlockedIds.includes(eventId)) return 'locked';
        if (relationshipEventState.readIds.includes(eventId)) return 'read';
        return 'unread';
    };

    const openRelationshipEvent = (eventId) => {
        navigate(`/relationship-events/${eventId}`);
    };

    const handleGiveGift = (item) => {
        // Set giving item for animation
        setGivingItem(item);

        const reaction = getGiftReaction({
            characterId,
            affection: stats.affection || 0,
            item,
        });

        updateStats((currentStats) => {
            const currentInventory = currentStats?.inventory || [];
            const reducedInventory = removeFromInventory(currentInventory, item.itemId, 1);
            const nextAffection = (currentStats?.affection || 0) + item.affection;

            return applyRelationshipProgress({
                ...currentStats,
                inventory: reducedInventory,
                affection: nextAffection,
            }, {
                type: 'gift',
                summary: `${item.name}をプレゼントした`,
                detail: '好みに合わせて選んだ気持ちが、しっかり届いたみたいだ。',
                affectionDelta: item.affection,
            }).nextStats;
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

            <section className="ci-relationship-card" aria-label="関係メモ">
                <div className="ci-relationship-card-header">
                    <span className="ci-relationship-card-label">関係メモ</span>
                    <span className="ci-relationship-card-rhythm">{relationshipSnapshot.rhythmLabel}</span>
                </div>
                <div className="ci-relationship-card-stage">{relationshipSnapshot.stageLabel}</div>
                <p className="ci-relationship-card-copy">{relationshipSnapshot.stageDescription}</p>
                <div className="ci-relationship-card-latest">
                    <span className="ci-relationship-card-latest-title">{relationshipSnapshot.latestMomentTitle}</span>
                    <span className="ci-relationship-card-latest-detail">{relationshipSnapshot.latestMomentDetail}</span>
                </div>
                <div className="ci-relationship-card-footer">
                    <span>{relationshipSnapshot.focusCopy}</span>
                    <span>{relationshipSnapshot.nextHint}</span>
                </div>
            </section>

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
                    className="character-interaction"
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
                        <button className="ci-btn" onClick={() => setMode('events')}>
                            <BookOpen size={24} />
                            <span>イベント</span>
                            {unreadRelationshipEvents.length > 0 && (
                                <span className="ci-badge">{unreadRelationshipEvents.length}</span>
                            )}
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
                            autoSpeakAssistant
                            onUserMessage={(_, { emotion: nextEmotion } = {}) => {
                                setExpression(normalizeCharacterEmotion(nextEmotion, 'normal'));
                                updateStats?.((currentStats) => applyRelationshipProgress(currentStats, {
                                    type: 'chat',
                                    summary: '二人きりで話し込んだ',
                                    detail: '向き合って話すぶん、いつもより素直な空気になった。',
                                }).nextStats);
                            }}
                            onAssistantReply={(replyText, { emotion: nextEmotion } = {}) => {
                                setChatSpeechText(String(replyText || '').trim());
                                setExpression(normalizeCharacterEmotion(nextEmotion, 'normal'));
                            }}
                            onAssistantSpeechStart={(replyText) => {
                                setChatSpeechText(String(replyText || '').trim());
                                setIsChatSpeaking(true);
                            }}
                            onAssistantSpeechEnd={() => {
                                setIsChatSpeaking(false);
                            }}
                            onClose={() => setMode('main')}
                        />
                    </div>
                )}

                {mode === 'events' && (
                    <div className="ci-events-panel">
                        <div className="ci-panel-header">
                            <span>関係イベント</span>
                            <button className="ci-close-small" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-events-list">
                            {allRelationshipEvents.map((event) => {
                                const status = getEventStatus(event.id);
                                const isLocked = status === 'locked';

                                return (
                                    <button
                                        key={event.id}
                                        className={`ci-event-card is-${status}`}
                                        onClick={() => !isLocked && openRelationshipEvent(event.id)}
                                        disabled={isLocked}
                                    >
                                        <div className="ci-event-card-top">
                                            <span className="ci-event-order">EP.{String(event.order).padStart(2, '0')}</span>
                                            <span className={`ci-event-status is-${status}`}>
                                                {status === 'locked' ? '未解放' : status === 'read' ? '既読' : 'NEW'}
                                            </span>
                                        </div>
                                        <div className="ci-event-title">{isLocked ? '？？？' : event.title}</div>
                                        <div className="ci-event-teaser">
                                            {isLocked ? '条件を満たすと解放されます。' : event.teaser}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TODO: Implement Costume and BG selection if needed, or just redirect? 
                     User said "Place Costume and BG buttons". Maybe just navigating to Inventory?
                     But "Gift button -> list comes out from bottom" implies inline interaction.
                     For now, let's keep it simple. If they click Costume, maybe show alert or implement similar list.
                 */}

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
