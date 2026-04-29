import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Sparkles } from 'lucide-react';
import CharacterStage from '../components/character/CharacterStage';
import { useSound } from '../contexts/SoundContext';
import { getCurrentUser, getUserProfile } from '../firebase/auth';
import { createHomePose } from '../utils/characterPoseUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { loadAchievementStats } from '../utils/achievementUtils';
import {
    claimMissionReward,
    getAllMissionsWithProgress,
} from '../utils/missionUtils';
import { getTtsSettings, TTS_ENGINES } from '../utils/ttsSettings';
import { getNormalizedDailyReviewProgress } from '../utils/reviewUtils';
import {
    buildSpeechVariationProfile,
    getEngineBaseUrl,
    isEngineAvailable,
    resolveSpeakerIdForEngine,
    speakWithBrowserTts,
    speakWithEngine,
} from '../utils/voicevoxUtils';
import { getReferralSummary, REFERRAL_REWARD } from '../utils/referralUtils';

const REWARD_VOICE_FILES = [
    'mission_reward_cheer.wav',
    'mission_reward_cheer_soft.wav',
    'mission_reward_cheer_bright.wav',
    'mission_reward_cheer_tease.wav',
];

const TAB_CONFIG = [
    { key: 'daily', label: 'デイリー', title: 'デイリーミッション' },
    { key: 'main', label: 'メイン', title: 'メインミッション' },
    { key: 'event', label: '限定', title: '限定ミッション' },
];

const CORE_MISSION_CATEGORY_MAP = {
    daily_study_once: 'daily',
    daily_study_three: 'daily',
    daily_study_five: 'daily',
    daily_study_time: 'main',
    daily_perfect: 'main',
    daily_interact: 'event',
    daily_story: 'event',
};

const SUPPLEMENTAL_CLAIMS_KEY = 'supplementalMissionClaims';

