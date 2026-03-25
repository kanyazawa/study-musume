import React, { useEffect, useMemo, useState } from 'react';
import { Mic, RefreshCw, Save, Volume2, X } from 'lucide-react';
import './TtsSettingsModal.css';
import { DEFAULT_TTS_SETTINGS, getTtsSettings, saveTtsSettings, TTS_ENGINES } from '../utils/ttsSettings';
import {
    fetchEngineSpeakers,
    getEngineBaseUrl,
    getEngineDisplayName,
    isEngineAvailable,
    resolveSpeakerIdForEngine,
    speakWithBrowserTts,
    speakWithEngine,
} from '../utils/voicevoxUtils';

const ENGINE_OPTIONS = [
    { value: TTS_ENGINES.AUTO, label: '自動判定', desc: 'クラウドTTS → AivisSpeech → VOICEVOX → ブラウザTTS の順で使います' },
    { value: TTS_ENGINES.DEEPGRAM, label: 'クラウドTTS', desc: '本番向け。Aivis Cloud を優先し、未設定なら Deepgram を使います' },
    { value: TTS_ENGINES.AIVIS, label: 'AivisSpeech', desc: 'AivisSpeech Engine を優先して使います' },
    { value: TTS_ENGINES.VOICEVOX, label: 'VOICEVOX', desc: 'VOICEVOX Engine を優先して使います' },
    { value: TTS_ENGINES.BROWSER, label: 'ブラウザTTS', desc: '端末標準の読み上げだけを使います' },
];

const SAMPLE_TEXT = 'こんにちは。読み上げエンジンのテストです。授業データを自然に読めるか確認しましょう。';

const DEEPGRAM_MODEL_OPTIONS = [
    { value: 'aura-2-uzume-ja', label: 'Aura-2 Uzume', desc: '日本語向け。若めでかわいい寄りの声です' },
    { value: 'aura-2-ama-ja', label: 'Aura-2 Ama', desc: '日本語向け。やわらかくカジュアル寄りです' },
    { value: 'aura-2-izanami-ja', label: 'Aura-2 Izanami', desc: '日本語向け。自然で安定した声です' },
    { value: 'aura-2-fujin-ja', label: 'Aura-2 Fujin', desc: '日本語向け。落ち着いた低めの声です' },
    { value: 'aura-2-ebisu-ja', label: 'Aura-2 Ebisu', desc: '日本語向け。若めの男性声です' },
    { value: 'aura-2-thalia-en', label: 'Aura-2 Thalia', desc: '英語向け' },
    { value: 'aura-2-luna-en', label: 'Aura-2 Luna', desc: '英語向け' },
];

