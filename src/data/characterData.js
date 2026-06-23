import NoahSelectImage from '../assets/images/noah_normal.webp';
import RenSelectImage from '../assets/images/character_ren.webp';

export const CHARACTER_LABELS = {
    noah: 'ノア',
    ren: 'レン',
    firefly: 'ホタル',
    sparkle: '花火',
};

export const CHARACTER_SELECT_OPTIONS = [
    {
        id: 'noah',
        name: CHARACTER_LABELS.noah,
        image: NoahSelectImage,
        description: '勉強熱心で少しツンデレな女の子。\nいちばん軽い標準表示で使えます。',
    },
    {
        id: 'ren',
        name: CHARACTER_LABELS.ren,
        image: RenSelectImage,
        description: 'クールで知的な男の子。\n冷静に学習のアドバイスをくれます。',
    },
];

export const getCharacterLabel = (characterId = 'noah') =>
    CHARACTER_LABELS[characterId] || CHARACTER_LABELS.noah;
