// Toggle `chestEnabled` to false when we want to remove the chest-only joke lines quickly.
export const HOME_TOUCH_FEATURE_FLAGS = {
    enabled: true,
    chestEnabled: true,
};

const HOME_TOUCH_STYLE_MAP = {
    noah: {
        face: 'まお / あまあま',
        hair: 'まお / からかい',
        chest: 'まお / からかい',
        default: 'まお / ノーマル',
    },
    ren: {
        face: 'まお / おちつき',
        hair: 'まお / ふつー',
        chest: 'まお / せつなめ',
        default: 'まお / おちつき',
    },
};

const buildTouchVoicePath = (characterId, area, id) =>
    `/audio/tts-generated/home-touch/${characterId}/${area}/${id}.mp3`;

const withTouchMeta = (characterId, area, items) => items.map((item, index) => {
    const id = item.id || `${characterId}-${area}-${String(index + 1).padStart(2, '0')}`;
    const styleMap = HOME_TOUCH_STYLE_MAP[characterId] || HOME_TOUCH_STYLE_MAP.noah;

    return {
        ...item,
        area,
        id,
        voice: item.voice || buildTouchVoicePath(characterId, area, id),
        ttsSpeaker: item.ttsSpeaker || styleMap[area] || styleMap.default,
    };
});

export const HOME_TOUCH_AREAS = {
    noah: [
        { id: 'hair', label: '髪', left: '33%', top: '8%', width: '34%', height: '16%' },
        { id: 'face', label: '顔', left: '37%', top: '25%', width: '26%', height: '16%' },
        { id: 'chest', label: '胸', left: '29%', top: '50%', width: '42%', height: '14%', gatedBy: 'chestEnabled' },
    ],
    ren: [
        { id: 'hair', label: '髪', left: '33%', top: '8%', width: '34%', height: '16%' },
        { id: 'face', label: '顔', left: '37%', top: '25%', width: '26%', height: '16%' },
        { id: 'chest', label: '胸', left: '29%', top: '50%', width: '42%', height: '14%', gatedBy: 'chestEnabled' },
    ],
};

export const HOME_TOUCH_REACTIONS = {
    noah: {
        face: withTouchMeta('noah', 'face', [
            { emotion: 'happy', text: 'ち、近い近い。顔をつつくなら、せめて一言くらい言いなさいよ。' },
            { emotion: 'angry', text: '顔を触られると、さすがにちょっと意識するんだけど……。' },
            { emotion: 'smile', text: 'そういういたずらする余裕があるなら、今日は調子よさそうね。' },
            { emotion: 'relaxed', text: '顔色を見てくれたの？ ふふ、ありがと。' },
        ]),
        hair: withTouchMeta('noah', 'hair', [
            { emotion: 'happy', text: '髪？ べ、別にいいけど、そんなに気になるの？' },
            { emotion: 'smile', text: 'そこ触ると少しくすぐったいわね。変な顔してないでしょうね。' },
            { emotion: 'angry', text: '髪を撫でるの、案外ずるいわよ……ちょっと落ち着いちゃうじゃない。' },
            { emotion: 'happy', text: 'ちゃんと整ってるか見てくれてるなら、まあ許してあげる。' },
        ]),
        chest: withTouchMeta('noah', 'chest', [
            { emotion: 'angry', text: 'ちょっ、そこはだめに決まってるでしょ。からかうなら他でやりなさい。' },
            { emotion: 'smile', text: 'ほんとにそういう遊び好きよね……今回は軽く注意だけで済ませてあげる。' },
            { emotion: 'angry', text: 'び、びっくりした……今のは反則。次やったら知らないんだから。' },
        ]),
    },
    ren: {
        face: withTouchMeta('ren', 'face', [
            { emotion: 'normal', text: '顔か。何か付いていたか？ いや、別に嫌ではない。' },
            { emotion: 'smile', text: 'そんなところを触るのは、お前なりの挨拶かもしれないな。' },
            { emotion: 'relaxed', text: '近いな。でも、そのくらいなら平気だ。' },
            { emotion: 'happy', text: '顔色を見に来たのなら安心しろ。今日は悪くない。' },
        ]),
        hair: withTouchMeta('ren', 'hair', [
            { emotion: 'normal', text: '髪を触るのは珍しいな。乱れていないならそのままでいい。' },
            { emotion: 'smile', text: 'そういう距離感にも、少し慣れてきたかもしれない。' },
            { emotion: 'relaxed', text: '撫でるならもう少しゆっくりでいい。慌てなくていいからな。' },
            { emotion: 'happy', text: '気分転換のつもりか？ それなら効果はありそうだ。' },
        ]),
        chest: withTouchMeta('ren', 'chest', [
            { emotion: 'serious', text: 'おい、そこは急に来るな。さすがに驚く。' },
            { emotion: 'smile', text: '……遊んでいるのは分かるが、ほどほどにな。' },
            { emotion: 'angry', text: '距離が近すぎる。嫌じゃないが、心の準備はさせてくれ。' },
        ]),
    },
};

const lastTouchReactionTextByKey = new Map();

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

export const getEnabledHomeTouchAreas = (characterId = 'noah') => {
    if (!HOME_TOUCH_FEATURE_FLAGS.enabled) {
        return [];
    }

    const areas = HOME_TOUCH_AREAS[characterId] || HOME_TOUCH_AREAS.noah || [];
    return areas.filter((area) => !area.gatedBy || HOME_TOUCH_FEATURE_FLAGS[area.gatedBy] !== false);
};

export const getHomeTouchReaction = (characterId = 'noah', areaId = 'face') => {
    if (!HOME_TOUCH_FEATURE_FLAGS.enabled) {
        return null;
    }

    if (areaId === 'chest' && HOME_TOUCH_FEATURE_FLAGS.chestEnabled === false) {
        return null;
    }

    const reactionSet = HOME_TOUCH_REACTIONS[characterId] || HOME_TOUCH_REACTIONS.noah;
    const candidates = reactionSet?.[areaId] || [];
    if (candidates.length === 0) {
        return null;
    }

    const cacheKey = `${characterId}:${areaId}`;
    const lastText = lastTouchReactionTextByKey.get(cacheKey);
    const filtered = lastText ? candidates.filter((item) => item.text !== lastText) : candidates;
    const picked = pickRandom(filtered.length > 0 ? filtered : candidates);

    if (picked?.text) {
        lastTouchReactionTextByKey.set(cacheKey, picked.text);
    }

    return picked;
};

export const getAllHomeTouchVoiceLines = () => Object.entries(HOME_TOUCH_REACTIONS).flatMap(([characterId, reactionGroups]) =>
    Object.entries(reactionGroups).flatMap(([area, items]) =>
        items.map((item) => ({
            characterId,
            area,
            ...item,
        }))
    )
);
