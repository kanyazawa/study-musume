import NoahSelectImage from '../assets/images/noah_normal.webp';
import EmmaSelectImage from '../assets/images/emma_home_preview_generated.png';
import RenSelectImage from '../assets/images/character_ren.webp';
import FireflySelectImage from '../assets/images/firefly/firefly_select.webp';
import SparkleSelectImage from '../assets/images/sparkle/sparkle_select.png';

export const CHARACTER_LABELS = {
    emma: '高瀬エマ',
    noah: 'ノア',
    ren: 'レン',
    firefly: 'ホタル',
    sparkle: '花火',
};

export const CHARACTER_SELECT_OPTIONS = [
    {
        id: 'emma',
        name: CHARACTER_LABELS.emma,
        image: EmmaSelectImage,
        description: '放課後に英語を見てくれる学習パートナー。\nまずは静止画ベースのMVP表示で使えます。',
    },
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
    {
        id: 'firefly',
        name: CHARACTER_LABELS.firefly,
        image: FireflySelectImage,
        description: '新しい相棒の試作キャラ。\nまずは静止画の表情差分つきで使えます。',
    },
    {
        id: 'sparkle',
        name: CHARACTER_LABELS.sparkle,
        image: SparkleSelectImage,
        description: 'いたずらっぽくて底知れない新キャラ。\nまずは Live2D 試作モデルつきで使えます。',
    },
];

export const getCharacterLabel = (characterId = 'noah') =>
    CHARACTER_LABELS[characterId] || CHARACTER_LABELS.noah;
