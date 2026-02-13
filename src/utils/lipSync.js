/**
 * lipSync.js
 * 日本語テキストからリップシンク（口パク）データを生成するユーティリティ
 * テキスト → ひらがな/カタカナ → 母音(A/I/U/E/O) → タイムライン
 */

// ひらがな → 母音マッピング
const HIRAGANA_TO_VOWEL = {
    'あ': 'aa', 'い': 'ih', 'う': 'ou', 'え': 'ee', 'お': 'oh',
    'か': 'aa', 'き': 'ih', 'く': 'ou', 'け': 'ee', 'こ': 'oh',
    'さ': 'aa', 'し': 'ih', 'す': 'ou', 'せ': 'ee', 'そ': 'oh',
    'た': 'aa', 'ち': 'ih', 'つ': 'ou', 'て': 'ee', 'と': 'oh',
    'な': 'aa', 'に': 'ih', 'ぬ': 'ou', 'ね': 'ee', 'の': 'oh',
    'は': 'aa', 'ひ': 'ih', 'ふ': 'ou', 'へ': 'ee', 'ほ': 'oh',
    'ま': 'aa', 'み': 'ih', 'む': 'ou', 'め': 'ee', 'も': 'oh',
    'や': 'aa', 'ゆ': 'ou', 'よ': 'oh',
    'ら': 'aa', 'り': 'ih', 'る': 'ou', 'れ': 'ee', 'ろ': 'oh',
    'わ': 'aa', 'を': 'oh', 'ん': null,
    'が': 'aa', 'ぎ': 'ih', 'ぐ': 'ou', 'げ': 'ee', 'ご': 'oh',
    'ざ': 'aa', 'じ': 'ih', 'ず': 'ou', 'ぜ': 'ee', 'ぞ': 'oh',
    'だ': 'aa', 'ぢ': 'ih', 'づ': 'ou', 'で': 'ee', 'ど': 'oh',
    'ば': 'aa', 'び': 'ih', 'ぶ': 'ou', 'べ': 'ee', 'ぼ': 'oh',
    'ぱ': 'aa', 'ぴ': 'ih', 'ぷ': 'ou', 'ぺ': 'ee', 'ぽ': 'oh',
    // 拗音
    'ゃ': 'aa', 'ゅ': 'ou', 'ょ': 'oh',
    // 促音・長音
    'っ': null, 'ー': null,
};

// カタカナ→ひらがな変換
const katakanaToHiragana = (str) => {
    return str.replace(/[\u30A1-\u30F6]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
};

// 漢字・英字に対する簡易母音推定（実際の読みは不明なのでランダムっぽく）
const guessVowelForUnknown = (index) => {
    const vowels = ['aa', 'ih', 'ou', 'ee', 'oh'];
    return vowels[index % vowels.length];
};

/**
 * テキストからリップシンクタイムラインを生成
 * @param {string} text - 日本語テキスト
 * @param {number} duration - アニメーション総時間（秒）デフォルトはテキスト長に応じて自動
 * @returns {Array<{time: number, vowel: string, duration: number}>}
 */
export const generateLipSyncTimeline = (text, duration = null) => {
    if (!text) return [];

    const hiraganaText = katakanaToHiragana(text);
    const vowelSequence = [];

    for (let i = 0; i < hiraganaText.length; i++) {
        const char = hiraganaText[i];
        if (HIRAGANA_TO_VOWEL[char] !== undefined) {
            if (HIRAGANA_TO_VOWEL[char] !== null) {
                vowelSequence.push(HIRAGANA_TO_VOWEL[char]);
            }
            // null = 促音・長音 → 無音区間
            else {
                vowelSequence.push(null);
            }
        } else if (/[\u4E00-\u9FFF]/.test(char)) {
            // 漢字 → 推定母音（2音分）
            vowelSequence.push(guessVowelForUnknown(i));
            vowelSequence.push(guessVowelForUnknown(i + 1));
        } else if (/[a-zA-Z]/.test(char)) {
            // 英字はそのまま母音推定
            const lower = char.toLowerCase();
            if ('aeiou'.includes(lower)) {
                const map = { 'a': 'aa', 'i': 'ih', 'u': 'ou', 'e': 'ee', 'o': 'oh' };
                vowelSequence.push(map[lower]);
            }
        } else if (/[、。！？,.!?]/.test(char)) {
            // 句読点 → 少し長めの無音
            vowelSequence.push(null);
            vowelSequence.push(null);
        }
        // その他（スペース等）はスキップ
    }

    if (vowelSequence.length === 0) return [];

    // 1音あたりの時間（秒）
    const charDuration = 0.08; // 80ms per character
    const totalDuration = duration || vowelSequence.length * charDuration;
    const timePerChar = totalDuration / vowelSequence.length;

    const timeline = [];
    let currentTime = 0;

    for (const vowel of vowelSequence) {
        timeline.push({
            time: currentTime,
            vowel: vowel, // null = 口を閉じる
            duration: timePerChar,
        });
        currentTime += timePerChar;
    }

    return timeline;
};

/**
 * 現在時刻に対応する母音を取得
 * @param {Array} timeline - generateLipSyncTimelineの戻り値
 * @param {number} elapsed - 経過時間（秒）
 * @returns {string|null} 母音名 or null
 */
export const getCurrentVowel = (timeline, elapsed) => {
    if (!timeline || timeline.length === 0) return null;

    for (let i = timeline.length - 1; i >= 0; i--) {
        if (elapsed >= timeline[i].time) {
            return timeline[i].vowel;
        }
    }
    return null;
};

/**
 * VRM ExpressionManager用の母音名マッピング
 * VRM1.0の表情プリセット名に変換
 */
export const VRM_VOWEL_MAP = {
    'aa': 'aa',   // あ
    'ih': 'ih',   // い
    'ou': 'ou',   // う
    'ee': 'ee',   // え
    'oh': 'oh',   // お
};

/**
 * テキストの推定読み上げ時間を計算（秒）
 * @param {string} text
 * @returns {number}
 */
export const estimateSpeechDuration = (text) => {
    if (!text) return 0;
    // 日本語は1文字あたり約0.1秒（やや速め）
    const charCount = text.replace(/[\s\n]/g, '').length;
    return Math.max(1, charCount * 0.08);
};
