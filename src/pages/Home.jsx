import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import './Home.css';
// Footer removed
import CharacterStage from '../components/character/CharacterStage';
import MenuModal from '../components/MenuModal';
import LoginBonusModal from '../components/LoginBonusModal';
import NoaChatBox from '../components/NoaChatBox';
import HomePreviewGeneratedChroma from '../assets/images/noah_home_preview_generated_chroma.png';
import EmmaStandingImage from '../assets/images/emma_home_preview_generated.png';

// Utils
import { getAffectionLevel, getAffectionProgress, getHomeReaction, getNextLevel } from '../utils/affectionUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { getBackgroundStyle } from '../utils/cosmeticUtils';
import { createHomePose } from '../utils/characterPoseUtils';
import { updateMissionsOnInteract } from '../utils/missionUtils';
import { checkForNewAchievements } from '../utils/achievementUtils';
import { ACHIEVEMENTS } from '../data/achievements';
import { processLoginBonus } from '../utils/loginBonusUtils';
import { getCharacterChatTopicKey, getLatestNoaAssistantMessageEntry } from '../utils/chatHistory';
import { inferEmotionFromChatText } from '../utils/chatEmotionUtils';
import { getEnabledHomeTouchAreas, getHomeTouchReaction } from '../data/homeTouchReactions';
import { CHARACTER_SELECT_OPTIONS, getCharacterLabel } from '../data/characterData';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { loadGoalTodos } from '../utils/goalUtils';
import { getEmptyGameLoopState } from '../utils/gameLoopUtils';
import { getHomeReviewSummary } from '../utils/reviewUtils';
import { applyRelationshipActivity } from '../utils/relationshipEventUtils';
import { getUnreadRelationshipEvents } from '../utils/relationshipEventUtils';
import { useSound } from '../contexts/SoundContext';
import { getLastStudyTopic } from '../data/studyData';
import {
    HOME_EXPRESSION_LAYER,
    createHomeExpressionLayer,
    inferHomeEmotion,
    resolveHomeExpressionLayers,
    toVisibleHomeEmotion,
} from '../utils/homeExpressionLayers';

