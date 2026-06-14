import {
    AI_TUTOR_PLANS,
    AI_TUTOR_TICKET_PACKS,
    AI_TUTOR_TRIAL_LIMIT,
    getAiTutorPlanById,
    getAiTutorTicketPackById,
} from '../data/aiTutorPlans';

const toPeriodKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const normalizeSubscription = (subscription = {}) => {
    const source = subscription && typeof subscription === 'object' ? subscription : {};
    const planId = typeof source.planId === 'string' ? source.planId : 'free';
    const billingCycle = source.billingCycle === 'yearly' ? 'yearly' : 'monthly';

    return {
        planId,
        billingCycle,
        startedAt: Number.isFinite(Number(source.startedAt)) ? Number(source.startedAt) : null,
    };
};

const normalizeUsage = (usage = {}, now = new Date()) => {
    const source = usage && typeof usage === 'object' ? usage : {};
    const periodKey = typeof source.periodKey === 'string' ? source.periodKey : toPeriodKey(now);
    const used = Math.max(0, Number(source.used) || 0);

    if (periodKey !== toPeriodKey(now)) {
        return {
            periodKey: toPeriodKey(now),
            used: 0,
        };
    }

    return {
        periodKey,
        used,
    };
};

export const getAiTutorState = (stats = {}, now = new Date()) => ({
    trialUsed: Math.max(0, Number(stats?.aiTutorTrialUsed) || 0),
    ticketCount: Math.max(0, Number(stats?.aiTutorTickets) || 0),
    subscription: normalizeSubscription(stats?.aiTutorSubscription),
    usage: normalizeUsage(stats?.aiTutorUsage, now),
});

export const getAiTutorEntitlement = (stats = {}, now = new Date()) => {
    const state = getAiTutorState(stats, now);
    const activePlan = getAiTutorPlanById(state.subscription.planId);
    const hasPaidPlan = activePlan.id !== 'free';
    const monthlyLimit = hasPaidPlan ? activePlan.monthlyCorrectionLimit : 0;
    const monthlyRemaining = hasPaidPlan ? Math.max(0, monthlyLimit - state.usage.used) : 0;
    const trialRemaining = Math.max(0, AI_TUTOR_TRIAL_LIMIT - state.trialUsed);
    const ticketRemaining = state.ticketCount;

    let nextConsumption = 'none';
    if (monthlyRemaining > 0) {
        nextConsumption = 'plan';
    } else if (trialRemaining > 0) {
        nextConsumption = 'trial';
    } else if (ticketRemaining > 0) {
        nextConsumption = 'ticket';
    }

    return {
        ...state,
        activePlan,
        hasPaidPlan,
        monthlyLimit,
        monthlyRemaining,
        trialRemaining,
        ticketRemaining,
        totalRemaining: monthlyRemaining + ticketRemaining + trialRemaining,
        nextConsumption,
        canUseCorrection: nextConsumption !== 'none',
    };
};

export const getAiTutorStatusLabel = (stats = {}, now = new Date()) => {
    const entitlement = getAiTutorEntitlement(stats, now);

    if (entitlement.monthlyRemaining > 0) {
        return `${entitlement.activePlan.name} 残り ${entitlement.monthlyRemaining}/${entitlement.monthlyLimit}`;
    }

    if (entitlement.ticketRemaining > 0) {
        return `チケット ${entitlement.ticketRemaining}回`;
    }

    if (entitlement.trialRemaining > 0) {
        return `体験 ${entitlement.trialRemaining}/${AI_TUTOR_TRIAL_LIMIT}`;
    }

    return '利用枠なし';
};

export const consumeAiTutorUse = (stats = {}, now = new Date()) => {
    const entitlement = getAiTutorEntitlement(stats, now);

    if (!entitlement.canUseCorrection) {
        return stats;
    }

    if (entitlement.nextConsumption === 'plan') {
        return {
            ...stats,
            aiTutorUsage: {
                periodKey: entitlement.usage.periodKey,
                used: entitlement.usage.used + 1,
            },
        };
    }

    if (entitlement.nextConsumption === 'ticket') {
        return {
            ...stats,
            aiTutorTickets: Math.max(0, entitlement.ticketRemaining - 1),
        };
    }

    return {
        ...stats,
        aiTutorTrialUsed: entitlement.trialUsed + 1,
    };
};

export const activateAiTutorPlan = (
    stats = {},
    { planId = 'standard', billingCycle = 'monthly', now = new Date() } = {},
) => {
    const nextPlan = getAiTutorPlanById(planId);

    return {
        ...stats,
        aiTutorSubscription: {
            planId: nextPlan.id,
            billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
            startedAt: now.getTime(),
        },
        aiTutorUsage: {
            periodKey: toPeriodKey(now),
            used: 0,
        },
    };
};

export const purchaseAiTutorTickets = (stats = {}, packId) => {
    const pack = getAiTutorTicketPackById(packId);

    if (!pack) {
        return stats;
    }

    return {
        ...stats,
        aiTutorTickets: Math.max(0, Number(stats?.aiTutorTickets) || 0) + pack.corrections,
    };
};

export const formatAiTutorPrice = (plan, billingCycle = 'monthly') => {
    if (!plan || plan.id === 'free') {
        return '無料';
    }

    if (billingCycle === 'yearly') {
        return `¥${plan.yearlyPrice.toLocaleString()} / 年`;
    }

    return `¥${plan.monthlyPrice.toLocaleString()} / 月`;
};

export const getAiTutorPlanFeatureNote = (plan, billingCycle = 'monthly') => {
    if (!plan || plan.id === 'free') {
        return `初回 ${AI_TUTOR_TRIAL_LIMIT} 回までAI添削`;
    }

    if (billingCycle === 'yearly') {
        return `月あたり約 ¥${plan.yearlyMonthlyEquivalent.toLocaleString()}`;
    }

    return `月 ${plan.monthlyCorrectionLimit} 回まで`;
};

export const getAiTutorUpsellCards = () => ({
    plans: AI_TUTOR_PLANS,
    ticketPacks: AI_TUTOR_TICKET_PACKS,
});
