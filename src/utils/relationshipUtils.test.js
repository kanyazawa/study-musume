import { describe, expect, it } from 'vitest';
import { getRelationshipSnapshot, recordRelationshipMoment } from './relationshipUtils';

describe('relationshipUtils', () => {
    it('records daily interaction counts and recent moments', () => {
        const baseStats = { affection: 1200 };
        const updated = recordRelationshipMoment(baseStats, {
            type: 'chat',
            summary: '少し長く雑談した',
            detail: '勉強の悩みを打ち明けられた。',
            timestamp: new Date('2026-03-29T10:00:00+09:00').getTime(),
        });

        expect(updated.relationshipDaily.chat).toBe(1);
        expect(updated.relationshipMoments).toHaveLength(1);
        expect(updated.relationshipMoments[0].summary).toBe('少し長く雑談した');
    });

    it('merges repeated moments within a short window', () => {
        const first = recordRelationshipMoment({}, {
            type: 'talk',
            summary: '顔を見て少し話した',
            timestamp: new Date('2026-03-29T10:00:00+09:00').getTime(),
        });
        const second = recordRelationshipMoment(first, {
            type: 'talk',
            summary: '顔を見て少し話した',
            timestamp: new Date('2026-03-29T10:10:00+09:00').getTime(),
        });

        expect(second.relationshipDaily.talk).toBe(2);
        expect(second.relationshipMoments).toHaveLength(1);
        expect(second.relationshipMoments[0].count).toBe(2);
    });

    it('builds a relationship snapshot with a forward-looking hint', () => {
        const stats = {
            affection: 5200,
            ...recordRelationshipMoment({}, {
                type: 'study',
                summary: '一緒に勉強を進めた',
                detail: '今日は集中して進められた。',
                timestamp: new Date('2026-03-29T12:00:00+09:00').getTime(),
            }),
        };

        const snapshot = getRelationshipSnapshot(stats);

        expect(snapshot.stageLabel).toBe('親しい友達');
        expect(snapshot.latestMomentTitle).toBe('一緒に勉強を進めた');
        expect(snapshot.nextHint).toContain('あと');
    });
});
