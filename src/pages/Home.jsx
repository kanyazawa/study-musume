import React, { useEffect, useRef, useState } from 'react';
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
import { getLastStudyTopic } from '../data/studyData';
import { getLatestNoaAssistantMessage } from '../utils/chatHistory';

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loginBonusData, setLoginBonusData] = useState(null);
    const [isTalkAnimating, setIsTalkAnimating] = useState(false);
    const talkAnimationTimerRef = useRef(null);

    // Get equipped title
    const selectedTitle = stats?.selectedTitle;
    const equippedTitle = selectedTitle ? ACHIEVEMENTS.find(a => a.id === selectedTitle)?.rewards?.title : null;

    // スキン画像のマッピング
    // キャラクターIDに基づいて切り替え (デフォルトは 'noah')
    const characterId = stats.characterId || 'noah';
    const preferredRenderer = stats?.characterRenderer;

    const isVrmMode = characterId === 'noah' && localStorage.getItem('characterMode') === '3d';

    const currentBgStyle = getBackgroundStyle(equippedBackground);
    const homePose = createHomePose({ emotion, text: speech }, { speaking: isTalkAnimating });
    const renderer = resolveCharacterRenderer({
        preferredRenderer,
        characterId,
        skinId: equippedSkin,
        canUseVrm: isVrmMode,
    });

    // 好感度レベルを取得
    const affectionLevelInfo = getAffectionLevel(affection);
    const affectionProgress = getAffectionProgress(affection);
    const examDate = stats?.examDate || '';

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

    // Random speech on mount and click (好感度レベルに応じて)
    const talk = () => {
        if (talkAnimationTimerRef.current) {
            clearTimeout(talkAnimationTimerRef.current);
        }

        setIsTalkAnimating(true);
        const reaction = getHomeReaction({
            affection,
            tp,
            maxTp,
            loginStreak: stats?.loginStreak || 0,
            characterId,
        });
        setSpeech(reaction.text);
        setEmotion(reaction.emotion || 'normal');

        talkAnimationTimerRef.current = setTimeout(() => {
            setIsTalkAnimating(false);
        }, 480);

        // Update mission progress for character interaction
        updateMissionsOnInteract();
    };

    const syncSpeechWithNoaReply = (replyText) => {
        const nextSpeech = String(replyText || '').trim();
        if (!nextSpeech) return;

        setSpeech(nextSpeech);
        setEmotion('normal');
        setIsTalkAnimating(false);

        if (talkAnimationTimerRef.current) {
            clearTimeout(talkAnimationTimerRef.current);
            talkAnimationTimerRef.current = null;
        }
    };

    useEffect(() => {
        const topicName = getLastStudyTopic()?.topicName || 'default';
        const latestReply = getLatestNoaAssistantMessage(topicName);

        if (latestReply) {
            syncSpeechWithNoaReply(latestReply);
            return;
        }

        talk();
    }, [affectionLevelInfo.level]);

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
            if (talkAnimationTimerRef.current) {
                clearTimeout(talkAnimationTimerRef.current);
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
                    className={`character-figure ${isVrmMode ? 'is-vrm' : ''} ${renderer === 'live2d' ? 'is-live2d' : ''}`}
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
                        className="vrm-home"
                        imageClassName={`char-image ${isTalkAnimating ? 'talk-burst' : ''}`}
                    />

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

                <NoaChatBox stats={stats} compact onAssistantReply={syncSpeechWithNoaReply} />
            </div>

            {/* Footer removed */}
        </div>
    );
};

export default Home;