const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fbf4ee 0%, #f7eee6 100%)',
        color: '#5f5364',
        fontFamily: "'Noto Sans JP', sans-serif",
    },
    shell: {
        maxWidth: '430px',
        margin: '0 auto',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f4ded7 0%, #f9f2ec 44%, #fbf7f2 100%)',
    },
    glowA: {
        position: 'absolute',
        top: '-30px',
        right: '-20px',
        width: '150px',
        height: '150px',
        borderRadius: '999px',
        background: 'rgba(255, 205, 218, 0.42)',
        filter: 'blur(24px)',
    },
    glowB: {
        position: 'absolute',
        top: '140px',
        left: '-30px',
        width: '140px',
        height: '140px',
        borderRadius: '999px',
        background: 'rgba(203, 226, 255, 0.36)',
        filter: 'blur(28px)',
    },
    hero: {
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        overflow: 'hidden',
    },
    heroAura: {
        position: 'absolute',
        left: '50%',
        bottom: '23%',
        width: '290px',
        height: '150px',
        transform: 'translateX(-50%)',
        borderRadius: '999px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 74%)',
        filter: 'blur(6px)',
    },
    heroStage: {
        position: 'absolute',
        inset: '0 -28px 18% -28px',
        pointerEvents: 'none',
    },
    bottomSheet: {
        position: 'relative',
        zIndex: 4,
        marginTop: '42vh',
        height: '58vh',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        background: 'linear-gradient(180deg, rgba(255,251,247,0.98) 0%, rgba(253,249,245,0.98) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.85)',
        boxShadow: '0 -18px 40px rgba(199, 164, 155, 0.18)',
        padding: '12px 8px 16px',
        display: 'flex',
        flexDirection: 'column',
    },
    handle: {
        width: '52px',
        height: '6px',
        borderRadius: '999px',
        background: 'rgba(211, 193, 188, 0.9)',
        margin: '0 auto 10px',
    },
    noteCard: {
        borderRadius: '20px',
        background: 'linear-gradient(180deg, #fff8f4 0%, #fffdfa 100%)',
        border: '1px solid #f5e2db',
        boxShadow: '0 10px 24px rgba(221, 194, 186, 0.12)',
        padding: '12px 14px',
    },
    noteTitle: {
        fontSize: '17px',
        lineHeight: 1.2,
        fontWeight: 900,
        color: '#5f5364',
    },
    tabs: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginTop: '12px',
        marginBottom: '10px',
        padding: '0 4px',
    },
    tab: {
        border: '1px solid #f0dfd9',
        borderRadius: '999px',
        padding: '10px 8px',
        background: '#fffaf7',
        color: '#aa9aa4',
        fontSize: '12px',
        fontWeight: 800,
        textAlign: 'center',
    },
    activeTab: {
        background: 'linear-gradient(135deg, #fff2f5 0%, #fff8f2 100%)',
        color: '#a8657e',
        border: '1px solid #f3d4de',
        boxShadow: '0 8px 20px rgba(236, 195, 207, 0.18)',
    },
    missionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflowY: 'auto',
        padding: '0 4px 0 2px',
    },
    missionCard: {
        borderRadius: '18px',
        background: 'linear-gradient(180deg, #fffefd 0%, #fffaf7 100%)',
        border: '1px solid #f5e6df',
        boxShadow: '0 10px 22px rgba(226, 203, 195, 0.14)',
        padding: '11px',
    },
    claimedMissionCard: {
        opacity: 0.72,
    },
    cardHeader: {
        display: 'grid',
        gridTemplateColumns: '46px 1fr auto',
        gap: '10px',
        alignItems: 'start',
    },
    titleBlock: {
        minWidth: 0,
    },
    iconWrap: {
        width: '46px',
        height: '46px',
        borderRadius: '14px',
        background: 'linear-gradient(180deg, #f6f0ff 0%, #eef7ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a6bf',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
        fontSize: '18px',
    },
    missionTitle: {
        fontSize: '15px',
        lineHeight: 1.3,
        fontWeight: 900,
        color: '#615661',
    },
    missionDesc: {
        marginTop: '2px',
        fontSize: '12px',
        color: '#9b919c',
        fontWeight: 700,
    },
    progressBox: {
        marginTop: '8px',
        borderRadius: '14px',
        border: '1px solid #f4e4dd',
        background: '#fffaf8',
        padding: '10px',
    },
    progressHead: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#90858f',
        fontSize: '12px',
        fontWeight: 800,
    },
    progressTrack: {
        marginTop: '7px',
        height: '8px',
        borderRadius: '999px',
        overflow: 'hidden',
        background: '#f6e9e7',
    },
    progressFill: {
        height: '100%',
        borderRadius: '999px',
        background: 'linear-gradient(90deg, #f2c4ce 0%, #f7dfc2 100%)',
    },
    rewardWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        justifySelf: 'end',
        flexWrap: 'wrap',
    },
    rewardChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: '999px',
        padding: '6px 9px',
        background: '#fff0c8',
        color: '#b0903b',
        fontSize: '11px',
        fontWeight: 800,
        whiteSpace: 'nowrap',
    },
    rewardChipMint: {
        background: '#d9f3e8',
        color: '#5aa98a',
    },
    actionButton: {
        marginTop: '8px',
        width: '100%',
        border: 'none',
        borderRadius: '12px',
        padding: '10px 12px',
        background: 'linear-gradient(180deg, #e7f1fd 0%, #dcebfb 100%)',
        color: '#688bb5',
        fontSize: '14px',
        fontWeight: 900,
    },
    actionButtonDisabled: {
        background: '#eef3f8',
        color: '#9aacbc',
    },
    bottomActions: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: '8px',
        marginTop: '10px',
        padding: '0 4px',
    },
    secondaryFooterButton: {
        border: 'none',
        borderRadius: '14px',
        padding: '12px 10px',
        background: '#f7e9ed',
        color: '#ad7487',
        fontSize: '13px',
        fontWeight: 900,
    },
    primaryFooterButton: {
        border: 'none',
        borderRadius: '14px',
        padding: '12px 12px',
        background: 'linear-gradient(135deg, #8de1d6 0%, #b7f2d6 100%)',
        color: '#1d6f63',
        fontSize: '13px',
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
    },
    primaryFooterButtonDisabled: {
        background: '#e7ecef',
        color: '#95a0a6',
    },
    emptyState: {
        borderRadius: '18px',
        border: '1px dashed #ebd8d1',
        background: '#fffaf7',
        color: '#9b919c',
        padding: '18px 14px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 700,
    },
    rewardOverlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(38, 32, 44, 0.24)',
        padding: '24px',
        backdropFilter: 'blur(2px)',
    },
    rewardModal: {
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.7)',
        background: 'linear-gradient(180deg, rgba(255,250,243,0.98), rgba(255,255,255,0.95))',
        padding: '22px 24px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(39, 24, 57, 0.22)',
        minWidth: '260px',
    },
    rewardKicker: {
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.18em',
        color: '#8b7158',
    },
    rewardTitle: {
        marginTop: '6px',
        fontSize: '24px',
        fontWeight: 900,
        color: '#4f3427',
    },
    rewardItems: {
        marginTop: '14px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
    },
};

