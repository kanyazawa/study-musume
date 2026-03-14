import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, History, ChevronLeft, X } from 'lucide-react';
import { performGacha, getGachaHistory, getCurrentPity, getRemainingPity, GACHA_COST } from '../utils/gachaUtils';
import { RARITY } from '../data/gachaItems';
import './Gacha.css';

// ガチャ動画・音声のパス
const GACHA_VIDEO = '/gacha_animation (2).mp4';
const GACHA_AUDIO = '/audio/gacha.mp3';
const JACKPOT_CHARACTER = '/jackpot_character.jpg';

const Gacha = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [showVideo, setShowVideo] = useState(false);
    const [gachaResults, setGachaResults] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showJackpot, setShowJackpot] = useState(false);
    const [history, setHistory] = useState([]);
    const [pityCount, setPityCount] = useState(0);
    const [pendingResults, setPendingResults] = useState(null);
    const audioRef = useRef(null);
    const videoRef = useRef(null);

    const diamonds = stats?.diamonds || 0;

    useEffect(() => {
        setPityCount(getCurrentPity());
        setHistory(getGachaHistory());
    }, []);

    // ガチャ結果を処理する共通関数
    const showGachaResults = (results) => {
        const hasSSR = results.some(r => r.rarity === 'SSR');

        if (hasSSR) {
            setShowJackpot(true);
            setTimeout(() => {
                setShowJackpot(false);
                setGachaResults(results);
            }, 3000);
        } else {
            setGachaResults(results);
        }

        setShowVideo(false);
        setPendingResults(null);
        setPityCount(getCurrentPity());
        setHistory(getGachaHistory());

        // アイテムをインベントリに追加
        const newInventory = [...(stats.inventory || [])];
        results.forEach(item => {
            if (item.type !== 'dummy') {
                const existingIndex = newInventory.findIndex(i => i.itemId === item.id);
                if (existingIndex >= 0) {
                    newInventory[existingIndex].quantity++;
                } else {
                    newInventory.push({
                        itemId: item.id,
                        name: item.name,
                        type: item.type,
                        rarity: item.rarity,
                        emoji: item.emoji,
                        description: item.description,
                        quantity: 1
                    });
                }
            }
        });
        updateStats({ inventory: newInventory });
    };

    // ガチャ実行
    const handleGacha = (count) => {
        const cost = count === 1 ? GACHA_COST.SINGLE : GACHA_COST.TEN;

        // ダイヤ不足チェック
        if (diamonds < cost) {
            alert(`ダイヤが不足しています！\n必要: ${cost} 💎\n所持: ${diamonds} 💎`);
            return;
        }

        // ダイヤ消費
        updateStats({ diamonds: diamonds - cost });

        // ガチャ結果を先に計算
        const results = performGacha(count);
        setPendingResults(results);

        // ガチャアニメーション表示
        setShowVideo(true);

        // 音声再生
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            audioRef.current = new Audio(GACHA_AUDIO);
            audioRef.current.play().catch(() => { });
        } catch {
            // 音声再生失敗は無視
        }
    };

    // 動画終了時に結果表示
    const handleVideoEnded = () => {
        if (pendingResults) {
            showGachaResults(pendingResults);
        }
        // 音声停止
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    // スキップ（タップで演出をスキップ）
    const handleSkip = () => {
        if (pendingResults) {
            showGachaResults(pendingResults);
        }
        // 音声停止
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    // 結果モーダルを閉じる
    const closeResults = () => {
        setGachaResults(null);
    };

    return (
        <div className="gacha-page-cute">
            {/* ヘッダー */}
            <div className="gacha-header-cute">
                <button className="back-btn-cute" onClick={() => navigate('/home')}>
                    <ChevronLeft size={20} />
                </button>
                <h2 className="gacha-title-cute">✨ ガチャ</h2>
                <button className="history-btn-cute" onClick={() => setShowHistory(true)}>
                    <History size={20} />
                </button>
            </div>

            {/* リソース表示 */}
            <div className="resource-bar">
                <div className="resource-item">
                    <span className="resource-icon">💎</span>
                    <span className="resource-value">{diamonds}</span>
                </div>
            </div>

            {/* メインコンテンツ */}
            <div className="gacha-main-content">
                {/* バナー */}
                <div className="gacha-banner-cute">
                    <div className="banner-bg"></div>
                    <div className="banner-text">
                        <h3>🌸 プレミアムガチャ 🌸</h3>
                        <p>限定アイテム実装中!</p>
                        <div className="pickup-badge">PICK UP!</div>
                    </div>
                </div>

                {/* 天井カウンター（コンパクト） */}
                <div className="pity-counter-compact">
                    <span className="pity-text">天井まで <strong>{getRemainingPity()}</strong>回</span>
                    <div className="pity-bar-mini">
                        <div className="pity-fill-mini" style={{ width: `${(pityCount / 100) * 100}%` }}></div>
                    </div>
                </div>

                {/* ガチャボタン */}
                <div className="gacha-buttons-cute">
                    <button
                        className="gacha-btn-cute single"
                        onClick={() => handleGacha(1)}
                        disabled={showVideo}
                    >
                        <div className="btn-icon">💎</div>
                        <div className="btn-label">1回引く</div>
                        <div className="btn-cost">{GACHA_COST.SINGLE}</div>
                    </button>
                    <button
                        className="gacha-btn-cute ten"
                        onClick={() => handleGacha(10)}
                        disabled={showVideo}
                    >
                        <div className="btn-icon">💎</div>
                        <div className="btn-label">10回引く</div>
                        <div className="btn-cost">{GACHA_COST.TEN}</div>
                        <div className="btn-bonus">SR以上1個確定!</div>
                    </button>
                </div>

                {/* 提供割合（折りたたみ可能） */}
                <details className="rates-details">
                    <summary className="rates-summary">📊 提供割合</summary>
                    <div className="rates-list-compact">
                        {Object.entries(RARITY).reverse().map(([key, data]) => (
                            <div key={key} className="rate-item-compact">
                                <span style={{ color: data.color }}>{data.label}</span>
                                <span>{data.rate}%</span>
                            </div>
                        ))}
                    </div>
                    <p className="rate-note-small">※10連でSR以上1個確定</p>
                    <p className="rate-note-small">※100回でSSR確定</p>
                </details>
            </div>

            {/* ガチャアニメーション */}
            {showVideo && (
                <div className="video-overlay" onClick={handleSkip}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="gacha-video"
                        onEnded={handleVideoEnded}
                        onError={() => {
                            console.warn('Gacha video not found, skipping...');
                            if (pendingResults) showGachaResults(pendingResults);
                        }}
                    >
                        <source src={GACHA_VIDEO} type="video/mp4" />
                    </video>
                    <div className="skip-hint">タップでスキップ</div>
                </div>
            )}

            {/* 大当たり演出 */}
            {showJackpot && (
                <div className="jackpot-overlay">
                    <div className="jackpot-content">
                        <h1 className="jackpot-title">🎊 大当たり! 🎊</h1>
                        <img
                            src={JACKPOT_CHARACTER}
                            alt="SSR Character"
                            className="jackpot-character"
                        />
                        <div className="jackpot-sparkles">✨✨✨</div>
                    </div>
                </div>
            )}

            {/* 結果モーダル */}
            {gachaResults && (
                <div className="result-overlay" onClick={closeResults}>
                    {/* 背景パーティクル */}
                    <div className="result-particles">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                className={`particle particle-${i % 5}`}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                }}
                            />
                        ))}
                    </div>

                    <div className="results-modal-rich" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn-x" onClick={closeResults}>
                            <X size={24} />
                        </button>

                        {/* タイトル */}
                        <div className="result-title-area">
                            <h3 className="result-title-rich">
                                <span className="title-deco">✦</span>
                                ガチャ結果
                                <span className="title-deco">✦</span>
                            </h3>
                            <div className="result-summary">
                                {gachaResults.length}件獲得
                                {gachaResults.some(r => r.rarity === 'SSR') && <span className="summary-ssr">🌟 SSR!</span>}
                                {gachaResults.some(r => r.rarity === 'SR') && <span className="summary-sr">💜 SR!</span>}
                            </div>
                        </div>

                        {/* カードグリッド */}
                        <div className="results-grid-rich">
                            {gachaResults.map((item, index) => (
                                <div
                                    key={index}
                                    className={`result-card-rich rarity-${item.rarity}`}
                                    style={{ animationDelay: `${index * 0.12}s` }}
                                >
                                    {/* レアリティ別グロー */}
                                    {(item.rarity === 'SSR' || item.rarity === 'SR') && (
                                        <div className={`card-glow glow-${item.rarity}`} />
                                    )}

                                    {/* レアリティリボン */}
                                    <div className={`rarity-ribbon ribbon-${item.rarity}`}>
                                        {RARITY[item.rarity].label}
                                    </div>

                                    {/* アイテム表示 */}
                                    <div className="card-emoji">{item.emoji}</div>
                                    <div className="card-name">{item.name}</div>
                                    <div
                                        className="card-rarity-label"
                                        style={{ color: RARITY[item.rarity].color }}
                                    >
                                        {item.rarity}
                                    </div>

                                    {/* バッジ */}
                                    {item.isPity && (
                                        <div className="badge-pity">天井</div>
                                    )}
                                    {item.isNew && (
                                        <div className="badge-new">NEW</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button className="close-btn-result-rich" onClick={closeResults}>
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* 履歴モーダル */}
            {showHistory && (
                <div className="modal-overlay" onClick={() => setShowHistory(false)}>
                    <div className="history-modal-cute" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-cute">
                            <h3>📜 ガチャ履歴</h3>
                            <button onClick={() => setShowHistory(false)}>×</button>
                        </div>
                        <div className="history-list">
                            {history.length === 0 ? (
                                <p className="empty-message">履歴がありません</p>
                            ) : (
                                history.map((entry) => (
                                    <div key={entry.id} className="history-entry">
                                        <div className="entry-header">
                                            <span className="entry-date">
                                                {new Date(entry.timestamp).toLocaleString('ja-JP')}
                                            </span>
                                            <span className="entry-count">{entry.count}回</span>
                                        </div>
                                        <div className="entry-results">
                                            {entry.results.map((item, idx) => (
                                                <span
                                                    key={idx}
                                                    className="mini-result"
                                                    style={{ color: RARITY[item.rarity].color }}
                                                >
                                                    {item.emoji}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gacha;
