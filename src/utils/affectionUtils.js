import { AFFECTION_LEVELS, AFFECTION_QUOTES, AFFECTION_QUOTES_REN } from '../data/affectionData';

const HOME_REACTIONS = {
    noah: {
        lowTp: [
            { emotion: 'normal', text: '無理しすぎないでよ。少し休んでからでも遅くないんだから。' },
            { emotion: 'serious', text: '顔色、あんまり良くないわよ。今日は深呼吸してからにしなさい。' },
        ],
        highStreak: [
            { emotion: 'happy', text: '連続で頑張れてるじゃない。べ、別にちょっと感心しただけよ。' },
            { emotion: 'happy', text: 'その調子で積み上げなさいよ。今日はかなりいい感じなんだから。' },
        ],
        highAffection: [
            { emotion: 'happy', text: '来てくれると安心するの。今日は何を一緒にやる？' },
            { emotion: 'happy', text: 'あんたと話すと落ち着くのよね。少しだけ、ここにいて。' },
        ],
        default: [
            { emotion: 'normal', text: '今日はどこから進めるの？ちゃんと付き合ってあげるわ。' },
            { emotion: 'normal', text: 'ぼーっとしてないで、やること決めなさいよ。' },
            { emotion: 'happy', text: '来たのね。少しだけなら、話してあげてもいいわ。' },
        ],
    },
    ren: {
        lowTp: [
            { emotion: 'serious', text: '疲れているだろ。無理に詰め込まず、少し整えてから進もう。' },
            { emotion: 'normal', text: '集中が切れている時は休憩も必要だ。焦るな。' },
        ],
        highStreak: [
            { emotion: 'happy', text: '継続できているな。その積み重ねは確実に力になる。' },
            { emotion: 'happy', text: '今日も続けられている。お前の努力、俺はちゃんと見てる。' },
        ],
        highAffection: [
            { emotion: 'happy', text: 'お前が来ると少し空気が変わるな。悪くない。' },
            { emotion: 'happy', text: '一緒にいると落ち着く。今日は何から始める？' },
        ],
        default: [
            { emotion: 'normal', text: '来たか。今日も一つずつ片付けていこう。' },
            { emotion: 'normal', text: '始めるなら集中していこう。俺も付き合う。' },
            { emotion: 'happy', text: '少し話すくらいならいい。で、何をやる？' },
        ],
    },
};

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

export const getHomeReaction = ({ affection = 0, tp = 0, maxTp = 100, loginStreak = 0, characterId = 'noah' }) => {
    const level = getAffectionLevel(affection).level;
    const reactionSet = HOME_REACTIONS[characterId] || HOME_REACTIONS.noah;
    const tpRatio = maxTp > 0 ? tp / maxTp : 0;

    if (tpRatio <= 0.25) {
        return pickRandom(reactionSet.lowTp);
    }

    if (loginStreak >= 3) {
        return pickRandom(reactionSet.highStreak);
    }

    if (level >= 5) {
        return pickRandom(reactionSet.highAffection);
    }

    return pickRandom(reactionSet.default);
};

export const getGiftReaction = ({ characterId = 'noah', affection = 0, item }) => {
    const reactionSet = GIFT_REACTION_BY_RARITY[characterId] || GIFT_REACTION_BY_RARITY.noah;
    const rarityKey = reactionSet[item?.rarity] ? item.rarity : 'default';
    const baseReaction = pickRandom(reactionSet[rarityKey]);
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
        ? pickRandom(reactionSet.correct[difficultyKey])
        : pickRandom(reactionSet.incorrect[difficultyKey]);

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
