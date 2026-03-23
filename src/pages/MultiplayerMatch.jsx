/* eslint-disable react-hooks/preserve-manual-memoization */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Swords, Clock, Loader2, TrendingUp, TrendingDown, Volume2 } from 'lucide-react';
import { getCurrentUser, getUserProfile } from '../firebase/auth';
import {
    findOrCreateRoom,
    joinFriendRoom,
    requestFriendRematch,
    subscribeToRoom,
    submitAnswer,
    leaveRoom,
    markFinished,
    TARGET_CORRECT,
    generateQuestions
} from '../firebase/matching';
import { getBackgroundStyle } from '../utils/cosmeticUtils';
import {
    getLevelFromRating,
    getRankFromRating,
    getNextLevelInfo,
    calculateRatingChange,
    calculateDrawRatingChange,
    LEVEL_THRESHOLDS,
    DEFAULT_RATING
} from '../utils/ratingUtils';
import {
    getBattleModeLabel,
    normalizeBattleMode,
    normalizeTargetCorrect,
    resolveWinnerUid,
    summarizeAnswers,
} from '../utils/matchUtils';
import { addWrongQuestion } from '../utils/reviewUtils';
import { useSound } from '../contexts/SoundContext';
import { getTtsSettings, TTS_ENGINES } from '../utils/ttsSettings';
import { getEngineBaseUrl, isEngineAvailable, resolveSpeakerIdForEngine, speakWithEngine } from '../utils/voicevoxUtils';
import CharacterStage from '../components/character/CharacterStage';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { createHomePose } from '../utils/characterPoseUtils';
import './MultiplayerMatch.css';

// Background & Character Images
import BgClassroom from '../assets/images/bg_classroom.webp';
import CharacterMain from '../assets/images/character_new.webp';
import CharacterRen from '../assets/images/character_ren.webp';
import CharacterCasual from '../assets/images/character_casual_v9.webp';
import CharacterGym from '../assets/images/character_gym.webp';
import CharacterCasualGray from '../assets/images/character_casual_gray_hoodie.webp';
import CharacterCasualBlack from '../assets/images/character_casual_hoodie.webp';
import battleChain1Audio from '../assets/audio/chains/battle-chain-1.mp3';
import battleChain2Audio from '../assets/audio/chains/battle-chain-2.mp3';
import battleChain3Audio from '../assets/audio/chains/battle-chain-3.mp3';
import battleChain4Audio from '../assets/audio/chains/battle-chain-4.mp3';
import battleChain5Audio from '../assets/audio/chains/battle-chain-5.mp3';

const noahImages = {
    'default': CharacterMain,
    'skin_casual': CharacterCasual,
    'skin_gym': CharacterGym,
    'skin_casual_gray_hoodie': CharacterCasualGray,
    'skin_casual_hoodie': CharacterCasualBlack
};
const renImages = {
    'default': CharacterRen
};

const getCharacterImage = (characterId, skinId) => {
    const images = characterId === 'ren' ? renImages : noahImages;
    return images[skinId] || images['default'];
};

const getPlayerAvatarSrc = (player, fallbackCharacterId = 'noah', fallbackSkin = 'default') => {
    if (!player && !fallbackCharacterId) {
        return null;
    }

    return getCharacterImage(player?.characterId || fallbackCharacterId, player?.equippedSkin || fallbackSkin);
};

const ANSWER_TIME_LIMIT = 10; // 1問あたりの制限時間（秒）
const WRONG_ANSWER_DELAY = 1200; // 不正解時に正解を表示する時間（ms）
const MATCHING_TIMEOUT_MS = 30000;
const LISTENING_REPLAY_LIMIT = 1;

const getLevelMeta = (level) => {
    return LEVEL_THRESHOLDS.find((threshold) => threshold.level === level) || LEVEL_THRESHOLDS[0];
};

const getLeadMeta = (myScore, opponentScore) => {
    const gap = myScore - opponentScore;

    if (gap >= 2) {
        return {
            label: `${gap}問リード`,
            detail: 'このまま押し切ろう',
            tone: 'lead'
        };
    }

    if (gap === 1) {
        return {
            label: 'わずかにリード',
            detail: '焦らず次の1問へ',
            tone: 'lead'
        };
    }

    if (gap === 0) {
        return {
            label: '接戦',
            detail: '次の1問が勝負どころ',
            tone: 'neutral'
        };
    }

    return {
        label: `${Math.abs(gap)}問ビハインド`,
        detail: 'まだ巻き返せます',
        tone: 'chase'
    };
};

const getFinishReasonLabel = (finishReason, isSolo) => {
    if (isSolo) {
        return 'ソロチャレンジ完了';
    }

    switch (finishReason) {
        case 'completed':
            return '目標正解数に到達';
        case 'questions_exhausted':
            return '規定問題を消化';
        case 'opponent_left':
            return '相手の退出で終了';
        default:
            return '対戦終了';
    }
};

const getChainMeta = (streak) => {
    if (streak < 1) return null;

    if (streak === 1) {
        return {
            label: null,
            voiceSrc: battleChain1Audio,
        };
    }

    if (streak === 2) {
        return {
            label: '2 CHAIN',
            callout: 'やあ！',
            voiceSrc: battleChain2Audio,
            tone: 'good',
        };
    }

    if (streak === 3) {
        return {
            label: '3 CHAIN',
            callout: 'とう！',
            voiceSrc: battleChain3Audio,
            tone: 'great',
        };
    }

    if (streak === 4) {
        return {
            label: '4 CHAIN',
            callout: 'それ！',
            voiceSrc: battleChain4Audio,
            tone: 'amazing',
        };
    }

    return {
        label: `${streak} CHAIN`,
        callout: 'いくよ！',
        voiceSrc: battleChain5Audio,
        tone: 'fever',
    };
};

