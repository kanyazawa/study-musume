import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CharacterStage from '../components/character/CharacterStage';
import classroomBg from '../assets/images/bg_classroom.webp';
import {
    getSeasonalEventById,
    getSeasonalEventProgress,
    getSeasonalEventRemainingDays,
    isSeasonalEventActive,
} from '../data/seasonalEvents';
import { getAiTutorEntitlement, getAiTutorStatusLabel } from '../utils/aiTutorPlanUtils';
import { createHomePose } from '../utils/characterPoseUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';

const styles = {
    page: {
        minHeight: '100vh',
        background: '#eef1f5',
        color: '#493d39',
        fontFamily: '"BIZ UDPGothic", "Yu Gothic UI", sans-serif',
    },
    shell: {
        position: 'relative',
        maxWidth: '430px',
        minHeight: '100vh',
        margin: '0 auto',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #dbe8f6 0%, #f7eee7 48%, #fcf7f2 100%)',
    },
    background: {
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(180deg, rgba(235, 246, 255, 0.18), rgba(255, 242, 233, 0.12)), url(${classroomBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.92)',
    },
    overlayGlow: {
        position: 'absolute',
        inset: '0 auto auto 50%',
        width: '300px',
        height: '200px',
        transform: 'translateX(-50%)',
        borderRadius: '999px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 72%)',
        pointerEvents: 'none',
    },
    topArea: {
        position: 'relative',
        height: '40vh',
        minHeight: '290px',
        zIndex: 1,
    },
    backButton: {
        position: 'absolute',
        top: '16px',
        left: '14px',
        width: '42px',
        height: '42px',
        border: 'none',
        borderRadius: '14px',
        background: 'rgba(255, 255, 255, 0.92)',
        boxShadow: '0 10px 18px rgba(60, 48, 40, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6e5a4f',
    },
    eventBadge: {
        position: 'absolute',
        top: '18px',
        right: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '999px',
        background: 'rgba(255, 251, 246, 0.94)',
        boxShadow: '0 10px 18px rgba(60, 48, 40, 0.1)',
        fontSize: '11px',
        fontWeight: 800,
        color: '#a3674a',
    },
    badgeDot: {
        width: '8px',
        height: '8px',
        borderRadius: '999px',
        background: '#ff8c78',
        boxShadow: '0 0 0 3px rgba(255, 140, 120, 0.18)',
    },
    characterWrap: {
        position: 'absolute',
        inset: '40px 0 0 0',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    characterStage: {
        width: '100%',
        height: '100%',
        transform: 'translateY(10px)',
    },
    characterStageLive2d: {
        transform: 'translateY(0)',
    },
    speechBubble: {
        position: 'absolute',
        left: '50%',
        bottom: '6px',
        transform: 'translateX(-50%)',
        width: 'min(84vw, 330px)',
        minHeight: '88px',
        padding: '14px 18px',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.96)',
        border: '2px solid rgba(255, 179, 155, 0.8)',
        boxShadow: '0 16px 28px rgba(68, 53, 45, 0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        lineHeight: 1.5,
        fontWeight: 700,
        color: '#584841',
    },
    bottomSheet: {
        position: 'relative',
        zIndex: 2,
        marginTop: '-12px',
        minHeight: '60vh',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        background: 'linear-gradient(180deg, rgba(255, 252, 248, 0.98) 0%, rgba(255, 248, 243, 0.98) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.85)',
        boxShadow: '0 -14px 36px rgba(68, 53, 45, 0.12)',
        padding: '14px 12px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    handle: {
        width: '54px',
        height: '6px',
        borderRadius: '999px',
        background: 'rgba(121, 101, 93, 0.18)',
        margin: '0 auto 2px',
    },
    titleCard: {
        borderRadius: '20px',
        padding: '14px',
        background: 'linear-gradient(135deg, #fff6ef 0%, #fffdf9 100%)',
        border: '1px solid rgba(239, 206, 187, 0.76)',
        boxShadow: '0 10px 20px rgba(81, 60, 48, 0.06)',
    },
    kicker: {
        fontSize: '11px',
        fontWeight: 900,
        letterSpacing: '0.12em',
        color: '#d07b64',
    },
    titleRow: {
        marginTop: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
    },
    title: {
        fontSize: '22px',
        fontWeight: 900,
        color: '#4f3e38',
    },
    clearChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 9px',
        borderRadius: '999px',
        background: '#e5f7eb',
        color: '#3a8e60',
        fontSize: '11px',
        fontWeight: 900,
        whiteSpace: 'nowrap',
    },
    subtitle: {
        marginTop: '6px',
        fontSize: '12px',
        lineHeight: 1.5,
        color: '#7c6660',
        fontWeight: 700,
    },
    progressRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '8px',
    },
    progressCard: {
        borderRadius: '16px',
        padding: '10px 8px',
        background: '#fffdfa',
        border: '1px solid rgba(235, 219, 211, 0.92)',
        textAlign: 'center',
    },
    progressLabel: {
        fontSize: '10px',
        color: '#9b8177',
        fontWeight: 800,
    },
    progressValue: {
        marginTop: '4px',
        fontSize: '18px',
        color: '#54433d',
        fontWeight: 900,
    },
    sectionCard: {
        borderRadius: '18px',
        padding: '14px',
        background: 'rgba(255, 255, 255, 0.92)',
        border: '1px solid rgba(236, 220, 212, 0.92)',
        boxShadow: '0 8px 18px rgba(81, 60, 48, 0.05)',
    },
    sectionLabel: {
        fontSize: '11px',
        fontWeight: 900,
        letterSpacing: '0.08em',
        color: '#d07b64',
        textTransform: 'uppercase',
    },
    situation: {
        marginTop: '6px',
        fontSize: '13px',
        lineHeight: 1.6,
        color: '#53443d',
        fontWeight: 700,
    },
    prompt: {
        marginTop: '8px',
        fontSize: '12px',
        color: '#8d7469',
        fontWeight: 700,
    },
    checkpointRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '12px',
    },
    checkpointChip: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px 10px',
        borderRadius: '999px',
        background: '#f7efe8',
        color: '#7a6258',
        fontSize: '11px',
        fontWeight: 800,
    },
    checkpointChipActive: {
        background: '#e8f8ef',
        color: '#3a7e58',
    },
    writingArea: {
        width: '100%',
        minHeight: '132px',
        marginTop: '12px',
        border: '1px solid rgba(182, 160, 147, 0.58)',
        borderRadius: '16px',
        padding: '12px 13px',
        fontSize: '14px',
        lineHeight: 1.65,
        color: '#463731',
        background: '#fffdfa',
        resize: 'vertical',
        outline: 'none',
        boxSizing: 'border-box',
    },
    writingMetaRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        marginTop: '10px',
        flexWrap: 'wrap',
    },
    writingWordCount: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 10px',
        borderRadius: '999px',
        background: '#f6f0eb',
        color: '#735e55',
        fontSize: '11px',
        fontWeight: 900,
    },
    writingWordCountGood: {
        background: '#ebfbf1',
        color: '#3d7c58',
    },
    writingHintBox: {
        marginTop: '12px',
        borderRadius: '16px',
        padding: '12px 13px',
        background: '#fffaf2',
        border: '1px solid rgba(234, 198, 126, 0.4)',
        color: '#866236',
        fontSize: '12px',
        lineHeight: 1.6,
    },
    choiceList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    choiceButton: {
        width: '100%',
        border: '1px solid rgba(234, 220, 213, 0.92)',
        borderRadius: '18px',
        background: '#fffdfa',
        padding: '12px 12px 11px',
        textAlign: 'left',
        color: '#463934',
        boxShadow: '0 8px 14px rgba(81, 60, 48, 0.04)',
    },
    choiceButtonSelected: {
        borderColor: '#f0a48f',
        boxShadow: '0 10px 18px rgba(240, 164, 143, 0.16)',
    },
    choiceButtonCorrect: {
        borderColor: '#8bc9a0',
        background: '#f6fffa',
    },
    choiceButtonWrong: {
        borderColor: '#f2b2a1',
        background: '#fff8f6',
    },
    choiceEnglish: {
        fontSize: '15px',
        lineHeight: 1.45,
        fontWeight: 800,
    },
    choiceMeaning: {
        marginTop: '4px',
        fontSize: '11px',
        color: '#88726a',
        fontWeight: 700,
    },
    feedbackBox: {
        borderRadius: '16px',
        padding: '12px 13px',
        fontSize: '12px',
        lineHeight: 1.6,
        fontWeight: 700,
    },
    feedbackSuccess: {
        background: '#ebfbf1',
        color: '#38754e',
        border: '1px solid rgba(130, 201, 158, 0.65)',
    },
    feedbackError: {
        background: '#fff2ef',
        color: '#9d5d53',
        border: '1px solid rgba(242, 178, 161, 0.82)',
    },
    rewardRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '10px',
    },
    rewardChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '7px 10px',
        borderRadius: '999px',
        background: '#fff3d8',
        color: '#94692a',
        fontSize: '11px',
        fontWeight: 900,
    },
    rewardChipMint: {
        background: '#e7f8ef',
        color: '#3f8a63',
    },
    rewardChipPink: {
        background: '#ffeef4',
        color: '#b46483',
    },
    footerActions: {
        marginTop: 'auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '8px',
    },
    secondaryButton: {
        border: 'none',
        borderRadius: '16px',
        padding: '13px 12px',
        background: '#f5ece8',
        color: '#8a7067',
        fontSize: '13px',
        fontWeight: 900,
    },
    primaryButton: {
        border: 'none',
        borderRadius: '16px',
        padding: '13px 12px',
        background: 'linear-gradient(135deg, #ffb28e 0%, #ffd59d 100%)',
        color: '#6f462b',
        fontSize: '13px',
        fontWeight: 900,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
    },
    primaryButtonDisabled: {
        background: '#ece5df',
        color: '#a18d82',
    },
};

