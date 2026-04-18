import { getAffectionLevel } from './affectionUtils';
import { getRelationshipEventById, getRelationshipEventsByCharacter } from '../data/relationshipEvents';
import { getRelationshipEventState, getRelationshipTotals, recordRelationshipMoment } from './relationshipUtils';

const meetsTotalsRequirement = (totals = {}, requiredTotals = {}) =>
    Object.entries(requiredTotals).every(([key, value]) => Number(totals[key] || 0) >= Number(value || 0));

export const unlockRelationshipEvents = (stats = {}) => {
    const characterId = stats?.characterId || 'noah';
    const level = getAffectionLevel(stats?.affection || 0).level;
    const totals = getRelationshipTotals(stats);
    const state = getRelationshipEventState(stats);
    const unlockedSet = new Set(state.unlockedIds);
    const notifiedSet = new Set(state.notifiedIds);
    const newlyUnlockedIds = [];

    getRelationshipEventsByCharacter(characterId).forEach((event) => {
        if (unlockedSet.has(event.id)) return;

        const minAffectionLevel = Number(event?.requirements?.minAffectionLevel || 0);
        const requiredTotals = event?.requirements?.totals || {};

        if (level < minAffectionLevel) return;
        if (!meetsTotalsRequirement(totals, requiredTotals)) return;

        unlockedSet.add(event.id);
        newlyUnlockedIds.push(event.id);
    });

    newlyUnlockedIds.forEach((id) => notifiedSet.delete(id));

    return {
        statsPatch: {
            relationshipEvents: {
                unlockedIds: [...unlockedSet],
                readIds: state.readIds,
                notifiedIds: [...notifiedSet],
            },
        },
        newlyUnlockedIds,
    };
};

export const applyRelationshipProgress = (stats = {}, momentInput = null) => {
    const nextStats = momentInput
        ? {
            ...stats,
            ...recordRelationshipMoment(stats, momentInput),
        }
        : { ...stats };
    const { statsPatch, newlyUnlockedIds } = unlockRelationshipEvents(nextStats);

    return {
        nextStats: {
            ...nextStats,
            ...statsPatch,
        },
        newlyUnlockedIds,
    };
};

export const getUnlockedRelationshipEvents = (stats = {}) => {
    const state = getRelationshipEventState(stats);
    return state.unlockedIds
        .map((id) => getRelationshipEventById(id))
        .filter(Boolean);
};

export const getUnreadRelationshipEvents = (stats = {}) => {
    const state = getRelationshipEventState(stats);
    return state.unlockedIds
        .filter((id) => !state.readIds.includes(id))
        .map((id) => getRelationshipEventById(id))
        .filter(Boolean);
};

export const markRelationshipEventRead = (stats = {}, eventId) => {
    const state = getRelationshipEventState(stats);
    const readSet = new Set(state.readIds);
    const notifiedSet = new Set(state.notifiedIds);
    readSet.add(eventId);
    notifiedSet.add(eventId);

    return {
        relationshipEvents: {
            unlockedIds: state.unlockedIds,
            readIds: [...readSet],
            notifiedIds: [...notifiedSet],
        },
    };
};

export const isRelationshipEventUnlocked = (stats = {}, eventId) =>
    getRelationshipEventState(stats).unlockedIds.includes(eventId);

export const isRelationshipEventRead = (stats = {}, eventId) =>
    getRelationshipEventState(stats).readIds.includes(eventId);
