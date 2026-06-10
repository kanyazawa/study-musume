import React, { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import './Home.css';
// Footer removed
import CharacterStage from '../components/character/CharacterStage';
import SceneStageLayout from '../components/Layout/SceneStageLayout';
import MenuModal from '../components/MenuModal';
import LoginBonusModal from '../components/LoginBonusModal';
import NoaChatBox from '../components/NoaChatBox';
import HomePreviewGeneratedChroma from '../assets/images/noah_home_preview_generated_chroma.png';

// Utils
import { getAffectionLevel, getAffectionProgress, getHomeReaction, getNextLevel } from '../utils/affectionUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { getBackgroundStyle } from '../utils/cosmeticUtils';
import { createHomePose } from '../utils/characterPoseUtils';
import { updateMissionsOnInteract } from '../utils/missionUtils';
import { checkForNewAchievements } from '../utils/achievementUtils';
import { ACHIEVEMENTS } from '../data/achievements';
import { processLoginBonus } from '../utils/loginBonusUtils';
import { getLatestNoaAssistantMessageEntry } from '../utils/chatHistory';
import { inferEmotionFromChatText } from '../utils/chatEmotionUtils';
import { getEnabledHomeTouchAreas, getHomeTouchReaction } from '../data/homeTouchReactions';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { getHomeReviewSummary } from '../utils/reviewUtils';
import { applyRelationshipActivity } from '../utils/relationshipEventUtils';
import { getUnreadRelationshipEvents } from '../utils/relationshipEventUtils';
import { useSound } from '../contexts/SoundContext';
import { getLastStudyTopic } from '../data/studyData';
import { personalizePlayerText } from '../utils/playerName';
import { loadGoalTodos, saveGoalTodos } from '../utils/goalUtils';
import {
    SEASONAL_EVENTS,
    getSeasonalEventProgress,
    getSeasonalEventRemainingDays,
    isSeasonalEventActive,
} from '../data/seasonalEvents';
import {
    HOME_EXPRESSION_LAYER,
    createHomeExpressionLayer,
    inferHomeEmotion,
    resolveHomeExpressionLayers,
    toVisibleHomeEmotion,
} from '../utils/homeExpressionLayers';

const HOME_CHARACTER_PREVIEWS = {
    'generated-hoodie-main': {
        characterId: 'noah',
        source: HomePreviewGeneratedChroma,
        alt: 'Noah home silhouette preview',
        disableFaceEffects: true,
        forceRenderer: 'image',
        chromaKey: {
            red: 0,
            green: 255,
            blue: 0,
            threshold: 56,
            softness: 44,
            despill: 0.8,
        },
        imageClassName: 'home-preview-generated-portrait',
        figureClassName: 'has-generated-preview',
    },
    'guest-darkhair': {
        source: '/images/home_guest_preview_chroma.png',
        alt: 'Guest home preview',
        disableFaceEffects: true,
        forceRenderer: 'image',
        chromaKey: {
            red: 0,
            green: 255,
            blue: 0,
            threshold: 52,
            softness: 30,
            despill: 0.94,
        },
        imageClassName: 'home-preview-guest-portrait',
        figureClassName: 'has-guest-preview',
    },
};

const getLocalDateKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatBoardDateLabel = (dateKey) => {
    const [year, month, day] = String(dateKey || '').split('-').map(Number);
    if (![year, month, day].every(Number.isFinite)) {
        return '';
    }

    return `${month}/${day}`;
};

const resolveHomeFocusBoard = (calendarFocuses = {}) => {
    const focusEntries = Object.entries(calendarFocuses)
        .map(([dateKey, text]) => [dateKey, String(text || '').trim()])
        .filter(([, text]) => text.length > 0);

    if (focusEntries.length === 0) {
        return null;
    }

    const todayKey = getLocalDateKey();
    const exactToday = focusEntries.find(([dateKey]) => dateKey === todayKey);

    if (exactToday) {
        return {
            dateKey: exactToday[0],
            dateLabel: formatBoardDateLabel(exactToday[0]),
            kicker: '今日のひとこと',
            text: exactToday[1],
            tone: 'today',
        };
    }

    return null;
};

const Home = ({ stats, updateStats }) => {
    // Default stats if not provided (fallback)
    const {
        name = '先輩',
        rank = 'C+',
        tp = 100,
        maxTp = 100,
        intellect = 0,
        diamonds = 0,
        affection = 0,
        equippedSkin = 'default',
        equippedBackground = 'default',
        equippedAccessories = [],
    } = stats || {};

    const loginStreak = stats?.loginStreak || 0;
    const characterId = stats?.characterId || 'noah';
    const preferredRenderer = stats?.characterRenderer;
    const hasHomeLive2D = hasLive2DModelConfig(characterId, equippedSkin);
    const currentBgStyle = getBackgroundStyle(equippedBackground);

    const navigate = useNavigate();
    const location = useLocation();
    const { playVoice, stopVoice } = useSound();
    const [speech, setSpeech] = useState("");
    const [baseHomeEmotion, setBaseHomeEmotion] = useState('normal');
    const [activeHomeReaction, setActiveHomeReaction] = useState(null);
    const [userInputEmotion, setUserInputEmotion] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loginBonusData, setLoginBonusData] = useState(null);
    const [isTalkAnimating, setIsTalkAnimating] = useState(false);
    const [speechNonce, setSpeechNonce] = useState(0);
    const [touchMotion, setTouchMotion] = useState('');
    const [touchMotionStyle, setTouchMotionStyle] = useState(null);
    const [live2dImpact, setLive2dImpact] = useState(null);
    const [homeGoalTodos, setHomeGoalTodos] = useState(() => loadGoalTodos());
    const [lastStudyTopic, setLastStudyTopic] = useState(() => getLastStudyTopic());
    const displaySpeech = useMemo(() => personalizePlayerText(speech, stats), [speech, stats]);
    const talkAnimationTimerRef = useRef(null);
    const userInputEmotionTimerRef = useRef(null);
    const touchMotionTimerRef = useRef(null);
    const live2dImpactTimerRef = useRef(null);
    const touchAreaTapGuardRef = useRef(0);
    const interactionDedupRef = useRef({ key: '', timestamp: 0 });
    const speechPriorityLockRef = useRef(0);

    // Get equipped title
    const selectedTitle = stats?.selectedTitle;
    const equippedTitle = selectedTitle ? ACHIEVEMENTS.find(a => a.id === selectedTitle)?.rewards?.title : null;

    // スキン画像のマッピング
    // キャラクターIDに基づいて切り替え (デフォルトは 'noah')

    // 好感度レベルを取得
    const affectionLevelInfo = getAffectionLevel(affection);
    const affectionProgress = getAffectionProgress(affection);
    const nextAffectionLevelInfo = getNextLevel(affectionLevelInfo.level);
    const affectionProgressLabel = nextAffectionLevelInfo
        ? `${Number(affection).toLocaleString()} / ${Number(nextAffectionLevelInfo.points).toLocaleString()}`
        : `${Number(affection).toLocaleString()} / MAX`;
    const examDate = stats?.examDate || '';
    const homeExpressionLayers = [
        activeHomeReaction
            ? createHomeExpressionLayer(HOME_EXPRESSION_LAYER.REACTION, {
                emotion: activeHomeReaction.emotion,
                pose: activeHomeReaction,
            })
            : null,
        userInputEmotion
            ? createHomeExpressionLayer(HOME_EXPRESSION_LAYER.USER_INPUT, {
                emotion: userInputEmotion,
            })
            : null,
        live2dImpact
            ? createHomeExpressionLayer(HOME_EXPRESSION_LAYER.IMPACT, {
                pose: live2dImpact,
            })
            : null,
    ].filter(Boolean);
    const homeExpressionState = resolveHomeExpressionLayers({
        baseEmotion: baseHomeEmotion,
        speech,
        tp,
        maxTp,
        affectionLevel: affectionLevelInfo.level,
        examDate,
        layers: homeExpressionLayers,
    });
    const homePose = {
        ...createHomePose({
            ...homeExpressionState.pose,
            text: displaySpeech,
        }, { speaking: isTalkAnimating }),
        speechNonce,
    };

    const getCountdownDisplay = () => {
        if (!examDate) {
            return { value: '--', suffix: '日', title: '目標日未設定' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const target = new Date(`${examDate}T00:00:00`);
        if (Number.isNaN(target.getTime())) {
            return { value: '--', suffix: '日', title: '日付エラー' };
        }

        const diffMs = target.getTime() - today.getTime();
        const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (remainingDays < 0) {
            return { value: '終了', suffix: '', title: '本番終了' };
        }

        if (remainingDays === 0) {
            return { value: '今日', suffix: '', title: '本番当日' };
        }

        return { value: remainingDays, suffix: '日', title: '本番まで' };
    };

    const countdownDisplay = getCountdownDisplay();
    const homeReviewSummary = useMemo(() => getHomeReviewSummary(stats), [stats]);
    const homeFocusBoard = useMemo(() => resolveHomeFocusBoard(stats?.calendarFocuses || {}), [stats?.calendarFocuses]);
    const pendingHomeTodos = useMemo(
        () => homeGoalTodos.filter((todo) => !todo.completed && String(todo.text || '').trim().length > 0),
        [homeGoalTodos],
    );
    const visibleHomeTodos = useMemo(() => pendingHomeTodos.slice(0, 2), [pendingHomeTodos]);
    const homeTouchAreas = useMemo(() => getEnabledHomeTouchAreas(characterId), [characterId]);
    const unreadRelationshipEvents = useMemo(() => getUnreadRelationshipEvents(stats), [stats]);
    const seasonalHomeEvent = useMemo(
        () => SEASONAL_EVENTS.find((event) => isSeasonalEventActive(event)) || null,
        [],
    );
    const seasonalHomeEventProgress = useMemo(
        () => (seasonalHomeEvent ? getSeasonalEventProgress(stats, seasonalHomeEvent.id) : null),
        [seasonalHomeEvent, stats],
    );
    const seasonalHomeEventRemainingDays = useMemo(
        () => (seasonalHomeEvent ? getSeasonalEventRemainingDays(seasonalHomeEvent) : null),
        [seasonalHomeEvent],
    );
    const homeCharacterPreview = useMemo(() => {
        const previewKey = new URLSearchParams(location.search).get('characterPreview');
        const preview = HOME_CHARACTER_PREVIEWS[previewKey];

        if (!preview) {
            return null;
        }

        if (preview.characterId && preview.characterId !== characterId) {
            return null;
        }

        return preview;
    }, [characterId, location.search]);
    const shouldForceHomeLive2D = !homeCharacterPreview && characterId === 'noah' && hasHomeLive2D;
    const renderer = resolveCharacterRenderer({
        preferredRenderer: homeCharacterPreview?.forceRenderer || (shouldForceHomeLive2D ? 'live2d' : preferredRenderer),
        characterId,
        skinId: equippedSkin,
    });
    const examDaysLeft = useMemo(() => {
        if (!examDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(`${examDate}T00:00:00`);
        if (Number.isNaN(target.getTime())) {
            return null;
        }

        return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }, [examDate]);
    const headerSealLabel = characterId === 'ren'
        ? 'R'
        : characterId === 'firefly'
            ? 'F'
            : characterId === 'sparkle'
                ? 'S'
                : 'N';

    const stopTalkAnimation = useCallback(() => {
        if (talkAnimationTimerRef.current) {
            clearTimeout(talkAnimationTimerRef.current);
            talkAnimationTimerRef.current = null;
        }
        setIsTalkAnimating(false);
    }, []);

    const scheduleUserInputEmotion = (nextEmotion) => {
        if (userInputEmotionTimerRef.current) {
            clearTimeout(userInputEmotionTimerRef.current);
            userInputEmotionTimerRef.current = null;
        }

        if (!nextEmotion || nextEmotion === 'normal') {
            setUserInputEmotion(null);
            return;
        }

        setUserInputEmotion(nextEmotion);
        userInputEmotionTimerRef.current = setTimeout(() => {
            setUserInputEmotion(null);
            userInputEmotionTimerRef.current = null;
        }, 3800);
    };

    const startTimedTalkAnimation = (text) => {
        if (talkAnimationTimerRef.current) {
            clearTimeout(talkAnimationTimerRef.current);
            talkAnimationTimerRef.current = null;
        }
        flushSync(() => {
            setIsTalkAnimating(false);
            setSpeechNonce((current) => current + 1);
        });
        setIsTalkAnimating(true);
        talkAnimationTimerRef.current = setTimeout(() => {
            setIsTalkAnimating(false);
            talkAnimationTimerRef.current = null;
        }, Math.max(1500, String(text || '').length * 150));
    };

    const triggerTouchMotion = (areaId) => {
        if (touchMotionTimerRef.current) {
            clearTimeout(touchMotionTimerRef.current);
            touchMotionTimerRef.current = null;
        }
        if (live2dImpactTimerRef.current) {
            clearTimeout(live2dImpactTimerRef.current);
            live2dImpactTimerRef.current = null;
        }

        const nextMotion = areaId === 'chest' ? 'chest-flinch' : areaId === 'hair' ? 'hair-sway' : 'face-bounce';
        const createChestFlinchVariant = () => {
            const side = Math.random() < 0.5 ? -1 : 1;
            const durationMs = 1180 + Math.round(Math.random() * 240);
            const intensity = 0.92 + (Math.random() * 0.22);
            const lift = 0.88 + (Math.random() * 0.26);
            const twist = 0.84 + (Math.random() * 0.26);
            const settle = 0.82 + (Math.random() * 0.24);
            const anticipation = 0.82 + (Math.random() * 0.28);
            const lag = 0.9 + (Math.random() * 0.22);
            const escapeX = side * Math.round((10 + Math.random() * 6) * intensity);
            const escapeY = -Math.round((17 + Math.random() * 8) * lift);
            const recoilX = side * -Math.round((4 + Math.random() * 4) * settle);
            const recoilY = Math.round(3 + Math.random() * 4);
            const settleX = side * Math.round(1 + Math.random() * 2);
            const settleY = -Math.round(1 + Math.random() * 2);
            const anticipationX = side * Math.round(1 + Math.random() * 2);
            const anticipationY = Math.round(2 + Math.random() * 2);
            const escapeRotate = side * -(1.8 + Math.random() * 1.1) * twist;
            const recoilRotate = side * (0.9 + Math.random() * 0.9) * settle;
            const settleRotate = side * -(0.18 + Math.random() * 0.32);

            return {
                durationMs,
                live2d: {
                    side,
                    intensity,
                    lift,
                    twist,
                    settle,
                    anticipation,
                    lag,
                },
                css: {
                    '--chest-flinch-duration': `${durationMs + 180}ms`,
                    '--chest-flinch-anticipation-x': `${anticipationX}px`,
                    '--chest-flinch-anticipation-y': `${anticipationY}px`,
                    '--chest-flinch-escape-x': `${escapeX}px`,
                    '--chest-flinch-escape-y': `${escapeY}px`,
                    '--chest-flinch-recoil-x': `${recoilX}px`,
                    '--chest-flinch-recoil-y': `${recoilY}px`,
                    '--chest-flinch-settle-x': `${settleX}px`,
                    '--chest-flinch-settle-y': `${settleY}px`,
                    '--chest-flinch-escape-rotate': `${escapeRotate.toFixed(2)}deg`,
                    '--chest-flinch-recoil-rotate': `${recoilRotate.toFixed(2)}deg`,
                    '--chest-flinch-settle-rotate': `${settleRotate.toFixed(2)}deg`,
                    '--chest-flinch-escape-scale': (1.032 + (Math.random() * 0.02)).toFixed(3),
                    '--chest-flinch-recoil-scale': (0.989 + (Math.random() * 0.015)).toFixed(3),
                    '--chest-flinch-settle-scale': (1.002 + (Math.random() * 0.01)).toFixed(3),
                },
            };
        };
        const chestVariant = areaId === 'chest' ? createChestFlinchVariant() : null;
        const duration = chestVariant?.durationMs ?? (areaId === 'chest' ? 980 : 320);

        setTouchMotion(nextMotion);
        setTouchMotionStyle(chestVariant?.css ?? null);
        if (areaId === 'chest') {
            setLive2dImpact({
                live2dImpactMotion: 'chest-flinch',
                live2dImpactStartedAt: performance.now(),
                live2dImpactDurationMs: duration,
                live2dImpactVariant: chestVariant?.live2d ?? null,
            });
            live2dImpactTimerRef.current = setTimeout(() => {
                setLive2dImpact(null);
                live2dImpactTimerRef.current = null;
            }, duration + 160);
        } else {
            setLive2dImpact(null);
        }
        touchMotionTimerRef.current = setTimeout(() => {
            setTouchMotion('');
            setTouchMotionStyle(null);
            touchMotionTimerRef.current = null;
        }, duration + (areaId === 'chest' ? 160 : 0));
    };

    const isDuplicateInteraction = (key, windowMs = 700) => {
        const now = Date.now();
        const last = interactionDedupRef.current;
        if (last.key === key && now - last.timestamp < windowMs) {
            return true;
        }

        interactionDedupRef.current = { key, timestamp: now };
        return false;
    };

    const lockManualSpeechPriority = (durationMs = 1800) => {
        speechPriorityLockRef.current = Date.now() + durationMs;
    };

    // Random speech on mount and click (好感度レベルに応じて)
    const talk = async ({ source = 'system' } = {}) => {
        if (source !== 'system' && isDuplicateInteraction(`talk:${source}`)) {
            return;
        }

        if (source === 'system' && Date.now() < speechPriorityLockRef.current) {
            return;
        }

        const reaction = getHomeReaction({
            affection,
            tp,
            maxTp,
            loginStreak,
            characterId,
            reviewDueCount: homeReviewSummary.due,
            examDaysLeft,
        });
        setActiveHomeReaction(reaction);
        setSpeech(reaction.text);
        setBaseHomeEmotion(toVisibleHomeEmotion(reaction.emotion || 'normal'));
        startTimedTalkAnimation(reaction.text);

        const played = reaction.voice
            ? await playVoice(reaction.voice, {
                channel: 'home',
                requiresUserInteraction: source === 'system',
                suppressBlockedError: source === 'system',
                onStart: () => {
                    startTimedTalkAnimation(reaction.text);
                },
                onEnd: () => {
                    stopTalkAnimation();
                },
            })
            : false;

        if (!played && reaction.voice) {
            stopTalkAnimation();
            startTimedTalkAnimation(reaction.text);
        }

        // Update mission progress for character interaction
        updateMissionsOnInteract();

        if (source !== 'system' && typeof updateStats === 'function') {
            updateStats((currentStats) => applyRelationshipActivity(currentStats, {
                type: 'talk',
                summary: 'ホームで少し話した',
                detail: '短いひとことでも、いつもの距離感が少しやわらいだ。',
            }).nextStats);
        }
    };

    const handleTouchAreaTap = async (areaId, event) => {
        if (isDuplicateInteraction(`area:${areaId}`)) {
            event?.preventDefault?.();
            event?.stopPropagation?.();
            return;
        }

        touchAreaTapGuardRef.current = Date.now() + 1000;
        lockManualSpeechPriority();
        event?.preventDefault?.();
        event?.stopPropagation?.();
        triggerTouchMotion(areaId);

        const reaction = getHomeTouchReaction(characterId, areaId);
        if (!reaction) {
            return;
        }

        setActiveHomeReaction(reaction);
        setSpeech(reaction.text);
        setBaseHomeEmotion(toVisibleHomeEmotion(reaction.emotion || 'normal'));
        startTimedTalkAnimation(reaction.text);

        const played = reaction.voice
            ? await playVoice(reaction.voice, {
                channel: 'home',
                onStart: () => {
                    startTimedTalkAnimation(reaction.text);
                },
                onEnd: () => {
                    stopTalkAnimation();
                },
            })
            : false;

        if (!played && reaction.voice) {
            stopTalkAnimation();
            startTimedTalkAnimation(reaction.text);
        }

        updateMissionsOnInteract();

        if (typeof updateStats === 'function') {
            updateStats((currentStats) => applyRelationshipActivity(currentStats, {
                type: 'talk',
                summary: 'ホームで触れ合った',
                detail: '何気ないリアクションの応酬が、少しずつ親しさになっていく。',
            }).nextStats);
        }
    };

    const handleCharacterTap = (event) => {
        if (Date.now() < touchAreaTapGuardRef.current) {
            event?.preventDefault?.();
            event?.stopPropagation?.();
            return;
        }

        void talk({ source: 'touch' });
    };

    const reactToUserMessage = (userText, { emotion: nextEmotion } = {}) => {
        const inferredEmotion = toVisibleHomeEmotion(
            nextEmotion || inferEmotionFromChatText(userText, { role: 'user' })
        );
        scheduleUserInputEmotion(inferredEmotion);
    };

    const syncSpeechWithNoaReply = (replyText, { animate = false, emotion: replyEmotion, force = false } = {}) => {
        if (!force && Date.now() < speechPriorityLockRef.current) {
            return;
        }

        const nextSpeech = String(replyText || '').trim();
        if (!nextSpeech) return;

        const inferredReplyEmotion = replyEmotion || inferEmotionFromChatText(nextSpeech, { role: 'assistant' });
        const visibleReplyEmotion = toVisibleHomeEmotion(
            inferredReplyEmotion !== 'normal'
                ? inferredReplyEmotion
                : inferHomeEmotion({
                    emotion: 'normal',
                    speech: nextSpeech,
                    tp,
                    maxTp,
                    affectionLevel: affectionLevelInfo.level,
                    examDate,
                })
        );

        setActiveHomeReaction({
            emotion: visibleReplyEmotion,
            text: nextSpeech,
        });
        setSpeech(nextSpeech);
        setBaseHomeEmotion(visibleReplyEmotion);
        if (animate) {
            startTimedTalkAnimation(nextSpeech);
        } else {
            stopTalkAnimation();
        }
    };

    const runSystemHomeTalk = useEffectEvent(async () => {
        const reaction = getHomeReaction({
            affection,
            tp,
            maxTp,
            loginStreak,
            characterId,
            reviewDueCount: homeReviewSummary.due,
            examDaysLeft,
        });
        setActiveHomeReaction(reaction);
        setSpeech(reaction.text);
        setBaseHomeEmotion(toVisibleHomeEmotion(reaction.emotion || 'normal'));
        startTimedTalkAnimation(reaction.text);

        const played = reaction.voice
            ? await playVoice(reaction.voice, {
                channel: 'home',
                requiresUserInteraction: true,
                suppressBlockedError: true,
                onStart: () => {
                    startTimedTalkAnimation(reaction.text);
                },
                onEnd: () => {
                    stopTalkAnimation();
                },
            })
            : false;

        if (!played && reaction.voice) {
            stopTalkAnimation();
            startTimedTalkAnimation(reaction.text);
        }

        updateMissionsOnInteract();
    });

    useEffect(() => {
        setLastStudyTopic(getLastStudyTopic());
    }, []);

    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key === 'lastStudyTopic') {
                setLastStudyTopic(getLastStudyTopic());
            }
            if (event.key === 'uma_todos') {
                setHomeGoalTodos(loadGoalTodos());
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        const latestReply = getLatestNoaAssistantMessageEntry('general');

        if (latestReply?.content) {
            const nextSpeech = String(latestReply.content || '').trim();
            if (!nextSpeech) {
                return;
            }

            const inferredReplyEmotion = latestReply.emotion || inferEmotionFromChatText(nextSpeech, { role: 'assistant' });
            const visibleReplyEmotion = toVisibleHomeEmotion(
                inferredReplyEmotion !== 'normal'
                    ? inferredReplyEmotion
                    : inferHomeEmotion({
                        emotion: 'normal',
                        speech: nextSpeech,
                        tp,
                        maxTp,
                        affectionLevel: affectionLevelInfo.level,
                        examDate,
                    })
            );

            setActiveHomeReaction({
                emotion: visibleReplyEmotion,
                text: nextSpeech,
            });
            setSpeech(nextSpeech);
            setBaseHomeEmotion(visibleReplyEmotion);
            startTimedTalkAnimation(nextSpeech);
            return;
        }

        void runSystemHomeTalk();
    }, [affectionLevelInfo.level, examDate, maxTp, tp]);

    useEffect(() => {
        if (!shouldForceHomeLive2D || !updateStats || preferredRenderer === 'live2d') {
            return;
        }

        updateStats({ characterRenderer: 'live2d' });
    }, [preferredRenderer, shouldForceHomeLive2D, updateStats]);

    // Check achievements on mount (for initial achievements like "Welcome!")
    useEffect(() => {
        checkForNewAchievements(stats);

        // ログインボーナスチェック
        if (stats && updateStats) {
            const bonusResult = processLoginBonus(stats);
            if (bonusResult) {
                updateStats(bonusResult.updates);
                setLoginBonusData(bonusResult);
            }
        }
    }, [stats, updateStats]);

    useEffect(() => (
        () => {
            stopTalkAnimation();
            stopVoice('home');
            if (userInputEmotionTimerRef.current) {
                clearTimeout(userInputEmotionTimerRef.current);
                userInputEmotionTimerRef.current = null;
            }
            if (touchMotionTimerRef.current) {
                clearTimeout(touchMotionTimerRef.current);
                touchMotionTimerRef.current = null;
            }
            if (live2dImpactTimerRef.current) {
                clearTimeout(live2dImpactTimerRef.current);
                live2dImpactTimerRef.current = null;
            }
        }
    ), [stopTalkAnimation, stopVoice]);

    // Calculate TP percentage
    const tpPercent = Math.min((tp / maxTp) * 100, 100);

    const handleOpenRecommendedReview = () => {
        if (!homeReviewSummary.hasReviews) {
            navigate('/study');
            return;
        }

        navigate('/review', {
            state: {
                autoStart: true,
                sessionSize: homeReviewSummary.sessionSize || 10,
                startQuestionId: homeReviewSummary.recommendedQuestion?.id || null,
            },
        });
    };

    const getReviewShortcutLabel = () => {
        if (!homeReviewSummary.hasReviews) {
            return '弱点ノートは空です。授業一覧へ移動します。';
        }

        return `${homeReviewSummary.priorityLabel}の弱点回収。今日 ${homeReviewSummary.due}件、連続 ${homeReviewSummary.reviewSetsToday}セット。`;
    };

    const handleResumeStudy = () => {
        if (!lastStudyTopic?.routePath) {
            navigate('/study');
            return;
        }

        navigate(lastStudyTopic.routePath);
    };

    const getResumeStudyLabel = () => {
        if (!lastStudyTopic) {
            return '前回の続きはまだありません。授業一覧へ移動します。';
        }

        const detail = [lastStudyTopic.modeLabel, lastStudyTopic.resumeLabel]
            .filter(Boolean)
            .join(' / ');
        return detail ? `${detail}を再開` : '前回の学習を再開';
    };

    const handleHomeTodoToggle = (todoId) => {
        const result = saveGoalTodos(homeGoalTodos.map((todo) => (
            todo.id === todoId
                ? { ...todo, completed: !todo.completed }
                : todo
        )));

        if (result.ok) {
            setHomeGoalTodos(result.todos);
        }
    };

    return (
        <div className="home-screen">
            {/* Menu Modal */}
            {isMenuOpen && <MenuModal onClose={() => setIsMenuOpen(false)} stats={stats} updateStats={updateStats} />}

            {/* Login Bonus Modal */}
            {loginBonusData && (
                <LoginBonusModal
                    onClose={() => setLoginBonusData(null)}
                    reward={loginBonusData.reward}
                    streak={loginBonusData.streak}
                    totalDays={loginBonusData.totalDays}
                    consecutive={loginBonusData.consecutive}
                />
            )}

            {/* Header Info */}
            <div className={`home-header home-header-${characterId}`}>
                {/* Left Group: Rank, User, TP, Affection */}
                <div className="header-left-group">
                    {/* Study Rank Block (Moved to Left) */}
                    <div className="header-block study-rank-block">
                        <div className="info-row study-rank-row">
                            <span className="study-rank-label">学力</span>
                            <span className="study-rank-value">{rank}</span>
                        </div>
                    </div>

                    <div className="header-block user-tp-block">
                        {/* User Info Row */}
                        <div className="info-row user-row">
                            <div className="header-user-main">
                                <span className={`header-character-seal is-${characterId}`} aria-hidden="true">
                                    {headerSealLabel}
                                </span>
                                <span className="user-name-text">{name}</span>
                                {equippedTitle && (
                                    <span className="user-title-badge">「{equippedTitle}」</span>
                                )}
                            </div>
                            <div className="header-affection-inline" aria-label={`好感度 レベル${affectionLevelInfo.level}`}>
                                <span className="affection-icon">💖</span>
                                <div className="affection-bar-bg is-inline">
                                    <div className="affection-bar-fill" style={{ width: `${affectionProgress}%` }}></div>
                                </div>
                                <span className="affection-level">Lv.{affectionLevelInfo.level}</span>
                            </div>
                        </div>
                        {/* TP Row */}
                        <div className="info-row tp-row">
                            <div className="tp-bar-container-compact">
                                <div className="tp-bar-bg-compact">
                                    <div className="tp-bar-fill" style={{ width: `${tpPercent}%` }}></div>
                                </div>
                                <span className="tp-text-compact">{tp}/{maxTp}</span>
                            </div>
                            <span className="affection-points inline">{affectionProgressLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Right Group (Currencies, Settings) */}
                <div className="header-right-group">
                    {/* Currencies Block */}
                    <div className="header-block">
                        {/* Intellect Row */}
                        <div className="info-row currency-row">
                            <span className="currency-icon-small">🧠</span>
                            <span className="currency-value-small">{intellect.toLocaleString()}</span>
                        </div>
                        {/* Jewel Row */}
                        <div className="info-row currency-row">
                            <span className="jewel-icon-small">💎</span>
                            <span className="currency-value-small">{diamonds.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Settings Block */}
                    <div className="header-block">
                        <button className="settings-btn" onClick={() => setIsMenuOpen(true)}>
                            ⚙️
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area (Room & Character) */}
            <SceneStageLayout
                rootClassName="room-container"
                rootStyle={equippedBackground !== 'default' ? currentBgStyle : undefined}
                backgroundClassName={equippedBackground === 'default' ? 'room-background' : ''}
                character={(
                    <div
                        className={`character-figure ${renderer === 'live2d' ? 'is-live2d' : ''} ${homeCharacterPreview?.figureClassName || ''}`}
                    >
                        <div
                            className={`character-touch-target ${touchMotion ? `motion-${touchMotion}` : ''}`}
                            style={touchMotionStyle || undefined}
                            onPointerUp={handleCharacterTap}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && void talk({ source: 'touch' })}
                        >
                            <CharacterStage
                                characterId={characterId}
                                renderer={renderer}
                                skinId={equippedSkin}
                                accessoryIds={equippedAccessories}
                                scene="home"
                                pose={homePose}
                                className="character-home"
                                imageClassName={`char-image ${isTalkAnimating ? 'talk-burst' : ''} ${homeCharacterPreview?.imageClassName || ''}`}
                                sourceOverride={homeCharacterPreview?.source}
                                disableFaceEffects={homeCharacterPreview?.disableFaceEffects}
                                chromaKey={homeCharacterPreview?.chromaKey}
                                alt={homeCharacterPreview?.alt || 'Character'}
                            />
                            {renderer === 'live2d' && (homePose.live2dFaceAccent === 'blush' || homePose.live2dFaceAccent === 'shy') && (
                                <div className={`home-live2d-face-accent is-${homePose.live2dFaceAccent}`} aria-hidden="true">
                                    <span className="home-live2d-blush left" />
                                    <span className="home-live2d-blush right" />
                                    {homePose.live2dFaceAccent === 'shy' && (
                                        <>
                                            <span className="home-live2d-eye-lid left" />
                                            <span className="home-live2d-eye-lid right" />
                                            <span className="home-live2d-mouth-shy" />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {homeTouchAreas.length > 0 && (
                            <div className="home-touch-hotspot-layer">
                                {homeTouchAreas.map((area) => (
                                    <button
                                        key={area.id}
                                        type="button"
                                        className={`home-touch-hotspot is-${area.id}`}
                                        style={{
                                            left: area.left,
                                            top: area.top,
                                            width: area.width,
                                            height: area.height,
                                        }}
                                        onPointerUp={(event) => { void handleTouchAreaTap(area.id, event); }}
                                        aria-label={`${area.label}をタップ`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="speech-bubble">
                            <p>{displaySpeech}</p>
                        </div>
                    </div>
                )}
            >

                {/* Countdown (Floating) */}
                <div className="countdown-floating" onClick={() => navigate('/goal')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/goal')}>
                    <div className="countdown-title">{countdownDisplay.title}</div>
                    <div className="countdown-days">
                        <span className="days-num">{countdownDisplay.value}</span>
                        {countdownDisplay.suffix && <span className="days-label">{countdownDisplay.suffix}</span>}
                    </div>
                </div>

                <button
                    type="button"
                    className={`home-review-card is-${homeReviewSummary.mode}`}
                    onClick={handleOpenRecommendedReview}
                    aria-label={getReviewShortcutLabel()}
                    title={getReviewShortcutLabel()}
                >
                    <span className={`home-review-priority-dot is-${homeReviewSummary.mode}`} aria-hidden="true" />
                    <span className="home-review-title">復習</span>
                    <span className="home-review-value" aria-hidden="true">
                        {homeReviewSummary.hasReviews ? homeReviewSummary.due : 0}
                    </span>
                    <span className="home-review-unit" aria-hidden="true">件</span>
                    {homeReviewSummary.reviewSetsToday > 0 && (
                        <span className="home-review-streak" aria-hidden="true">
                            {homeReviewSummary.reviewSetsToday}
                        </span>
                    )}
                </button>

                {homeFocusBoard && (
                    <section className={`home-focus-board is-${homeFocusBoard.tone}`} aria-label={`${homeFocusBoard.kicker}: ${homeFocusBoard.text}`}>
                        <span className="home-focus-board-pin" aria-hidden="true" />
                        <div className="home-focus-board-meta">
                            <span className="home-focus-board-kicker">{homeFocusBoard.kicker}</span>
                            {homeFocusBoard.dateLabel && (
                                <span className="home-focus-board-date">{homeFocusBoard.dateLabel}</span>
                            )}
                        </div>
                        <p className="home-focus-board-text">{homeFocusBoard.text}</p>
                    </section>
                )}

                {visibleHomeTodos.length > 0 && (
                    <section
                        className={`home-planner-card ${homeFocusBoard ? 'with-focus-board' : 'is-standalone'}`}
                        aria-label={`未完了のToDo ${pendingHomeTodos.length}件`}
                    >
                        <div className="home-planner-header compact">
                            <div className="home-planner-heading-copy">
                                <span className="home-planner-kicker">TODO</span>
                                <strong>今日やること</strong>
                            </div>
                            <span className="home-planner-date-chip">{pendingHomeTodos.length}件</span>
                        </div>

                        <div className="home-planner-section compact">
                            <div className="home-todo-list">
                                {visibleHomeTodos.map((todo) => (
                                    <div key={todo.id} className="home-todo-item">
                                        <button
                                            type="button"
                                            className="home-todo-toggle"
                                            onClick={() => handleHomeTodoToggle(todo.id)}
                                            aria-label={`「${todo.text}」を完了にする`}
                                            title="タップで完了"
                                        >
                                            <span>✓</span>
                                        </button>
                                        <p className="home-todo-preview is-condensed">{todo.text}</p>
                                    </div>
                                ))}
                            </div>
                            {pendingHomeTodos.length > visibleHomeTodos.length && (
                                <p className="home-todo-more">ほか {pendingHomeTodos.length - visibleHomeTodos.length} 件</p>
                            )}
                        </div>
                    </section>
                )}

                {seasonalHomeEvent && (
                    <button
                        type="button"
                        className={`home-seasonal-banner ${seasonalHomeEventProgress?.completed ? 'is-cleared' : ''}`}
                        onClick={() => navigate(`/seasonal-events/${seasonalHomeEvent.id}`)}
                        aria-label={`${seasonalHomeEvent.title}へ移動`}
                    >
                        <span className="home-seasonal-banner-kicker">{seasonalHomeEvent.bannerKicker}</span>
                        <strong className="home-seasonal-banner-title">{seasonalHomeEvent.homeBannerTitle}</strong>
                        <span className="home-seasonal-banner-meta">
                            {seasonalHomeEventProgress?.completed
                                ? 'CLEAR'
                                : seasonalHomeEventRemainingDays === 0
                                    ? '今日まで'
                                    : `あと${seasonalHomeEventRemainingDays}日`}
                        </span>
                        {!seasonalHomeEventProgress?.completed && (
                            <span className="home-seasonal-banner-badge" aria-hidden="true">
                                NEW
                            </span>
                        )}
                    </button>
                )}

                {/* Action Buttons */}
                <div className="action-area has-resume">
                    <button
                        className="battle-btn-large"
                        onClick={() => navigate('/multiplayer-match')}
                        aria-label="バトル"
                    >
                        <span>バトル</span>
                    </button>
                    <button
                        type="button"
                        className="resume-study-btn-large"
                        onClick={handleResumeStudy}
                        aria-label={getResumeStudyLabel()}
                        title={getResumeStudyLabel()}
                    >
                        <span className="resume-study-main">続きから</span>
                        <span className="resume-study-sub">
                            {lastStudyTopic?.resumeLabel || lastStudyTopic?.topicName || '履歴がなければ授業一覧へ'}
                        </span>
                    </button>
                    <button className="study-btn-large" onClick={() => navigate('/study')} aria-label="勉強">
                        <span>勉強</span>
                    </button>
                </div>

                {/* Social Buttons (Right Side) */}
                <div className="social-buttons">
                    <button
                        className="event-btn-side"
                        onClick={() => navigate('/character', { state: { openPanel: 'events' } })}
                        aria-label="イベント"
                    >
                        <span className="home-side-btn-label">イベ</span>
                        {unreadRelationshipEvents.length > 0 && (
                            <strong className="event-btn-badge">{unreadRelationshipEvents.length}</strong>
                        )}
                    </button>
                    <button className="mission-btn-side" onClick={() => navigate('/missions')} aria-label="課題">
                        <span className="home-side-btn-label">課題</span>
                    </button>
                    <button className="friend-btn" onClick={() => navigate('/friends')} aria-label="仲間">
                        <span className="home-side-btn-label">仲間</span>
                    </button>
                    <button className="ranking-btn" onClick={() => navigate('/ranking')} aria-label="順位">
                        <span className="home-side-btn-label">順位</span>
                    </button>
                </div>

                <NoaChatBox
                    stats={stats}
                    updateStats={updateStats}
                    compact
                    autoSpeakAssistant
                    onAssistantReply={syncSpeechWithNoaReply}
                    onUserMessage={reactToUserMessage}
                    onAssistantSpeechStart={() => {
                        stopTalkAnimation();
                        setIsTalkAnimating(true);
                    }}
                    onAssistantSpeechEnd={() => {
                        setIsTalkAnimating(false);
                    }}
                />
            </SceneStageLayout>

            {/* Footer removed */}
        </div>
    );
};

export default Home;
