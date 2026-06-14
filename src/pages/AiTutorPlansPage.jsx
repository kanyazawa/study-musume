import React, { useMemo } from 'react';
import { ArrowLeft, Check, Crown, Gem, Sparkles, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CharacterStage from '../components/character/CharacterStage';
import classroomBg from '../assets/images/bg_classroom.webp';
import { getCharacterLabel } from '../data/characterData';
import { AI_TUTOR_PLANS, AI_TUTOR_TICKET_PACKS } from '../data/aiTutorPlans';
import {
    activateAiTutorPlan,
    formatAiTutorPrice,
    getAiTutorEntitlement,
    getAiTutorPlanFeatureNote,
    getAiTutorStatusLabel,
    purchaseAiTutorTickets,
} from '../utils/aiTutorPlanUtils';

const planBadgeIcon = {
    free: Sparkles,
    standard: Gem,
    premium: Crown,
};

const styles = {
    page: {
        minHeight: '100vh',
        background: '#f2efe9',
        color: '#4a3b35',
        fontFamily: '"BIZ UDPGothic", "Yu Gothic UI", sans-serif',
    },
    shell: {
        position: 'relative',
        maxWidth: '430px',
        minHeight: '100vh',
        margin: '0 auto',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #dfeaf3 0%, #f7eee7 46%, #fcf7f2 100%)',
    },
    background: {
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(180deg, rgba(250, 247, 242, 0.1), rgba(255, 247, 240, 0.26)), url(${classroomBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.92)',
    },
    hero: {
        position: 'relative',
        height: '36vh',
        minHeight: '270px',
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
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 10px 18px rgba(62, 49, 40, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6d5b50',
    },
    heroBadge: {
        position: 'absolute',
        top: '18px',
        right: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '999px',
        background: 'rgba(255, 253, 249, 0.92)',
        fontSize: '11px',
        fontWeight: 800,
        color: '#9d6559',
        boxShadow: '0 10px 18px rgba(62, 49, 40, 0.1)',
    },
    heroCharacter: {
        position: 'absolute',
        inset: '44px 0 0 0',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    heroStage: {
        width: '100%',
        height: '100%',
    },
    speechBubble: {
        position: 'absolute',
        left: '50%',
        bottom: '8px',
        transform: 'translateX(-50%)',
        width: 'min(82vw, 320px)',
        minHeight: '86px',
        padding: '14px 18px',
        borderRadius: '22px',
        background: 'rgba(255,255,255,0.96)',
        border: '2px solid rgba(246, 183, 150, 0.78)',
        boxShadow: '0 14px 26px rgba(62, 49, 40, 0.14)',
        textAlign: 'center',
        lineHeight: 1.5,
        fontWeight: 700,
        color: '#5b4a44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheet: {
        position: 'relative',
        zIndex: 2,
        marginTop: '-10px',
        minHeight: '64vh',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        background: 'linear-gradient(180deg, rgba(255, 252, 248, 0.98) 0%, rgba(255, 249, 245, 0.98) 100%)',
        boxShadow: '0 -14px 34px rgba(62, 49, 40, 0.12)',
        padding: '14px 12px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    handle: {
        width: '54px',
        height: '6px',
        borderRadius: '999px',
        background: 'rgba(120, 100, 92, 0.18)',
        margin: '0 auto 2px',
    },
    headlineCard: {
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
    title: {
        marginTop: '6px',
        fontSize: '24px',
        fontWeight: 900,
        color: '#4f3f39',
    },
    subtitle: {
        marginTop: '6px',
        fontSize: '12px',
        lineHeight: 1.6,
        color: '#7b6760',
        fontWeight: 700,
    },
    statusCard: {
        borderRadius: '18px',
        padding: '12px 14px',
        background: '#fffdfa',
        border: '1px solid rgba(234, 219, 211, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
    },
    statusTitle: {
        fontSize: '11px',
        color: '#9d8479',
        fontWeight: 800,
    },
    statusValue: {
        marginTop: '4px',
        fontSize: '16px',
        color: '#54443d',
        fontWeight: 900,
    },
    sectionLabel: {
        paddingLeft: '2px',
        fontSize: '11px',
        fontWeight: 900,
        letterSpacing: '0.08em',
        color: '#d07b64',
        textTransform: 'uppercase',
    },
    planList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    planCard: {
        borderRadius: '20px',
        padding: '14px',
        background: '#fffdfa',
        border: '1px solid rgba(235, 219, 211, 0.92)',
        boxShadow: '0 10px 18px rgba(81, 60, 48, 0.05)',
    },
    planCardRecommended: {
        borderColor: '#f0b08c',
        boxShadow: '0 14px 24px rgba(240, 176, 140, 0.16)',
    },
    planCardCurrent: {
        borderColor: '#9ed4b2',
        background: '#fcfffd',
    },
    planHead: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '10px',
    },
    planNameRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    planIconWrap: {
        width: '34px',
        height: '34px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #ffe3d4 0%, #fff2d9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#bb6a57',
        flexShrink: 0,
    },
    planName: {
        fontSize: '20px',
        fontWeight: 900,
        color: '#51403a',
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px 8px',
        borderRadius: '999px',
        background: '#fff0ea',
        color: '#d06d59',
        fontSize: '10px',
        fontWeight: 900,
        whiteSpace: 'nowrap',
    },
    currentBadge: {
        background: '#e7f8ee',
        color: '#3e8d62',
    },
    priceBlock: {
        marginTop: '10px',
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px',
        flexWrap: 'wrap',
    },
    pricePrimary: {
        fontSize: '22px',
        fontWeight: 900,
        color: '#553f35',
    },
    priceSecondary: {
        fontSize: '11px',
        fontWeight: 800,
        color: '#9b7f74',
    },
    planDescription: {
        marginTop: '8px',
        fontSize: '12px',
        lineHeight: 1.6,
        color: '#7a6660',
        fontWeight: 700,
    },
    featureList: {
        marginTop: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '7px',
        fontSize: '12px',
        lineHeight: 1.5,
        color: '#5f4d47',
        fontWeight: 700,
    },
    buttonRow: {
        marginTop: '12px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
    },
    button: {
        border: 'none',
        borderRadius: '14px',
        padding: '11px 12px',
        fontSize: '12px',
        fontWeight: 900,
    },
    primaryButton: {
        background: 'linear-gradient(135deg, #ffb28e 0%, #ffd59d 100%)',
        color: '#72482e',
    },
    secondaryButton: {
        background: '#f5ece8',
        color: '#897067',
    },
    ticketGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '10px',
    },
    ticketCard: {
        borderRadius: '18px',
        padding: '13px',
        background: '#fffdfa',
        border: '1px solid rgba(235, 219, 211, 0.92)',
    },
    ticketName: {
        fontSize: '16px',
        fontWeight: 900,
        color: '#54443d',
    },
    ticketMeta: {
        marginTop: '5px',
        fontSize: '12px',
        color: '#8b746b',
        fontWeight: 700,
    },
    noteCard: {
        borderRadius: '16px',
        padding: '12px 13px',
        background: '#fff8f4',
        border: '1px solid rgba(241, 218, 205, 0.92)',
        fontSize: '11px',
        lineHeight: 1.6,
        color: '#8b7269',
        fontWeight: 700,
    },
};

const AiTutorPlansPage = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const characterId = stats?.characterId || 'noah';
    const skinId = stats?.equippedSkin || 'default';
    const characterLabel = getCharacterLabel(characterId) || 'コーチ';
    const entitlement = useMemo(() => getAiTutorEntitlement(stats), [stats]);

    const coachLine = entitlement.hasPaidPlan
        ? `${entitlement.activePlan.name}なら、英作文の添削を ${entitlement.monthlyLimit} 回まで見られます。必要なぶんだけチケットも足せます。`
        : 'イベントは無料で進めつつ、AI添削だけを有料に分けています。赤字になりにくくしつつ、添削の価値は残す形です。';

    const handleActivatePlan = (planId, billingCycle) => {
        if (typeof updateStats !== 'function') {
            return;
        }

        updateStats((currentStats) => activateAiTutorPlan(currentStats, { planId, billingCycle }));
    };

    const handleBuyTickets = (packId) => {
        if (typeof updateStats !== 'function') {
            return;
        }

        updateStats((currentStats) => purchaseAiTutorTickets(currentStats, packId));
    };

    return (
        <div style={styles.page}>
            <div style={styles.shell}>
                <div style={styles.background} />

                <section style={styles.hero}>
                    <button type="button" style={styles.backButton} aria-label="戻る" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>

                    <div style={styles.heroBadge}>
                        <Sparkles size={14} />
                        AI TUTOR PRICING
                    </div>

                    <div style={styles.heroCharacter}>
                        <div style={styles.heroStage}>
                            <CharacterStage
                                characterId={characterId}
                                renderer={stats?.characterRenderer}
                                skinId={skinId}
                                accessoryIds={stats?.equippedAccessories || []}
                                scene="home"
                                pose={{
                                    emotion: entitlement.hasPaidPlan ? 'happy' : 'normal',
                                    expression: entitlement.hasPaidPlan ? 'happy' : 'normal',
                                    scene: 'home',
                                }}
                                imageStyle={{
                                    height: '100%',
                                    width: '100%',
                                    '--character-stage-overflow': 'visible',
                                }}
                                alt={`${characterLabel} plan guide`}
                            />
                        </div>
                    </div>

                    <div style={styles.speechBubble}>
                        {coachLine}
                    </div>
                </section>

                <section style={styles.sheet}>
                    <div style={styles.handle} />

                    <div style={styles.headlineCard}>
                        <div style={styles.kicker}>AI CORRECTION</div>
                        <div style={styles.title}>添削プラン</div>
                        <div style={styles.subtitle}>
                            ゲーム本編は無料のまま、AI添削だけを切り出したプランです。価格表示と利用枠は試作用にローカル保存されます。
                        </div>
                    </div>

                    <div style={styles.statusCard}>
                        <div>
                            <div style={styles.statusTitle}>現在のステータス</div>
                            <div style={styles.statusValue}>{getAiTutorStatusLabel(stats)}</div>
                        </div>
                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.secondaryButton }}
                            onClick={() => navigate('/writing')}
                        >
                            英作文へ
                        </button>
                    </div>

                    <div style={styles.sectionLabel}>Plans</div>
                    <div style={styles.planList}>
                        {[
                            { ...AI_TUTOR_PLANS[0], billingCycle: 'monthly' },
                            { ...AI_TUTOR_PLANS[1], billingCycle: 'monthly' },
                            { ...AI_TUTOR_PLANS[2], billingCycle: 'monthly' },
                        ].map((plan) => {
                            const Icon = planBadgeIcon[plan.id] || Sparkles;
                            const isCurrent = entitlement.activePlan.id === plan.id;

                            return (
                                <article
                                    key={plan.id}
                                    style={{
                                        ...styles.planCard,
                                        ...(plan.recommended ? styles.planCardRecommended : {}),
                                        ...(isCurrent ? styles.planCardCurrent : {}),
                                    }}
                                >
                                    <div style={styles.planHead}>
                                        <div>
                                            <div style={styles.planNameRow}>
                                                <span style={styles.planIconWrap}>
                                                    <Icon size={18} />
                                                </span>
                                                <div style={styles.planName}>{plan.name}</div>
                                            </div>
                                            <div style={styles.priceBlock}>
                                                <span style={styles.pricePrimary}>{formatAiTutorPrice(plan, 'monthly')}</span>
                                                <span style={styles.priceSecondary}>{getAiTutorPlanFeatureNote(plan, 'monthly')}</span>
                                            </div>
                                        </div>
                                        <span style={isCurrent ? { ...styles.badge, ...styles.currentBadge } : styles.badge}>
                                            {isCurrent ? 'ACTIVE' : plan.badge}
                                        </span>
                                    </div>

                                    <div style={styles.planDescription}>{plan.description}</div>

                                    <div style={styles.featureList}>
                                        {plan.features.map((feature) => (
                                            <div key={feature} style={styles.featureItem}>
                                                <Check size={14} />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {plan.id !== 'free' && (
                                        <div style={styles.buttonRow}>
                                            <button
                                                type="button"
                                                style={{ ...styles.button, ...styles.secondaryButton }}
                                                onClick={() => handleActivatePlan(plan.id, 'yearly')}
                                            >
                                                年額 {formatAiTutorPrice(plan, 'yearly')}
                                            </button>
                                            <button
                                                type="button"
                                                style={{ ...styles.button, ...styles.primaryButton }}
                                                onClick={() => handleActivatePlan(plan.id, 'monthly')}
                                            >
                                                月額で選ぶ
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    <div style={styles.sectionLabel}>Tickets</div>
                    <div style={styles.ticketGrid}>
                        {AI_TUTOR_TICKET_PACKS.map((pack) => (
                            <article key={pack.id} style={styles.ticketCard}>
                                <div style={styles.planNameRow}>
                                    <span style={styles.planIconWrap}>
                                        <Ticket size={18} />
                                    </span>
                                    <div style={styles.ticketName}>{pack.name}</div>
                                </div>
                                <div style={styles.ticketMeta}>
                                    AI添削 {pack.corrections} 回分
                                    <br />
                                    ¥{pack.price.toLocaleString()}
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        style={{ ...styles.button, ...styles.primaryButton, width: '100%' }}
                                        onClick={() => handleBuyTickets(pack.id)}
                                    >
                                        このパックを持つ
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div style={styles.noteCard}>
                        `無料 / スタンダード / プレミアム` の3段で、真ん中が本命に見えやすい構成にしています。
                        高いプランは単なるダミーではなく、回数と解説量の差が見えるようにしてあります。
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AiTutorPlansPage;
