import React from 'react';
import './StaticCharacterImage.css';
import CharacterMain from '../../assets/images/character_new.webp';
import CharacterUser from '../../assets/images/character_user.webp';
import CharacterRen from '../../assets/images/character_ren.webp';
import CharacterCasual from '../../assets/images/character_casual_v9.webp';
import CharacterCasualFall from '../../assets/images/noa_casual_fall.webp';
import CharacterGym from '../../assets/images/character_gym.webp';
import CharacterCasualGray from '../../assets/images/character_casual_gray_hoodie.webp';
import CharacterCasualBlack from '../../assets/images/character_casual_hoodie.webp';
import NoaBlink from '../../assets/images/noah_blink.webp';
import NoaHappy from '../../assets/images/noah_happy.webp';
import NoaNormal from '../../assets/images/noah_normal.webp';
import NoaAngry from '../../assets/images/noah_angry.webp';
import NoaTalk from '../../assets/images/noah_talk.webp';
import RenNormal from '../../assets/images/ren_normal.webp';
import RenAngry from '../../assets/images/ren_angry.webp';
import RenHappy from '../../assets/images/ren_happy.webp';
import RenSerious from '../../assets/images/ren_serious.webp';
import { getSkinFilter } from '../../utils/cosmeticUtils';

const FACE_EFFECT_CONFIG = {
    noah: {
        leftEyeX: '45.2%',
        rightEyeX: '54.8%',
        eyeY: '16.7%',
        eyeSize: '6.4%',
        leftCheekX: '42.1%',
        rightCheekX: '57.9%',
        cheekY: '21.4%',
        cheekSize: '5.4%',
        mouthY: '24.8%',
        mouthSize: '4.8%',
        effectOpacity: 1,
    },
    ren: {
        leftEyeX: '45.5%',
        rightEyeX: '54.5%',
        eyeY: '16.1%',
        eyeSize: '5.8%',
        leftCheekX: '42.8%',
        rightCheekX: '57.2%',
        cheekY: '20.8%',
        cheekSize: '4.8%',
        mouthY: '24.1%',
        mouthSize: '4.2%',
        effectOpacity: 0.9,
    },
};

const NOAH_SKIN_IMAGES = {
    default: CharacterMain,
    skin_casual: CharacterCasual,
    skin_casual_fall: CharacterCasualFall,
    skin_gym: CharacterGym,
    skin_casual_gray_hoodie: CharacterCasualGray,
    skin_casual_hoodie: CharacterCasualBlack,
};

const REN_SKIN_IMAGES = {
    default: CharacterRen,
    skin_casual: CharacterRen,
    skin_casual_fall: CharacterRen,
};

const NOAH_EXPRESSION_IMAGES = {
    default: NoaNormal,
    main: NoaNormal,
    new: CharacterMain,
    tsundere: NoaNormal,
    user: CharacterUser,
    happy: NoaHappy,
    normal: NoaNormal,
    angry: NoaAngry,
    serious: NoaAngry,
    smile: NoaHappy,
    shy: NoaBlink,
    sad: NoaNormal,
    surprised: NoaTalk,
    relaxed: NoaBlink,
};

const REN_EXPRESSION_IMAGES = {
    default: RenNormal,
    main: RenNormal,
    new: RenNormal,
    happy: RenHappy,
    normal: RenNormal,
    angry: RenAngry,
    serious: RenSerious,
    smile: RenHappy,
    shy: RenHappy,
    sad: RenNormal,
    surprised: RenHappy,
    relaxed: RenNormal,
};

const resolveImage = (characterId, skinId, pose = {}) => {
    const isRen = characterId === 'ren';
    const skinImages = isRen ? REN_SKIN_IMAGES : NOAH_SKIN_IMAGES;
    const expressionImages = isRen ? REN_EXPRESSION_IMAGES : NOAH_EXPRESSION_IMAGES;
    const expressionKey = pose.expression || pose.emotion || 'normal';
    const isSpeaking = Boolean(pose?.speaking);
    const hasNoahTalkVariant = !isRen && isSpeaking && ['normal', 'happy', 'smile', 'surprised'].includes(expressionKey);
    const source = hasNoahTalkVariant
        ? NoaTalk
        : expressionImages[expressionKey] || skinImages[skinId] || skinImages.default;
    const skinFallback = skinImages[skinId] || skinImages.default;

    return {
        source,
        expressionKey,
        usesExpressionVariant: source !== skinFallback,
    };
};

const resolveFaceEffectMode = (expressionKey) => {
    switch (expressionKey) {
        case 'happy':
        case 'smile':
            return 'sparkle';
        case 'surprised':
            return 'starburst';
        case 'shy':
        case 'relaxed':
            return 'dreamy';
        case 'angry':
            return 'pout';
        case 'serious':
            return 'focus';
        default:
            return '';
    }
};

const buildFaceEffectStyle = (config = {}) => ({
    '--fx-left-eye-x': config.leftEyeX,
    '--fx-right-eye-x': config.rightEyeX,
    '--fx-eye-y': config.eyeY,
    '--fx-eye-size': config.eyeSize,
    '--fx-left-cheek-x': config.leftCheekX,
    '--fx-right-cheek-x': config.rightCheekX,
    '--fx-cheek-y': config.cheekY,
    '--fx-cheek-size': config.cheekSize,
    '--fx-mouth-y': config.mouthY,
    '--fx-mouth-size': config.mouthSize,
    '--fx-opacity': String(config.effectOpacity ?? 1),
});

const FaceEffectLayer = ({ mode = '', characterId = 'noah' }) => {
    if (!mode) {
        return null;
    }

    return (
        <div className={`character-face-fx mode-${mode} character-${characterId}`} aria-hidden="true">
            <span className="character-eye-fx left">
                <span className="character-eye-aura" />
                <span className="character-eye-iris" />
                <span className="character-eye-star" />
                <span className="character-eye-highlight" />
            </span>
            <span className="character-eye-fx right">
                <span className="character-eye-aura" />
                <span className="character-eye-iris" />
                <span className="character-eye-star" />
                <span className="character-eye-highlight" />
            </span>
            <span className="character-angry-brow left" />
            <span className="character-angry-brow right" />
            <span className="character-cheek-puff left" />
            <span className="character-cheek-puff right" />
            <span className="character-pout-mouth" />
            <span className="character-forehead-mark" />
        </div>
    );
};

const StaticCharacterImage = ({
    characterId = 'noah',
    skinId = 'default',
    pose = {},
    alt = 'Character',
    className = '',
    style,
}) => {
    const { source, usesExpressionVariant, expressionKey } = resolveImage(characterId, skinId, pose);
    const filter = getSkinFilter(skinId);
    const shouldKeepSkinFilter = !usesExpressionVariant;
    const faceEffectConfig = FACE_EFFECT_CONFIG[characterId];
    const faceEffectMode = faceEffectConfig ? resolveFaceEffectMode(expressionKey) : '';

    return (
        <div className={['character-static-stage', className].filter(Boolean).join(' ')} style={style}>
            <img
                src={source}
                alt={alt}
                className="character-static-base-image"
                style={shouldKeepSkinFilter ? { filter } : undefined}
            />
            {faceEffectConfig && (
                <div className="character-face-fx-layer" style={buildFaceEffectStyle(faceEffectConfig)}>
                    <FaceEffectLayer mode={faceEffectMode} characterId={characterId} />
                </div>
            )}
        </div>
    );
};

export default StaticCharacterImage;
