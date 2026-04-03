import { AFFECTION_LEVELS, AFFECTION_QUOTES, AFFECTION_QUOTES_REN } from '../data/affectionData';
import { HOME_REACTIONS } from '../data/homeReactions';

const GIFT_REACTION_BY_RARITY = {
    noah: {
        SSR: [
            { emotion: 'happy', text: 'えっ、本当にこれくれるの？ず、ずるいわよ……嬉しすぎるじゃない。'},
            { emotion: 'happy', text: 'こんなの大事にするに決まってるでしょ。今日はちょっと特別に許してあげる。'},
        ],
        SR: [
            { emotion: 'happy', text: 'センスいいじゃない。ちゃんと私のこと考えて選んだのね。'},
            { emotion: 'happy', text: 'ふふ、これ好き。ありがと……その、かなり嬉しい。'},
        ],
        default: [
            { emotion: 'happy', text: 'ありがと。こういう気遣い、嫌いじゃないわ。'},
            { emotion: 'normal', text: '受け取っておくわ。ちゃんと覚えておくんだから。'},
        ],
    },
    ren: {
        SSR: [
            { emotion: 'happy', text: 'ここまで用意してくれたのか。……さすがに嬉しいな。'},
            { emotion: 'happy', text: 'すごいな。大切に使う。お前の気持ちごと受け取っておくよ。'},
        ],
        SR: [
            { emotion: 'happy', text: 'いい贈り物だな。俺のこと、よく見ている。'},
            { emotion: 'happy', text: 'ちょうど欲しかった。ありがとう、助かる。'},
        ],
        default: [
            { emotion: 'normal', text: 'ありがとう。こういうのは素直に嬉しい。'},
            { emotion: 'happy', text: '気にかけてくれたんだな。大事にする。'},
        ],
    },
};

const QUIZ_REACTIONS = {
    noah: {
        correct: {
            low: [
                { emotion: 'happy', text: '正解よ。いいじゃない、ちゃんと理解できてる。' },
                { emotion: 'happy', text: 'その答えで合ってるわ。少し見直したかも。' },
            ],
            high: [
                { emotion: 'happy', text: 'さすがね。そうやって連続で決められると、ちょっと悔しいくらい。' },
                { emotion: 'happy', text: '正解。今の流れ、かなりいいわよ。このまま行きなさい。' },
            ],
        },
        incorrect: {
            low: [
                { emotion: 'serious', text: '惜しいわね。正解は「{correctAnswer}」よ。ここは押さえておきなさい。' },
                { emotion: 'serious', text: '違うわ。答えは「{correctAnswer}」。次は落ち着いて見なさい。' },
            ],
            high: [
                { emotion: 'normal', text: '今回は外れたけど大丈夫。正解は「{correctAnswer}」。次で取り返しなさい。' },
                { emotion: 'normal', text: 'ミスは気にしすぎなくていいわ。答えは「{correctAnswer}」よ。' },
            ],
        },
    },
    ren: {
        correct: {
            low: [
                { emotion: 'happy', text: '正解だ。理解できているな。' },
                { emotion: 'happy', text: 'その答えで合ってる。いい調子だ。' },
            ],
            high: [
                { emotion: 'happy', text: 'また正解か。かなり仕上がってきたな、このまま行こう。' },
                { emotion: 'happy', text: '正解だ。今の判断は良かった。自信を持っていい。' },
            ],
        },
        incorrect: {
            low: [
                { emotion: 'serious', text: '違う。正解は「{correctAnswer}」だ。ここは覚えておけ。' },
                { emotion: 'serious', text: '惜しいな。答えは「{correctAnswer}」。次は取れる。' },
            ],
            high: [
                { emotion: 'normal', text: '今のミスは引きずらなくていい。正解は「{correctAnswer}」だ。' },
                { emotion: 'normal', text: '外したか。だが流れは悪くない。答えは「{correctAnswer}」。' },
            ],
        },
    },
};

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];
const lastReactionTextByKey = new Map();

