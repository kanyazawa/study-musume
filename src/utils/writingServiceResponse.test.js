import { describe, expect, it } from 'vitest';
import { extractStructuredWritingEvaluation } from '../../functions/_shared/writingService.js';

describe('writingService structured responses', () => {
    it('extracts writing evaluation from plain json', () => {
        expect(
            extractStructuredWritingEvaluation(
                '{"overallScore":12,"breakdown":{"content":3,"organization":3,"vocabulary":3,"grammar":3},"summaryJa":"論点は伝わっています。","strengthsJa":["立場が明確です。"],"improvementsJa":["語彙を増やしましょう。"],"revisedAnswer":"I think students should use libraries more often.","modelAnswer":"Students should visit libraries because they can study quietly and find useful books.","encouragementJa":"この方向で大丈夫です。"}'
            )
        ).toEqual({
            overallScore: 12,
            maxScore: 16,
            breakdown: {
                content: 3,
                organization: 3,
                vocabulary: 3,
                grammar: 3,
            },
            summary: '論点は伝わっています。',
            strengths: ['立場が明確です。'],
            improvements: ['語彙を増やしましょう。'],
            revisedAnswer: 'I think students should use libraries more often.',
            modelAnswer: 'Students should visit libraries because they can study quietly and find useful books.',
            encouragement: 'この方向で大丈夫です。',
        });
    });

    it('extracts writing evaluation from fenced json and clamps scores', () => {
        const result = extractStructuredWritingEvaluation(
            '```json\n{"overallScore":22,"breakdown":{"content":9,"organization":-1,"vocabulary":4,"grammar":3}}\n```'
        );

        expect(result.overallScore).toBe(16);
        expect(result.breakdown).toEqual({
            content: 4,
            organization: 0,
            vocabulary: 4,
            grammar: 3,
        });
        expect(result.summary.length).toBeGreaterThan(0);
        expect(result.strengths.length).toBeGreaterThan(0);
        expect(result.improvements.length).toBeGreaterThan(0);
    });
});
