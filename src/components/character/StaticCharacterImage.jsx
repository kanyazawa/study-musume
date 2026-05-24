import React, { useEffect, useState } from 'react';
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
import FireflyBase from '../../assets/images/firefly/firefly_base.webp';
import FireflyBlinkOverlay from '../../assets/images/firefly/firefly_overlay_blink.webp';
import FireflySmileOverlay from '../../assets/images/firefly/firefly_overlay_smile.webp';
import FireflySurprisedOverlay from '../../assets/images/firefly/firefly_overlay_surprised.webp';
import SparkleSelectImage from '../../assets/images/sparkle/sparkle_select.png';
import EmmaStanding from '../../assets/images/emma_home_preview_generated.png';
import EmmaStandingBlinkChroma from '../../assets/images/emma_home_preview_generated_blink_chroma.png';
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
    emma: {
        leftEyeX: '45.6%',
        rightEyeX: '54.4%',
        eyeY: '17%',
        eyeSize: '5.9%',
        leftCheekX: '42.8%',
        rightCheekX: '57.2%',
        cheekY: '21.4%',
        cheekSize: '4.8%',
        mouthY: '24.2%',
        mouthSize: '4.1%',
        effectOpacity: 0.9,
    },
};

const CHARACTER_IMAGE_SETS = {
    noah: {
        skinImages: {
            default: CharacterMain,
            skin_casual: CharacterCasual,
            skin_casual_fall: CharacterCasualFall,
            skin_gym: CharacterGym,
            skin_casual_gray_hoodie: CharacterCasualGray,
            skin_casual_hoodie: CharacterCasualBlack,
        },
        expressionImages: {
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
        },
        speakingExpressions: ['normal', 'happy', 'smile', 'surprised'],
        speakingSource: NoaTalk,
    },
    ren: {
        skinImages: {
            default: CharacterRen,
            skin_casual: CharacterRen,
            skin_casual_fall: CharacterRen,
        },
        expressionImages: {
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
        },
    },
    firefly: {
        skinImages: {
            default: FireflyBase,
        },
        expressionImages: {
            default: FireflyBase,
            main: FireflyBase,
            new: FireflyBase,
            tsundere: FireflyBase,
            user: FireflyBase,
            happy: FireflyBase,
            correct: FireflyBase,
            normal: FireflyBase,
            angry: FireflyBase,
            serious: FireflyBase,
            smile: FireflyBase,
            shy: FireflyBase,
            sad: FireflyBase,
            surprised: FireflyBase,
            relaxed: FireflyBase,
            blink: FireflyBase,
            talk: FireflyBase,
        },
        expressionOverlays: {
            happy: FireflySmileOverlay,
            correct: FireflySmileOverlay,
            smile: FireflySmileOverlay,
            shy: FireflyBlinkOverlay,
            relaxed: FireflyBlinkOverlay,
            blink: FireflyBlinkOverlay,
            surprised: FireflySurprisedOverlay,
        },
    },
    emma: {
        skinImages: {
            default: EmmaStanding,
        },
        expressionImages: {
            default: EmmaStanding,
            main: EmmaStanding,
            new: EmmaStanding,
            tsundere: EmmaStanding,
            user: EmmaStanding,
            happy: EmmaStanding,
            correct: EmmaStanding,
            normal: EmmaStanding,
            angry: EmmaStanding,
            serious: EmmaStanding,
            smile: EmmaStanding,
            shy: EmmaStanding,
            sad: EmmaStanding,
            surprised: EmmaStanding,
            relaxed: EmmaStanding,
            blink: EmmaStandingBlinkChroma,
            talk: EmmaStanding,
        },
    },
    sparkle: {
        skinImages: {
            default: SparkleSelectImage,
        },
        expressionImages: {
            default: SparkleSelectImage,
            main: SparkleSelectImage,
            new: SparkleSelectImage,
            tsundere: SparkleSelectImage,
            user: SparkleSelectImage,
            happy: SparkleSelectImage,
            correct: SparkleSelectImage,
            normal: SparkleSelectImage,
            angry: SparkleSelectImage,
            serious: SparkleSelectImage,
            smile: SparkleSelectImage,
            shy: SparkleSelectImage,
            sad: SparkleSelectImage,
            surprised: SparkleSelectImage,
            relaxed: SparkleSelectImage,
            blink: SparkleSelectImage,
            talk: SparkleSelectImage,
        },
    },
};

