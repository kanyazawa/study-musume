import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Volume2 } from 'lucide-react';
import ItemVisual from '../components/ItemVisual';
import { useSound } from '../contexts/SoundContext';
import { filterInventoryByType } from '../utils/itemUtils';
import './VoiceCollection.css';

const PREVIEW_CHANNEL = 'voice-collection-preview';

const RARITY_PRIORITY = {
    SSR: 0,
    SR: 1,
    R: 2,
    N_PLUS: 3,
    N: 4,
};

const VoiceCollection = ({ stats }) => {
    const navigate = useNavigate();
    const { playVoice, stopVoice, isMuted, voiceVolume } = useSound();
    const [playingItemId, setPlayingItemId] = useState('');
    const [statusText, setStatusText] = useState('気になるボイスをタップして試聴できます。');

    const ownedVoices = useMemo(() => (
        filterInventoryByType(stats?.inventory || [], 'voice')
            .sort((a, b) => {
                const rarityDiff = (RARITY_PRIORITY[a.rarity] ?? 99) - (RARITY_PRIORITY[b.rarity] ?? 99);
                if (rarityDiff !== 0) return rarityDiff;
                return a.name.localeCompare(b.name, 'ja');
            })
    ), [stats?.inventory]);

    useEffect(() => () => {
        stopVoice(PREVIEW_CHANNEL);
    }, [stopVoice]);

    const handlePreview = async (voiceItem) => {
        if (!voiceItem?.previewVoicePath) {
            setStatusText('このボイスはまだ試聴音声が未設定です。');
            return;
        }

        if (playingItemId === voiceItem.itemId) {
            stopVoice(PREVIEW_CHANNEL);
            setPlayingItemId('');
            setStatusText(`${voiceItem.name} を停止しました。`);
            return;
        }

        stopVoice(PREVIEW_CHANNEL);
        setPlayingItemId(voiceItem.itemId);
        setStatusText(`${voiceItem.name} を再生中です。`);

        const played = await playVoice(voiceItem.previewVoicePath, {
            channel: PREVIEW_CHANNEL,
            onEnd: () => {
                setPlayingItemId((current) => (current === voiceItem.itemId ? '' : current));
                setStatusText(`${voiceItem.name} の試聴が終わりました。`);
            },
        });

        if (!played) {
            setPlayingItemId('');
            setStatusText('試聴の再生に失敗しました。音量設定か音声ファイルを確認してください。');
        }
    };

    return (
        <div className="voice-collection-page">
            <header className="voice-collection-header">
                <button type="button" className="voice-collection-back" onClick={() => navigate('/inventory')}>
                    <ArrowLeft size={20} />
                    <span>戻る</span>
                </button>

                <div className="voice-collection-title">
                    <p>Collection</p>
                    <h1>ボイスコレクション</h1>
                </div>

                <div className="voice-collection-meter">
                    <span>{ownedVoices.length}種</span>
                    <small>Voice {Math.round((voiceVolume || 0) * 100)}%</small>
                </div>
            </header>

            <section className="voice-collection-hero">
                <div className="voice-collection-hero-copy">
                    <span className="voice-chip">ガチャ報酬</span>
                    <h2>引いたボイスをその場で試聴</h2>
                    <p>
                        学習の節目やホーム演出に使う報酬を、まずはコレクションとして並べています。
                        今は試聴中心ですが、あとでホーム反映にも広げやすい形です。
                    </p>
                </div>

                <div className="voice-collection-status">
                    <div className={`voice-status-badge ${isMuted ? 'is-muted' : ''}`}>
                        <Volume2 size={16} />
                        <span>{isMuted ? 'ミュート中' : '試聴できます'}</span>
                    </div>
                    <p>{statusText}</p>
                </div>
            </section>

            <section className="voice-collection-grid">
                {ownedVoices.length === 0 ? (
                    <div className="voice-collection-empty">
                        <h3>まだボイス報酬を持っていません</h3>
                        <p>ガチャや交換所から集めると、ここに試聴カードが並びます。</p>
                        <div className="voice-collection-empty-actions">
                            <button type="button" onClick={() => navigate('/gacha')}>
                                ガチャへ
                            </button>
                            <button type="button" onClick={() => navigate('/shop')}>
                                交換所へ
                            </button>
                        </div>
                    </div>
                ) : (
                    ownedVoices.map((voiceItem) => {
                        const isPlaying = playingItemId === voiceItem.itemId;

                        return (
                            <article
                                key={voiceItem.itemId}
                                className={`voice-collection-card rarity-${voiceItem.rarity} ${isPlaying ? 'is-playing' : ''}`}
                            >
                                <ItemVisual
                                    item={voiceItem}
                                    className="voice-collection-visual"
                                    fallbackText={voiceItem.name.charAt(0)}
                                    alt={voiceItem.name}
                                />

                                <div className="voice-collection-card-copy">
                                    <div className="voice-collection-card-head">
                                        <span className={`voice-rarity rarity-${voiceItem.rarity}`}>{voiceItem.rarity}</span>
                                        <span className="voice-quantity">x{voiceItem.quantity}</span>
                                    </div>
                                    <h3>{voiceItem.name}</h3>
                                    <p className="voice-unlock-label">{voiceItem.unlockLabel || '追加ボイス'}</p>
                                    <p className="voice-transcript">
                                        {voiceItem.sampleTranscript || '試聴テキストはあとで追加できます。'}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className={`voice-preview-button ${isPlaying ? 'is-playing' : ''}`}
                                    onClick={() => handlePreview(voiceItem)}
                                >
                                    {isPlaying ? <Square size={16} /> : <Play size={16} />}
                                    <span>{isPlaying ? '停止' : '試聴する'}</span>
                                </button>
                            </article>
                        );
                    })
                )}
            </section>
        </div>
    );
};

export default VoiceCollection;
