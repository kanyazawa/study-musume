import React, { useEffect, useRef, useState } from 'react';
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
    correct: NoaHappy,
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
    correct: RenHappy,
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
        case 'correct':
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

const drawChromaKeyedImage = (canvas, image, chromaKey) => {
    if (!canvas || !image) {
        return false;
    }

    const {
        red = 0,
        green = 255,
        blue = 0,
        threshold = 58,
        softness = 42,
        despill = 0.72,
    } = chromaKey || {};

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
        return false;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        return false;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const frame = ctx.getImageData(0, 0, width, height);
    const pixels = frame.data;

    for (let index = 0; index < pixels.length; index += 4) {
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const a = pixels[index + 3];

        if (a === 0) {
            continue;
        }

        const colorDistance = Math.sqrt(
            ((r - red) ** 2) +
            ((g - green) ** 2) +
            ((b - blue) ** 2)
        );
        const blendWindow = Math.max(softness, 1);

        if (colorDistance <= threshold) {
            pixels[index + 3] = 0;
            continue;
        }

        if (colorDistance <= threshold + blendWindow) {
            const keepRatio = (colorDistance - threshold) / blendWindow;
            pixels[index + 3] = Math.max(0, Math.min(255, Math.round(a * keepRatio)));
        }

        const otherMax = Math.max(r, b);
        const greenCast = g - otherMax;
        if (greenCast > 0) {
            pixels[index + 1] = Math.max(
                otherMax,
                Math.round(g - (greenCast * despill))
            );
        }
    }

    ctx.putImageData(frame, 0, 0);
    return true;
};

const ChromaKeyedImage = ({ src, alt, chromaKey }) => {
    const canvasRef = useRef(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const image = new window.Image();
        image.decoding = 'async';
        image.onload = () => {
            if (cancelled) {
                return;
            }

            const ok = drawChromaKeyedImage(canvasRef.current, image, chromaKey);
            setFailed(!ok);
        };
        image.onerror = () => {
            if (!cancelled) {
                setFailed(true);
            }
        };
        image.src = src;

        return () => {
            cancelled = true;
        };
    }, [chromaKey, src]);

    if (failed) {
        return (
            <img
                src={src}
                alt={alt}
                className="character-static-base-image"
            />
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className="character-static-base-image"
            role="img"
            aria-label={alt}
        />
    );
};

const FaceEffectLayer = ({
    mode = '',
    characterId = 'noah',
    expressionKey = 'normal',
    isSpeaking = false,
}) => {
    if (!mode && !isSpeaking) {
        return null;
    }

    return (
        <div
            className={[
                'character-face-fx',
                mode ? `mode-${mode}` : '',
                isSpeaking ? 'is-speaking' : '',
                `character-${characterId}`,
                `expression-${expressionKey}`,
            ].filter(Boolean).join(' ')}
            aria-hidden="true"
        >
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
            <span className="character-smile-cheek left" />
            <span className="character-smile-cheek right" />
            <span className="character-smile-mouth" />
            <span className="character-talk-mouth" />
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
    sourceOverride,
    disableFaceEffects = false,
    chromaKey,
}) => {
    const { source, usesExpressionVariant, expressionKey } = resolveImage(characterId, skinId, pose);
    const filter = getSkinFilter(skinId);
    const shouldKeepSkinFilter = !usesExpressionVariant;
    const resolvedSource = sourceOverride || source;
    const faceEffectConfig = disableFaceEffects ? null : FACE_EFFECT_CONFIG[characterId];
    const isCompactScene = pose?.scene === 'missions';
    const faceEffectMode = faceEffectConfig && !isCompactScene ? resolveFaceEffectMode(expressionKey) : '';

    return (
        <div className={['character-static-stage', className].filter(Boolean).join(' ')} style={style}>
            {chromaKey ? (
                <ChromaKeyedImage
                    src={resolvedSource}
                    alt={alt}
                    chromaKey={chromaKey}
                />
            ) : (
                <img
                    src={resolvedSource}
                    alt={alt}
                    className="character-static-base-image"
                    style={shouldKeepSkinFilter ? { filter } : undefined}
                />
            )}
            {faceEffectConfig && (
                <div className="character-face-fx-layer" style={buildFaceEffectStyle(faceEffectConfig)}>
                    <FaceEffectLayer
                        mode={faceEffectMode}
                        characterId={characterId}
                        expressionKey={expressionKey}
                        isSpeaking={Boolean(pose?.speaking)}
                    />
                </div>
            )}
        </div>
    );
};

export default StaticCharacterImage;