const createEmptySelection = () => ({
    selectedChoiceId: '',
    feedback: null,
});

const countSeasonalWords = (text) => {
    const matches = String(text || '')
        .trim()
        .match(/[A-Za-z]+(?:['-][A-Za-z]+)*/g);

    return matches ? matches.length : 0;
};

const getSeasonalWritingFeedback = (draft, challenge) => {
    const normalized = String(draft || '').toLowerCase();
    const wordCount = countSeasonalWords(draft);
    const hasBeach = /\bbeach\b/.test(normalized);
    const hasTogether = /\bwith me\b|\btogether\b/.test(normalized);
    const hasTiming = /\bthis weekend\b|\bsaturday\b|\bsunday\b|\bafter school\b|\btomorrow\b/.test(normalized);
    const score = [hasBeach, hasTogether, hasTiming].filter(Boolean).length;

    if (wordCount < (challenge?.minWords || 8)) {
        return {
            score,
            type: 'error',
            headline: 'まずは一文を完成させよう',
            text: `あと少しだけ足して、${challenge?.minWords || 8} words 以上を目安にすると誘い文として伝わりやすくなります。`,
        };
    }

    if (score >= 3) {
        return {
            score,
            type: 'success',
            headline: 'かなり自然に誘えています',
            text: '相手・予定・タイミングがそろっていて、イベントの山場として十分きれいです。',
        };
    }

    if (score === 2) {
        return {
            score,
            type: 'success',
            headline: 'あとひと押しでさらに自然',
            text: 'かなり形になっています。海に行くこと、いっしょに行くこと、時期のどれか一つを足すともっと伝わります。',
        };
    }

    return {
        score,
        type: 'error',
        headline: '伝えたい要素をもう少し足そう',
        text: '海に行くこと、いっしょに行くこと、いつ行くかのうち二つ以上が入ると、誘い文としてかなり安定します。',
    };
};

const SeasonalEventPage = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const event = useMemo(() => getSeasonalEventById(eventId), [eventId]);
    const savedProgress = useMemo(() => getSeasonalEventProgress(stats, eventId), [eventId, stats]);
    const aiTutorEntitlement = useMemo(() => getAiTutorEntitlement(stats), [stats]);
    const aiTutorStatusLabel = useMemo(() => getAiTutorStatusLabel(stats), [stats]);
    const characterId = stats?.characterId || 'noah';
    const equippedSkin = stats?.equippedSkin || 'default';
    const preferredRenderer = stats?.characterRenderer;
    const hasLive2d = hasLive2DModelConfig(characterId, equippedSkin);
    const renderer = resolveCharacterRenderer({
        preferredRenderer: characterId === 'noah' && hasLive2d ? 'live2d' : preferredRenderer,
        characterId,
        skinId: equippedSkin,
    });
    const remainingDays = event ? getSeasonalEventRemainingDays(event) : null;

    const [sceneIndex, setSceneIndex] = useState(0);
    const [mistakeCount, setMistakeCount] = useState(0);
    const [selection, setSelection] = useState(createEmptySelection);
    const [clearedThisRun, setClearedThisRun] = useState(false);
    const [grantedReward, setGrantedReward] = useState(false);
    const [writingDraft, setWritingDraft] = useState(savedProgress.writingDraft || '');
    const [writingFeedback, setWritingFeedback] = useState(null);

    useEffect(() => {
        setSceneIndex(0);
        setMistakeCount(0);
        setSelection(createEmptySelection());
        setClearedThisRun(false);
        setGrantedReward(false);
        setWritingDraft(savedProgress.writingDraft || '');
        setWritingFeedback(null);
    }, [eventId]);

    const scenes = event?.scenes || [];
    const currentScene = scenes[sceneIndex];
    const totalScenes = scenes.length;
    const isLastScene = sceneIndex === totalScenes - 1;
    const choiceIsCorrect = selection.feedback?.type === 'success';
    const eventIsActive = event ? isSeasonalEventActive(event) : false;
    const writingChallenge = event?.writingChallenge || null;
    const hasUnlockedWriting = Boolean(savedProgress.completed || clearedThisRun);
    const seasonalWordCount = useMemo(() => countSeasonalWords(writingDraft), [writingDraft]);
    const seasonalDraftSaved = Boolean(savedProgress.writingCompleted);
    const characterPose = useMemo(() => createHomePose({
        emotion: clearedThisRun ? 'happy' : choiceIsCorrect ? 'smile' : selection.feedback?.type === 'error' ? 'shy' : 'normal',
        text: clearedThisRun
            ? 'えへへ、ちゃんと誘えてよかったね。夏の予定、楽しみにしてる。'
            : currentScene?.partnerLine || '次はどんなふうに話しかける？',
    }), [choiceIsCorrect, clearedThisRun, currentScene?.partnerLine, selection.feedback?.type]);

    const resetRun = () => {
        setSceneIndex(0);
        setMistakeCount(0);
        setSelection(createEmptySelection());
        setClearedThisRun(false);
        setGrantedReward(false);
    };

    const patchSeasonalEventProgress = (patch) => {
        if (typeof updateStats !== 'function') {
            return;
        }

        updateStats((currentStats) => {
            const currentEntry = currentStats?.seasonalEvents?.[eventId] || {};

            return {
                seasonalEvents: {
                    ...(currentStats?.seasonalEvents || {}),
                    [eventId]: {
                        ...currentEntry,
                        ...patch,
                        lastPlayedAt: Date.now(),
                    },
                },
            };
        });
    };

    const markCompleted = () => {
        const firstClear = !savedProgress.completed;

        if (typeof updateStats === 'function') {
            updateStats((currentStats) => {
                const currentEntry = currentStats?.seasonalEvents?.[eventId] || {};
                const reward = firstClear ? event.reward : { diamonds: 0, intellect: 0, affection: 0 };

                return {
                    seasonalEvents: {
                        ...(currentStats?.seasonalEvents || {}),
                        [eventId]: {
                            ...currentEntry,
                            completed: true,
                            rewardClaimed: currentEntry.rewardClaimed || firstClear,
                            clearedAt: currentEntry.clearedAt || Date.now(),
                            lastPlayedAt: Date.now(),
                            playCount: Math.max(0, Number(currentEntry.playCount) || 0) + 1,
                            bestMistakes: Number.isFinite(Number(currentEntry.bestMistakes))
                                ? Math.min(Number(currentEntry.bestMistakes), mistakeCount)
                                : mistakeCount,
                        },
                    },
                    affection: (currentStats?.affection || 0) + (reward.affection || 0),
                    diamonds: (currentStats?.diamonds || 0) + (reward.diamonds || 0),
                    intellect: (currentStats?.intellect || 0) + (reward.intellect || 0),
                };
            });
        }

        setGrantedReward(firstClear);
        setClearedThisRun(true);
    };

    const handleWritingSave = () => {
        const trimmedDraft = writingDraft.trim();

        if (!trimmedDraft || !writingChallenge) {
            setWritingFeedback({
                type: 'error',
                headline: 'まだ書けていません',
                text: 'まずは海に誘う一文を英語で書いてみましょう。',
            });
            return;
        }

        const feedback = getSeasonalWritingFeedback(trimmedDraft, writingChallenge);
        setWritingFeedback(feedback);
        patchSeasonalEventProgress({
            writingDraft: trimmedDraft,
            writingCompleted: true,
            writingSubmittedAt: Date.now(),
            writingScore: feedback.score,
        });
    };

    const handleChoice = (choice) => {
        if (clearedThisRun) {
            return;
        }

        if (choice.isCorrect) {
            setSelection({
                selectedChoiceId: choice.id,
                feedback: {
                    type: 'success',
                    text: choice.feedback,
                },
            });
            return;
        }

        setMistakeCount((current) => current + 1);
        setSelection({
            selectedChoiceId: choice.id,
            feedback: {
                type: 'error',
                text: choice.feedback,
            },
        });
    };

    const handlePrimaryAction = () => {
        if (clearedThisRun) {
            navigate('/home');
            return;
        }

        if (!choiceIsCorrect) {
            return;
        }

        if (isLastScene) {
            markCompleted();
            return;
        }

        setSceneIndex((current) => current + 1);
        setSelection(createEmptySelection());
    };

    if (!event) {
        return (
            <div style={styles.page}>
                <div style={styles.shell}>
                    <div style={styles.background} />
                    <section style={{ ...styles.bottomSheet, marginTop: 0, minHeight: '100vh', justifyContent: 'center' }}>
                        <div style={styles.titleCard}>
                            <div style={styles.title}>イベントが見つかりません</div>
                            <div style={styles.subtitle}>ホームに戻って、もう一度バナーから開いてください。</div>
                        </div>
                        <button type="button" style={styles.primaryButton} onClick={() => navigate('/home')}>
                            ホームへ戻る
                        </button>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.shell}>
                <div style={styles.background} />
                <div style={styles.overlayGlow} />

                <section style={styles.topArea}>
                    <button type="button" style={styles.backButton} aria-label="ホームへ戻る" onClick={() => navigate('/home')}>
                        <ArrowLeft size={20} />
                    </button>

                    <div style={styles.eventBadge}>
                        <span style={styles.badgeDot} aria-hidden="true" />
                        {eventIsActive ? (remainingDays === 0 ? '今日まで' : `あと${remainingDays}日`) : 'アーカイブ'}
                    </div>

                    <div style={styles.characterWrap}>
                        <div
                            style={renderer === 'live2d'
                                ? { ...styles.characterStage, ...styles.characterStageLive2d }
                                : styles.characterStage}
                        >
                            <CharacterStage
                                characterId={characterId}
                                renderer={renderer}
                                skinId={equippedSkin}
                                accessoryIds={stats?.equippedAccessories || []}
                                scene="home"
                                pose={characterPose}
                                imageStyle={{
                                    height: '100%',
                                    '--character-stage-inline-max-width': '100%',
                                    '--character-stage-overflow': 'visible',
                                }}
                                alt="seasonal event character"
                            />
                        </div>
                    </div>

                    <div style={styles.speechBubble}>
                        {clearedThisRun
                            ? 'ちゃんと伝わったね。夏の約束、成功だよ。'
                            : currentScene?.partnerLine}
                    </div>
                </section>

                <section style={styles.bottomSheet}>
                    <div style={styles.handle} />

                    <div style={styles.titleCard}>
                        <div style={styles.kicker}>{event.bannerKicker}</div>
                        <div style={styles.titleRow}>
                            <div style={styles.title}>{event.title}</div>
                            {(savedProgress.completed || clearedThisRun) && (
                                <span style={styles.clearChip}>
                                    <Check size={14} />
                                    CLEAR
                                </span>
                            )}
                        </div>
                        <div style={styles.subtitle}>
                            {event.shortTitle}をテーマに、自然な英語で夏の約束を決める短編イベントです。
                        </div>

                        <div style={styles.rewardRow}>
                            <span style={styles.rewardChip}>💎 +{event.reward.diamonds}</span>
                            <span style={{ ...styles.rewardChip, ...styles.rewardChipMint }}>🧠 +{event.reward.intellect}</span>
                            <span style={{ ...styles.rewardChip, ...styles.rewardChipPink }}>💖 +{event.reward.affection}</span>
                        </div>
                    </div>

                    <div style={styles.progressRow}>
                        <div style={styles.progressCard}>
                            <div style={styles.progressLabel}>STEP</div>
                            <div style={styles.progressValue}>{Math.min(sceneIndex + 1, totalScenes)} / {totalScenes}</div>
                        </div>
                        <div style={styles.progressCard}>
                            <div style={styles.progressLabel}>MISS</div>
                            <div style={styles.progressValue}>{mistakeCount}</div>
                        </div>
                        <div style={styles.progressCard}>
                            <div style={styles.progressLabel}>BEST</div>
                            <div style={styles.progressValue}>
                                {savedProgress.bestMistakes === null ? '--' : savedProgress.bestMistakes}
                            </div>
                        </div>
                    </div>

                    {!clearedThisRun && currentScene && (
                        <>
                            <div style={styles.sectionCard}>
                                <div style={styles.sectionLabel}>Situation</div>
                                <div style={styles.situation}>{currentScene.situation}</div>
                                <div style={styles.prompt}>{currentScene.prompt}</div>
                            </div>

                            <div style={styles.choiceList}>
                                {currentScene.choices.map((choice) => {
                                    const isSelected = selection.selectedChoiceId === choice.id;
                                    const feedbackType = isSelected ? selection.feedback?.type : null;
                                    const choiceStyle = {
                                        ...styles.choiceButton,
                                        ...(isSelected ? styles.choiceButtonSelected : {}),
                                        ...(feedbackType === 'success' ? styles.choiceButtonCorrect : {}),
                                        ...(feedbackType === 'error' ? styles.choiceButtonWrong : {}),
                                    };

                                    return (
                                        <button
                                            key={choice.id}
                                            type="button"
                                            style={choiceStyle}
                                            onClick={() => handleChoice(choice)}
                                        >
                                            <div style={styles.choiceEnglish}>{choice.english}</div>
                                            <div style={styles.choiceMeaning}>{choice.meaning}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {selection.feedback && !clearedThisRun && (
                        <div
                            style={{
                                ...styles.feedbackBox,
                                ...(selection.feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError),
                            }}
                        >
                            {selection.feedback.text}
                        </div>
                    )}

                    {clearedThisRun && (
                        <div style={{ ...styles.sectionCard, textAlign: 'center' }}>
                            <div style={styles.sectionLabel}>Result</div>
                            <div style={{ ...styles.situation, marginTop: '8px' }}>
                                {mistakeCount === 0
                                    ? 'パーフェクト。英語の流れがきれいで、そのまま季節イベントの正解ルートです。'
                                    : `クリア成功。今回は ${mistakeCount} 回言い直して、ちゃんと海に誘えました。`}
                            </div>
                            <div style={styles.prompt}>
                                {grantedReward
                                    ? '初回クリア報酬を受け取りました。'
                                    : 'クリア済みなので、今回は練習プレイです。'}
                            </div>
                        </div>
                    )}

                    {writingChallenge && hasUnlockedWriting && (
                        <div style={styles.sectionCard}>
                            <div style={styles.sectionLabel}>Writing</div>
                            <div style={{ ...styles.situation, marginTop: '8px' }}>
                                ここからは自分の言葉で誘う練習です。クリア報酬はそのまま受け取れるので、自由に書いて大丈夫です。
                            </div>
                            <div style={styles.prompt}>{writingChallenge.instruction}</div>

                            <div style={styles.checkpointRow}>
                                {writingChallenge.checkpoints.map((checkpoint) => {
                                    const isActive = writingDraft.toLowerCase().includes(checkpoint.split(' / ')[0].toLowerCase());

                                    return (
                                        <span
                                            key={checkpoint}
                                            style={{
                                                ...styles.checkpointChip,
                                                ...(isActive ? styles.checkpointChipActive : {}),
                                            }}
                                        >
                                            {checkpoint}
                                        </span>
                                    );
                                })}
                            </div>

                            <textarea
                                value={writingDraft}
                                onChange={(event) => setWritingDraft(event.target.value)}
                                onBlur={() => patchSeasonalEventProgress({ writingDraft })}
                                placeholder={writingChallenge.placeholder}
                                style={styles.writingArea}
                            />

                            <div style={styles.writingMetaRow}>
                                <span
                                    style={{
                                        ...styles.writingWordCount,
                                        ...(seasonalWordCount >= writingChallenge.minWords ? styles.writingWordCountGood : {}),
                                    }}
                                >
                                    {seasonalWordCount} words / target {writingChallenge.targetWords}
                                </span>
                                <span style={styles.prompt}>
                                    {seasonalDraftSaved
                                        ? '前回の提出内容を読み込み済みです。'
                                        : `${writingChallenge.minWords} words 以上を目安にすると自然です。`}
                                </span>
                            </div>

                            <div style={styles.writingHintBox}>
                                {writingChallenge.hint}
                            </div>

                            {writingFeedback && (
                                <div
                                    style={{
                                        ...styles.feedbackBox,
                                        marginTop: '12px',
                                        ...(writingFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError),
                                    }}
                                >
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>{writingFeedback.headline}</strong>
                                    {writingFeedback.text}
                                </div>
                            )}

                            <div style={styles.footerActions}>
                                <button
                                    type="button"
                                    style={styles.secondaryButton}
                                    onClick={() => {
                                        setWritingDraft('');
                                        setWritingFeedback(null);
                                        patchSeasonalEventProgress({
                                            writingDraft: '',
                                            writingCompleted: false,
                                            writingSubmittedAt: null,
                                            writingScore: null,
                                        });
                                    }}
                                >
                                    書き直す
                                </button>
                                <button type="button" style={styles.primaryButton} onClick={handleWritingSave}>
                                    <Sparkles size={15} />
                                    この英文を保存
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={styles.sectionCard}>
                        <div style={styles.sectionLabel}>Ai Tutor</div>
                        <div style={{ ...styles.situation, marginTop: '8px' }}>
                            固定の正解ルートだけでなく、いま書いた英文をもっと細かく見直したいなら AI 添削へつなげられます。
                        </div>
                        <div style={styles.prompt}>現在: {aiTutorStatusLabel}</div>
                        <div style={styles.footerActions}>
                            <button
                                type="button"
                                style={styles.secondaryButton}
                                onClick={() => navigate('/writing')}
                            >
                                英作文へ
                            </button>
                            <button
                                type="button"
                                style={aiTutorEntitlement.canUseCorrection ? styles.primaryButton : { ...styles.primaryButton, ...styles.primaryButtonDisabled }}
                                onClick={() => navigate('/ai-tutor-plans')}
                            >
                                {aiTutorEntitlement.canUseCorrection ? 'プラン確認' : '添削プランを見る'}
                            </button>
                        </div>
                    </div>

                    <div style={styles.footerActions}>
                        <button type="button" style={styles.secondaryButton} onClick={clearedThisRun ? resetRun : () => navigate('/home')}>
                            {clearedThisRun ? 'もう一度挑戦' : 'ホームへ戻る'}
                        </button>
                        <button
                            type="button"
                            style={!clearedThisRun && !choiceIsCorrect
                                ? { ...styles.primaryButton, ...styles.primaryButtonDisabled }
                                : styles.primaryButton}
                            onClick={handlePrimaryAction}
                            disabled={!clearedThisRun && !choiceIsCorrect}
                        >
                            <Sparkles size={15} />
                            {clearedThisRun ? 'ホームへ' : isLastScene ? 'クリアする' : '次へ進む'}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SeasonalEventPage;
