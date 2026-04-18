import { describe, expect, it } from 'vitest';
import { applyRelationshipProgress, getUnreadRelationshipEvents, markRelationshipEventRead } from './relationshipEventUtils';

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
});
