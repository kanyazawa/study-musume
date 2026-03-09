import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
// Images
import CharacterMain from '../assets/images/character_new.png';
import CharacterRen from '../assets/images/character_ren.png';
import CharacterCasual from '../assets/images/character_casual_v9.png';
import CharacterGym from '../assets/images/character_gym.jpg';
import CharacterCasualGray from '../assets/images/character_casual_gray_hoodie.jpg';
import CharacterCasualBlack from '../assets/images/character_casual_hoodie.png';
// Footer removed
import MenuModal from '../components/MenuModal';
import LoginBonusModal from '../components/LoginBonusModal';

// Utils
import { getAffectionLevel, getAffectionProgress, getRandomQuote } from '../utils/affectionUtils';
import { getSkinImage, getSkinFilter, getBackgroundStyle, getNextSkinId } from '../utils/cosmeticUtils';
import { updateMissionsOnInteract } from '../utils/missionUtils';
import { getUnlockedTitles, checkForNewAchievements } from '../utils/achievementUtils';
import { ACHIEVEMENTS } from '../data/achievements';
import { processLoginBonus } from '../utils/loginBonusUtils';

const TSUNDERE_QUOTES = [
    "べ、別にアンタのために\n勉強教えてあげるわけじゃないんだからね！",
    "早く勉強しなさいよ、バカ！",
    "……ま、まあ、頑張ってるのは知ってるけど。",
    "ちょっと！\n私の顔ばっかり見てないでテキスト見なさいよ！",
    "次のテストで赤点取ったら承知しないから！",
    "ふん、意外とやるじゃない……\nほ、褒めてないわよ！"
];

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
        inventory = [],
        equippedSkin = 'default',
        equippedBackground = 'default'
    } = stats || {};

    const navigate = useNavigate();
    const [speech, setSpeech] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loginBonusData, setLoginBonusData] = useState(null);

    // Get equipped title
    const selectedTitle = stats?.selectedTitle;
    const equippedTitle = selectedTitle ? ACHIEVEMENTS.find(a => a.id === selectedTitle)?.rewards?.title : null;

    // スキン画像のマッピング
    // キャラクターIDに基づいて切り替え (デフォルトは 'noah')
    const characterId = stats.characterId || 'noah';

    // Ren (Male) placeholder
    const renImages = {
        'default': CharacterRen // Placeholder
    };

    const noahImages = {
        'default': CharacterMain,
        'skin_casual': CharacterCasual,
        'skin_gym': CharacterGym,
        'skin_casual_gray_hoodie': CharacterCasualGray,
        'skin_casual_hoodie': CharacterCasualBlack
    };

    const skinImages = characterId === 'ren' ? renImages : noahImages;

    // 装備中のスキン・背景の取得
    const currentSkinImage = skinImages[equippedSkin] || skinImages['default'];
    const currentSkinFilter = getSkinFilter(equippedSkin);
    const currentBgStyle = getBackgroundStyle(equippedBackground);

    // 着せ替え機能
    const changeSkin = (e) => {
        e.stopPropagation(); // talkイベントの発火を防ぐ
        const nextSkinId = getNextSkinId(equippedSkin, inventory);
        if (updateStats) {
            updateStats({ equippedSkin: nextSkinId });
        }
    };

    // 好感度レベルを取得
    const affectionLevelInfo = getAffectionLevel(affection);
    const affectionProgress = getAffectionProgress(affection);

    // Random speech on mount and click (好感度レベルに応じて)
    const talk = () => {
        const randomQuote = getRandomQuote(affectionLevelInfo.level, characterId);
        setSpeech(randomQuote);

        // Update mission progress for character interaction
        updateMissionsOnInteract();
    };

    useEffect(() => {
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
                <div className="countdown-floating">
                    <div className="countdown-title">入試まで</div>
                    <div className="countdown-days">
                        <span className="days-num">14</span>
                        <span className="days-label">日</span>
                    </div>
                </div>

                {/* Character Figure */}
                <div className="character-figure" onClick={talk}>
                    <img
                        src={currentSkinImage}
                        alt="Character"
                        className="char-image"
                        style={{ filter: currentSkinFilter }}
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
            </div>

            {/* Footer removed */}
        </div>
    );
};

export default Home;
