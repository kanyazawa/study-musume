import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shirt, Image as ImageIcon, Gift, BookOpen, Sparkles } from 'lucide-react';
import './CharacterInteraction.css';
import './Dialogue.css'; // Reuse dialogue styles for consistency
import CharacterSelect from '../components/CharacterSelect';
import CharacterStage from '../components/character/CharacterStage';

// Utils
import { getGiftReaction } from '../utils/affectionUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { getBackgroundStyle, getOwnedSkins, getOwnedBackgrounds } from '../utils/cosmeticUtils';
import { createGiftPose, normalizeCharacterEmotion } from '../utils/characterPoseUtils';
import { getCharacterEvaluationSummary } from '../utils/characterEvaluationUtils';
import { filterInventoryByType, removeFromInventory } from '../utils/itemUtils';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { getRelationshipEventState } from '../utils/relationshipUtils';
import { getRelationshipEventsByCharacter } from '../data/relationshipEvents';
import { applyRelationshipProgress, getUnreadRelationshipEvents } from '../utils/relationshipEventUtils';

const CUSTOMIZE_TABS = [
    { mode: 'costume', label: '衣装', icon: Shirt },
    { mode: 'bg', label: '背景', icon: ImageIcon },
    { mode: 'accessory', label: 'アクセ', icon: Sparkles },
];

