import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    buildStudyRouteFromItem,
    getLastStudyTopic,
    saveLastStudyTopic,
    saveLastStudyTopicFromItem,
} from './studyData';

describe('studyData last study topic', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.spyOn(Date, 'now').mockReturnValue(1776900000000);
    });

    it('builds a direct solo vocab route for an Eiken level item', () => {
        expect(buildStudyRouteFromItem({ level: 'grade_pre2' }))
            .toBe('/multiplayer-match?mode=solo&level=grade_pre2');
    });

    it('saves and restores the last selected vocab level with a resume label', () => {
        saveLastStudyTopicFromItem(
            { id: 'eng_vocab_grade_pre2', name: '英検準2級', topic: '英検準2級', level: 'grade_pre2' },
            {
                subject: { id: 'english', name: '英語' },
                category: { id: 'eng_vocab', name: '単語' },
                unit: { id: 'eng_vocab_basic', name: '英単語' },
            }
        );

        expect(getLastStudyTopic()).toEqual(expect.objectContaining({
            routePath: '/multiplayer-match?mode=solo&level=grade_pre2',
            resumeLabel: '英検準2級の単語',
            mode: 'vocab',
            level: 'grade_pre2',
        }));
    });

    it('normalizes legacy saved topics into a safe route', () => {
        saveLastStudyTopic('english', 'eng_writing', 'grade_pre2_online_classes', 'Online Classes', '英検ライティング', {
            mode: 'writing',
            level: 'grade_pre2',
        });

        expect(getLastStudyTopic()).toEqual(expect.objectContaining({
            routePath: '/writing?level=grade_pre2',
            topicName: 'Online Classes',
        }));
    });
});
