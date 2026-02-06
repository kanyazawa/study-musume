/**
 * VOICEVOX連携ユーティリティ
 * VOICEVOXアプリが起動していれば音声合成APIを使用して再生
 */

import { Capacitor } from '@capacitor/core';

const VOICEVOX_API_BASE = 'http://localhost:50021';

// キャラクターID（speaker ID）
export const VOICEVOX_SPEAKERS = {
    ZUNDAMON: 3,           // ずんだもん（ノーマル）
    ZUNDAMON_SWEET: 1,     // ずんだもん（あまあま）
    METAN: 2,              // 四国めたん（ノーマル）
    TSUMUGI: 8,            // 春日部つむぎ（ノーマル）
    RITSU: 9,              // 雨晴はう（ノーマル）
};

// 音声キャッシュ（テキスト+speakerIdをキーにしてBlobをキャッシュ）
const audioCache = new Map();

/**
 * VOICEVOXが利用可能かチェックする
 * @returns {Promise<boolean>} 利用可能ならtrue
 */
export const isVoicevoxAvailable = async () => {
    try {
        const response = await fetch(`${VOICEVOX_API_BASE}/version`, {
            method: 'GET',
        });
        return response.ok;
    } catch (error) {
        return false;
    }
};

/**
 * VOICEVOXで音声を合成して再生する（キャッシュ対応）
 * @param {string} text - 読み上げるテキスト
 * @param {number} speakerId - キャラクターID（デフォルト: ずんだもん）
 * @returns {Promise<boolean>} 成功したらtrue、失敗したらfalse
 */
export const speakWithVoicevox = async (text, speakerId = VOICEVOX_SPEAKERS.ZUNDAMON) => {
    try {
        const cacheKey = `${text}_${speakerId}`;

        // キャッシュをチェック
        if (audioCache.has(cacheKey)) {
            const audioBlob = audioCache.get(cacheKey);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
            });

            await audio.play();
            return true;
        }

        // キャッシュになければ生成
        // 1. 音声合成用のクエリを作成
        const queryResponse = await fetch(
            `${VOICEVOX_API_BASE}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
            {
                method: 'POST',
            }
        );

        if (!queryResponse.ok) {
            throw new Error('Audio query failed');
        }

        const audioQuery = await queryResponse.json();

        // 2. 音声を合成
        const synthesisResponse = await fetch(
            `${VOICEVOX_API_BASE}/synthesis?speaker=${speakerId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(audioQuery),
            }
        );

        if (!synthesisResponse.ok) {
            throw new Error('Audio synthesis failed');
        }

        // 3. 音声データを取得してキャッシュ
        const audioBlob = await synthesisResponse.blob();
        audioCache.set(cacheKey, audioBlob);

        // 4. 再生
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // 再生終了後にメモリ解放
        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl);
        });

        await audio.play();
        return true;

    } catch (error) {
        console.warn('VOICEVOX synthesis failed:', error);
        return false;
    }
};

/**
 * よく使うフレーズをプリロード（キャッシュ）する
 * @param {number} speakerId - キャラクターID
 */
export const preloadCommonPhrases = async (speakerId = VOICEVOX_SPEAKERS.METAN) => {
    const commonPhrases = [
        '正解！',
        'もう一度頑張って。'
    ];

    console.log('Preloading common phrases...');

    for (const phrase of commonPhrases) {
        try {
            const cacheKey = `${phrase}_${speakerId}`;

            // 既にキャッシュされていればスキップ
            if (audioCache.has(cacheKey)) {
                continue;
            }

            // 音声を生成してキャッシュ
            const queryResponse = await fetch(
                `${VOICEVOX_API_BASE}/audio_query?text=${encodeURIComponent(phrase)}&speaker=${speakerId}`,
                { method: 'POST' }
            );

            if (!queryResponse.ok) continue;

            const audioQuery = await queryResponse.json();
            const synthesisResponse = await fetch(
                `${VOICEVOX_API_BASE}/synthesis?speaker=${speakerId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(audioQuery),
                }
            );

            if (!synthesisResponse.ok) continue;

            const audioBlob = await synthesisResponse.blob();
            audioCache.set(cacheKey, audioBlob);
            console.log(`Cached: ${phrase}`);
        } catch (error) {
            console.warn(`Failed to preload: ${phrase}`, error);
        }
    }

    console.log('Preloading complete!');
};

/**
 * テキストをVOICEVOXまたはブラウザTTSで読み上げる
 * VOICEVOXが利用できない場合は自動的にブラウザTTSにフォールバック
 * モバイルプラットフォームではVOICEVOXをスキップ
 * @param {string} text - 読み上げるテキスト
 * @param {number} speakerId - VOICEVOXキャラクターID
 */
export const speak = async (text, speakerId = VOICEVOX_SPEAKERS.ZUNDAMON) => {
    // モバイルプラットフォームではVOICEVOXをスキップ
    const isNativePlatform = Capacitor.isNativePlatform();

    let success = false;

    // Webブラウザの場合のみVOICEVOXを試す
    if (!isNativePlatform) {
        success = await speakWithVoicevox(text, speakerId);
    }

    // VOICEVOXが失敗した、またはモバイルの場合はブラウザTTSにフォールバック
    if (!success) {
        if (isNativePlatform) {
            console.log('Using browser TTS on mobile platform');
        } else {
            console.log('Falling back to browser TTS');
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.pitch = 1.3;
        utterance.rate = 1.0;

        // 日本語女性音声を選択
        const voices = window.speechSynthesis.getVoices();
        const japaneseVoices = voices.filter(voice => voice.lang.startsWith('ja'));
        const femaleVoice = japaneseVoices.find(voice =>
            voice.name.includes('Female') || voice.name.includes('female') ||
            voice.name.includes('女性') || voice.name.includes('Kyoko') ||
            voice.name.includes('Otoya') || voice.name.includes('Google 日本語')
        ) || japaneseVoices[0];

        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
};