function getProgressPercent(current, target) {
    if (!target) return 0;
    return Math.min((current / target) * 100, 100);
}

function loadSupplementalClaims() {
    try {
        return JSON.parse(localStorage.getItem(SUPPLEMENTAL_CLAIMS_KEY) || '{}');
    } catch (error) {
        console.error('Error loading supplemental mission claims:', error);
        return {};
    }
}

function saveSupplementalClaims(claims) {
    try {
        localStorage.setItem(SUPPLEMENTAL_CLAIMS_KEY, JSON.stringify(claims));
    } catch (error) {
        console.error('Error saving supplemental mission claims:', error);
    }
}

function getCoreMissionCategory(missionId) {
    return CORE_MISSION_CATEGORY_MAP[missionId] || 'daily';
}

function isMissionClaimable(mission) {
    return Boolean(mission.completed && !mission.claimed);
}

function getRewardReactionLine(rewards = {}) {
    const hasDiamonds = Number(rewards?.diamonds || 0) > 0;
    const hasIntellect = Number(rewards?.intellect || 0) > 0;

    if (hasDiamonds && hasIntellect) {
        return '報酬受け取り完了。ダイヤも知力もちゃんと増えたよ。';
    }

    if (hasDiamonds) {
        return 'ダイヤの報酬、受け取り完了だよ。';
    }

    if (hasIntellect) {
        return '知力の報酬を受け取ったよ。こつこつ進めててえらいね。';
    }

    return '報酬、ちゃんと受け取れたよ。';
}

function getBulkRewardReactionLine(missionCount) {
    if (missionCount <= 1) {
        return '報酬を受け取ったよ。';
    }

    return `${missionCount}件まとめて受け取れたよ。この調子でいこう。`;
}

function buildSupplementalMissions({ stats, profile, claims, coreMissions }) {
    const achievementStats = loadAchievementStats();
    const referralSummary = getReferralSummary(profile || {});
    const dailyReviewProgress = getNormalizedDailyReviewProgress(stats);
    const studyCount = Math.max(
        Number(stats?.studyCount) || 0,
        Number(achievementStats?.studyCount) || 0
    );
    const dailyReviewSets = Math.max(0, Number(dailyReviewProgress.reviewSetsToday) || 0);
    const dailyCoreCompletedCount = coreMissions.filter(
        (mission) => mission.category === 'daily' && mission.completed
    ).length;
    const dailyCompleteTarget = dailyCoreCompletedCount + 1;

    const definitions = [
        {
            id: 'daily_review_once',
            category: 'daily',
            title: '復習の時間',
            description: '復習を1セットする',
            icon: '📝',
            current: dailyReviewSets,
            target: 1,
            rewards: { diamonds: 8, intellect: 12 },
        },
        {
            id: 'daily_complete_bonus',
            category: 'daily',
            title: 'デイリーコンプリート',
            description: 'ほかのデイリーミッションをすべて達成する',
            icon: '🎁',
            current: dailyCoreCompletedCount + Math.min(dailyReviewSets, 1),
            target: dailyCompleteTarget,
            rewards: { diamonds: 20, intellect: 25 },
        },
        {
            id: 'main_study_total_30',
            category: 'main',
            title: '積み重ねの証',
            description: '累計で30回勉強する',
            icon: '📚',
            current: studyCount,
            target: 30,
            rewards: { diamonds: 15, intellect: 18 },
        },
        {
            id: 'main_affection_100',
            category: 'main',
            title: 'なかよしメモリー',
            description: '好感度を100まで上げる',
            icon: '💖',
            current: Math.max(0, Number(stats?.affection) || 0),
            target: 100,
            rewards: { diamonds: 20, intellect: 24 },
        },
        {
            id: 'main_intellect_100',
            category: 'main',
            title: 'ブレインスパーク',
            description: '🧠を100まで集める',
            icon: '🧠',
            current: Math.max(0, Number(stats?.intellect) || 0),
            target: 100,
            rewards: { diamonds: 18, intellect: 22 },
        },
        {
            id: 'event_friend_invite',
            category: 'event',
            title: 'フレンド招待',
            description: '友だちを1人招待する',
            icon: '🎟️',
            current: Math.max(0, Number(referralSummary.inviteCount) || 0),
            target: 1,
            rewards: {
                diamonds: REFERRAL_REWARD.diamonds,
                intellect: REFERRAL_REWARD.intellect,
            },
        },
    ];

    return definitions.map((mission, index) => {
        const current = Math.min(mission.current, mission.target);

        return {
            ...mission,
            source: 'supplemental',
            order: 100 + index,
            current,
            completed: current >= mission.target,
            claimed: Boolean(claims?.[mission.id]),
            progressPercent: getProgressPercent(current, mission.target),
        };
    });
}

