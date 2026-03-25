import { normalizeCharacterEmotion } from './characterPoseUtils';

const USER_ANGRY_PATTERNS = [
    '嫌い', 'きらい', 'バカ', 'ばか', '馬鹿', 'アホ', 'あほ', 'うざ', 'ウザ',
    'きも', 'キモ', '最悪', 'むかつ', 'ムカつ', 'うるさい', '黙れ', 'だまれ',
    '消えろ', 'しね', '死ね', 'クソ', 'くそ', 'ゴミ', '役立たず', '最低',
];

const USER_POSITIVE_PATTERNS = [
    '好き', 'すき', 'ありがとう', 'ありがと', 'ごめん', '応援', '助かる', 'えらい',
    '偉い', 'すごい', '頑張', 'がんば', 'かわいい', '可愛い',
];

const ASSISTANT_HAPPY_PATTERNS = [
    'ありがとう', 'ありがと', '嬉', 'うれ', '楽しい', '安心', 'よかった',
    'えらい', '偉い', 'すごい', '好き', '助かる', 'いい感じ', 'ふふ',
    'えへ', '笑', '大丈夫', '一緒',
];

const ASSISTANT_SERIOUS_PATTERNS = [
    '無理', '休', '深呼吸', '落ち着', '集中', '焦', '気をつけ', '疲',
    '眠', 'しっかり', 'ちゃんと', '整え', 'ゆっくり', '急が', '慌て',
];

const SURPRISED_PATTERNS = [
    '!?', '?!', '！！', 'びっくり', '驚', 'まさか', 'えっ', 'えぇ', '本当に',
    'ほんとに', 'そんな',
];

const SHY_PATTERNS = [
    'その、', 'そのさ', 'べ、別に', '照', '恥ずか', '内緒', 'からかわ',
    '近い', '意識', 'どき',
];

const ANGRY_PATTERNS = [
    ...USER_ANGRY_PATTERNS,
    '違う', 'だめ', 'ダメ', 'やめ', '知らない', '勝手', '困る',
];

const LOW_ENERGY_PATTERNS = [
    '疲れ', 'つかれ', 'しんど', '眠い', 'ねむい', '無理', 'つら', '辛い',
    '落ち込', '不安', 'かなしい', '悲しい',
];

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const includesAny = (text, patterns) => patterns.some((pattern) => text.includes(String(pattern).toLowerCase()));

export const inferEmotionFromChatText = (text, { role = 'assistant', fallback = 'normal' } = {}) => {
    const normalizedText = normalizeText(text);
    if (!normalizedText) {
        return normalizeCharacterEmotion(fallback);
    }

    if (role === 'user') {
        if (includesAny(normalizedText, USER_ANGRY_PATTERNS)) {
            return 'angry';
        }

        if (includesAny(normalizedText, LOW_ENERGY_PATTERNS)) {
            return 'serious';
        }

        if (includesAny(normalizedText, USER_POSITIVE_PATTERNS)) {
            return 'happy';
        }

        if (includesAny(normalizedText, SURPRISED_PATTERNS)) {
            return 'surprised';
        }

        return normalizeCharacterEmotion(fallback);
    }

    if (includesAny(normalizedText, ANGRY_PATTERNS)) {
        return 'angry';
    }

    if (includesAny(normalizedText, SURPRISED_PATTERNS)) {
        return 'surprised';
    }

    if (includesAny(normalizedText, SHY_PATTERNS)) {
        return includesAny(normalizedText, ASSISTANT_HAPPY_PATTERNS) ? 'shy' : 'normal';
    }

    if (includesAny(normalizedText, ASSISTANT_HAPPY_PATTERNS)) {
        return 'happy';
    }

    if (includesAny(normalizedText, ASSISTANT_SERIOUS_PATTERNS)) {
        return 'serious';
    }

    return normalizeCharacterEmotion(fallback);
};