const HOME_CHARACTER_PREVIEWS = {
    'emma-mvp': {
        characterId: 'emma',
        source: EmmaStandingImage,
        alt: 'Takase Emma standing portrait',
        forceRenderer: 'image',
        imageClassName: 'home-preview-emma-portrait',
        figureClassName: 'has-emma-preview',
        pose: {
            idleMotion: 'gentle',
            autoBlink: true,
        },
    },
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

const EMMA_MVP_HOME_SPEECH = '今日は長くやらなくていい。まず一個だけ、一緒に見よ。';

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
    const selectedHeroineId = stats?.selectedHeroineId || stats?.favoriteCharacter || characterId;
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
    const [lastStudyTopic, setLastStudyTopic] = useState(() => getLastStudyTopic());
    const [goalTodos, setGoalTodos] = useState(() => loadGoalTodos());
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
    const tpPercent = maxTp > 0
        ? Math.min(100, Math.max(0, (tp / maxTp) * 100))
        : 0;
    const affectionProgressLabel = nextAffectionLevelInfo
        ? `${Number(affection).toLocaleString()} / ${Number(nextAffectionLevelInfo.points).toLocaleString()}`
        : `${Number(affection).toLocaleString()} / MAX`;
    const examDate = stats?.examDate || '';
    const homeExpressionLayers = useMemo(() => [
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
    ].filter(Boolean), [activeHomeReaction, live2dImpact, userInputEmotion]);
    const homeExpressionState = useMemo(() => resolveHomeExpressionLayers({
        baseEmotion: baseHomeEmotion,
        speech,
        tp,
        maxTp,
        affectionLevel: affectionLevelInfo.level,
        examDate,
        layers: homeExpressionLayers,
    }), [affectionLevelInfo.level, baseHomeEmotion, examDate, homeExpressionLayers, maxTp, speech, tp]);
    const homePose = useMemo(() => ({
        ...createHomePose({
            ...homeExpressionState.pose,
            text: speech,
        }, { speaking: isTalkAnimating }),
        speechNonce,
    }), [homeExpressionState.pose, isTalkAnimating, speech, speechNonce]);

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
    const storyProgressFallback = useMemo(
        () => getEmptyGameLoopState().storyProgressSummary,
        [],
    );
    const isEmmaMvp = stats?.tutorialHomeVariant === 'emma-mvp';
    const isEmmaActiveCharacter = characterId === 'emma';
    const shouldUseEmmaMvpPresentation = isEmmaMvp && isEmmaActiveCharacter;
    const supportsNoaChat = characterId === 'noah' || characterId === 'emma';
    const chatHistoryKey = useMemo(() => getCharacterChatTopicKey(characterId), [characterId]);
    const storyProgressSummary = stats?.storyProgressSummary || storyProgressFallback;
    const featuredPromise = storyProgressSummary.featuredPromise;
    const selectedHeroineOption = useMemo(
        () => CHARACTER_SELECT_OPTIONS.find((character) => character.id === selectedHeroineId) || null,
        [selectedHeroineId],
    );
    const selectedHeroineLabel = selectedHeroineOption?.name || getCharacterLabel(selectedHeroineId);
    const selectedHeroineHint = selectedHeroineOption?.description?.split('\n')[0] || '今日いっしょに進める相手';
    const displayedFocusCharacterLabel = storyProgressSummary.focusCharacterLabel;
    const displayedPromiseCharacterLabel = featuredPromise?.characterLabel;
    const unreadRelationshipEvents = useMemo(() => getUnreadRelationshipEvents(stats), [stats]);
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
    const fallbackEmmaPreview = shouldUseEmmaMvpPresentation ? HOME_CHARACTER_PREVIEWS['emma-mvp'] : null;
    const activeHomeCharacterPreview = homeCharacterPreview || fallbackEmmaPreview;
    const isPreviewOnlyHomeCharacter = Boolean(
        activeHomeCharacterPreview?.characterId
        && activeHomeCharacterPreview.characterId !== characterId
    );
    const isHomeCharacterInteractive = !isPreviewOnlyHomeCharacter;
    const homeTouchAreas = useMemo(
        () => (isHomeCharacterInteractive ? getEnabledHomeTouchAreas(characterId) : []),
        [characterId, isHomeCharacterInteractive],
    );
    const shouldForceHomeLive2D = !activeHomeCharacterPreview && characterId === 'noah' && hasHomeLive2D;
    const renderer = resolveCharacterRenderer({
        preferredRenderer: activeHomeCharacterPreview?.forceRenderer || (shouldForceHomeLive2D ? 'live2d' : preferredRenderer),
        characterId: activeHomeCharacterPreview?.characterId || characterId,
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
    const tomorrowDate = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }, []);
    const tomorrowFocus = (stats?.calendarFocuses || {})[tomorrowDate] || '';
    const incompleteGoalTodos = useMemo(
        () => goalTodos.filter((todo) => !todo.completed),
        [goalTodos],
    );
    const visibleGoalTodos = useMemo(
        () => incompleteGoalTodos.slice(0, 2),
        [incompleteGoalTodos],
    );
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
    }, [setIsTalkAnimating]);

    const scheduleUserInputEmotion = useCallback((nextEmotion) => {
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
    }, [setUserInputEmotion]);

    const startTimedTalkAnimation = useCallback((text) => {
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
    }, [setIsTalkAnimating]);

    const triggerTouchMotion = useCallback((areaId) => {
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
    }, []);

    const isDuplicateInteraction = useCallback((key, windowMs = 700) => {
        const now = Date.now();
        const last = interactionDedupRef.current;
        if (last.key === key && now - last.timestamp < windowMs) {
            return true;
        }

        interactionDedupRef.current = { key, timestamp: now };
        return false;
    }, []);

    const lockManualSpeechPriority = useCallback((durationMs = 1800) => {
        speechPriorityLockRef.current = Date.now() + durationMs;
    }, []);

    // Random speech on mount and click (好感度レベルに応じて)
    const talk = useCallback(async ({ source = 'system' } = {}) => {
        if (!isHomeCharacterInteractive) {
            return;
        }

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
    }, [affection, characterId, examDaysLeft, homeReviewSummary.due, isDuplicateInteraction, isHomeCharacterInteractive, loginStreak, maxTp, playVoice, startTimedTalkAnimation, stopTalkAnimation, tp, updateStats]);

    const handleTouchAreaTap = useCallback(async (areaId, event) => {
        if (!isHomeCharacterInteractive) {
            event?.preventDefault?.();
            event?.stopPropagation?.();
            return;
        }

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
    }, [characterId, isDuplicateInteraction, isHomeCharacterInteractive, lockManualSpeechPriority, playVoice, startTimedTalkAnimation, stopTalkAnimation, triggerTouchMotion, updateStats]);

    const handleCharacterTap = useCallback((event) => {
        if (!isHomeCharacterInteractive) {
            event?.preventDefault?.();
            event?.stopPropagation?.();
            return;
        }

        if (Date.now() < touchAreaTapGuardRef.current) {
            event?.preventDefault?.();
            event?.stopPropagation?.();
            return;
        }

        void talk({ source: 'touch' });
    }, [isHomeCharacterInteractive, talk]);

    const reactToUserMessage = useCallback((userText, { emotion: nextEmotion } = {}) => {
        const inferredEmotion = toVisibleHomeEmotion(
            nextEmotion || inferEmotionFromChatText(userText, { role: 'user' })
        );
        scheduleUserInputEmotion(inferredEmotion);
    }, [scheduleUserInputEmotion]);

    const syncSpeechWithNoaReply = useCallback((replyText, { animate = false, emotion: replyEmotion } = {}) => {
        if (Date.now() < speechPriorityLockRef.current) {
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
    }, [affectionLevelInfo.level, examDate, maxTp, setBaseHomeEmotion, setSpeech, startTimedTalkAnimation, stopTalkAnimation, tp]);

    useEffect(() => {
        setLastStudyTopic(getLastStudyTopic());
    }, []);

    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key === 'lastStudyTopic') {
                setLastStudyTopic(getLastStudyTopic());
            }
            if (event.key === 'uma_todos') {
                setGoalTodos(loadGoalTodos());
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        if (shouldUseEmmaMvpPresentation && isPreviewOnlyHomeCharacter) {
            setActiveHomeReaction({
                emotion: 'normal',
                text: EMMA_MVP_HOME_SPEECH,
            });
            setSpeech(EMMA_MVP_HOME_SPEECH);
            setBaseHomeEmotion('normal');
            stopTalkAnimation();
            return;
        }

        if (!supportsNoaChat) {
            void talk();
            return;
        }

        const latestReply = getLatestNoaAssistantMessageEntry(chatHistoryKey);

        if (latestReply?.content) {
            syncSpeechWithNoaReply(latestReply.content, {
                animate: true,
                emotion: latestReply.emotion,
            });
            return;
        }

        void talk();
    }, [affectionLevelInfo.level, chatHistoryKey, isPreviewOnlyHomeCharacter, shouldUseEmmaMvpPresentation, stopTalkAnimation, supportsNoaChat, syncSpeechWithNoaReply, talk]);

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

    const handleOpenPromiseAction = () => {
        if (featuredPromise?.actionRoutePath === '/review') {
            handleOpenRecommendedReview();
            return;
        }

        navigate('/character', { state: { openPanel: 'events' } });
    };

    const handleOpenHeroineSelect = () => {
        if (isEmmaMvp) {
            return;
        }
        navigate('/character-select');
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
            <div className="room-container" style={equippedBackground !== 'default' ? currentBgStyle : {}}>
                {/* Placeholder for Room Background */}
                {equippedBackground === 'default' && <div className="room-background"></div>}

                <section className="home-story-strip" aria-label="今日の流れ">
                    <div className="home-story-strip-top">
                        <span className="home-story-date">{storyProgressSummary.dateLabel}</span>
                        <span className="home-story-weekday">{storyProgressSummary.weekdayLabel}</span>
                        <span className="home-story-timeslot">{storyProgressSummary.timeSlotLabel}</span>
                    </div>
                    <div className="home-story-focus">注目: {displayedFocusCharacterLabel}</div>
                    <div className="home-heroine-slot" aria-label="指定ヒロイン">
                        <div className="home-heroine-copy">
                            <span className="home-heroine-kicker">{isEmmaActiveCharacter ? 'Emma' : 'Partner'}</span>
                            <strong className="home-heroine-name">{selectedHeroineLabel}</strong>
                            <p className="home-heroine-hint">{selectedHeroineHint}</p>
                        </div>
                        {!shouldUseEmmaMvpPresentation && (
                            <button
                                type="button"
                                className="home-heroine-action"
                                onClick={handleOpenHeroineSelect}
                            >
                                変更
                            </button>
                        )}
                    </div>
                    <p className="home-story-route">{storyProgressSummary.routeLabel}</p>
                    <p className="home-story-mood">{storyProgressSummary.todayMoodCopy}</p>
                </section>

                <section className="home-promise-card" aria-label="放課後の予定">
                    <div className="home-promise-head">
                        {featuredPromise ? '今日の予定' : '放課後の予定'}
                    </div>
                    {featuredPromise ? (
                        <>
                            <div className="home-promise-title">{featuredPromise.title}</div>
                            <div className="home-promise-meta">
                                <span>{featuredPromise.timeSlotLabel}</span>
                                <span>{displayedPromiseCharacterLabel}</span>
                                <span>{featuredPromise.locationLabel}</span>
                            </div>
                            <p className="home-promise-body">{featuredPromise.body}</p>
                            <p className="home-promise-hint">{featuredPromise.hint}</p>
                            <button
                                type="button"
                                className="home-promise-action"
                                onClick={handleOpenPromiseAction}
                            >
                                {featuredPromise.actionLabel}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="home-promise-empty">今日はまだ特別な約束はない</p>
                            <p className="home-promise-hint">
                                先に授業か復習を進めておくと、あとで落ち着いて話しやすい。
                            </p>
                            <button
                                type="button"
                                className="home-promise-action"
                                onClick={handleOpenPromiseAction}
                            >
                                {storyProgressSummary.secondaryActionHint}
                            </button>
                        </>
                    )}
                </section>

                <section className="home-study-status-row" aria-label="学習状況">
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

                    <section className="home-planner-card" aria-label="明日の目標とToDo">
                        <div className="home-planner-header compact">
                            <div className="home-planner-heading-copy">
                                <span className="home-planner-kicker">Plan</span>
                                <strong>明日</strong>
                            </div>
                            <span className="home-planner-date-chip">{formatShortDate(tomorrowDate)}</span>
                        </div>

                        <div className="home-planner-section compact">
                            {tomorrowFocus ? (
                                <p className="home-focus-text is-condensed">{tomorrowFocus}</p>
                            ) : (
                                <p className="home-planner-empty is-condensed">
                                    カレンダーに明日の目標を書くと、ここに出ます。
                                </p>
                            )}
                        </div>

                        <div className="home-planner-summary-row">
                            <span className="home-planner-summary-label">ToDo</span>
                            <span className="home-planner-summary-value">{incompleteGoalTodos.length}件</span>
                        </div>

                        {visibleGoalTodos.length > 0 ? (
                            <p className="home-todo-preview is-condensed">
                                {visibleGoalTodos[0].text}
                                {incompleteGoalTodos.length > 1 ? ` / ほか ${incompleteGoalTodos.length - 1} 件` : ''}
                            </p>
                        ) : (
                            <p className="home-todo-preview is-condensed">
                                いまのToDoは全部片付いています。
                            </p>
                        )}

                        <div className="home-planner-actions compact">
                            <button
                                type="button"
                                className="home-planner-link compact"
                                onClick={() => navigate('/calendar')}
                            >
                                予定
                            </button>
                        </div>
                    </section>
                </section>

                {/* Character Figure */}
                <div
                    className={`character-figure ${renderer === 'live2d' ? 'is-live2d' : ''} ${activeHomeCharacterPreview?.figureClassName || ''}`}
                >
                    <div
                        className={`character-touch-target ${touchMotion ? `motion-${touchMotion}` : ''}`}
                        style={touchMotionStyle || undefined}
                        onPointerUp={isHomeCharacterInteractive ? handleCharacterTap : undefined}
                        role={isHomeCharacterInteractive ? 'button' : undefined}
                        tabIndex={isHomeCharacterInteractive ? 0 : undefined}
                        onKeyDown={isHomeCharacterInteractive ? (e) => e.key === 'Enter' && void talk({ source: 'touch' }) : undefined}
                    >
                        <CharacterStage
                            characterId={activeHomeCharacterPreview?.characterId || characterId}
                            renderer={renderer}
                            skinId={equippedSkin}
                            accessoryIds={equippedAccessories}
                            scene="home"
                            pose={{ ...homePose, ...(activeHomeCharacterPreview?.pose || {}) }}
                            className="character-home"
                            imageClassName={`char-image ${isTalkAnimating ? 'talk-burst' : ''} ${activeHomeCharacterPreview?.imageClassName || ''}`}
                            sourceOverride={activeHomeCharacterPreview?.source}
                            disableFaceEffects={activeHomeCharacterPreview?.disableFaceEffects}
                            chromaKey={activeHomeCharacterPreview?.chromaKey}
                            alt={activeHomeCharacterPreview?.alt || 'Character'}
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

                    {/* Speech Bubble */}
                    <div className="speech-bubble">
                        <p>{speech}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-area has-resume">
                    <button
                        className="study-btn-large"
                        onClick={() => navigate('/study')}
                        aria-label={storyProgressSummary.primaryActionHint}
                        title={storyProgressSummary.studyPriorityLabel}
                    >
                        <span>勉強</span>
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
                    <button
                        className="battle-btn-large"
                        onClick={() => navigate('/multiplayer-match')}
                        aria-label="バトル"
                    >
                        <span>バトル</span>
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

                {supportsNoaChat && (
                    <NoaChatBox
                        stats={stats}
                        characterId={characterId}
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
                )}
            </div>

            {/* Footer removed */}
        </div>
    );
};

const formatShortDate = (dateString) => {
    const date = new Date(`${dateString}T00:00:00`);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}/${date.getDate()} ${weekDays[date.getDay()]}`;
};

export default Home;
