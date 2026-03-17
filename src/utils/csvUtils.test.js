import { describe, expect, it } from 'vitest';
import { parseCsvTable } from './csvUtils';

describe('parseCsvTable', () => {
    it('parses standard csv rows', () => {
        expect(parseCsvTable('a,b\nc,d')).toEqual([
            ['a', 'b'],
            ['c', 'd']
        ]);
    });

    it('keeps commas inside quoted fields', () => {
        expect(parseCsvTable('scene,text\nmath,"1, 2, 3 を順番に見てね"')).toEqual([
            ['scene', 'text'],
            ['math', '1, 2, 3 を順番に見てね']
        ]);
    });

    it('keeps line breaks inside quoted fields', () => {
        expect(parseCsvTable('scene,text\nmath,"1行目\n2行目"')).toEqual([
            ['scene', 'text'],
            ['math', '1行目\n2行目']
        ]);
    });

    it('unescapes doubled quotes', () => {
        expect(parseCsvTable('scene,text\nmath,"""比例"""')).toEqual([
            ['scene', 'text'],
            ['math', '"比例"']
        ]);
    });
});
