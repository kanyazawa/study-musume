import { RARITY, ALL_GACHA_ITEMS, GACHA_POOL } from '../data/gachaItems';

const GACHA_HISTORY_KEY = 'gacha_history';
const PITY_COUNTER_KEY = 'gacha_pity';
const PITY_LIMIT = 100; // 天井回数

// ガチャ履歴を取得
export const getGachaHistory = () => {
    const history = localStorage.getItem(GACHA_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
};

// ガチャ履歴に追加
export const addGachaHistory = (results) => {
    const history = getGachaHistory();
    const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        results: results,
        count: results.length
    };
    history.unshift(newEntry); // 最新が先頭

    // 最大100件まで保存
    if (history.length > 100) {
        history.pop();
    }

    localStorage.setItem(GACHA_HISTORY_KEY, JSON.stringify(history));
    return newEntry;
};

// 天井カウンターを取得
export const getCurrentPity = () => {
    const pity = localStorage.getItem(PITY_COUNTER_KEY);
    return pity ? parseInt(pity, 10) : 0;
};

// 天井カウンターを更新
export const updatePity = (count, hasSSR) => {
    let currentPity = getCurrentPity();

    if (hasSSR) {
        // SSRを引いたらリセット
        currentPity = 0;
    } else {
        // SSRを引かなかったら加算
        currentPity += count;
    }

    localStorage.setItem(PITY_COUNTER_KEY, currentPity.toString());
    return currentPity;
};

// レアリティ抽選（確率に基づく）
const rollRarity = (isPity = false) => {
    if (isPity) {
        return 'SSR'; // 天井到達時は確定SSR
    }

    const rand = Math.random() * 100;
    let cumulative = 0;

    // SSR -> SR -> R -> N+ -> N の順で判定
    for (const [rarityKey, rarityData] of Object.entries(RARITY).reverse()) {
        cumulative += rarityData.rate;
        if (rand < cumulative) {
            return rarityKey;
        }
    }

    return 'N'; // フォールバック
};

// アイテム抽選（レアリティ内からランダム）
const rollItem = (rarity) => {
    const pool = GACHA_POOL[rarity];

    // プールが空の場合、ダミーアイテムを返す
    if (!pool || pool.length === 0) {
        return {
            id: `dummy_${rarity}_${Date.now()}`,
            name: `${RARITY[rarity].label} アイテム`,
            rarity: rarity,
            type: 'dummy',
            emoji: '📦',
            description: '今後追加予定のアイテムです'
        };
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return { ...pool[randomIndex] };
};

// ガチャ実行（単発/10連）
export const performGacha = (count = 1) => {
    const results = [];
    let currentPity = getCurrentPity();
    let hasSSR = false;

    for (let i = 0; i < count; i++) {
        currentPity++;

        // 天井チェック
        const isPity = currentPity >= PITY_LIMIT;

        // レアリティ抽選
        const rarity = rollRarity(isPity);

        // SSRチェック
        if (rarity === 'SSR') {
            hasSSR = true;
        }

        // アイテム抽選
        const item = rollItem(rarity);

        results.push({
            ...item,
            isNew: true, // 新規入手かどうか（後で実装）
            isPity: isPity
        });

        // SSR引いたら天井リセット
        if (rarity === 'SSR') {
            currentPity = 0;
        }
    }

    // 10連の場合、最低1つSR以上保証
    if (count === 10) {
        const hasSROrAbove = results.some(r => ['SR', 'SSR'].includes(r.rarity));
        if (!hasSROrAbove) {
            // 最後の1つをSRに変更
            const srItem = rollItem('SR');
            results[results.length - 1] = {
                ...srItem,
                isNew: true,
                isPity: false
            };
        }
    }

    // 天井カウンター更新
    updatePity(0, hasSSR); // hasSSRでリセット判定
    localStorage.setItem(PITY_COUNTER_KEY, currentPity.toString());

    // 履歴に追加
    addGachaHistory(results);

    return results;
};

// 天井まであと何回か
export const getRemainingPity = () => {
    return PITY_LIMIT - getCurrentPity();
};

// ガチャに必要なダイヤ数
export const GACHA_COST = {
    SINGLE: 150,
    TEN: 1500
};