const pickRandomDistinct = (items, cacheKey = '') => {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    if (!cacheKey || items.length === 1) {
        return pickRandom(items);
    }

    const lastText = lastReactionTextByKey.get(cacheKey);
    const filteredItems = lastText
        ? items.filter((item) => item?.text !== lastText)
        : items;
    const picked = pickRandom(filteredItems.length > 0 ? filteredItems : items);

    if (picked?.text) {
        lastReactionTextByKey.set(cacheKey, picked.text);
    }

    return picked;
};

export const __resetReactionMemoryForTests = () => {
    lastReactionTextByKey.clear();
};

const interpolateReactionText = (text, params = {}) =>
    text.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));

/**
 * 好感度ポイントから現在のレベル情報を取得する
 * @param {number} affection - 現在の好感度ポイント
 * @returns {Object} レベル情報
 */
export const getAffectionLevel = (affection) => {
    // レベルを降順で検索し、条件を満たす最初のレベルを返す
    for (let i = AFFECTION_LEVELS.length - 1; i >= 0; i--) {
        if (affection >= AFFECTION_LEVELS[i].points) {
            return AFFECTION_LEVELS[i];
        }
    }

    // フォールバック（レベル0）
    return AFFECTION_LEVELS[0];
};

/**
 * 次のレベル情報を取得する
 * @param {number} currentLevel - 現在のレベル
 * @returns {Object|null} 次のレベル情報、最大レベルの場合はnull
 */
export const getNextLevel = (currentLevel) => {
    const nextLevel = AFFECTION_LEVELS.find(level => level.level === currentLevel + 1);
    return nextLevel || null;
};

/**
 * 現在のレベルから次のレベルまでの進捗率を計算する
 * @param {number} affection - 現在の好感度ポイント
 * @returns {number} 進捗率（0〜100）
 */
export const getAffectionProgress = (affection) => {
    const currentLevelInfo = getAffectionLevel(affection);
    const nextLevelInfo = getNextLevel(currentLevelInfo.level);

    // 最大レベルに到達している場合
    if (!nextLevelInfo) {
        return 100;
    }

    const currentPoints = currentLevelInfo.points;
    const nextPoints = nextLevelInfo.points;
    const range = nextPoints - currentPoints;
    const progress = affection - currentPoints;

    return Math.min((progress / range) * 100, 100);
};

/**
 * 次のレベルまでに必要なポイントを計算する
 * @param {number} affection - 現在の好感度ポイント
 * @returns {number} 必要ポイント数、最大レベルの場合は0
 */
export const getPointsToNextLevel = (affection) => {
    const currentLevelInfo = getAffectionLevel(affection);
    const nextLevelInfo = getNextLevel(currentLevelInfo.level);

    if (!nextLevelInfo) {
        return 0;
    }

    return Math.max(nextLevelInfo.points - affection, 0);
};

/**
 * 好感度レベルに応じたランダムなセリフを取得する
 * @param {number} affectionLevel - 好感度レベル
 * @param {string} characterId - キャラクターID ('noah' | 'ren')
 * @returns {string} セリフ
 */
export const getRandomQuote = (affectionLevel, characterId = 'noah') => {
    // キャラクターIDに応じたセリフ配列を取得
    let quotesMap = AFFECTION_QUOTES;
    if (characterId === 'ren') {
        quotesMap = AFFECTION_QUOTES_REN;
    }

    // レベルに対応するセリフ配列を取得
    const quotes = quotesMap[affectionLevel] || quotesMap[0];

    // ランダムに1つ選択
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
};