function sumRewards(current, next) {
    return {
        diamonds: (current.diamonds || 0) + (next?.diamonds || 0),
        intellect: (current.intellect || 0) + (next?.intellect || 0),
    };
}

function MissionCard({ mission, onClaim }) {
    const isClaimable = isMissionClaimable(mission);

    return (
        <article
            style={{
                ...styles.missionCard,
                ...(mission.claimed ? styles.claimedMissionCard : {}),
            }}
        >
            <div style={styles.cardHeader}>
                <div style={styles.iconWrap}>{mission.icon || '📘'}</div>
                <div style={styles.titleBlock}>
                    <div style={styles.missionTitle}>{mission.title}</div>
                    <div style={styles.missionDesc}>{mission.description}</div>
                </div>
                <div style={styles.rewardWrap}>
                    <div style={styles.rewardChip}>
                        <Gem size={13} />
                        {mission.rewards?.diamonds || 0}
                    </div>
                    <div style={{ ...styles.rewardChip, ...styles.rewardChipMint }}>
                        🧠 {mission.rewards?.intellect || 0}
                    </div>
                </div>
            </div>

            <div style={styles.progressBox}>
                <div style={styles.progressHead}>
                    <span>進行状況</span>
                    <span>{mission.current} / {mission.target}</span>
                </div>
                <div style={styles.progressTrack}>
                    <div
                        style={{
                            ...styles.progressFill,
                            width: `${mission.progressPercent || 0}%`,
                        }}
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={() => onClaim(mission)}
                disabled={!isClaimable}
                style={{
                    ...styles.actionButton,
                    ...(!isClaimable ? styles.actionButtonDisabled : {}),
                }}
            >
                {mission.claimed ? '受取済み' : isClaimable ? '受け取る' : 'つづける'}
            </button>
        </article>
    );
}