const TtsSettingsModal = ({ onClose }) => {
    const [settings, setSettings] = useState(getTtsSettings());
    const [available, setAvailable] = useState({ deepgram: false, aivis: false, voicevox: false });
    const [loadingAvailability, setLoadingAvailability] = useState(true);
    const [speakerOptions, setSpeakerOptions] = useState([]);
    const [loadingSpeakers, setLoadingSpeakers] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [testMessage, setTestMessage] = useState('');

    const selectedEngine = settings.engine === TTS_ENGINES.AUTO
        ? (available.deepgram
            ? TTS_ENGINES.DEEPGRAM
            : available.aivis
                ? TTS_ENGINES.AIVIS
                : available.voicevox
                    ? TTS_ENGINES.VOICEVOX
                    : TTS_ENGINES.BROWSER)
        : settings.engine;

    const selectedEngineLabel = useMemo(
        () => getEngineDisplayName(selectedEngine),
        [selectedEngine]
    );

    useEffect(() => {
        const run = async () => {
            setLoadingAvailability(true);
            const [deepgramOk, aivisOk, voicevoxOk] = await Promise.all([
                isEngineAvailable(TTS_ENGINES.DEEPGRAM),
                isEngineAvailable(TTS_ENGINES.AIVIS, settings.aivisUrl),
                isEngineAvailable(TTS_ENGINES.VOICEVOX, settings.voicevoxUrl),
            ]);
            setAvailable({ deepgram: deepgramOk, aivis: aivisOk, voicevox: voicevoxOk });
            setLoadingAvailability(false);
        };
        run();
    }, [settings.aivisUrl, settings.voicevoxUrl]);

    useEffect(() => {
        const engineForSpeakers = settings.engine === TTS_ENGINES.AUTO ? selectedEngine : settings.engine;
        if (engineForSpeakers === TTS_ENGINES.BROWSER || engineForSpeakers === TTS_ENGINES.DEEPGRAM) {
            setSpeakerOptions([]);
            return;
        }

        const loadSpeakers = async () => {
            setLoadingSpeakers(true);
            const speakers = await fetchEngineSpeakers(engineForSpeakers, getEngineBaseUrl(engineForSpeakers, settings));
            setSpeakerOptions(speakers);
            setLoadingSpeakers(false);
        };

        loadSpeakers();
    }, [selectedEngine, settings]);

    const handleChange = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSaveMessage('');
        setTestMessage('');
    };

    const handleSave = () => {
        const saved = saveTtsSettings(settings);
        setSettings(saved);
        setSaveMessage('保存しました');
        setTimeout(() => setSaveMessage(''), 2000);
    };

    const handleReset = () => {
        setSettings(DEFAULT_TTS_SETTINGS);
        setSaveMessage('');
        setTestMessage('');
    };

    const handleTest = async () => {
        setTestMessage('テスト再生中...');

        if (!settings.enabled) {
            setTestMessage('自動読み上げがオフです');
            return;
        }

        if (selectedEngine === TTS_ENGINES.BROWSER) {
            speakWithBrowserTts(SAMPLE_TEXT, {
                pitch: settings.browserPitch,
                rate: settings.browserRate,
            });
            setTestMessage('ブラウザTTSで再生しました');
            return;
        }

        const preferredSpeakerValue = selectedEngine === TTS_ENGINES.DEEPGRAM
            ? settings.deepgramVoiceModel
            : settings.preferredSpeaker;
        const preferredSpeakerId = await resolveSpeakerIdForEngine(selectedEngine, preferredSpeakerValue, {
            baseUrl: getEngineBaseUrl(selectedEngine, settings),
        });
        const success = await speakWithEngine(selectedEngine, SAMPLE_TEXT, preferredSpeakerId, {
            baseUrl: getEngineBaseUrl(selectedEngine, settings),
        });

        if (success) {
            setTestMessage(`${selectedEngineLabel} で再生しました`);
            return;
        }

        speakWithBrowserTts(SAMPLE_TEXT, {
            pitch: settings.browserPitch,
            rate: settings.browserRate,
        });
        setTestMessage(`${selectedEngineLabel} に接続できなかったため、ブラウザTTSで再生しました`);
    };

    return (
        <div className="modal-overlay tts-modal-overlay" onClick={onClose}>
            <div className="tts-settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tts-settings-header">
                    <div className="tts-header-title">
                        <Mic size={24} />
                        <h3>TTS設定</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="tts-settings-body">
                    <div className="tts-status-grid">
                        <div className={`tts-status-card ${available.deepgram ? 'online' : 'offline'}`}>
                            <div className="tts-status-name">クラウドTTS</div>
                            <div className="tts-status-value">{loadingAvailability ? '確認中' : available.deepgram ? '接続OK' : '未設定'}</div>
                        </div>
                        <div className={`tts-status-card ${available.aivis ? 'online' : 'offline'}`}>
                            <div className="tts-status-name">AivisSpeech</div>
                            <div className="tts-status-value">{loadingAvailability ? '確認中' : available.aivis ? '接続OK' : '未接続'}</div>
                        </div>
                        <div className={`tts-status-card ${available.voicevox ? 'online' : 'offline'}`}>
                            <div className="tts-status-name">VOICEVOX</div>
                            <div className="tts-status-value">{loadingAvailability ? '確認中' : available.voicevox ? '接続OK' : '未接続'}</div>
                        </div>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">自動読み上げ</div>
                            <div className="setting-desc">授業データの通常行を自動で話します</div>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => handleChange('enabled', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="tts-engine-section">
                        <div className="tts-section-title">エンジン選択</div>
                        <div className="tts-engine-list">
                            {ENGINE_OPTIONS.map((option) => (
                                <label key={option.value} className={`tts-engine-card ${settings.engine === option.value ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="tts-engine"
                                        value={option.value}
                                        checked={settings.engine === option.value}
                                        onChange={() => handleChange('engine', option.value)}
                                    />
                                    <div className="tts-engine-copy">
                                        <div className="tts-engine-label">{option.label}</div>
                                        <div className="tts-engine-desc">{option.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="tts-field-group">
                        <label className="tts-field">
                            <span>クラウドTTS 音声設定</span>
                            <select
                                value={settings.deepgramVoiceModel}
                                onChange={(e) => handleChange('deepgramVoiceModel', e.target.value)}
                            >
                                {DEEPGRAM_MODEL_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="tts-inline-help">
                                Aivis Cloud が設定されている場合はサーバー側のモデル UUID を優先します。未設定時は Deepgram フォールバックとして下の候補を使います。
                            </div>
                            <div className="tts-inline-help">
                                {DEEPGRAM_MODEL_OPTIONS.find((option) => option.value === settings.deepgramVoiceModel)?.desc || 'モデルを選んで音の印象を調整できます'}
                            </div>
                        </label>
                    </div>

                    <div className="tts-url-grid">
                        <label className="tts-field">
                            <span>AivisSpeech URL</span>
                            <input
                                value={settings.aivisUrl}
                                onChange={(e) => handleChange('aivisUrl', e.target.value)}
                                placeholder="http://127.0.0.1:10101"
                            />
                        </label>
                        <label className="tts-field">
                            <span>VOICEVOX URL</span>
                            <input
                                value={settings.voicevoxUrl}
                                onChange={(e) => handleChange('voicevoxUrl', e.target.value)}
                                placeholder="http://127.0.0.1:50021"
                            />
                        </label>
                    </div>

                    <div className="tts-url-hint">
                        クラウドTTS は `/api/tts` 経由で使います。AivisSpeech の標準URLは `http://127.0.0.1:10101`、VOICEVOX は `http://127.0.0.1:50021` です。
                    </div>

                    <div className="tts-field-group">
                        <label className="tts-field">
                            <span>優先話者</span>
                            <select
                                value={settings.preferredSpeaker}
                                onChange={(e) => handleChange('preferredSpeaker', e.target.value)}
                                disabled={selectedEngine === TTS_ENGINES.BROWSER || selectedEngine === TTS_ENGINES.DEEPGRAM}
                            >
                                <option value="">自動選択</option>
                                {speakerOptions.map((speaker) => (
                                    <option key={`${speaker.engine}-${speaker.styleId}`} value={String(speaker.styleId)}>
                                        {speaker.displayName}
                                    </option>
                                ))}
                            </select>
                            <div className="tts-inline-help">
                                {loadingSpeakers
                                    ? '話者一覧を取得中...'
                                    : selectedEngine === TTS_ENGINES.BROWSER
                                        ? 'ブラウザTTS利用時は話者指定できません'
                                        : selectedEngine === TTS_ENGINES.DEEPGRAM
                                            ? 'クラウドTTS ではサーバー設定の音声、または上の Deepgram フォールバック候補を使います'
                                            : speakerOptions.length > 0
                                            ? `${speakerOptions.length}件の話者が見つかりました`
                                            : '話者一覧を取得できませんでした'}
                            </div>
                        </label>
                        <label className="tts-field">
                            <span>対戦ボイス話者</span>
                            <select
                                value={settings.battleSpeaker}
                                onChange={(e) => handleChange('battleSpeaker', e.target.value)}
                                disabled={selectedEngine === TTS_ENGINES.BROWSER || selectedEngine === TTS_ENGINES.DEEPGRAM}
                            >
                                <option value="">通常話者を使う</option>
                                {speakerOptions.map((speaker) => (
                                    <option key={`battle-${speaker.engine}-${speaker.styleId}`} value={String(speaker.styleId)}>
                                        {speaker.displayName}
                                    </option>
                                ))}
                            </select>
                            <div className="tts-inline-help">
                                {selectedEngine === TTS_ENGINES.BROWSER
                                    ? 'ブラウザTTS利用時は対戦話者を分けられません'
                                    : selectedEngine === TTS_ENGINES.DEEPGRAM
                                        ? 'クラウドTTS では通常音声と同じ設定を使います'
                                        : settings.battleSpeaker
                                            ? '対戦中の連鎖ボイスだけこの話者で再生します'
                                            : '未設定なら通常の優先話者をそのまま使います'}
                            </div>
                        </label>
                    </div>

                    <div className="tts-slider-section">
                        <div className="tts-section-title">ブラウザTTSの調整</div>
                        <label className="tts-slider-row">
                            <span>ピッチ</span>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={settings.browserPitch}
                                onChange={(e) => handleChange('browserPitch', Number(e.target.value))}
                            />
                            <strong>{settings.browserPitch.toFixed(1)}</strong>
                        </label>
                        <label className="tts-slider-row">
                            <span>速度</span>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={settings.browserRate}
                                onChange={(e) => handleChange('browserRate', Number(e.target.value))}
                            />
                            <strong>{settings.browserRate.toFixed(1)}</strong>
                        </label>
                    </div>

                    <div className="tts-test-panel">
                        <button className="tts-test-btn" onClick={handleTest}>
                            <Volume2 size={18} />
                            テスト再生
                        </button>
                        <button className="tts-reset-btn" onClick={handleReset}>
                            <RefreshCw size={18} />
                            初期値に戻す
                        </button>
                    </div>

                    {testMessage && <div className="tts-message">{testMessage}</div>}
                </div>

                <div className="tts-settings-footer">
                    <button className="tts-save-btn" onClick={handleSave}>
                        <Save size={18} />
                        {saveMessage || '設定を保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TtsSettingsModal;
