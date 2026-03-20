const SUPPORTED_EMOTIONS = new Set([
    'normal',
    'happy',
    'smile',
    'serious',
    'angry',
    'sad',
    'surprised',
    'relaxed',
    'shy',
    'main',
    'new',
    'tsundere',
    'user',
]);

export const normalizeCharacterEmotion = (value, fallback = 'normal') => {
    if (!value) return fallback;

    const normalized = String(value).trim().toLowerCase();
    if (SUPPORTED_EMOTIONS.has(normalized)) {
        return normalized;
    }

    return fallback;
};

export const createDialoguePose = (line, { speaking = false, text } = {}) => {
    const expression = normalizeCharacterEmotion(line?.expression || line?.emotion);
    const isStrongEmotion = ['happy', 'smile', 'angry', 'surprised'].includes(expression);

    return {
        emotion: expression,
        expression,
        intensity: isStrongEmotion ? 0.75 : 0.45,
        motion: speaking ? 'talk' : null,
        idle: speaking ? 'talking' : 'gentle',
        gaze: 'camera',
        speaking,
        text: text ?? line?.text ?? '',
        effect: line?.effect ?? '',
    };
};

export const createHomePose = (reaction, { speaking = false } = {}) => {
    const emotion = normalizeCharacterEmotion(reaction?.emotion);

    return {
        emotion,
        expression: emotion,
        intensity: emotion === 'normal' ? 0.35 : 0.65,
        motion: speaking ? 'talk_soft' : 'idle_home',
        idle: 'gentle',
        gaze: 'camera',
        speaking,
        text: reaction?.text ?? '',
        effect: '',
    };
};

export const createGiftPose = (reaction) => {
    const emotion = normalizeCharacterEmotion(reaction?.emotion);

    return {
        emotion,
        expression: emotion,
        intensity: emotion === 'happy' || emotion === 'smile' ? 0.9 : 0.55,
        motion: emotion === 'happy' || emotion === 'smile' ? 'present_happy' : 'present_accept',
        idle: 'gentle',
        gaze: 'camera',
        speaking: false,
        text: reaction?.text ?? '',
        effect: '',
    };
};

export const createStoryPose = (scene, { speaking = false } = {}) => {
    const emotion = normalizeCharacterEmotion(scene?.emotion || scene?.expression || 'normal');

    return {
        emotion,
        expression: emotion,
        intensity: speaking ? 0.55 : 0.35,
        motion: speaking ? 'talk_soft' : null,
        idle: 'gentle',
        gaze: 'camera',
        speaking,
        text: scene?.text ?? '',
        effect: '',
    };
};
