import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
// Footer removed
import CharacterStage from '../components/character/CharacterStage';
import MenuModal from '../components/MenuModal';
import LoginBonusModal from '../components/LoginBonusModal';
import NoaChatBox from '../components/NoaChatBox';

// Utils
import { getAffectionLevel, getAffectionProgress, getHomeReaction } from '../utils/affectionUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { getBackgroundStyle } from '../utils/cosmeticUtils';
import { createHomePose } from '../utils/characterPoseUtils';
import { updateMissionsOnInteract } from '../utils/missionUtils';
import { checkForNewAchievements } from '../utils/achievementUtils';
import { ACHIEVEMENTS } from '../data/achievements';
import { processLoginBonus } from '../utils/loginBonusUtils';
import { getLatestNoaAssistantMessageEntry } from '../utils/chatHistory';
import { inferEmotionFromChatText } from '../utils/chatEmotionUtils';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';

const inferHomeEmotion = ({ emotion, speech, tp, maxTp, affectionLevel, examDate }) => {
    if (emotion && emotion !== 'normal') {
        return emotion;
    }

    const normalizedSpeech = String(speech || '').toLowerCase();
    const tpRatio = maxTp > 0 ? tp / maxTp : 0;

    if (tpRatio <= 0.25) {
        return 'serious';
    }

    if (examDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(`${examDate}T00:00:00`);
        if (!Number.isNaN(target.getTime())) {
            const remainingDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (remainingDays >= 0 && remainingDays <= 7) {
                return 'serious';
            }
        }
    }

    if (
        normalizedSpeech.includes('嬉') ||
        normalizedSpeech.includes('安心') ||
        normalizedSpeech.includes('ありがと') ||
        normalizedSpeech.includes('一緒') ||
        normalizedSpeech.includes('いい感じ') ||
        normalizedSpeech.includes('落ち着')
    ) {
        return 'happy';
    }

    if (
        normalizedSpeech.includes('深呼吸') ||
        normalizedSpeech.includes('無理') ||
        normalizedSpeech.includes('休') ||
        normalizedSpeech.includes('集中')
    ) {
        return 'serious';
    }

    if (affectionLevel >= 5) {
        return 'happy';
    }

    return 'normal';
};

const toVisibleHomeEmotion = (emotion) => {
    switch (emotion) {
        case 'smile':
            return 'happy';
        case 'sad':
            return 'serious';
        default:
            return emotion || 'normal';
    }
};