export default function Missions({ stats, updateStats }) {
    const navigate = useNavigate();
    const { playVoice, acquireVoiceFocus } = useSound();
    const [coreMissions, setCoreMissions] = useState([]);
    const [supplementalClaims, setSupplementalClaims] = useState(() => loadSupplementalClaims());
    const [profile, setProfile] = useState(null);
    const [showRewardAnimation, setShowRewardAnimation] = useState(null);
    const [missionReaction, setMissionReaction] = useState(null);
    const [activeTab, setActiveTab] = useState('daily');
    const reactionTimerRef = useRef(null);

    const refreshCoreMissions = () => {
        const nextMissions = getAllMissionsWithProgress().map((mission, index) => ({
            ...mission,
            source: 'core',
            category: getCoreMissionCategory(mission.id),
            order: index,
        }));
        setCoreMissions(nextMissions);
    };

    useEffect(() => {
        refreshCoreMissions();
        setSupplementalClaims(loadSupplementalClaims());

        const loadProfile = async () => {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                setProfile(null);
                return;
            }

            const result = await getUserProfile(currentUser.uid);
            if (result.success) {
                setProfile(result.data);
            }
        };

        loadProfile();

        return () => {
            if (reactionTimerRef.current) {
                clearTimeout(reactionTimerRef.current);
            }
        };
    }, []);

    const supplementalMissions = useMemo(
        () => buildSupplementalMissions({
            stats,
            profile,
            claims: supplementalClaims,
            coreMissions,
        }),
        [coreMissions, profile, stats, supplementalClaims]
    );

    const missions = useMemo(() => {
        const merged = [...coreMissions, ...supplementalMissions];

        return merged.sort((a, b) => {
            const aRank = a.claimed ? 2 : isMissionClaimable(a) ? 0 : 1;
            const bRank = b.claimed ? 2 : isMissionClaimable(b) ? 0 : 1;

            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }

            if (aRank !== bRank) {
                return aRank - bRank;
            }

            return (a.order || 0) - (b.order || 0);
        });
    }, [coreMissions, supplementalMissions]);

    const playRewardVoice = async (lineText) => {
        const settings = getTtsSettings();
        if (!settings.enabled || !lineText) return;

        const speechProfile = buildSpeechVariationProfile(lineText, {
            emotion: 'happy sweet',
            speaker: 'ノア',
            browserPitch: Math.max(settings.browserPitch, 1.28),
            browserRate: Math.min(settings.browserRate, 1.02),
            pitchScale: 0.06,
            speedScale: 0.98,
            intonationScale: 1.24,
            postPhonemeLength: 0.14,
        });

        const preferredEngineOrder = [
            TTS_ENGINES.AIVIS,
            ...(settings.engine === TTS_ENGINES.AUTO
                ? [TTS_ENGINES.DEEPGRAM, TTS_ENGINES.VOICEVOX]
                : [settings.engine].filter(
                    (engine) => engine !== TTS_ENGINES.AIVIS && engine !== TTS_ENGINES.BROWSER
                )),
        ];

        for (const engine of preferredEngineOrder) {
            const baseUrl = getEngineBaseUrl(engine, settings);
            const available = await isEngineAvailable(engine, baseUrl);
            if (!available) continue;

            const releaseVoiceFocus = acquireVoiceFocus();
            const preferredSpeakerValue = engine === TTS_ENGINES.DEEPGRAM
                ? settings.deepgramVoiceModel
                : settings.preferredSpeaker;
            const speakerId = await resolveSpeakerIdForEngine(engine, preferredSpeakerValue, { baseUrl });
            const success = await speakWithEngine(engine, lineText, speakerId, {
                baseUrl,
                onEnd: releaseVoiceFocus,
                audioQueryOverrides: speechProfile.engine.audioQueryOverrides,
                cacheKeyHint: `mission-reward:${lineText}:${speechProfile.signature}`,
            });

            if (success) {
                return;
            }

            releaseVoiceFocus();
        }

        const releaseVoiceFocus = acquireVoiceFocus();
        speakWithBrowserTts(lineText, {
            pitch: speechProfile.browser.pitch,
            rate: speechProfile.browser.rate,
            onEnd: releaseVoiceFocus,
        });
    };

    const presentRewardFeedback = async (rewards, lineText) => {
        updateStats((currentStats) => ({
            diamonds: (currentStats?.diamonds || 0) + (rewards?.diamonds || 0),
            intellect: (currentStats?.intellect || 0) + (rewards?.intellect || 0),
        }));

        setMissionReaction({
            emotion: 'happy',
            text: lineText,
        });

        if (reactionTimerRef.current) {
            clearTimeout(reactionTimerRef.current);
        }

        reactionTimerRef.current = setTimeout(() => {
            setMissionReaction(null);
            reactionTimerRef.current = null;
        }, 2200);

        setShowRewardAnimation(rewards);
        setTimeout(() => setShowRewardAnimation(null), 2000);

        const rewardVoiceFile = REWARD_VOICE_FILES[Math.floor(Math.random() * REWARD_VOICE_FILES.length)];
        const played = await playVoice(rewardVoiceFile);
        if (!played) {
            playRewardVoice(lineText);
        }
    };

    const handleClaimReward = async (mission) => {
        if (!isMissionClaimable(mission)) return;

        if (mission.source === 'supplemental') {
            const nextClaims = {
                ...supplementalClaims,
                [mission.id]: true,
            };
            setSupplementalClaims(nextClaims);
            saveSupplementalClaims(nextClaims);
            await presentRewardFeedback(mission.rewards, getRewardReactionLine(mission.rewards));
            return;
        }

        const rewards = claimMissionReward(mission.id);
        if (!rewards) return;
        refreshCoreMissions();
        await presentRewardFeedback(rewards, getRewardReactionLine(rewards));
    };

    const handleClaimAllRewards = async () => {
        const claimableMissions = missions.filter(isMissionClaimable);
        if (claimableMissions.length === 0) return;

        let nextClaims = supplementalClaims;
        let supplementalUpdated = false;
        let totalRewards = { diamonds: 0, intellect: 0 };

        claimableMissions.forEach((mission) => {
            if (mission.source === 'supplemental') {
                if (!supplementalUpdated) {
                    nextClaims = { ...supplementalClaims };
                    supplementalUpdated = true;
                }
                nextClaims[mission.id] = true;
                totalRewards = sumRewards(totalRewards, mission.rewards);
                return;
            }

            const rewards = claimMissionReward(mission.id);
            if (rewards) {
                totalRewards = sumRewards(totalRewards, rewards);
            }
        });

        if (supplementalUpdated) {
            setSupplementalClaims(nextClaims);
            saveSupplementalClaims(nextClaims);
        }

        refreshCoreMissions();
        await presentRewardFeedback(totalRewards, getBulkRewardReactionLine(claimableMissions.length));
    };

    const visibleMissions = useMemo(
        () => missions.filter((mission) => mission.category === activeTab),
        [activeTab, missions]
    );
    const claimableCount = missions.filter(isMissionClaimable).length;
    const activeTabMeta = TAB_CONFIG.find((tab) => tab.key === activeTab) || TAB_CONFIG[0];

    const characterId = stats?.characterId || 'noah';
    const equippedSkin = stats?.equippedSkin === 'default'
        ? 'skin_casual_fall'
        : stats?.equippedSkin || 'skin_casual_fall';
    const renderer = resolveCharacterRenderer({
        preferredRenderer: stats?.characterRenderer,
        characterId,
        skinId: equippedSkin,
    });

    const missionPose = useMemo(
        () => createHomePose({
            emotion: missionReaction?.emotion || (claimableCount > 0 ? 'happy' : 'normal'),
            text: missionReaction?.text || '',
        }),
        [claimableCount, missionReaction]
    );

    return (
        <div style={styles.page}>
            <div style={styles.shell}>
                <div style={styles.glowA} />
                <div style={styles.glowB} />

                <section style={styles.hero}>
                    <div style={styles.heroAura} />
                    <div style={styles.heroStage}>
                        <CharacterStage
                            characterId={characterId}
                            renderer={renderer}
                            skinId={equippedSkin}
                            pose={{ ...missionPose, scene: 'missions' }}
                            scene="missions"
                            className="h-full w-full [&_.character-static-base-image]:h-[142%] [&_.character-static-base-image]:max-w-none [&_.character-static-base-image]:translate-y-4 [&_.character-static-base-image]:scale-[1.06]"
                            imageStyle={{
                                height: '100%',
                                width: '100%',
                                '--character-stage-overflow': 'visible',
                            }}
                            alt="ノア"
                        />
                    </div>
                </section>

                <section style={styles.bottomSheet}>
                    <div style={styles.handle} />

                    <div style={styles.noteCard}>
                        <div style={styles.noteTitle}>{activeTabMeta.title}</div>
                    </div>

                    <div style={styles.tabs}>
                        {TAB_CONFIG.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                style={activeTab === tab.key ? { ...styles.tab, ...styles.activeTab } : styles.tab}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={styles.missionList}>
                        {visibleMissions.length > 0 ? (
                            visibleMissions.map((mission) => (
                                <MissionCard
                                    key={mission.id}
                                    mission={mission}
                                    onClaim={handleClaimReward}
                                />
                            ))
                        ) : (
                            <div style={styles.emptyState}>いま表示できるミッションはありません。</div>
                        )}
                    </div>

                    <div style={styles.bottomActions}>
                        <button
                            type="button"
                            style={styles.secondaryFooterButton}
                            onClick={() => navigate('/home')}
                        >
                            ホームへ戻る
                        </button>
                        <button
                            type="button"
                            style={{
                                ...styles.primaryFooterButton,
                                ...(claimableCount === 0 ? styles.primaryFooterButtonDisabled : {}),
                            }}
                            onClick={handleClaimAllRewards}
                            disabled={claimableCount === 0}
                        >
                            <Sparkles size={14} />
                            全部受け取る
                        </button>
                    </div>
                </section>
            </div>

            {showRewardAnimation && (
                <div style={styles.rewardOverlay}>
                    <div style={styles.rewardModal}>
                        <div style={styles.rewardKicker}>REWARD</div>
                        <div style={styles.rewardTitle}>報酬獲得！</div>
                        <div style={styles.rewardItems}>
                            {showRewardAnimation.diamonds > 0 && (
                                <div style={styles.rewardChip}>
                                    💎 +{showRewardAnimation.diamonds}
                                </div>
                            )}
                            {showRewardAnimation.intellect > 0 && (
                                <div style={{ ...styles.rewardChip, ...styles.rewardChipMint }}>
                                    🧠 +{showRewardAnimation.intellect}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