const MultiplayerMatch = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isMuted, playSE } = useSound();
    const searchParams = new URLSearchParams(location.search);
    const isSolo = searchParams.get('mode') === 'solo';
    const queryLevel = searchParams.get('level');
    const directRoomId = searchParams.get('room');
    const friendNameParam = searchParams.get('friendName');
    const friendLevelParam = searchParams.get('battleLevel');
    const friendTargetParam = searchParams.get('battleTarget');
    const friendModeParam = searchParams.get('battleMode');
    const isFriendMatch = Boolean(directRoomId) && !isSolo;
    
    // 自分のキャラ・背景情報 (フォールバックあり)
    const myCharacterId = stats?.characterId || 'noah';
    const myEquippedSkin = stats?.equippedSkin || 'default';
    const myEquippedBackground = stats?.equippedBackground || 'default';
    const currentBgStyle = getBackgroundStyle(myEquippedBackground);
    
    const preferredRenderer = stats?.characterRenderer;
    const renderer = resolveCharacterRenderer({
        preferredRenderer,
        characterId: myCharacterId,
        skinId: myEquippedSkin,
    });
    
    const [phase, setPhase] = useState('init'); // init | matching | countdown | playing | result | error
    const [roomId, setRoomId] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [myUid, setMyUid] = useState(null);
    const [myDisplayName, setMyDisplayName] = useState('');
    const [myQuestionIndex, setMyQuestionIndex] = useState(0); // 自分の現在の問題番号（ローカル管理）
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [countdown, setCountdown] = useState(3);
    const [timer, setTimer] = useState(ANSWER_TIME_LIMIT);
    const [showFeedback, setShowFeedback] = useState(false);
    const [error, setError] = useState(null);
    const [myScore, setMyScore] = useState(0);
    const [ratingChange, setRatingChange] = useState(null); // { newRating, change }
    const [prevLevelLabel, setPrevLevelLabel] = useState(null);
    const [failureState, setFailureState] = useState(null);
    const [resultNotice, setResultNotice] = useState(null);
    const [isRematchLoading, setIsRematchLoading] = useState(false);
    const [answerFx, setAnswerFx] = useState(null);
    const [resultFx, setResultFx] = useState(null);
    const [correctStreak, setCorrectStreak] = useState(0);
    const [chainCallout, setChainCallout] = useState(null);
    const [isPronouncingQuestion, setIsPronouncingQuestion] = useState(false);
    const [isCharacterSpeaking, setIsCharacterSpeaking] = useState(false);
    const [pronunciationReplayCount, setPronunciationReplayCount] = useState(0);

    // matchPose は isCharacterSpeaking ステートを使ってリップシンクさせる
    const matchPose = createHomePose({ emotion: 'normal', text: '' }, { speaking: isCharacterSpeaking });

    // 連鎖ボイスを事前読み込みしておく（ラグ解消のため）
    const chainAudioCacheRef = useRef({});
    useEffect(() => {
        const srcs = [1, 2, 3, 4, 5].map(n => {
            const meta = getChainMeta(n);
            return meta?.voiceSrc;
        }).filter(Boolean);

        const unique = [...new Set(srcs)];
        unique.forEach(src => {
            if (!chainAudioCacheRef.current[src]) {
                const audio = new Audio(src);
                audio.preload = 'auto';
                audio.load();
                chainAudioCacheRef.current[src] = audio;
            }
        });
    }, []);

    const chainLipIntervalRef = useRef(null);

    const unsubscribeRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const feedbackTimeoutRef = useRef(null);
    const matchingTimeoutRef = useRef(null);
    const autoStartAttemptedRef = useRef(false);
    const answerFxTimeoutRef = useRef(null);
    const resultFxTimeoutRef = useRef(null);
    const resultFxPlayedRef = useRef(null);
    const previousPhaseRef = useRef('init');
    const audioContextRef = useRef(null);
    const chainCalloutTimeoutRef = useRef(null);
    const pronunciationRequestIdRef = useRef(0);

    // レート関連の情報
    const myRating = stats?.multiplayerRating || DEFAULT_RATING;
    const myLevelInfo = getLevelFromRating(myRating);
    const myRankInfo = getRankFromRating(myRating);
    const nextLevelInfo = getNextLevelInfo(myRating);
    const friendBattleLevelInfo = getLevelMeta(roomData?.level || friendLevelParam);
    const matchTargetCorrect = normalizeTargetCorrect(roomData?.targetCorrect || friendTargetParam, TARGET_CORRECT);
    const battleMode = normalizeBattleMode(roomData?.battleMode || friendModeParam);
    const battleModeLabel = getBattleModeLabel(battleMode);
    const isListeningBattle = isFriendMatch && battleMode === 'listening';
    const canUseSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const playUiTone = useCallback((frequency, durationMs, { type = 'sine', gain = 0.03, delayMs = 0 } = {}) => {
        if (isMuted || typeof window === 'undefined') return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
        }

        const audioContext = audioContextRef.current;
        if (!audioContext) return;

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        const now = audioContext.currentTime + (delayMs / 1000);
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (durationMs / 1000));

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + (durationMs / 1000) + 0.02);
    }, [isMuted]);

    const triggerAnswerFx = useCallback((type) => {
        clearTimeout(answerFxTimeoutRef.current);
        setAnswerFx(type);
        answerFxTimeoutRef.current = setTimeout(() => {
            setAnswerFx(null);
        }, type === 'correct' ? 420 : 520);
    }, []);

    const playChainVoiceClip = useCallback((voiceSrc, volume = 0.8) => {
        if (isMuted || typeof window === 'undefined' || !voiceSrc) {
            return;
        }

        window.clearInterval(chainLipIntervalRef.current);

        let audio = chainAudioCacheRef.current[voiceSrc];
        if (audio) {
            audio.currentTime = 0;
        } else {
            audio = new window.Audio(voiceSrc);
            chainAudioCacheRef.current[voiceSrc] = audio;
        }

        audio.volume = volume;

        const startLipSync = () => {
            setIsCharacterSpeaking(true);
        };

        const stopLipSync = () => {
            setIsCharacterSpeaking(false);
        };

        audio.onplay = startLipSync;
        audio.onended = stopLipSync;
        audio.onerror = stopLipSync;

        audio.play().catch((err) => {
            console.error('Chain voice playback error:', err);
            stopLipSync();
        });
    }, [isMuted]);

    const speakBattleVoice = useCallback(async (text, settings, speakerValue) => {
        if (!text || !speakerValue) {
            return false;
        }

        const engineOrder = settings.engine === TTS_ENGINES.AUTO
            ? [TTS_ENGINES.AIVIS, TTS_ENGINES.VOICEVOX]
            : [settings.engine];

        for (const engine of engineOrder) {
            if (engine === TTS_ENGINES.BROWSER) {
                continue;
            }

            const baseUrl = getEngineBaseUrl(engine, settings);
            const available = await isEngineAvailable(engine, baseUrl);
            if (!available) {
                continue;
            }

            const speakerId = await resolveSpeakerIdForEngine(engine, speakerValue, { baseUrl });
            const success = await speakWithEngine(engine, text, speakerId, { baseUrl });
            if (success) {
                return true;
            }
        }

        return false;
    }, []);

    const clearChainCallout = useCallback(() => {
        clearTimeout(chainCalloutTimeoutRef.current);
        setChainCallout(null);
    }, []);

    const cancelQuestionPronunciation = useCallback(() => {
        pronunciationRequestIdRef.current += 1;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsPronouncingQuestion(false);
    }, []);

    const speakQuestionWord = useCallback((word, { isReplay = false } = {}) => {
        if (!isListeningBattle || !canUseSpeechSynthesis || !word) return false;

        const synth = window.speechSynthesis;
        pronunciationRequestIdRef.current += 1;
        const requestId = pronunciationRequestIdRef.current;
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = isReplay ? 0.86 : 0.92;
        utterance.pitch = 1;

        const voices = synth.getVoices();
        const preferredVoice = voices.find((voice) =>
            /^en[-_]/i.test(voice.lang) &&
            /(Aria|Jenny|Samantha|Google US English|Female)/i.test(voice.name)
        ) || voices.find((voice) => /^en[-_]/i.test(voice.lang));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        const clearSpeaking = () => {
            if (pronunciationRequestIdRef.current !== requestId) return;
            setIsPronouncingQuestion(false);
        };

        utterance.onstart = () => {
            if (pronunciationRequestIdRef.current !== requestId) return;
            setIsPronouncingQuestion(true);
        };
        utterance.onend = clearSpeaking;
        utterance.onerror = clearSpeaking;

        synth.speak(utterance);
        return true;
    }, [canUseSpeechSynthesis, isListeningBattle]);

    const triggerChainCallout = useCallback((streak) => {
        const meta = getChainMeta(streak);
        if (!meta) return;

        if (meta.label) {
            clearTimeout(chainCalloutTimeoutRef.current);
            setChainCallout({
                count: streak,
                label: meta.label,
                callout: meta.callout,
                tone: meta.tone,
            });
            chainCalloutTimeoutRef.current = setTimeout(() => {
                setChainCallout(null);
            }, 950);
        }

        if (isMuted || typeof window === 'undefined') {
            return;
        }

        const ttsSettings = getTtsSettings();
        const preferredBattleSpeaker = ttsSettings.battleSpeaker || ttsSettings.preferredSpeaker;
        if (ttsSettings.enabled !== false && preferredBattleSpeaker) {
            const battleVoiceText = meta.callout || '正解！';
            void speakBattleVoice(battleVoiceText, ttsSettings, preferredBattleSpeaker).then((success) => {
                if (!success && meta.voiceSrc) {
                    playChainVoiceClip(meta.voiceSrc, ttsSettings.volume !== undefined ? ttsSettings.volume : 0.8);
                }
            }).catch(() => {
                if (meta.voiceSrc) {
                    playChainVoiceClip(meta.voiceSrc, ttsSettings.volume !== undefined ? ttsSettings.volume : 0.8);
                }
            });
            return;
        }

        if (meta.voiceSrc) {
            playChainVoiceClip(meta.voiceSrc, ttsSettings.volume !== undefined ? ttsSettings.volume : 0.8);
        }
    }, [isMuted, playChainVoiceClip, speakBattleVoice]);

    const resetMatchState = useCallback(() => {
        clearInterval(timerIntervalRef.current);
        clearTimeout(feedbackTimeoutRef.current);
        clearTimeout(matchingTimeoutRef.current);
        clearTimeout(answerFxTimeoutRef.current);
        clearTimeout(resultFxTimeoutRef.current);
        clearTimeout(chainCalloutTimeoutRef.current);
        clearInterval(chainLipIntervalRef.current);
        cancelQuestionPronunciation();
        setRoomId(null);
        setRoomData(null);
        setMyQuestionIndex(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setMyScore(0);
        setCountdown(3);
        setTimer(ANSWER_TIME_LIMIT);
        setRatingChange(null);
        setFailureState(null);
        setResultNotice(null);
        setIsRematchLoading(false);
        setAnswerFx(null);
        setResultFx(null);
        setCorrectStreak(0);
        setChainCallout(null);
        setIsPronouncingQuestion(false);
        setIsCharacterSpeaking(false);
        setPronunciationReplayCount(0);
        resultFxPlayedRef.current = null;
    }, [cancelQuestionPronunciation]);

    useEffect(() => {
        autoStartAttemptedRef.current = false;
    }, [directRoomId]);

    // 初期化: ユーザー確認
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            if (isSolo) {
                setMyUid('guest-local');
                setMyDisplayName(stats?.name || 'ゲスト');
                return;
            }

            navigate('/login');
            return;
        }

        setMyUid(user.uid);

        if (stats?.name) {
            setMyDisplayName(stats.name);
            return;
        }

        getUserProfile(user.uid).then(result => {
            if (result.success) {
                setMyDisplayName(result.data.displayName || user.displayName || 'Player');
            } else {
                setMyDisplayName(user.displayName || 'Player');
            }
        });
    }, [isSolo, navigate, stats?.name]);

    // ルームデータ更新時
    useEffect(() => {
        if (!roomData || !myUid) return;

        // ゲーム開始検出
        if (roomData.status === 'playing' && phase === 'matching') {
            clearTimeout(matchingTimeoutRef.current);
            setPhase('countdown');
        }

        if (roomData.status === 'finished' && phase === 'matching') {
            clearTimeout(matchingTimeoutRef.current);
            setFailureState({
                title: '対戦が成立しませんでした',
                message: '相手がマッチングをキャンセルしたため、対戦を開始できませんでした。',
            });
            setPhase('error');
            return;
        }

        // ゲーム終了検出（相手が先にフィニッシュした時）
        if (roomData.status === 'finished' && (phase === 'playing' || phase === 'countdown')) {
            clearInterval(timerIntervalRef.current);
            clearTimeout(feedbackTimeoutRef.current);
            const opponent = roomData.player1.uid === myUid ? roomData.player2 : roomData.player1;
            const opponentScore = opponent?.score || 0;
            const localMyScore = roomData.player1.uid === myUid ? roomData.player1.score : roomData.player2?.score || 0;

            if (roomData.finishReason === 'opponent_left') {
                setResultNotice('対戦相手が退出したため、対戦が終了しました。');
            } else if (localMyScore < matchTargetCorrect && opponentScore < matchTargetCorrect) {
                setResultNotice('規定問題を消化して対戦が終了しました。');
            } else {
                setResultNotice(null);
            }
            setPhase('result');
        }
    }, [roomData, phase, myUid, matchTargetCorrect]);

    useEffect(() => {
        if (phase !== 'matching' || isFriendMatch) return;

        clearTimeout(matchingTimeoutRef.current);
        matchingTimeoutRef.current = setTimeout(async () => {
            if (roomId && !isSolo) {
                const leaveResult = await leaveRoom(roomId, myUid, { waitingOnly: true });
                if (leaveResult?.status === 'already_started') {
                    return;
                }
            }
            setFailureState({
                title: '相手が見つかりませんでした',
                message: '30秒待っても対戦相手が見つかりませんでした。時間を置いてもう一度試してください。',
            });
            setPhase('error');
        }, MATCHING_TIMEOUT_MS);

        return () => clearTimeout(matchingTimeoutRef.current);
    }, [phase, roomId, myUid, isSolo, isFriendMatch]);

    // カウントダウン
    useEffect(() => {
        if (phase !== 'countdown') return;
        setCountdown(3);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setPhase('playing');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase]);

    // クリーンアップ
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
            clearInterval(timerIntervalRef.current);
            clearTimeout(feedbackTimeoutRef.current);
            clearTimeout(matchingTimeoutRef.current);
            clearTimeout(answerFxTimeoutRef.current);
            clearTimeout(resultFxTimeoutRef.current);
            clearTimeout(chainCalloutTimeoutRef.current);
            cancelQuestionPronunciation();
            if (audioContextRef.current?.state && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, [cancelQuestionPronunciation]);

    useEffect(() => {
        if (phase === 'playing') return;
        clearChainCallout();
        cancelQuestionPronunciation();
    }, [phase, clearChainCallout, cancelQuestionPronunciation]);

    useEffect(() => {
        if (!isListeningBattle || phase !== 'playing' || !roomData?.questions?.length) return;
        const question = roomData.questions[myQuestionIndex];
        if (!question?.word) return;

        setPronunciationReplayCount(0);
        speakQuestionWord(question.word);
    }, [isListeningBattle, phase, roomData, myQuestionIndex, speakQuestionWord]);

    useEffect(() => {
        if (phase === 'countdown' && countdown > 0) {
            playUiTone(420 + ((4 - countdown) * 90), 120, { type: 'triangle', gain: 0.025 });
        }

        if (previousPhaseRef.current === 'countdown' && phase === 'playing') {
            playSE('se_correct');
            playUiTone(880, 180, { type: 'sine', gain: 0.03 });
        }

        previousPhaseRef.current = phase;
    }, [countdown, phase, playSE, playUiTone]);

    useEffect(() => {
        if (phase !== 'result' || !roomData || resultFxPlayedRef.current === roomData.id) return;

        resultFxPlayedRef.current = roomData.id;
        setResultFx(null);

        const opponent = roomData.player1?.uid === myUid ? roomData.player2 : roomData.player1;
        const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, matchTargetCorrect);
        const didWin = isSolo || winnerUid === myUid || (!winnerUid && (myScore > (opponent?.score || 0)));

        if (didWin) {
            setResultFx('victory');
            playSE('gacha');
            playUiTone(784, 150, { type: 'triangle', gain: 0.03 });
            playUiTone(1046, 220, { type: 'triangle', gain: 0.028, delayMs: 120 });
            resultFxTimeoutRef.current = setTimeout(() => {
                setResultFx(null);
            }, 1800);
        }
    }, [phase, roomData, myUid, myScore, isSolo, matchTargetCorrect, playSE, playUiTone]);

    // 次の問題へ進む（ローカル管理）
    const goToNextQuestion = useCallback(async (wasCorrect) => {
        const newScore = wasCorrect ? myScore + 1 : myScore;
        const nextIndex = myQuestionIndex + 1;

        // 対戦モード：正解数が目標に達したか判定
        if (!isSolo && newScore >= matchTargetCorrect) {
            clearInterval(timerIntervalRef.current);
            setMyScore(newScore);
            await markFinished(roomId, myUid, 'completed');
            setPhase('result');
            return;
        }

        // 問題プールを使い切った場合もゲーム終了
        if (roomData && nextIndex >= roomData.questions.length) {
            clearInterval(timerIntervalRef.current);
            setMyScore(newScore);
            if (!isSolo) {
                await markFinished(roomId, myUid, 'questions_exhausted');
            }
            setPhase('result');
            return;
        }

        setMyQuestionIndex(nextIndex);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setTimer(ANSWER_TIME_LIMIT);
    }, [isSolo, matchTargetCorrect, myQuestionIndex, roomId, myUid, myScore, roomData]);

    useEffect(() => {
        if (phase !== 'result' || !roomData || ratingChange !== null || !updateStats) return;
        if (!isSolo && roomData.status !== 'finished') return;

        if (isSolo) {
            setRatingChange({ newRating: myRating, change: 0 });
            return;
        }

        if (isFriendMatch) {
            return;
        }

        const opponent = roomData.player1.uid === myUid ? roomData.player2 : roomData.player1;
        const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, matchTargetCorrect);
        const didWin = winnerUid === null ? null : winnerUid === myUid;
        const opRating = opponent?.rating || DEFAULT_RATING;
        const result = didWin === null
            ? calculateDrawRatingChange(myRating, opRating)
            : calculateRatingChange(myRating, opRating, didWin);

        setRatingChange(result);
        updateStats({ multiplayerRating: result.newRating });
    }, [phase, roomData, ratingChange, updateStats, isSolo, isFriendMatch, myUid, myRating, matchTargetCorrect]);

    const queueAdvance = useCallback((wasCorrect, delayMs, submitPromise = Promise.resolve()) => {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => {
            void (async () => {
                try {
                    await submitPromise;
                } catch (err) {
                    console.error('Submit answer error:', err);
                }

                await goToNextQuestion(wasCorrect);
            })();
        }, delayMs);
    }, [goToNextQuestion]);

    // マッチング開始
    const startMatching = useCallback(async () => {
        if (!myUid) return;
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        resetMatchState();
        setPhase('matching');
        setError(null);
        setPrevLevelLabel(myLevelInfo.label);

        if (isFriendMatch) {
            setRoomId(directRoomId);

            const unsub = subscribeToRoom(directRoomId, (data) => {
                if (!data) {
                    setFailureState({
                        title: '招待が見つかりません',
                        message: 'フレンド対戦の招待ルームが見つかりませんでした。もう一度招待を送り直してください。',
                    });
                    setPhase('error');
                    return;
                }
                setRoomData(data);
            });
            unsubscribeRef.current = unsub;

            const joinResult = await joinFriendRoom(
                directRoomId,
                myUid,
                myDisplayName || 'Player',
                myCharacterId,
                myEquippedSkin,
                myRating,
            );

            if (!joinResult.success) {
                setFailureState({
                    title: 'フレンド対戦に参加できませんでした',
                    message: joinResult.error || '招待の状態を確認してから、もう一度お試しください。',
                });
                setPhase('error');
            }
            return;
        }

        if (isSolo) {
            // ソロモードの場合はFirestore通信をスキップして即座に遊ぶ
            // queryLevel が指定されていれば優先、なければ現在のレートのレベル
            const targetLevel = queryLevel || myLevelInfo.level;
            // 指定レベルのすべての単語を問題として用意する（上限999）
            const questions = generateQuestions(targetLevel, 999);
            setRoomData({
                status: 'playing',
                questions,
                player1: {
                    uid: myUid,
                    displayName: myDisplayName,
                    score: 0,
                    answers: [],
                    characterId: myCharacterId,
                    equippedSkin: myEquippedSkin
                },
                player2: null,
                winnerUid: null,
                finishReason: null
            });
            setPhase('countdown');
            return;
        }

        try {
            const { roomId: newRoomId } = await findOrCreateRoom(
                myUid, 
                myDisplayName, 
                myCharacterId, 
                myEquippedSkin,
                myRating
            );
            setRoomId(newRoomId);

            const unsub = subscribeToRoom(newRoomId, (data) => {
                if (!data) {
                    clearTimeout(matchingTimeoutRef.current);
                    setFailureState({
                        title: 'ルームが見つかりません',
                        message: '対戦ルームが閉じられたため、マッチングを続けられませんでした。',
                    });
                    setPhase('error');
                    return;
                }
                setRoomData(data);
            });
            unsubscribeRef.current = unsub;
        } catch (err) {
            console.error('Matching error:', err);
            setError('マッチングに失敗しました。もう一度お試しください。');
            setPhase('init');
        }
    }, [
        directRoomId,
        isFriendMatch,
        isSolo,
        myCharacterId,
        myDisplayName,
        myEquippedSkin,
        myLevelInfo.label,
        myLevelInfo.level,
        myRating,
        myUid,
        resetMatchState,
        queryLevel,
    ]);

    useEffect(() => {
        if (!isFriendMatch || !myUid || phase !== 'init' || autoStartAttemptedRef.current) return;

        autoStartAttemptedRef.current = true;
        void startMatching();
    }, [isFriendMatch, myUid, phase, startMatching]);

    // 解答選択
    const handleAnswer = useCallback(async (answer) => {
        if (selectedAnswer !== null || !roomData || (!isSolo && !myUid) || showFeedback) return;

        const question = roomData.questions[myQuestionIndex];
        const isCorrect = answer === question.correctAnswer;

        cancelQuestionPronunciation();
        setSelectedAnswer(answer);
        setShowFeedback(true);
        clearInterval(timerIntervalRef.current);

        const submitPromise = !isSolo
            ? submitAnswer(roomId, myUid, myQuestionIndex, answer, isCorrect)
            : Promise.resolve();

        if (isCorrect) {
            const nextStreak = correctStreak + 1;
            triggerAnswerFx('correct');
            playSE('se_correct');
            setCorrectStreak(nextStreak);
            triggerChainCallout(nextStreak);
            setMyScore(prev => prev + 1);
            queueAdvance(true, 1000, submitPromise);
        } else {
            setCorrectStreak(0);
            clearChainCallout();
            triggerAnswerFx('wrong');
            playUiTone(180, 180, { type: 'sawtooth', gain: 0.022 });
            addWrongQuestion({
                subject: '英単語バトル',
                questionId: question.word,
                questionText: question.word,
                correctAnswer: question.correctAnswer,
                userAnswer: answer,
                options: question.options
            });
            queueAdvance(false, WRONG_ANSWER_DELAY, submitPromise);
        }
    }, [selectedAnswer, roomData, myUid, showFeedback, isSolo, roomId, myQuestionIndex, correctStreak, playSE, playUiTone, queueAdvance, triggerAnswerFx, triggerChainCallout, clearChainCallout, cancelQuestionPronunciation]);

    // 「わからない」：正解を見せて不正解扱いで次へ
    const handleSkip = useCallback(() => {
        if (selectedAnswer !== null || !roomData || (!isSolo && !myUid)) return;
        const question = roomData.questions[myQuestionIndex];
        setCorrectStreak(0);
        clearChainCallout();
        cancelQuestionPronunciation();
        setSelectedAnswer('__skip__');
        setShowFeedback(true);
        clearInterval(timerIntervalRef.current);
        const submitPromise = !isSolo
            ? submitAnswer(roomId, myUid, myQuestionIndex, '__skip__', false)
            : Promise.resolve();
        triggerAnswerFx('wrong');
        playUiTone(165, 220, { type: 'sawtooth', gain: 0.02 });
        addWrongQuestion({
            subject: '英単語バトル',
            questionId: question.word,
            questionText: question.word,
            correctAnswer: question.correctAnswer,
            userAnswer: '（わからない）',
            options: question.options
        });
        queueAdvance(false, WRONG_ANSWER_DELAY, submitPromise);
    }, [selectedAnswer, roomData, myUid, isSolo, roomId, myQuestionIndex, playUiTone, queueAdvance, triggerAnswerFx, clearChainCallout, cancelQuestionPronunciation]);

    const handleReplayPronunciation = useCallback(() => {
        if (!isListeningBattle || !roomData || selectedAnswer !== null) return;
        if (pronunciationReplayCount >= LISTENING_REPLAY_LIMIT) return;

        const question = roomData.questions[myQuestionIndex];
        if (!question?.word) return;

        setPronunciationReplayCount((prev) => prev + 1);
        speakQuestionWord(question.word, { isReplay: true });
    }, [isListeningBattle, roomData, selectedAnswer, pronunciationReplayCount, myQuestionIndex, speakQuestionWord]);

    // タイムアップ
    const handleTimeUp = useCallback(() => {
        if (selectedAnswer !== null || !roomData || (!isSolo && !myUid)) return;

        setCorrectStreak(0);
        clearChainCallout();
        cancelQuestionPronunciation();
        setSelectedAnswer('__timeout__');
        setShowFeedback(true);
        triggerAnswerFx('wrong');
        playUiTone(140, 260, { type: 'sawtooth', gain: 0.02 });

        const submitPromise = !isSolo
            ? submitAnswer(roomId, myUid, myQuestionIndex, '__timeout__', false)
            : Promise.resolve();

        const question = roomData.questions[myQuestionIndex];
        addWrongQuestion({
            subject: '英単語バトル',
            questionId: question.word,
            questionText: question.word,
            correctAnswer: question.correctAnswer,
            userAnswer: '（時間切れ）',
            options: question.options
        });

        queueAdvance(false, WRONG_ANSWER_DELAY, submitPromise);
    }, [selectedAnswer, roomData, myUid, isSolo, roomId, myQuestionIndex, playUiTone, queueAdvance, triggerAnswerFx, clearChainCallout, cancelQuestionPronunciation]);

    // 問題タイマー（問題が変わるたびにリセット）
    useEffect(() => {
        if (phase !== 'playing' || !roomData) return;
        clearInterval(timerIntervalRef.current);
        setTimer(ANSWER_TIME_LIMIT);

        timerIntervalRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerIntervalRef.current);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerIntervalRef.current);
    }, [phase, myQuestionIndex, roomData, handleTimeUp]);

    // 退出
    const handleLeave = async () => {
        cancelQuestionPronunciation();
        clearTimeout(matchingTimeoutRef.current);
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        if (roomId && !isSolo) await leaveRoom(roomId, myUid);
        navigate(isFriendMatch ? '/friends' : '/home');
    };

    // プレイ中の途中終了（結果画面へ）
    const handleEndQuiz = () => {
        cancelQuestionPronunciation();
        clearInterval(timerIntervalRef.current);
        clearTimeout(feedbackTimeoutRef.current);
        setPhase('result');
    };

    const resetToInit = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        resetMatchState();
        setPrevLevelLabel(null);
        setPhase('init');
    }, [resetMatchState]);

    const handleFriendRematch = useCallback(async () => {
        if (!isFriendMatch || isSolo || !roomData || !myUid) return;

        const opponent = roomData.player1?.uid === myUid ? roomData.player2 : roomData.player1;
        if (!opponent?.uid) {
            setResultNotice('再戦相手の情報が見つかりませんでした。');
            return;
        }

        setIsRematchLoading(true);
        setResultNotice(null);

        const nextLevel = roomData.rematchLevel || roomData.level || friendLevelParam || myLevelInfo.level;
        const nextTarget = normalizeTargetCorrect(
            roomData.rematchTargetCorrect || roomData.targetCorrect || friendTargetParam,
            matchTargetCorrect,
        );
        const nextBattleMode = normalizeBattleMode(
            roomData.rematchBattleMode || roomData.battleMode || friendModeParam,
            battleMode,
        );
        const result = roomData.rematchRoomId
            ? {
                success: true,
                roomId: roomData.rematchRoomId,
                level: nextLevel,
                targetCorrect: nextTarget,
                battleMode: nextBattleMode,
            }
            : await requestFriendRematch(
                roomData.id || roomId,
                myUid,
                myDisplayName || 'Player',
                myCharacterId,
                myEquippedSkin,
                ratingChange?.newRating || myRating,
                nextLevel,
                nextTarget,
                nextBattleMode,
            );

        if (!result.success || !result.roomId) {
            setIsRematchLoading(false);
            setResultNotice(result.error || '再戦の準備に失敗しました。');
            return;
        }

        resetToInit();
        navigate(
            `/multiplayer-match?room=${result.roomId}&friendName=${encodeURIComponent(opponent.displayName || '')}&battleLevel=${encodeURIComponent(result.level || nextLevel)}&battleTarget=${normalizeTargetCorrect(result.targetCorrect, nextTarget)}&battleMode=${encodeURIComponent(normalizeBattleMode(result.battleMode || nextBattleMode))}`,
        );
    }, [
        battleMode,
        friendLevelParam,
        friendModeParam,
        friendTargetParam,
        isFriendMatch,
        isSolo,
        matchTargetCorrect,
        myCharacterId,
        myDisplayName,
        myEquippedSkin,
        myLevelInfo.level,
        myRating,
        myUid,
        navigate,
        ratingChange?.newRating,
        resetToInit,
        roomId,
        roomData,
    ]);

    // ヘルパー: プレイヤー情報取得
    const getOpponent = () => {
        if (!roomData || !myUid) return null;
        return roomData.player1.uid === myUid ? roomData.player2 : roomData.player1;
    };

    const getMyPlayerFromRoom = () => {
        if (!roomData || !myUid) return null;
        return roomData.player1.uid === myUid ? roomData.player1 : roomData.player2;
    };

    // ================================================================
    // ヘルパー：背景コンポーネント
    const renderBackground = () => (
        <div 
            className={`mp-background ${myEquippedBackground !== 'default' ? 'is-custom' : ''}`} 
            style={myEquippedBackground !== 'default' ? currentBgStyle : { backgroundImage: `url(${BgClassroom})` }} 
        />
    );

    const renderAvatar = (player, fallbackCharacterId = null, fallbackSkin = 'default', alt = 'player') => {
        const avatarSrc = getPlayerAvatarSrc(player, fallbackCharacterId, fallbackSkin);

        if (!avatarSrc) {
            return <span className="mp-avatar-fallback">👤</span>;
        }

        return <img src={avatarSrc} alt={alt} />;
    };

    // ================================================================
    // レンダリング
    // ================================================================

    // 初期画面
    if (phase === 'init') {
        return (
            <div className="mp-screen">
                {renderBackground()}
                <div className="mp-header">
                    <button className="mp-back-btn" onClick={() => navigate('/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1><Swords size={28} /> 英単語バトル</h1>
                </div>
                <div className="mp-init-content">
                    {/* レート表示カード */}
                    <div className="mp-rating-card">
                        <div className="mp-rating-rank">
                            <span className="mp-rank-icon">{myRankInfo.icon}</span>
                            <span className="mp-rank-name">{myRankInfo.rank}</span>
                        </div>
                        <div className="mp-rating-number">{myRating}</div>
                        <div className="mp-rating-level" style={{ color: myLevelInfo.color }}>
                            {myLevelInfo.emoji} 出題範囲: {myLevelInfo.label}
                        </div>
                        {nextLevelInfo.nextLevel && (
                            <div className="mp-rating-next">
                                次のレベルまで: あと {nextLevelInfo.remaining} ポイント
                            </div>
                        )}
                    </div>

                    <div className="mp-title-card">
                        <div className="mp-title-icon">⚔️</div>
                        <h2>{isSolo ? '英単語 早押しクイズ (ソロ)' : '英単語 早押しクイズ'}</h2>
                        <p>{isSolo ? '英単語の知識を試そう！' : 'フレンドやライバルと英単語の知識で対決！'}<br />
                            {isSolo ? '限界まで挑戦！出題される単語に次々答えていこう！' : `先に${matchTargetCorrect}問正解した方の勝ち！`}</p>
                        <div className="mp-rules">
                            <div className="mp-rule-item">🎯 {isSolo ? '限界まで挑戦' : `${matchTargetCorrect}問正解で勝利`}</div>
                            <div className="mp-rule-item">⏱️ 1問{ANSWER_TIME_LIMIT}秒</div>
                            <div className="mp-rule-item">❌ 誤答ペナルティ有</div>
                        </div>
                    </div>
                    <button className="mp-start-btn" onClick={startMatching}>
                        <Swords size={24} />
                        <span>{isSolo ? 'クイズスタート' : '対戦相手を探す'}</span>
                    </button>
                    {error && <div className="mp-error">{error}</div>}
                </div>
            </div>
        );
    }

    // マッチング中
    if (phase === 'matching') {
        const waitingForName = roomData?.invitedDisplayName || friendNameParam || 'フレンド';
        const matchingTitle = isFriendMatch
            ? roomData?.player1?.uid === myUid
                ? `${waitingForName} の参加を待っています...`
                : 'フレンド対戦に参加しています...'
            : '対戦相手を探しています...';
        const matchingText = isFriendMatch
            ? roomData?.player1?.uid === myUid
                ? `${battleModeLabel}・${friendBattleLevelInfo.label}で招待を送信しました`
                : `${battleModeLabel}・${friendBattleLevelInfo.label}の招待ルームに接続中...`
            : 'マッチング中...';
        const matchingHint = isFriendMatch
            ? roomData?.player1?.uid === myUid
                ? `${battleModeLabel}・${friendBattleLevelInfo.label}・${matchTargetCorrect}問先取で対戦が始まります`
                : '相手の準備が整うまで少しお待ちください'
            : '対戦相手が見つかるまでお待ちください';
        const matchingStatusBody = isFriendMatch
            ? roomData?.player1?.uid === myUid
                ? `この画面を開いたまま待機できます。キャンセルすると${battleModeLabel}・${friendBattleLevelInfo.label}・${matchTargetCorrect}問先取の招待は取り消されます。`
                : `参加が完了すると${battleModeLabel}・${friendBattleLevelInfo.label}・${matchTargetCorrect}問先取の対戦へ自動で進みます。`
            : '30秒以内に相手が見つからない場合は自動で待機を終了します。';

        return (
            <div className="mp-screen">
                {renderBackground()}
                <div className="mp-header">
                    <button className="mp-back-btn" onClick={handleLeave}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>{matchingTitle}</h1>
                </div>
                <div className="mp-matching-content">
                    <div className="mp-matching-spinner">
                        <Loader2 className="mp-spin" size={64} />
                    </div>
                    <p className="mp-matching-text">{matchingText}</p>
                    <p className="mp-matching-hint">{matchingHint}</p>
                    <div className="mp-matching-status-card">
                        <div className="mp-matching-status-title">{isFriendMatch ? 'フレンド対戦' : '待機の目安'}</div>
                        <div className="mp-matching-status-body">{matchingStatusBody}</div>
                    </div>
                    <button className="mp-cancel-btn" onClick={handleLeave}>
                        キャンセル
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className="mp-screen">
                {renderBackground()}
                <div className="mp-header">
                    <button className="mp-back-btn" onClick={() => navigate(isFriendMatch ? '/friends' : '/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>対戦を開始できませんでした</h1>
                </div>
                <div className="mp-matching-content">
                    <div className="mp-error-panel">
                        <div className="mp-error-icon">⚠️</div>
                        <h2>{failureState?.title || 'エラーが発生しました'}</h2>
                        <p>{failureState?.message || '時間を置いてもう一度お試しください。'}</p>
                        <div className="mp-error-actions">
                            <button className="mp-start-btn" onClick={() => {
                                setRoomId(null);
                                setRoomData(null);
                                startMatching();
                            }}>
                                もう一度試す
                            </button>
                            <button className="mp-cancel-btn" onClick={() => navigate(isFriendMatch ? '/friends' : '/home')}>
                                {isFriendMatch ? 'フレンド一覧に戻る' : 'ホームに戻る'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // カウントダウン
    if (phase === 'countdown') {
        const opponent = getOpponent();
        return (
            <div className="mp-screen mp-countdown-screen">
                {renderBackground()}
                <div className="mp-countdown-content">
                    <div className="mp-vs-display">
                        <div className="mp-vs-player">
                            <div className="mp-vs-avatar">
                                {renderAvatar(null, myCharacterId, myEquippedSkin, 'me')}
                            </div>
                            <div className="mp-vs-name">{myDisplayName}</div>
                        </div>
                        {!isSolo && (
                            <>
                                <div className="mp-vs-icon">VS</div>
                                <div className="mp-vs-player">
                                    <div className="mp-vs-avatar">
                                        {renderAvatar(opponent, null, 'default', opponent?.displayName || 'opponent')}
                                    </div>
                                    <div className="mp-vs-name">{opponent?.displayName || '???'}</div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="mp-countdown-rings" key={`rings-${countdown}`} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </div>
                    <div className="mp-countdown-number" key={`count-${countdown}`}>{countdown}</div>
                    <p className="mp-countdown-text">対戦スタート！</p>
                </div>
            </div>
        );
    }

    // プレイ中
    if (phase === 'playing' && roomData && roomData.questions.length > 0) {
        if (myQuestionIndex >= roomData.questions.length) {
            return (
                <div className="mp-screen">
                    <div className="mp-loading-content">
                        <Loader2 className="mp-spin" size={48} />
                        <p>結果を集計中...</p>
                    </div>
                </div>
            );
        }

        const question = roomData.questions[myQuestionIndex];
        const opponent = getOpponent();
        const myRoomPlayer = getMyPlayerFromRoom();
        const opScore = opponent?.score || 0;
        const totalQuestions = roomData.questions.length;
        const currentQuestionLabel = `${Math.min(myQuestionIndex + 1, totalQuestions)} / ${totalQuestions}`;
        const targetHint = isSolo
            ? `残り ${Math.max(totalQuestions - myQuestionIndex - 1, 0)} 問`
            : `あと ${Math.max(matchTargetCorrect - myScore, 0)} 問で勝利`;
        const leadMeta = !isSolo ? getLeadMeta(myScore, opScore) : null;
        const mySummary = summarizeAnswers(myRoomPlayer?.answers || []);

        // 進行度の計算 (%)
        // ソロモード時は「全問題数」に対する進捗、対戦モード時は「目標正解数」に対する進捗
        const myProgressPercent = isSolo 
            ? Math.min(((myQuestionIndex + 1) / totalQuestions) * 100, 100)
            : Math.min((myScore / matchTargetCorrect) * 100, 100);
            
        const opProgressPercent = Math.min((opScore / matchTargetCorrect) * 100, 100);

        return (
            <div className={`mp-screen mp-playing-screen ${answerFx ? `mp-answer-fx-${answerFx}` : ''}`}>
                {renderBackground()}
                {answerFx && <div className={`mp-answer-fx-overlay mp-answer-fx-overlay-${answerFx}`} aria-hidden="true" />}
                
                {/* 途中終了ボタン（ソロモード時） */}
                {isSolo && (
                    <button className="mp-end-quiz-btn" onClick={handleEndQuiz} title="クイズを終了して結果を見る">
                        <ArrowLeft size={24} />
                    </button>
                )}
                
                {/* キャラクター（mp-playing-screenに対してabsolute配置） */}
                <div className={`mp-character-area ${renderer === 'live2d' ? 'is-live2d' : ''}`}>
                    <CharacterStage
                        characterId={myCharacterId}
                        renderer={renderer}
                        skinId={myEquippedSkin}
                        scene="match"
                        pose={matchPose}
                        className="character-match"
                        imageClassName="mp-center-character"
                    />
                </div>
                
                {/* プレイ画面のコンテンツラッパー */}
                <div className="mp-playing-content-wrapper">
                    
                    {/* 上部：相手のステータス＆プログレスバー */}
                    {!isSolo && (
                        <div className="mp-top-status">
                            <div className="mp-status-info mp-status-op">
                                <div className="mp-status-header">
                                    <div className="mp-status-name-with-avatar">
                                        <div className="mp-status-avatar">
                                            {renderAvatar(opponent, null, 'default', opponent?.displayName || 'opponent')}
                                        </div>
                                        <div className="mp-status-name">{opponent?.displayName || '???'}</div>
                                    </div>
                                    <div className="mp-status-score">{opScore} / {matchTargetCorrect}</div>
                                </div>
                            </div>
                            <div className="mp-progress-bar-container">
                                <div className="mp-progress-bar-fill mp-bg-op" style={{ width: `${opProgressPercent}%` }} />
                            </div>
                        </div>
                    )}


                    {/* 問題とタイマー（中央） */}
                    <div className="mp-question-container">
                        {chainCallout && (
                            <div className={`mp-chain-callout mp-chain-callout-${chainCallout.tone}`} key={`chain-${chainCallout.count}`}>
                                <div className="mp-chain-label">{chainCallout.label}</div>
                                <div className="mp-chain-text">{chainCallout.callout}</div>
                            </div>
                        )}
                        <div className="mp-question-meta-row">
                            <div className="mp-question-pill mp-question-pill-primary">
                                第{currentQuestionLabel}問
                            </div>
                            {isFriendMatch && (
                                <div className="mp-question-pill mp-question-pill-neutral">
                                    {battleModeLabel}
                                </div>
                            )}
                            <div className="mp-question-pill">
                                {targetHint}
                            </div>
                            {!isSolo && (
                                <div className={`mp-question-pill mp-question-pill-${leadMeta.tone}`}>
                                    {leadMeta.label}
                                </div>
                            )}
                            {isSolo && (
                                <div className="mp-question-pill mp-question-pill-neutral">
                                    正答率 {mySummary.accuracy}%
                                </div>
                            )}
                        </div>
                        <div className={`mp-question-card ${isListeningBattle ? 'mp-question-card-listening' : ''}`}>
                            {isListeningBattle && (
                                <div className="mp-question-audio-row">
                                    <div className={`mp-question-audio-status ${isPronouncingQuestion ? 'is-speaking' : ''}`}>
                                        {isPronouncingQuestion ? '発音中...' : 'リスニング問題'}
                                    </div>
                                    <button
                                        type="button"
                                        className="mp-pronounce-btn"
                                        onClick={handleReplayPronunciation}
                                        disabled={!canUseSpeechSynthesis || selectedAnswer !== null || pronunciationReplayCount >= LISTENING_REPLAY_LIMIT}
                                    >
                                        <Volume2 size={16} />
                                        {pronunciationReplayCount >= LISTENING_REPLAY_LIMIT ? '聞き直し済み' : 'もう一回聞く'}
                                    </button>
                                </div>
                            )}
                            <div className={`mp-question-word ${isListeningBattle && !showFeedback ? 'is-hidden' : ''}`}>
                                {isListeningBattle && !showFeedback ? 'Listen Carefully' : question.word}
                            </div>
                            <p className="mp-question-hint">
                                {isListeningBattle
                                    ? '聞こえた英単語の意味を選ぼう'
                                    : 'この単語の意味は？'}
                            </p>
                            {isListeningBattle && !showFeedback && (
                                <div className="mp-question-subhint">
                                    単語のつづりは回答後に表示されます
                                </div>
                            )}
                        </div>
                        <div className="mp-timer-wrapper">
                            <div
                                className={`mp-timer-bar-fill ${timer <= 3 ? 'mp-timer-danger' : ''}`}
                                style={{ width: `${(timer / ANSWER_TIME_LIMIT) * 100}%` }}
                            />
                            <div className="mp-timer-text-overlay">
                                <Clock size={16} /> {timer}秒
                            </div>
                        </div>
                    </div>

                    {/* 下部：解答ボタン＆自分のステータス */}
                    <div className="mp-bottom-area">
                        {/* 解答ボタン */}
                        <div className="mp-options-grid">
                            {question.options.map((option, idx) => {
                                let btnClass = 'mp-option-btn';
                                if (showFeedback) {
                                    if (option === question.correctAnswer) {
                                        btnClass += ' mp-option-correct';
                                    } else if (option === selectedAnswer && option !== question.correctAnswer) {
                                        btnClass += ' mp-option-wrong';
                                    } else {
                                        btnClass += ' mp-option-disabled';
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        className={btnClass}
                                        onClick={() => handleAnswer(option)}
                                        disabled={selectedAnswer !== null}
                                    >
                                        <span className="mp-option-text">{option}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* わからないボタン（常に表示、回答後はdisabledで位置を固定） */}
                        <div className="mp-skip-wrapper">
                            <button 
                                className="mp-skip-btn" 
                                onClick={handleSkip}
                                disabled={selectedAnswer !== null}
                            >
                                🤔 わからない
                            </button>
                        </div>

                        {/* 自分のプログレスバーとステータス */}
                        <div className="mp-bottom-status-wrapper">
                            <div className="mp-progress-bar-container">
                                <div className="mp-progress-bar-fill mp-bg-me" style={{ width: `${myProgressPercent}%` }} />
                            </div>
                            <div className="mp-status-info mp-status-me">
                                <div className="mp-status-avatar">
                                    {renderAvatar(null, myCharacterId, myEquippedSkin, 'me')}
                                </div>
                                <div className="mp-status-name">{myDisplayName}</div>
                                <div className="mp-status-score">
                                    {isSolo ? `${myScore} / ${totalQuestions}` : `${myScore} / ${matchTargetCorrect}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* フィードバック表示 (画面全体の中央に大きく被せる) */}
                    {showFeedback && selectedAnswer !== question.correctAnswer && (
                        <div className="mp-feedback-center">
                            {selectedAnswer === '__timeout__' ? (
                                <div className="mp-feedback-card mp-fc-timeout">
                                    <h2>❌</h2>
                                    <p>正解: {question.correctAnswer}</p>
                                </div>
                            ) : (
                                <div className="mp-feedback-card mp-fc-wrong">
                                    <h2>❌</h2>
                                    <p>正解: {question.correctAnswer}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {!isSolo && !opponent && (
                        <div className="mp-connection-overlay">
                            <div className="mp-connection-card">
                                <Loader2 className="mp-spin" size={28} />
                                <div className="mp-connection-title">相手の再接続を確認中...</div>
                                <div className="mp-connection-text">切断が続く場合は、この対戦は自動で終了します。</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // リザルト画面
    if (phase === 'result' && roomData) {
        const opponent = getOpponent();
        const myPlayerRoom = getMyPlayerFromRoom();
        const finalMyScore = Math.max(myPlayerRoom?.score || 0, myScore);
        const opScore = opponent?.score || 0;
        const totalQuestions = roomData.questions.length;
        const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, matchTargetCorrect);
        const mySummary = summarizeAnswers(myPlayerRoom?.answers || []);
        const opponentSummary = summarizeAnswers(opponent?.answers || []);
        const finishReasonLabel = getFinishReasonLabel(roomData.finishReason, isSolo);
        const resultLevelInfo = getLevelMeta(roomData.level || friendLevelParam);
        const hasRematchRoom = Boolean(roomData.rematchRoomId);
        const rematchRequestedByMe = hasRematchRoom && roomData.rematchRequestedBy === myUid;
        const rematchJoinLabel = hasRematchRoom && !rematchRequestedByMe
            ? '再戦に参加'
            : '同じ条件で再戦';

        // 勝敗判定
        let resultClass = 'mp-result-draw';
        let resultText = '引き分け！';
        let resultEmoji = '🤝';
        
        if (isSolo) {
            resultClass = 'mp-result-win';
            resultText = 'お疲れ様！';
            resultEmoji = '🎉';
        } else {
            if (winnerUid === myUid) {
                resultClass = 'mp-result-win';
                resultText = '勝利！';
                resultEmoji = '🏆';
            } else if (winnerUid && winnerUid !== myUid) {
                resultClass = 'mp-result-lose';
                resultText = '敗北...';
                resultEmoji = '😢';
            } else if (finalMyScore > opScore) {
                resultClass = 'mp-result-win';
                resultText = '勝利！';
                resultEmoji = '🏆';
            } else if (finalMyScore < opScore) {
                resultClass = 'mp-result-lose';
                resultText = '敗北...';
                resultEmoji = '😢';
            }
        }

        // レベルアップ判定
        const newLevelInfo = ratingChange ? getLevelFromRating(ratingChange.newRating) : myLevelInfo;
        const isLevelUp = prevLevelLabel && newLevelInfo.label !== prevLevelLabel && ratingChange?.change > 0;

        return (
            <div className={`mp-screen ${resultFx ? `mp-result-fx-${resultFx}` : ''}`}>
                {renderBackground()}
                {resultFx === 'victory' && (
                    <div className="mp-result-burst" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                )}
                <div className={`mp-result-content ${resultClass}`}>
                    
                    <div className={`mp-result-character-bg ${renderer === 'live2d' ? 'is-live2d' : ''}`}>
                        {(isSolo || finalMyScore >= opScore) && (
                            <CharacterStage
                                characterId={myCharacterId}
                                renderer={renderer}
                                skinId={myEquippedSkin}
                                scene="match-result"
                                pose={matchPose}
                                className="character-match-result"
                                imageClassName="mp-result-char-img mp-result-char-me"
                            />
                        )}
                    </div>
                    
                    <div className="mp-result-panel">
                        <div className="mp-result-emoji">{resultEmoji}</div>
                        <h2 className="mp-result-text">{resultText}</h2>
                        <div className="mp-result-detail">{finishReasonLabel}</div>
                        {isFriendMatch && (
                            <div className="mp-result-detail">{battleModeLabel} / {resultLevelInfo.label} / {matchTargetCorrect}問先取</div>
                        )}

                        <div className="mp-result-scores">
                            <div className="mp-result-player mp-result-me">
                                <div className="mp-result-player-name">{myDisplayName}</div>
                                <div className="mp-result-player-score">
                                    {isSolo ? `${finalMyScore} / ${totalQuestions}` : finalMyScore}
                                </div>
                            </div>
                            {!isSolo && (
                                <>
                                    <div className="mp-result-vs">-</div>
                                    <div className="mp-result-player mp-result-op">
                                        <div className="mp-result-player-name">{opponent?.displayName || '???'}</div>
                                        <div className="mp-result-player-score">{opScore}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={`mp-result-summary-grid ${isSolo ? 'is-solo' : ''}`}>
                            <div className="mp-result-summary-card">
                                <div className="mp-result-summary-label">自分の正答率</div>
                                <div className="mp-result-summary-value">{mySummary.accuracy}%</div>
                                <div className="mp-result-summary-sub">{mySummary.correctCount} / {Math.max(mySummary.answeredCount, finalMyScore)} 正解</div>
                            </div>
                            <div className="mp-result-summary-card">
                                <div className="mp-result-summary-label">{isSolo ? '回答数' : '相手の正答率'}</div>
                                <div className="mp-result-summary-value">{isSolo ? `${mySummary.answeredCount}問` : `${opponentSummary.accuracy}%`}</div>
                                <div className="mp-result-summary-sub">
                                    {isSolo ? `全${totalQuestions}問中` : `${opponentSummary.correctCount} / ${Math.max(opponentSummary.answeredCount, opScore)} 正解`}
                                </div>
                            </div>
                            {!isSolo && (
                                <div className="mp-result-summary-card">
                                    <div className="mp-result-summary-label">勝敗の差</div>
                                    <div className="mp-result-summary-value">{Math.abs(finalMyScore - opScore)}問差</div>
                                    <div className="mp-result-summary-sub">
                                        {finalMyScore === opScore
                                            ? '最後まで接戦でした'
                                            : finalMyScore > opScore
                                                ? '先行を守り切りました'
                                                : '次は追い上げましょう'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* レート変動表示 */}
                        {resultNotice && (
                            <div className="mp-result-notice">
                                {resultNotice}
                            </div>
                        )}
                        {!resultNotice && isFriendMatch && hasRematchRoom && !rematchRequestedByMe && (
                            <div className="mp-result-notice">
                                相手が再戦ルームを用意しました。このまま続けて対戦できます。
                            </div>
                        )}
                        {ratingChange && !isSolo && (
                            <div className="mp-rating-change-section">
                                <div className="mp-rating-change-label">レート</div>
                                <div className="mp-rating-change-row">
                                    <span className="mp-rating-old">{myRating}</span>
                                    <span className="mp-rating-arrow">→</span>
                                    <span className="mp-rating-new">{ratingChange.newRating}</span>
                                    <span className={`mp-rating-delta ${ratingChange.change >= 0 ? 'mp-delta-up' : 'mp-delta-down'}`}>
                                        {ratingChange.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        {ratingChange.change >= 0 ? '+' : ''}{ratingChange.change}
                                    </span>
                                </div>
                                {isLevelUp && (
                                    <div className="mp-level-up-banner">
                                        🎉 レベルアップ！ 出題範囲が {newLevelInfo.emoji} {newLevelInfo.label} に上がりました！
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mp-result-actions">
                            {!isFriendMatch && (
                                <button className="mp-rematch-btn" onClick={resetToInit}>
                                    もう一度対戦する
                                </button>
                            )}
                            {isFriendMatch && opponent?.uid && (
                                <button className="mp-rematch-btn" onClick={handleFriendRematch} disabled={isRematchLoading}>
                                    {isRematchLoading ? '再戦を準備中...' : rematchJoinLabel}
                                </button>
                            )}
                            <button className="mp-home-btn" onClick={() => navigate(isFriendMatch ? '/friends' : '/home')}>
                                {isFriendMatch ? 'フレンド一覧に戻る' : 'ホームに戻る'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ローディング
    return (
        <div className="mp-screen">
            <div className="mp-loading-content">
                <Loader2 className="mp-spin" size={48} />
                <p>読み込み中...</p>
            </div>
        </div>
    );
};

export default MultiplayerMatch;
