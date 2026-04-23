import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CharacterStage from '../components/character/CharacterStage';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { getLive2DModelConfig, hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { normalizeCharacterEmotion } from '../utils/characterPoseUtils';
import { resolveLive2DExpressionState } from '../utils/live2dExpressionResolver';
import {
    HOME_EXPRESSION_LAYER,
    createHomeExpressionLayer,
    resolveHomeExpressionLayers,
} from '../utils/homeExpressionLayers';
import './ExpressionPreview.css';

const EMOTION_PRESETS = [
    { id: 'normal', label: '通常 emotion' },
    { id: 'correct', label: 'correct emotion' },
    { id: 'happy', label: 'happy emotion' },
    { id: 'serious', label: 'serious emotion' },
    { id: 'angry', label: 'angry emotion' },
    { id: 'shy', label: 'shy emotion' },
    { id: 'surprised', label: 'surprised emotion' },
];

const EXPRESSION_PRESETS = [
    { id: 'normal', label: '通常 expression' },
    { id: 'correct', label: 'correct expression' },
    { id: 'happy', label: 'happy expression' },
    { id: 'smile', label: 'smile expression' },
    { id: 'serious', label: 'serious expression' },
    { id: 'angry', label: 'angry expression' },
    { id: 'sad', label: 'sad expression' },
    { id: 'relaxed', label: 'relaxed expression' },
    { id: 'shy', label: 'shy expression' },
    { id: 'surprised', label: 'surprised expression' },
];

const DIRECT_EXPRESSIONS = [
    { id: '', label: 'emotion任せ' },
    { id: 'none', label: 'expなし' },
    { id: 'sq', label: 'sq' },
    { id: 'zs1', label: 'zs1' },
    { id: 'zs2', label: 'zs2' },
    { id: 'xx', label: 'xx' },
    { id: 'h', label: 'h' },
    { id: 'yj', label: 'yj' },
    { id: 'ku', label: 'ku' },
    { id: 'x', label: 'x' },
    { id: 'fz', label: 'fz' },
    { id: 'mz', label: 'mz' },
    { id: 'cw', label: 'cw' },
    { id: 'hdj', label: 'hdj' },
];

const PREVIEW_MODES = [
    { id: 'expression-only', label: 'exp3だけ' },
    { id: 'composite', label: '本番どおり' },
    { id: 'home-layer', label: 'Home合成' },
];

const FRAMING_MODES = [
    { id: 'face-close', label: '顔寄り確認' },
    { id: 'full-body', label: '全身確認' },
];

const FACE_ACCENTS = [
    { id: '', label: 'accentなし' },
    { id: 'heart', label: 'heart eyes' },
    { id: 'star', label: 'star eyes' },
    { id: 'blush', label: 'blush overlay' },
    { id: 'shy', label: 'shy overlay' },
];

const HOME_LAYER_SCENARIOS = [
    { id: 'base', label: 'baseのみ' },
    { id: 'reaction', label: 'reaction' },
    { id: 'user-input', label: 'user input' },
    { id: 'impact', label: 'impact' },
    { id: 'stacked', label: '全部重ねる' },
];

const PARAMETER_DEBUG_KEYS = [
    'eyeSmile',
    'eyeSquint',
    'eyeOpen',
    'browY',
    'browForm',
    'angry',
    'mouthOpen',
    'mouthWiden',
    'jawOpen',
    'angleX',
    'angleY',
    'angleZ',
];

const ANIMATION_DEBUG_KEYS = [
    'mouthScale',
    'mouthLimit',
    'mouthFormBase',
    'blinkIntervalScale',
    'doubleBlinkChance',
];

const formatDebugValue = (value) => {
    if (typeof value === 'number') {
        return Number.isInteger(value) ? String(value) : value.toFixed(3);
    }

    if (value === '' || value === null || typeof value === 'undefined') {
        return 'none';
    }

    return String(value);
};

const pickDebugValues = (source, keys) =>
    keys.map((key) => [key, formatDebugValue(source?.[key])]);

const ExpressionPreview = ({ stats }) => {
    const characterId = stats?.characterId || 'noah';
    const skinId = stats?.equippedSkin || 'default';
    const preferredRenderer = stats?.characterRenderer;
    const hasLive2D = hasLive2DModelConfig(characterId, skinId);
    const modelConfig = getLive2DModelConfig(characterId, skinId);
    const renderer = resolveCharacterRenderer({
        preferredRenderer: hasLive2D ? 'live2d' : preferredRenderer,
        characterId,
        skinId,
    });

    const [emotion, setEmotion] = useState('normal');
    const [expression, setExpression] = useState('normal');
    const [live2dExpression, setLive2dExpression] = useState('');
    const [previewMode, setPreviewMode] = useState('expression-only');
    const [framingMode, setFramingMode] = useState('face-close');
    const [live2dFaceAccent, setLive2dFaceAccent] = useState('');
    const [homeLayerScenario, setHomeLayerScenario] = useState('base');
    const mappedExpression = useMemo(() => {
        const emotionKey = String(emotion || '').trim().toLowerCase();
        return modelConfig?.expressionMap?.[emotionKey] || '';
    }, [emotion, modelConfig]);
    const sceneKey = framingMode === 'face-close' ? 'preview-close' : 'preview';
    const homeDebugLayers = useMemo(() => {
        const layers = [];

        if (homeLayerScenario === 'reaction' || homeLayerScenario === 'stacked') {
            layers.push(createHomeExpressionLayer(HOME_EXPRESSION_LAYER.REACTION, {
                emotion,
                pose: {
                    emotion,
                    live2dExpression,
                    live2dFaceAccent,
                },
            }));
        }

        if (homeLayerScenario === 'user-input' || homeLayerScenario === 'stacked') {
            layers.push(createHomeExpressionLayer(HOME_EXPRESSION_LAYER.USER_INPUT, {
                emotion: expression,
            }));
        }

        if (homeLayerScenario === 'impact' || homeLayerScenario === 'stacked') {
            layers.push(createHomeExpressionLayer(HOME_EXPRESSION_LAYER.IMPACT, {
                pose: {
                    live2dImpactMotion: 'chest-flinch',
                    live2dImpactStartedAt: performance.now(),
                    live2dImpactDurationMs: 1200,
                    live2dImpactVariant: {
                        side: 1,
                        intensity: 1,
                        lift: 1,
                        twist: 1,
                        settle: 1,
                    },
                },
            }));
        }

        return layers;
    }, [emotion, expression, homeLayerScenario, live2dExpression, live2dFaceAccent]);
    const homeExpressionState = useMemo(() => resolveHomeExpressionLayers({
        baseEmotion: emotion,
        speech: `emotion=${emotion} / expression=${expression} / exp=${live2dExpression || 'auto'}`,
        tp: 100,
        maxTp: 100,
        affectionLevel: 4,
        layers: homeDebugLayers,
    }), [emotion, expression, homeDebugLayers, live2dExpression]);

    const previewPose = useMemo(() => {
        const homeLayerPose = previewMode === 'home-layer'
            ? homeExpressionState.pose
            : {};

        return {
            emotion,
            expression,
            ...homeLayerPose,
            intensity: emotion === 'normal' ? 0.4 : 0.72,
            motion: null,
            idle: 'gentle',
            gaze: 'camera',
            scene: sceneKey,
            speaking: false,
            text: `emotion=${emotion} / expression=${expression} / exp=${live2dExpression || 'auto'}`,
            live2dExpression: previewMode === 'home-layer'
                ? homeLayerPose.live2dExpression || live2dExpression
                : live2dExpression,
            live2dFaceAccent: previewMode === 'home-layer'
                ? homeLayerPose.live2dFaceAccent || live2dFaceAccent
                : live2dFaceAccent,
            disableLive2DEmotionAdjustments: previewMode === 'expression-only',
            effect: '',
        };
    }, [emotion, expression, homeExpressionState.pose, live2dExpression, live2dFaceAccent, previewMode, sceneKey]);
    const live2dDebugState = useMemo(
        () => resolveLive2DExpressionState(previewPose, modelConfig),
        [modelConfig, previewPose],
    );
    const resolvedExpression = live2dDebugState.expression || 'none';
    const parameterDebugValues = useMemo(
        () => pickDebugValues(live2dDebugState.parameterProfile, PARAMETER_DEBUG_KEYS),
        [live2dDebugState.parameterProfile],
    );
    const animationDebugValues = useMemo(
        () => pickDebugValues(live2dDebugState.animationProfile, ANIMATION_DEBUG_KEYS),
        [live2dDebugState.animationProfile],
    );
    const homeLayerDebugValues = useMemo(() => [
        ['scenario', homeLayerScenario],
        ['emotion', homeExpressionState.emotion],
        ['source', homeExpressionState.emotionSource],
        ['layers', homeExpressionState.activeLayers.map((layer) => layer.type).join(' -> ')],
        ['pose emotion', homeExpressionState.pose.emotion],
        ['pose accent', homeExpressionState.pose.live2dFaceAccent],
        ['pose exp3', homeExpressionState.pose.live2dExpression],
        ['impact', homeExpressionState.pose.live2dImpactMotion],
    ].map(([key, value]) => [key, formatDebugValue(value)]), [homeExpressionState, homeLayerScenario]);

    return (
        <div className="expression-preview-page">
            <header className="expression-preview-header">
                <div>
                    <p className="expression-preview-eyebrow">Live2D Expression Preview</p>
                    <h1>{characterId} の表情確認</h1>
                    <p className="expression-preview-copy">
                        `emotion`、立ち絵の `expression`、Live2D の `exp3` を個別に切り替えて見比べられます。
                    </p>
                </div>
                <Link className="expression-preview-back" to="/home">ホームへ戻る</Link>
            </header>

            <section className="expression-preview-stage">
                <div className={`expression-preview-character is-${framingMode}`}>
                    <CharacterStage
                        characterId={characterId}
                        renderer={renderer}
                        skinId={skinId}
                        scene={sceneKey}
                        pose={previewPose}
                        className={`expression-preview-figure is-${framingMode}`}
                        imageClassName="expression-preview-image"
                    />
                </div>
                <div className="expression-preview-readout">
                    <span>renderer: {renderer}</span>
                    <span>mode: {previewMode}</span>
                    <span>framing: {framingMode}</span>
                    <span>emotion: {emotion}</span>
                    <span>expression: {expression}</span>
                    <span>live2dExpression: {live2dExpression || 'auto'}</span>
                    <span>faceAccent: {live2dFaceAccent || 'none'}</span>
                    <span>mapped exp3: {mappedExpression || 'none'}</span>
                    <span>resolved exp3: {resolvedExpression}</span>
                    <span>resolver emotion: {live2dDebugState.emotion}</span>
                    <span>home source: {homeExpressionState.emotionSource}</span>
                </div>
            </section>

            <section className="expression-preview-debug">
                <div className="expression-preview-debug-card">
                    <h2>Live2D resolver</h2>
                    <div className="expression-preview-debug-grid">
                        <span>emotion</span><strong>{live2dDebugState.emotion}</strong>
                        <span>expressionId</span><strong>{resolvedExpression}</strong>
                        <span>faceAccent</span><strong>{live2dDebugState.faceAccent || 'none'}</strong>
                        <span>adjustments</span><strong>{previewPose.disableLive2DEmotionAdjustments ? 'off' : 'on'}</strong>
                    </div>
                </div>
                <div className="expression-preview-debug-card">
                    <h2>Home layer</h2>
                    <div className="expression-preview-debug-grid">
                        {homeLayerDebugValues.map(([key, value]) => (
                            <React.Fragment key={key}>
                                <span>{key}</span>
                                <strong>{value}</strong>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="expression-preview-debug-card is-wide">
                    <h2>parameterProfile</h2>
                    <div className="expression-preview-meter-grid">
                        {parameterDebugValues.map(([key, value]) => (
                            <span key={key}>{key}: <strong>{value}</strong></span>
                        ))}
                    </div>
                </div>
                <div className="expression-preview-debug-card is-wide">
                    <h2>animationProfile</h2>
                    <div className="expression-preview-meter-grid">
                        {animationDebugValues.map(([key, value]) => (
                            <span key={key}>{key}: <strong>{value}</strong></span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="expression-preview-panel">
                <h2>構図</h2>
                <div className="expression-preview-grid">
                    {FRAMING_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            className={mode.id === framingMode ? 'is-active' : ''}
                            onClick={() => setFramingMode(mode.id)}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="expression-preview-panel">
                <h2>見え方</h2>
                <div className="expression-preview-grid">
                    {PREVIEW_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            className={mode.id === previewMode ? 'is-active' : ''}
                            onClick={() => setPreviewMode(mode.id)}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="expression-preview-panel">
                <h2>Home layer scenario</h2>
                <div className="expression-preview-grid">
                    {HOME_LAYER_SCENARIOS.map((scenario) => (
                        <button
                            key={scenario.id}
                            type="button"
                            className={scenario.id === homeLayerScenario ? 'is-active' : ''}
                            onClick={() => setHomeLayerScenario(scenario.id)}
                        >
                            {scenario.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="expression-preview-panel">
                <h2>emotion</h2>
                <div className="expression-preview-grid">
                    {EMOTION_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            className={preset.id === emotion ? 'is-active' : ''}
                            onClick={() => {
                                const nextEmotion = normalizeCharacterEmotion(preset.id, 'normal');
                                setEmotion(nextEmotion);
                                setLive2dExpression('');
                            }}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="expression-preview-panel">
                <h2>立ち絵 / expression</h2>
                <div className="expression-preview-grid">
                    {EXPRESSION_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            className={preset.id === expression ? 'is-active' : ''}
                            onClick={() => setExpression(normalizeCharacterEmotion(preset.id, 'normal'))}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="expression-preview-panel">
                <h2>直接 exp3 を指定</h2>
                <div className="expression-preview-grid">
                    {DIRECT_EXPRESSIONS.map((preset) => (
                        <button
                            key={preset.id || 'auto'}
                            type="button"
                            className={preset.id === live2dExpression ? 'is-active' : ''}
                            onClick={() => setLive2dExpression(preset.id)}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="expression-preview-panel">
                <h2>目や頬の差分</h2>
                <div className="expression-preview-grid">
                    {FACE_ACCENTS.map((preset) => (
                        <button
                            key={preset.id || 'none'}
                            type="button"
                            className={preset.id === live2dFaceAccent ? 'is-active' : ''}
                            onClick={() => setLive2dFaceAccent(preset.id)}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ExpressionPreview;
