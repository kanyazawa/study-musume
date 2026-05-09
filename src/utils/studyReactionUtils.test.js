import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    __resetReactionVoiceHistoryForTests,
    getDialogueFeedbackOverlayCopy,
    getDialogueReactionLine,
    getMatchFeedbackCopy,
    getReactionVoiceCandidates,
    getReactionVoiceFile,
    getReviewFeedbackCopy,
    resolveReactionVoiceSelection,
    resolveMatchReactionTone,
    resolveReviewReactionTone,
    shouldTriggerReactionFeverFx,
} from './studyReactionUtils';

describe('studyReactionUtils', () => {
    beforeEach(() => {
        __resetReactionVoiceHistoryForTests();
    });

    it('treats hard review misses as encouraging instead of plain failure', () => {
        expect(resolveReviewReactionTone({
            isCorrect: false,
            questionType: 'reorder',
            wrongCount: 2,
        })).toBe('hard_incorrect');

        expect(getReviewFeedbackCopy({
            feedback: 'incorrect',
            tone: 'hard_incorrect',
        })).toEqual({
            banner: 'いい挑戦だったよ。',
            detail: '難しい問題なので、近いうちにもう一度出します。',
        });
    });

    it('returns a comeback tone and line after recovering in dialogue', () => {
        expect(getDialogueFeedbackOverlayCopy({
            feedback: 'correct',
            tone: 'comeback_correct',
        })).toBe('⭕ Nice comeback!');

        expect(getDialogueReactionLine({
            tone: 'comeback_correct',
            isCorrect: true,
        })).toContain('立て直し');
    });

    it('marks close saves in matches as clutch moments', () => {
        expect(resolveMatchReactionTone({
            isCorrect: true,
            timerRemaining: 1,
            nextCorrectStreak: 1,
        })).toBe('clutch_correct');

        expect(getMatchFeedbackCopy({
            tone: 'timeout',
            answerKind: 'timeout',
        })).toEqual({
            title: '⌛',
            detail: 'ギリギリまで粘れた。次で取り返そう。',
        });
    });

    it('maps supported tones to short reaction voice candidates for noah', () => {
        const candidates = getReactionVoiceCandidates({
            characterId: 'noah',
            tone: 'chain_correct',
        });
        const rareCandidates = getReactionVoiceCandidates({
            characterId: 'noah',
            tone: 'chain_correct',
            streak: 5,
        });

        expect(candidates).toHaveLength(3);
        expect(candidates.every((candidate) => candidate.includes('noah-highStreak'))).toBe(true);
        expect(rareCandidates).toHaveLength(6);

        expect(getReactionVoiceFile({
            characterId: 'ren',
            tone: 'chain_correct',
        })).toBe(null);
    });

    it('mixes in a rare chain voice after five streak when the rare roll hits', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0);

        const rareSelection = resolveReactionVoiceSelection({
            characterId: 'noah',
            tone: 'chain_correct',
            streak: 5,
        });

        expect(rareSelection.isRare).toBe(true);
        expect(rareSelection.shouldTriggerFeverFx).toBe(true);
        expect(rareSelection.file).toContain('noah-highStreak-04');
        randomSpy.mockRestore();
    });

    it('still triggers fever visuals at five streak even for characters without reaction voices', () => {
        const selection = resolveReactionVoiceSelection({
            characterId: 'ren',
            tone: 'chain_correct',
            streak: 5,
        });

        expect(selection.file).toBe(null);
        expect(selection.isRare).toBe(false);
        expect(selection.shouldTriggerFeverFx).toBe(true);
    });

    it('flags five-chain fever independently from voice playback', () => {
        expect(shouldTriggerReactionFeverFx({
            tone: 'chain_correct',
            streak: 5,
            isRare: false,
        })).toBe(true);

        expect(shouldTriggerReactionFeverFx({
            tone: 'chain_correct',
            streak: 4,
            isRare: true,
        })).toBe(false);
    });

    it('avoids replaying the exact same reaction voice when alternatives exist', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(0);

        const firstVoice = getReactionVoiceFile({
            characterId: 'noah',
            tone: 'hard_correct',
        });
        const secondVoice = getReactionVoiceFile({
            characterId: 'noah',
            tone: 'hard_correct',
        });

        expect(firstVoice).not.toBeNull();
        expect(secondVoice).not.toBeNull();
        expect(secondVoice).not.toBe(firstVoice);

        randomSpy.mockRestore();
    });
});