const Home = ({ stats, updateStats }) => {
    // Default stats if not provided (fallback)
    const {
        name = 'トレーナー',
        rank = 'C+',
        tp = 100,
        maxTp = 100,
        intellect = 0,
        diamonds = 0,
        affection = 0,
        equippedSkin = 'default',
        equippedBackground = 'default'
    } = stats || {};

    const navigate = useNavigate();
    const [speech, setSpeech] = useState("");
    const [emotion, setEmotion] = useState('normal');
    const [userInputEmotion, setUserInputEmotion] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loginBonusData, setLoginBonusData] = useState(null);
    const [isTalkAnimating, setIsTalkAnimating] = useState(false);
    const talkAnimationTimerRef = useRef(null);
    const userInputEmotionTimerRef = useRef(null);

    // Get equipped title
    const selectedTitle = stats?.selectedTitle;
    const equippedTitle = selectedTitle ? ACHIEVEMENTS.find(a => a.id === selectedTitle)?.rewards?.title : null;

    // スキン画像のマッピング
    // キャラクターIDに基づいて切り替え (デフォルトは 'noah')
    const characterId = stats.characterId || 'noah';
    const preferredRenderer = stats?.characterRenderer;
    const hasHomeLive2D = hasLive2DModelConfig(characterId, equippedSkin);
    const shouldForceHomeLive2D = characterId === 'noah' && hasHomeLive2D;

    const currentBgStyle = getBackgroundStyle(equippedBackground);
    const renderer = resolveCharacterRenderer({
        preferredRenderer: shouldForceHomeLive2D ? 'live2d' : preferredRenderer,
        characterId,
        skinId: equippedSkin,
    });

    // 好感度レベルを取得
    const affectionLevelInfo = getAffectionLevel(affection);
    const affectionProgress = getAffectionProgress(affection);
    const examDate = stats?.examDate || '';
    const homeEmotion = useMemo(() => toVisibleHomeEmotion(inferHomeEmotion({
        emotion: userInputEmotion || emotion,
        speech,
        tp,
        maxTp,
        affectionLevel: affectionLevelInfo.level,
        examDate,
    })), [affectionLevelInfo.level, emotion, examDate, maxTp, speech, tp, userInputEmotion]);
    const homePose = useMemo(() => createHomePose({ emotion: homeEmotion, text: speech }, { speaking: isTalkAnimating }), [homeEmotion, isTalkAnimating, speech]);

    const getCountdownDisplay = () => {
        if (!examDate) {
            return { value: '--', suffix: '日', title: '入試日未設定' };
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
            return { value: '終了', suffix: '', title: '入試日通過' };
        }

        if (remainingDays === 0) {
            return { value: '今日', suffix: '', title: '入試当日' };
        }

        return { value: remainingDays, suffix: '日', title: '入試まで' };
    };

    const countdownDisplay = getCountdownDisplay();

    const stopTalkAnimation = () => {
        if (talkAnimationTimerRef.current) {
            clearTimeout(talkAnimationTimerRef.current);
            talkAnimationTimerRef.current = null;
        }
        setIsTalkAnimating(false);
    };

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
    }, []);

    const startTimedTalkAnimation = (text) => {
        stopTalkAnimation();
        setIsTalkAnimating(true);
        talkAnimationTimerRef.current = setTimeout(() => {
            setIsTalkAnimating(false);
            talkAnimationTimerRef.current = null;
        }, Math.max(1500, String(text || '').length * 150));
    };

    // Random speech on mount and click (好感度レベルに応じて)
    const talk = () => {
        const reaction = getHomeReaction({
            affection,
            tp,
            maxTp,
            loginStreak: stats?.loginStreak || 0,
            characterId,
        });
        setSpeech(reaction.text);
        setEmotion(toVisibleHomeEmotion(reaction.emotion || 'normal'));
        startTimedTalkAnimation(reaction.text);

        // Update mission progress for character interaction
        updateMissionsOnInteract();
    };

    const reactToUserMessage = useCallback((userText, { emotion: nextEmotion } = {}) => {
        const inferredEmotion = toVisibleHomeEmotion(
            nextEmotion || inferEmotionFromChatText(userText, { role: 'user' })
        );
        scheduleUserInputEmotion(inferredEmotion);
    }, [scheduleUserInputEmotion]);

    const syncSpeechWithNoaReply = useCallback((replyText, { animate = false, emotion: replyEmotion } = {}) => {
        const nextSpeech = String(replyText || '').trim();
        if (!nextSpeech) return;

        const inferredReplyEmotion = replyEmotion || inferEmotionFromChatText(nextSpeech, { role: 'assistant' });

        setSpeech(nextSpeech);
        setEmotion(toVisibleHomeEmotion(
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
        ));
        if (animate) {
            startTimedTalkAnimation(nextSpeech);
        } else {
            stopTalkAnimation();
        }
    }, [affectionLevelInfo.level, examDate, maxTp, tp]);

    useEffect(() => {
        const latestReply = getLatestNoaAssistantMessageEntry('general');

        if (latestReply?.content) {
            syncSpeechWithNoaReply(latestReply.content, {
                animate: true,
                emotion: latestReply.emotion,
            });
            return;
        }

        talk();
    }, [affectionLevelInfo.level]);

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
    }, []);

    useEffect(() => (
        () => {
            stopTalkAnimation();
            if (userInputEmotionTimerRef.current) {
                clearTimeout(userInputEmotionTimerRef.current);
                userInputEmotionTimerRef.current = null;
            }
        }
    ), []);

    // Calculate TP percentage
    const tpPercent = Math.min((tp / maxTp) * 100, 100);

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
            <div className="home-header">
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
                            <span className="user-name-text">{name}</span>
                            {equippedTitle && (
                                <span className="user-title-badge">「{equippedTitle}」</span>
                            )}
                        </div>
                        {/* TP Row */}
                        <div className="info-row tp-row">
                            <div className="tp-bar-container-compact">
                                <div className="tp-bar-bg-compact">
                                    <div className="tp-bar-fill" style={{ width: `${tpPercent}%` }}></div>
                                </div>
                                <span className="tp-text-compact">{tp}/{maxTp}</span>
                            </div>
                        </div>
                        {/* Affection Row */}
                        <div className="info-row affection-row">
                            <div className="affection-bar-container">
                                <span className="affection-icon">💖</span>
                                <div className="affection-bar-bg">
                                    <div className="affection-bar-fill" style={{ width: `${affectionProgress}%` }}></div>
                                </div>
                                <span className="affection-level">Lv.{affectionLevelInfo.level}</span>
                            </div>
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

                {/* Countdown (Floating) */}
                <div className="countdown-floating" onClick={() => navigate('/goal')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/goal')}>
                    <div className="countdown-title">{countdownDisplay.title}</div>
                    <div className="countdown-days">
                        <span className="days-num">{countdownDisplay.value}</span>
                        {countdownDisplay.suffix && <span className="days-label">{countdownDisplay.suffix}</span>}
                    </div>
                </div>

                {/* Character Figure */}
                <div
                    className={`character-figure ${renderer === 'live2d' ? 'is-live2d' : ''}`}
                >
                    <div
                        className="character-touch-target"
                        onClick={talk}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && talk()}
                    >
                        <CharacterStage
                            characterId={characterId}
                            renderer={renderer}
                            skinId={equippedSkin}
                            scene="home"
                            pose={homePose}
                            className="character-home"
                            imageClassName={`char-image ${isTalkAnimating ? 'talk-burst' : ''}`}
                        />
                    </div>

                    {/* Speech Bubble */}
                    <div className="speech-bubble">
                        <p>{speech}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-area">
                    <button className="battle-btn-large" onClick={() => navigate('/multiplayer-match')}>
                        <span>⚔️ 対戦</span>
                    </button>
                    <button className="study-btn-large" onClick={() => navigate('/study')}>
                        <span>📚 勉強</span>
                    </button>
                </div>

                {/* Social Buttons (Right Side) */}
                <div className="social-buttons">
                    <button className="mission-btn-side" onClick={() => navigate('/missions')}>
                        <span>✓ ミッション</span>
                    </button>
                    <button className="friend-btn" onClick={() => navigate('/friends')}>
                        <span>👥 フレンド</span>
                    </button>
                    <button className="ranking-btn" onClick={() => navigate('/ranking')}>
                        <span>🏆 ランキング</span>
                    </button>
                </div>

                <NoaChatBox
                    stats={stats}
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
            </div>

            {/* Footer removed */}
        </div>
    );
};

export default Home;
