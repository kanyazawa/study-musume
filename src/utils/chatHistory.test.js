import { beforeEach, describe, expect, it } from 'vitest';
import {
    getLatestNoaAssistantMessage,
    getLatestNoaAssistantMessageEntry,
    getNoaChatMessages,
    saveNoaChatMessages,
} from './chatHistory';

describe('chatHistory', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('preserves assistant emotions when saving messages', () => {
        saveNoaChatMessages('general', [
            { role: 'assistant', content: 'こんにちは', emotion: 'happy' },
            { role: 'user', content: 'やあ' },
        ]);

        expect(getNoaChatMessages('general')).toEqual([
            { role: 'assistant', content: 'こんにちは', emotion: 'happy' },
            { role: 'user', content: 'やあ' },
        ]);
    });

    it('returns the latest assistant entry with emotion metadata', () => {
        saveNoaChatMessages('general', [
            { role: 'assistant', content: '最初の返事', emotion: 'normal' },
            { role: 'user', content: '質問' },
            { role: 'assistant', content: '落ち着いていこう', emotion: 'serious' },
        ]);

        expect(getLatestNoaAssistantMessage('general')).toBe('落ち着いていこう');
        expect(getLatestNoaAssistantMessageEntry('general')).toEqual({
            role: 'assistant',
            content: '落ち着いていこう',
            emotion: 'serious',
        });
    });
});