const BLINKABLE_EXPRESSIONS = new Set(['normal', 'happy', 'correct', 'smile', 'serious', 'sad', 'relaxed', 'shy']);
const EMMA_BLINK_CHROMA_KEY = {
    red: 255,
    green: 0,
    blue: 255,
    threshold: 34,
    softness: 40,
    despill: 0.18,
};
const CHROMA_KEYED_IMAGE_CACHE = new Map();
const CHROMA_KEYED_IMAGE_PENDING = new Map();

const getChromaKeyCacheKey = (src, chromaKey = {}) => (
    JSON.stringify({
        src,
        red: chromaKey.red ?? 0,
        green: chromaKey.green ?? 255,
        blue: chromaKey.blue ?? 0,
        threshold: chromaKey.threshold ?? 58,
        softness: chromaKey.softness ?? 42,
        despill: chromaKey.despill ?? 0.72,
    })
);
const getPoseExpressionKey = (pose = {}) => pose.expression || pose.emotion || 'normal';
const resolveCharacterImages = (characterId) => CHARACTER_IMAGE_SETS[characterId] || CHARACTER_IMAGE_SETS.noah;

const resolveImage = (characterId, skinId, pose = {}) => {
    const characterImages = resolveCharacterImages(characterId);
    const skinImages = characterImages.skinImages || CHARACTER_IMAGE_SETS.noah.skinImages;
    const expressionImages = characterImages.expressionImages || CHARACTER_IMAGE_SETS.noah.expressionImages;
    const expressionKey = getPoseExpressionKey(pose);
    const isSpeaking = Boolean(pose?.speaking);
    const hasSpeakingVariant = isSpeaking
        && characterImages.speakingSource
        && Array.isArray(characterImages.speakingExpressions)
        && characterImages.speakingExpressions.includes(expressionKey);
    const source = hasSpeakingVariant
        ? characterImages.speakingSource
        : expressionImages[expressionKey] || skinImages[skinId] || skinImages.default;
    const skinFallback = skinImages[skinId] || skinImages.default;
    const overlaySource = characterImages.expressionOverlays?.[expressionKey] || null;

    return {
        source,
        overlaySource,
        expressionKey,
        usesExpressionVariant: source !== skinFallback,
        hasBlinkVariant: Boolean(expressionImages.blink),
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

const buildChromaKeyedImageDataUrl = (src, chromaKey) => {
    const cacheKey = getChromaKeyCacheKey(src, chromaKey);
    if (CHROMA_KEYED_IMAGE_CACHE.has(cacheKey)) {
        return Promise.resolve(CHROMA_KEYED_IMAGE_CACHE.get(cacheKey));
    }

    if (CHROMA_KEYED_IMAGE_PENDING.has(cacheKey)) {
        return CHROMA_KEYED_IMAGE_PENDING.get(cacheKey);
    }

    const pending = new Promise((resolve, reject) => {
        const image = new window.Image();
        image.decoding = 'async';
        image.onload = () => {
            const bufferCanvas = document.createElement('canvas');
            const ok = drawChromaKeyedImage(bufferCanvas, image, chromaKey);
            if (!ok) {
                reject(new Error('Failed to draw chroma keyed image.'));
                return;
            }

            const dataUrl = bufferCanvas.toDataURL('image/png');
            CHROMA_KEYED_IMAGE_CACHE.set(cacheKey, dataUrl);
            resolve(dataUrl);
        };
        image.onerror = () => {
            reject(new Error(`Failed to load image: ${src}`));
        };
        image.src = src;
    }).finally(() => {
        CHROMA_KEYED_IMAGE_PENDING.delete(cacheKey);
    });

    CHROMA_KEYED_IMAGE_PENDING.set(cacheKey, pending);
    return pending;
};

const ChromaKeyedImage = ({ src, alt, chromaKey }) => {
    const [failed, setFailed] = useState(false);
    const [processedSrc, setProcessedSrc] = useState('');

    useEffect(() => {
        let cancelled = false;
        const cacheKey = getChromaKeyCacheKey(src, chromaKey);
        setFailed(false);
        if (CHROMA_KEYED_IMAGE_CACHE.has(cacheKey)) {
            setProcessedSrc(CHROMA_KEYED_IMAGE_CACHE.get(cacheKey) || '');
            return undefined;
        }

        setProcessedSrc('');

        buildChromaKeyedImageDataUrl(src, chromaKey)
            .then((nextProcessedSrc) => {
                if (!cancelled) {
                    setProcessedSrc(nextProcessedSrc);
                    setFailed(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setProcessedSrc('');
                    setFailed(true);
                }
            });

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

    if (!processedSrc) {
        return (
            <span
                className="character-static-base-image"
                aria-hidden="true"
            />
        );
    }

    return (
        <img
            src={processedSrc}
            alt={alt}
            className="character-static-base-image"
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
    const [isBlinking, setIsBlinking] = useState(false);
    const baseExpressionKey = getPoseExpressionKey(pose);
    const characterImages = resolveCharacterImages(characterId);
    const expressionImages = characterImages.expressionImages || {};
    const canAutoBlink = Boolean(
        pose?.autoBlink !== false
        && expressionImages.blink
        && !pose?.speaking
        && BLINKABLE_EXPRESSIONS.has(baseExpressionKey)
    );
    const animatedPose = isBlinking ? { ...pose, expression: 'blink' } : pose;
    const { source, overlaySource, usesExpressionVariant, expressionKey } = resolveImage(characterId, skinId, animatedPose);
    const filter = getSkinFilter(skinId);
    const shouldKeepSkinFilter = !usesExpressionVariant;
    const resolvedSource = usesExpressionVariant ? source : (sourceOverride || source);
    const faceEffectConfig = disableFaceEffects ? null : FACE_EFFECT_CONFIG[characterId];
    const isCompactScene = pose?.scene === 'missions';
    const faceEffectMode = faceEffectConfig && !isCompactScene ? resolveFaceEffectMode(expressionKey) : '';
    const idleMotionClass = pose?.idleMotion ? `idle-motion-${pose.idleMotion}` : '';
    const resolvedChromaKey = chromaKey || (
        characterId === 'emma' && expressionKey === 'blink'
            ? EMMA_BLINK_CHROMA_KEY
            : null
    );

    useEffect(() => {
        if (characterId !== 'emma' || !expressionImages.blink || pose?.autoBlink === false) {
            return undefined;
        }

        buildChromaKeyedImageDataUrl(expressionImages.blink, EMMA_BLINK_CHROMA_KEY).catch(() => {});
        return undefined;
    }, [characterId, expressionImages.blink, pose?.autoBlink]);

    useEffect(() => {
        if (!canAutoBlink) {
            setIsBlinking(false);
            return undefined;
        }

        let cancelled = false;
        let blinkStartTimer = 0;
        let blinkEndTimer = 0;

        const queueBlink = () => {
            const nextDelayMs = 1600 + Math.random() * 2400;
            blinkStartTimer = window.setTimeout(() => {
                if (cancelled) {
                    return;
                }

                setIsBlinking(true);
                blinkEndTimer = window.setTimeout(() => {
                    if (cancelled) {
                        return;
                    }

                    setIsBlinking(false);
                    queueBlink();
                }, 108);
            }, nextDelayMs);
        };

        queueBlink();

        return () => {
            cancelled = true;
            window.clearTimeout(blinkStartTimer);
            window.clearTimeout(blinkEndTimer);
        };
    }, [baseExpressionKey, canAutoBlink, characterId, skinId]);

    return (
        <div className={['character-static-stage', className].filter(Boolean).join(' ')} style={style}>
            <div className={['character-static-motion-shell', idleMotionClass].filter(Boolean).join(' ')}>
                {resolvedChromaKey ? (
                    <ChromaKeyedImage
                        src={resolvedSource}
                        alt={alt}
                        chromaKey={resolvedChromaKey}
                    />
                ) : (
                    <img
                        src={resolvedSource}
                        alt={alt}
                        className="character-static-base-image"
                        style={shouldKeepSkinFilter ? { filter } : undefined}
                    />
                )}
                {overlaySource && (
                    <img
                        src={overlaySource}
                        alt=""
                        aria-hidden="true"
                        className="character-static-expression-overlay"
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
        </div>
    );
};

export default StaticCharacterImage;