const CharacterInteraction = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState('main'); // main, gift, customize, costume, bg, accessory, events
    const [expression, setExpression] = useState('normal');
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
    const ownedAccessories = filterInventoryByType(stats.inventory || [], 'accessory');
    const equippedAccessories = stats?.equippedAccessories || [];
    const relationshipEventState = useMemo(() => getRelationshipEventState(stats), [stats]);

    const handleEquipSkin = (skinId) => {
        updateStats({ equippedSkin: skinId });
    };

    const handleEquipBackground = (bgId) => {
        updateStats({ equippedBackground: bgId });
    };

    const handleToggleAccessory = (accessoryId) => {
        updateStats((currentStats) => {
            const currentAccessories = currentStats?.equippedAccessories || [];
            const isEquipped = currentAccessories.includes(accessoryId);

            return {
                equippedAccessories: isEquipped
                    ? currentAccessories.filter((itemId) => itemId !== accessoryId)
                    : [...new Set([...currentAccessories, accessoryId])],
            };
        });
    };

    const characterId = stats.characterId || 'noah';
    const evaluationSummary = useMemo(() => getCharacterEvaluationSummary(stats, characterId), [characterId, stats]);
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
            speaking: false,
            text: '',
            effect: '',
        };

    useEffect(() => {
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

    const getModeHeading = () => {
        switch (mode) {
            case 'gift':
                return 'プレゼントを渡す';
            case 'events':
                return '関係イベント';
            case 'costume':
                return '衣装を着替える';
            case 'bg':
                return '背景を変更する';
            case 'accessory':
                return 'アクセを切り替える';
            case 'customize':
                return '見た目を整える';
            default:
                return '';
        }
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
            <button className="ci-back-btn" type="button" aria-label="ホームに戻る" onClick={() => navigate('/home')}>
                <ArrowLeft size={24} />
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
                    accessoryIds={stats.equippedAccessories || []}
                    scene="interaction"
                    pose={interactionPose}
                    className="character-interaction"
                    imageClassName="char-image"
                />
            </div>

            {/* Bottom Control Panel (Study Scene Style) */}
            <div className={`ci-control-panel dialogue-box is-${mode}`}>
                {mode === 'main' && (
                    <div className="ci-main-hub">
                        <section className={`ci-evaluation-card is-${evaluationSummary.accent}`}>
                            <div className="ci-evaluation-head">
                                <div className="ci-evaluation-copy">
                                    <span className="ci-evaluation-kicker">STUDY APPRAISAL</span>
                                    <strong>{evaluationSummary.rank} {evaluationSummary.label}</strong>
                                    <p>{evaluationSummary.lastComment || 'まだ大きな評価の変化はないみたい。次の勉強で印象が動く。'}</p>
                                </div>
                                <div className="ci-evaluation-rank">
                                    <span>{evaluationSummary.rank}</span>
                                </div>
                            </div>
                            <div className="ci-evaluation-bar" aria-hidden="true">
                                <div className="ci-evaluation-bar-fill" style={{ width: `${evaluationSummary.progressPercent}%` }} />
                            </div>
                            <div className="ci-evaluation-meta">
                                <span>{evaluationSummary.lastOutcome || '評価待ち'}</span>
                                <span>
                                    {evaluationSummary.nextRank
                                        ? `次の${evaluationSummary.nextRank}まで ${evaluationSummary.pointsToNext}`
                                        : '最高評定'}
                                </span>
                                <span>
                                    {evaluationSummary.lastDelta > 0
                                        ? `今回 +${evaluationSummary.lastDelta}`
                                        : evaluationSummary.lastDelta < 0
                                            ? `今回 ${evaluationSummary.lastDelta}`
                                            : '今回 ±0'}
                                </span>
                            </div>
                        </section>

                <div className="ci-main-actions">
                    <button className="ci-main-action is-secondary" type="button" onClick={() => setMode('gift')}>
                        <Gift size={22} />
                        <span className="ci-main-action-label">プレゼント</span>
                        <span className="ci-main-action-meta">
                            {giftItems.length > 0 ? `${giftItems.length}種 持っています` : '持ち物を確認'}
                        </span>
                    </button>

                    <button className="ci-main-action is-primary" type="button" onClick={() => setMode('customize')}>
                        <Sparkles size={24} />
                        <span className="ci-main-action-label">カスタマイズ</span>
                        <span className="ci-main-action-meta">衣装・背景・アクセをまとめて切り替える</span>
                    </button>

                    <button className="ci-main-action is-secondary" type="button" onClick={() => navigate('/story')}>
                        <BookOpen size={22} />
                        <span className="ci-main-action-label">物語</span>
                        <span className="ci-main-action-meta">このキャラとの物語を読む</span>
                    </button>

                    <button className="ci-main-action is-secondary" type="button" onClick={() => setMode('events')}>
                        <BookOpen size={22} />
                        <span className="ci-main-action-label">イベント</span>
                        <span className="ci-main-action-meta">
                            {unreadRelationshipEvents.length > 0 ? `新着 ${unreadRelationshipEvents.length}件` : '解放済みを読む'}
                                </span>
                                {unreadRelationshipEvents.length > 0 && (
                                    <span className="ci-badge">{unreadRelationshipEvents.length}</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Gift Selection Mode */}
                {mode === 'gift' && (
                    <div className="ci-gift-panel">
                        <div className="ci-panel-header">
                            <span>{getModeHeading()}</span>
                            <button className="ci-close-small" type="button" aria-label="閉じる" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-gift-list">
                            {giftItems.length === 0 ? (
                                <p className="no-items">プレゼントを持っていません</p>
                            ) : (
                                giftItems.map((item, idx) => (
                                    <button key={idx} className="ci-gift-item" type="button" onClick={() => handleGiveGift(item)}>
                                        <span className="ci-gift-emoji">{item.emoji}</span>
                                        <div className="ci-gift-info">
                                            <span className="ci-gift-name">{item.name}</span>
                                            <span className="ci-gift-count">x{item.quantity}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {mode === 'events' && (
                    <div className="ci-events-panel">
                        <div className="ci-panel-header">
                            <span>{getModeHeading()}</span>
                            <button className="ci-close-small" type="button" aria-label="閉じる" onClick={() => setMode('main')}>×</button>
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

                {mode === 'customize' && (
                    <div className="ci-customize-panel">
                        <div className="ci-panel-header">
                            <span>{getModeHeading()}</span>
                            <button className="ci-close-small" type="button" aria-label="閉じる" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-customize-grid">
                            <button className="ci-customize-card" type="button" onClick={() => setMode('costume')}>
                                <Shirt size={20} />
                                <div className="ci-customize-copy">
                                    <strong>衣装</strong>
                                    <span>{ownedSkins.length}着から選ぶ</span>
                                </div>
                            </button>
                            <button className="ci-customize-card" type="button" onClick={() => setMode('bg')}>
                                <ImageIcon size={20} />
                                <div className="ci-customize-copy">
                                    <strong>背景</strong>
                                    <span>{ownedBackgrounds.length}種類を切替</span>
                                </div>
                            </button>
                            <button className="ci-customize-card" type="button" onClick={() => setMode('accessory')}>
                                <Sparkles size={20} />
                                <div className="ci-customize-copy">
                                    <strong>アクセ</strong>
                                    <span>{ownedAccessories.length}個を装備</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Costume Selection Mode */}
                {mode === 'costume' && (
                    <div className="ci-gift-panel">
                        <div className="ci-panel-header">
                            <span>{getModeHeading()}</span>
                            <button className="ci-close-small" type="button" aria-label="閉じる" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-submode-tabs" role="tablist" aria-label="カスタマイズ切り替え">
                            {CUSTOMIZE_TABS.map(({ mode: tabMode, label, icon: Icon }) => (
                                <button
                                    key={tabMode}
                                    type="button"
                                    className={`ci-submode-tab ${mode === tabMode ? 'is-active' : ''}`}
                                    onClick={() => setMode(tabMode)}
                                >
                                    <Icon size={16} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="ci-gift-list">
                            {ownedSkins.map((item, idx) => (
                                <button
                                    key={idx}
                                    className={`ci-gift-item ${stats.equippedSkin === item.id ? 'equipped' : ''}`}
                                    type="button"
                                    onClick={() => handleEquipSkin(item.id)}
                                >
                                    <span className="ci-gift-emoji">{item.emoji}</span>
                                    <div className="ci-gift-info">
                                        <span className="ci-gift-name">{item.name}</span>
                                        {stats.equippedSkin === item.id && <span className="equipped-badge">装備中</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Background Selection Mode */}
                {mode === 'bg' && (
                    <div className="ci-gift-panel">
                        <div className="ci-panel-header">
                            <span>{getModeHeading()}</span>
                            <button className="ci-close-small" type="button" aria-label="閉じる" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-submode-tabs" role="tablist" aria-label="カスタマイズ切り替え">
                            {CUSTOMIZE_TABS.map(({ mode: tabMode, label, icon: Icon }) => (
                                <button
                                    key={tabMode}
                                    type="button"
                                    className={`ci-submode-tab ${mode === tabMode ? 'is-active' : ''}`}
                                    onClick={() => setMode(tabMode)}
                                >
                                    <Icon size={16} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="ci-gift-list">
                            {ownedBackgrounds.map((item, idx) => (
                                <button
                                    key={idx}
                                    className={`ci-gift-item ${stats.equippedBackground === item.id ? 'equipped' : ''}`}
                                    type="button"
                                    onClick={() => handleEquipBackground(item.id)}
                                >
                                    <span className="ci-gift-emoji">{item.emoji}</span>
                                    <div className="ci-gift-info">
                                        <span className="ci-gift-name">{item.name}</span>
                                        {stats.equippedBackground === item.id && <span className="equipped-badge">装備中</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Accessory Selection Mode */}
                {mode === 'accessory' && (
                    <div className="ci-gift-panel">
                        <div className="ci-panel-header">
                            <span>{getModeHeading()}</span>
                            <button className="ci-close-small" type="button" aria-label="閉じる" onClick={() => setMode('main')}>×</button>
                        </div>
                        <div className="ci-submode-tabs" role="tablist" aria-label="カスタマイズ切り替え">
                            {CUSTOMIZE_TABS.map(({ mode: tabMode, label, icon: Icon }) => (
                                <button
                                    key={tabMode}
                                    type="button"
                                    className={`ci-submode-tab ${mode === tabMode ? 'is-active' : ''}`}
                                    onClick={() => setMode(tabMode)}
                                >
                                    <Icon size={16} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="ci-gift-list">
                            {ownedAccessories.length === 0 ? (
                                <div className="no-items">購買部でアクセを交換するとここに表示されます</div>
                            ) : (
                                ownedAccessories.map((item, idx) => {
                                    const isEquipped = equippedAccessories.includes(item.itemId);

                                    return (
                                        <button
                                            key={`${item.itemId}-${idx}`}
                                            className={`ci-gift-item ${isEquipped ? 'equipped' : ''}`}
                                            type="button"
                                            onClick={() => handleToggleAccessory(item.itemId)}
                                        >
                                            <span className="ci-gift-emoji">{item.emoji}</span>
                                            <div className="ci-gift-info">
                                                <span className="ci-gift-name">{item.name}</span>
                                                {!isEquipped && <span className="ci-gift-count">未装備</span>}
                                                {isEquipped && <span className="equipped-badge">装備中</span>}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
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
