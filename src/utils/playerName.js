export const DEFAULT_PLAYER_NAME = 'トレーナー';

const DIRECT_ADDRESS_TOKENS = ['あなた', '君', 'きみ', 'あんた', 'アンタ', 'お前'];

const normalizeName = (value) => String(value || '').trim();

export const isDefaultPlayerName = (value) => normalizeName(value) === DEFAULT_PLAYER_NAME;

export const getPlayerName = (stats, fallback = DEFAULT_PLAYER_NAME) => {
    const rawName = typeof stats === 'string' ? stats : stats?.name;
    const normalizedName = normalizeName(rawName);
    return normalizedName || fallback;
};

export const getPlayerAddress = (stats, fallback = 'あなた') => {
    const playerName = getPlayerName(stats, '');
    return playerName && !isDefaultPlayerName(playerName) ? playerName : fallback;
};

export const personalizePlayerText = (text, stats, { fallback = 'あなた', tokens = DIRECT_ADDRESS_TOKENS } = {}) => {
    const sourceText = String(text || '');
    if (!sourceText) {
        return sourceText;
    }

    const playerAddress = getPlayerAddress(stats, fallback);
    return tokens.reduce((currentText, token) => currentText.split(token).join(playerAddress), sourceText);
};
