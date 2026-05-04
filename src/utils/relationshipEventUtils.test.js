import { describe, expect, it } from 'vitest';
import { applyRelationshipActivity, applyRelationshipProgress, getUnreadRelationshipEvents, markRelationshipEventRead } from './relationshipEventUtils';

describe('relationshipEventUtils', () => {
    it('unlocks the first event after the required chat interaction', () => {
        const { nextStats, newlyUnlockedIds } = applyRelationshipProgress(
            { affection: 1200, characterId: 'noah' },
            {
                type: 'chat',
                summary: '少し長く雑談した',
                timestamp: new Date('2026-03-29T10:00:00+09:00').getTime(),
            },
        );

        expect(newlyUnlockedIds).toContain('noah_event_01');
        expect(nextStats.relationshipEvents.unlockedIds).toContain('noah_event_01');
    });

    it('tracks unread events until they are marked as read', () => {
        const baseStats = {
            affection: 800,
            characterId: 'noah',
            relationshipEvents: {
                unlockedIds: ['noah_event_01'],
                readIds: [],
                notifiedIds: [],
            },
        };

        expect(getUnreadRelationshipEvents(baseStats)).toHaveLength(1);

        const patched = markRelationshipEventRead(baseStats, 'noah_event_01');
        const updatedStats = { ...baseStats, ...patched };

        expect(getUnreadRelationshipEvents(updatedStats)).toHaveLength(0);
        expect(updatedStats.relationshipEvents.readIds).toContain('noah_event_01');
    });

    it('awards affection for early daily chat turns and records the moment', () => {
        const { nextStats, affectionDelta } = applyRelationshipActivity(
            { affection: 1200, characterId: 'noah' },
            {
                type: 'chat',
                summary: 'ノアと少し会話した',
                timestamp: new Date('2026-03-29T10:00:00+09:00').getTime(),
            },
        );

        expect(affectionDelta).toBe(6);
        expect(nextStats.affection).toBe(1206);
        expect(nextStats.relationshipDaily.chat).toBe(1);
        expect(nextStats.relationshipMoments[0].affectionDelta).toBe(6);
    });

    it('stops granting extra talk affection after the daily soft cap while still recording interaction', () => {
        const timestamp = Date.now();
        const date = new Date(timestamp);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const baseStats = {
            affection: 20,
            relationshipDaily: {
                date: dateKey,
                talk: 5,
                chat: 0,
                study: 0,
                gift: 0,
            },
            relationshipTotals: {
                talk: 5,
                chat: 0,
                study: 0,
                gift: 0,
            },
        };
        const { nextStats, affectionDelta } = applyRelationshipActivity(baseStats, {
            type: 'talk',
            summary: 'ホームで少し話した',
            timestamp,
        });

        expect(affectionDelta).toBe(0);
        expect(nextStats.affection).toBe(20);
        expect(nextStats.relationshipDaily.talk).toBe(6);
    });
});