export const getHomeReaction = ({
    affection = 0,
    tp = 0,
    maxTp = 100,
    loginStreak = 0,
    characterId = 'noah',
    reviewDueCount = 0,
    examDaysLeft = null,
}) => {
    const level = getAffectionLevel(affection).level;
    const reactionSet = HOME_REACTIONS[characterId] || HOME_REACTIONS.noah;
    const tpRatio = maxTp > 0 ? tp / maxTp : 0;

    if (tpRatio <= 0.25) {
        return pickRandomDistinct(reactionSet.lowTp, `home:${characterId}:lowTp`);
    }

    if (typeof examDaysLeft === 'number' && examDaysLeft >= 0 && examDaysLeft <= 10 && reactionSet.examSoon?.length) {
        return pickRandomDistinct(reactionSet.examSoon, `home:${characterId}:examSoon`);
    }

    if (reviewDueCount > 0 && reactionSet.reviewFocus?.length) {
        return pickRandomDistinct(reactionSet.reviewFocus, `home:${characterId}:reviewFocus`);
    }

    if (loginStreak >= 3) {
        return pickRandomDistinct(reactionSet.highStreak, `home:${characterId}:highStreak`);
    }

    if (level >= 5) {
        return pickRandomDistinct(reactionSet.highAffection, `home:${characterId}:highAffection`);
    }

    return pickRandomDistinct(reactionSet.default, `home:${characterId}:default`);
};

export const getGiftReaction = ({ characterId = 'noah', affection = 0, item }) => {
    const reactionSet = GIFT_REACTION_BY_RARITY[characterId] || GIFT_REACTION_BY_RARITY.noah;
    const rarityKey = reactionSet[item?.rarity] ? item.rarity : 'default';
    const baseReaction = pickRandomDistinct(reactionSet[rarityKey], `gift:${characterId}:${rarityKey}`);
    const level = getAffectionLevel(affection).level;

    if (level >= 6 && baseReaction.emotion === 'normal') {
        return {
            ...baseReaction,
            emotion: 'happy',
        };
    }

    return baseReaction;
};

export const getQuizReaction = ({
    characterId = 'noah',
    affection = 0,
    isCorrect,
    correctAnswer = '',
    streak = 0,
}) => {
    const reactionSet = QUIZ_REACTIONS[characterId] || QUIZ_REACTIONS.noah;
    const level = getAffectionLevel(affection).level;
    const difficultyKey = streak >= 2 || level >= 5 ? 'high' : 'low';
    const baseReaction = isCorrect
        ? pickRandomDistinct(reactionSet.correct[difficultyKey], `quiz:${characterId}:correct:${difficultyKey}`)
        : pickRandomDistinct(reactionSet.incorrect[difficultyKey], `quiz:${characterId}:incorrect:${difficultyKey}`);

    return {
        ...baseReaction,
        text: interpolateReactionText(baseReaction.text, { correctAnswer }),
    };
};

/**
 * レベルアップが発生したかチェックする
 * @param {number} oldAffection - 変更前の好感度
 * @param {number} newAffection - 変更後の好感度
 * @returns {Object|null} レベルアップ情報、レベルアップしていない場合はnull
 */
export const checkLevelUp = (oldAffection, newAffection) => {
    const oldLevel = getAffectionLevel(oldAffection);
    const newLevel = getAffectionLevel(newAffection);

    if (newLevel.level > oldLevel.level) {
        return {
            oldLevel: oldLevel.level,
            newLevel: newLevel.level,
            levelInfo: newLevel
        };
    }

    return null;
};

/**
 * 好感度の変化量を計算する
 * @param {number} baseAffection - 基礎好感度上昇値
 * @param {number} currentLevel - 現在のレベル
 * @returns {number} 実際の好感度上昇値
 */
export const calculateAffectionGain = (baseAffection) => {
    // レベルが高いほど上昇量が減少する（オプション）
    // 現在は基礎値をそのまま返す
    return baseAffection;
};

/**
 * 最大レベルに到達しているかチェックする
 * @param {number} affection - 現在の好感度ポイント
 * @returns {boolean} 最大レベルかどうか
 */
export const isMaxLevel = (affection) => {
    const maxLevel = AFFECTION_LEVELS[AFFECTION_LEVELS.length - 1];
    return affection >= maxLevel.points;
};

/**
 * 好感度レベルのタイトルを取得する
 * @param {number} affection - 現在の好感度ポイント
 * @returns {string} レベルタイトル
 */
export const getAffectionTitle = (affection) => {
    const levelInfo = getAffectionLevel(affection);
    return levelInfo.title;
};
