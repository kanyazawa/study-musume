import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Swords, Clock, Loader2, TrendingUp, TrendingDown, Volume2, Flag } from 'lucide-react';
import { getCurrentUser, getPublicProfile } from '../firebase/auth';
import {
    findOrCreateRoom,
    joinFriendRoom,
    requestFriendRematch,
    subscribeToRoom,
    submitAnswer,
    leaveRoom,
    markFinished,
    TARGET_CORRECT,
} from '../firebase/matching';
import { getBackgroundStyle } from '../utils/cosmeticUtils';
import {
    getLevelFromRating,
    calculateRatingChange,
    calculateDrawRatingChange,
    LEVEL_THRESHOLDS,
    DEFAULT_RATING
} from '../utils/ratingUtils';
import {
    getBattleModeLabel,
    buildQuestionOptions,
    clampTugPosition,
    normalizeBattleMode,
    normalizeTargetCorrect,
    resolveTugAdvantageMeta,
    resolveWinnerUid,
    TUG_GAUGE_LIMIT,
    shuffleArray,
    summarizeAnswers,
} from '../utils/matchUtils';
import { applyCharacterEvaluationResult } from '../utils/characterEvaluationUtils';
import { addWrongQuestion } from '../utils/reviewUtils';
import { getVocabByLevel } from '../data/vocabData';
import { saveLastStudyTopic } from '../data/studyData';
import { getCharacterLabel } from '../data/characterData';
import { getCustomVocabStudyItems } from '../utils/customVocabUtils';
import { buildDailyLoopPhasePatch } from '../utils/dailyLoopUtils';
import { getInventoryItemQuantity, removeFromInventory } from '../utils/itemUtils';
import { useSound } from '../contexts/SoundContext';
import { getTtsSettings, TTS_ENGINES } from '../utils/ttsSettings';
import { getEngineBaseUrl, isEngineAvailable, resolveSpeakerIdForEngine, speakWithEngine } from '../utils/voicevoxUtils';
import CharacterStage from '../components/character/CharacterStage';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { resolveMatchCharacterPose } from '../utils/matchExpressionState';
import { getGameLoopSnapshot } from '../utils/gameLoopUtils';
import { getMatchFeedbackCopy, getReactionEmotion, resolveMatchReactionTone, resolveReactionVoiceSelection, shouldTriggerReactionFeverFx } from '../utils/studyReactionUtils';
import StudyFlashcardSession from '../components/StudyFlashcardSession';
import {
    getFlashcardScheduleChoices,
    getNextFlashcardVocabBatchForLevel,
    getNextVocabBatchForLevel,
    recordVocabAttempt,
    recordVocabFlashcardSchedule,
} from '../utils/vocabStudyUtils';
import './MultiplayerMatch.css';

// Background & Character Images
import BgClassroom from '../assets/images/bg_classroom.webp';
import CharacterMain from '../assets/images/character_new.webp';
import CharacterRen from '../assets/images/character_ren.webp';
import CharacterCasual from '../assets/images/character_casual_v9.webp';
import CharacterGym from '../assets/images/character_gym.webp';
import CharacterCasualGray from '../assets/images/character_casual_gray_hoodie.webp';
import CharacterCasualBlack from '../assets/images/character_casual_hoodie.webp';
import FireflyNormal from '../assets/images/firefly/firefly_normal.webp';
import SparkleSelectImage from '../assets/images/sparkle/sparkle_select.png';
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
const fireflyImages = {
    'default': FireflyNormal,
};
const sparkleImages = {
    'default': SparkleSelectImage,
};

const getCharacterImage = (characterId, skinId) => {
    const images = characterId === 'sparkle'
        ? sparkleImages
        : characterId === 'firefly'
        ? fireflyImages
        : characterId === 'ren'
            ? renImages
            : noahImages;
    return images[skinId] || images['default'];
};

const getPlayerAvatarSrc = (player, fallbackCharacterId = 'noah', fallbackSkin = 'default') => {
    if (!player && !fallbackCharacterId) {
        return null;
    }

    return getCharacterImage(player?.characterId || fallbackCharacterId, player?.equippedSkin || fallbackSkin);
};

const ANSWER_TIME_LIMIT = 10; // 1問あたりの制限時間（秒）
const SOLO_ASSIST_TIME_BONUS = 5;
const SOLO_ASSIST_HINT_ITEM_ID = 'assist_eliminate_choice';
const SOLO_ASSIST_CONTINUE_ITEM_ID = 'assist_chain_guard';
const SOLO_ASSIST_TIME_ITEM_ID = 'assist_time_extend';
const WRONG_ANSWER_DELAY = 1200; // 不正解時に正解を表示する時間（ms）
const MATCHING_TIMEOUT_MS = 30000;
const LISTENING_REPLAY_LIMIT = 1;
const SOLO_INITIAL_QUESTION_BATCH = 4;
const SOLO_BACKGROUND_QUESTION_BATCH = 8;
const SOLO_PRELOAD_THRESHOLD = 2;
const SOLO_SESSION_PRESETS = [
    {
        id: 'standard',
        label: '標準',
        eta: '約4分',
        description: 'ちゃんと進めたい時のちょうどいい区切り',
        count: 20,
    },
    {
        id: 'full',
        label: '1周',
        eta: '全部',
        description: 'このレベルを最初から最後まで確認',
        count: Number.POSITIVE_INFINITY,
    },
];
const CUSTOM_SOLO_LEVEL = 'custom';
const CUSTOM_SOLO_LEVEL_META = {
    level: CUSTOM_SOLO_LEVEL,
    label: '自作単語',
    emoji: '📝',
    color: '#fb923c',
};

const getSoloSessionOptions = (totalQuestions) => {
    if (totalQuestions <= 0) return [];

    if (totalQuestions <= 20) {
        return [
            {
                id: 'full',
                label: '1周',
                eta: '全部',
                description: 'このレベルを最初から最後まで確認',
                actualCount: totalQuestions,
            },
        ];
    }

    return SOLO_SESSION_PRESETS.map((preset) => ({
        ...preset,
        actualCount: Number.isFinite(preset.count)
            ? Math.min(preset.count, totalQuestions)
            : totalQuestions,
    }));
};

const getQuestionWordSizeClass = (word = '') => {
    const length = String(word).trim().length;

    if (length >= 18) return 'is-compact';
    if (length >= 12) return 'is-long';
    return '';
};

const getOptionTextSizeClass = (text = '') => {
    const length = String(text).trim().length;

    if (length >= 18) return 'is-compact';
    if (length >= 11) return 'is-long';
    return '';
};

const createInitialSoloAssistState = () => ({
    hintState: 'available',
    extendState: 'available',
    continueState: 'available',
});

const getSoloInitCoachCopy = ({ characterId, questionCount, dueCount, levelLabel }) => {
    switch (characterId) {
        case 'ren':
            return {
                line: questionCount
                    ? `今日は${questionCount}問でいこう。短くても、精度は落とさないぞ。`
                    : '今日は何問やる？ 方向が決まれば、あとは一緒に進められる。',
                subline: dueCount > 0
                    ? `終わったら弱点ノート${dueCount}件も確認だ。抜けは今のうちに埋めよう。`
                    : `${levelLabel}の単語で整えていこう。焦らなくていい、でも雑にはしない。`,
            };
        case 'firefly':
            return {
                line: questionCount
                    ? `今日は${questionCount}問だけ、一緒に灯していこっか。`
                    : '今日は何問にする？ 無理のないところから、ふわっと始めよう。',
                subline: dueCount > 0
                    ? `終わったら弱点ノート${dueCount}件も見ようね。こぼれたところ、そっと拾っていこ。`
                    : `${levelLabel}の単語で、じんわり調子を上げていこう。`,
            };
        case 'sparkle':
            return {
                line: questionCount
                    ? `今日は${questionCount}問？ いいね、ぱっと始めて景気よくいこっか。`
                    : '今日は何問にする？ せっかくだし、気持ちよく走れる本数でいこ。',
                subline: dueCount > 0
                    ? `終わったら弱点ノート${dueCount}件も回収しよ。取りこぼし、放っとくのはもったいないし。`
                    : `${levelLabel}の単語、軽やかに片づけちゃお。`,
            };
        case 'noah':
        default:
            return {
                line: questionCount
                    ? `今日は${questionCount}問でいくわよ。ちゃんと最後まで付き合いなさい。`
                    : '今日は何問やるの？ 中途半端はだめよ、決めてから始めなさい。',
                subline: dueCount > 0
                    ? `終わったら弱点ノート${dueCount}件も見るわ。取りこぼしは今のうちに片づけなさい。`
                    : `${levelLabel}の単語でテンポよく積み上げるわよ。ちゃんとついてきなさい。`,
            };
    }
};

const sanitizeMatchQuestions = (questions, fallbackMeanings = []) => {
    const resolvedFallbackMeanings = Array.isArray(fallbackMeanings) ? fallbackMeanings : [];

    return (Array.isArray(questions) ? questions : []).map((question) => {
        const word = String(question?.word ?? '').trim();
        const correctAnswer = String(question?.correctAnswer ?? question?.meaning ?? '').trim();

        if (!word || !correctAnswer) {
            return null;
        }

        const cleanedOptions = Array.isArray(question?.options)
            ? [...new Set(question.options.map((option) => String(option ?? '').trim()).filter(Boolean))]
            : [];
        const resolvedOptions = cleanedOptions.includes(correctAnswer) && cleanedOptions.length >= 2
            ? cleanedOptions
            : buildQuestionOptions(correctAnswer, resolvedFallbackMeanings);
        const finalOptions = shuffleArray([...new Set([correctAnswer, ...resolvedOptions].filter(Boolean))]);

        if (finalOptions.length < 2) {
            return null;
        }

        return {
            ...question,
            questionId: String(question?.questionId ?? word).trim() || word,
            itemId: String(question?.itemId ?? question?.questionId ?? '').trim(),
            subject: String(question?.subject ?? '英単語バトル').trim() || '英単語バトル',
            word,
            correctAnswer,
            options: finalOptions,
        };
    }).filter(Boolean);
};

const sanitizeVocabItems = (items) => {
    return (Array.isArray(items) ? items : []).map((item) => {
        const word = String(item?.word ?? '').trim();
        const meaning = String(item?.meaning ?? '').trim();

        if (!word || !meaning) {
            return null;
        }

        return {
            ...item,
            word,
            meaning,
        };
    }).filter(Boolean);
};

const buildQuestionsFromVocabItems = (vocabItems, fallbackMeanings = []) => {
    return sanitizeMatchQuestions(
        (Array.isArray(vocabItems) ? vocabItems : []).map((item) => ({
            questionId: item?.id || item?.questionId || item?.word,
            itemId: item?.id || item?.questionId || '',
            subject: item?.subject || '英単語バトル',
            word: item?.word,
            correctAnswer: item?.meaning,
            options: buildQuestionOptions(item?.meaning, fallbackMeanings),
        })),
        fallbackMeanings,
    );
};

const buildSoloRoomData = ({
    questions,
    uid,
    displayName,
    characterId,
    skinId,
    level,
    retry = false,
    sessionLabel = '',
    totalQuestionCount = questions.length,
    sourceQuestionCount = questions.length,
}) => ({
    id: `solo-${level}-${questions.length}-${Date.now()}`,
    status: 'playing',
    questions,
    level,
    soloRetry: retry,
    sessionLabel,
    totalQuestionCount,
    sourceQuestionCount,
    player1: {
        uid,
        displayName,
        score: 0,
        answers: [],
        characterId,
        equippedSkin: skinId,
    },
    player2: null,
    winnerUid: null,
    finishReason: null,
});

const getLevelMeta = (level) => {
    return LEVEL_THRESHOLDS.find((threshold) => threshold.level === level) || LEVEL_THRESHOLDS[0];
};

const getSoloLevelMeta = (level) => {
    if (level === CUSTOM_SOLO_LEVEL) {
        return CUSTOM_SOLO_LEVEL_META;
    }

    return getLevelMeta(level);
};

const getFinishReasonLabel = (finishReason, isSolo) => {
    if (isSolo) {
        if (finishReason === 'manual_exit') {
            return 'ここで一区切り';
        }

        return 'ソロチャレンジ完了';
    }

    switch (finishReason) {
        case 'gauge_breakthrough':
            return 'ゲージを押し切って決着';
        case 'completed':
            return '目標正解数に到達';
        case 'questions_exhausted':
            return '規定問題でゲージ判定';
        case 'opponent_left':
            return '相手の退出で終了';
        default:
            return '対戦終了';
    }
};

const getSoloAccuracyReaction = ({ accuracy = 0, answeredCount = 0, clearedSoloRetry = false, isRetrySession = false } = {}) => {
    if (answeredCount <= 0) {
        return 'まだ慣らし運転ってところね。次は最初の1問から、ちゃんと取りなさい。';
    }

    if (clearedSoloRetry) {
        return 'ふふん、悪くないじゃない。苦手だったところまで、ちゃんと回収できてるわ。';
    }

    if (accuracy <= 50) {
        return isRetrySession
            ? 'まだ甘いわ。間違えたところ、ちゃんと復習してきなさい。'
            : '5割以下は見過ごせないわね。間違えたところ、ちゃんと復習してきなさい。';
    }

    if (accuracy <= 70) {
        return '惜しいわね。苦手な単語だけ拾い直せば、もっと伸びるわ。';
    }

    if (accuracy <= 85) {
        return 'なかなかいいじゃない。この調子で正答率を安定させていきなさい。';
    }

    if (accuracy < 100) {
        return 'ふふん、いい感じよ。このペースならちゃんと定着していくわ。';
    }

    return isRetrySession
        ? '完璧じゃない。苦手克服チャレンジ、きれいに決めたわね。'
        : '全問正解ね。ちゃんと身についてるじゃない。';
};

const getSoloManualExitNotice = ({
    answeredCount = 0,
    totalQuestions = 0,
    accuracy = 0,
    retryCount = 0,
} = {}) => {
    if (answeredCount <= 0) {
        return '今日はここで切り上げでいいわ。まだ始めたばかりだし、次は最初の数問から落ち着いて取りにいきなさい。';
    }

    if (answeredCount === 1) {
        return retryCount > 0
            ? '今日はここで一区切りね。1問だけでも触れたのは前進よ。間違えたところは残してあるから、次に開いたらすぐ取り返しなさい。'
            : '今日はここで一区切りね。1問だけでも触れたのは前進よ。続きはまた落ち着いたときに、きれいにつないでいきましょ。';
    }

    if (answeredCount < totalQuestions) {
        return retryCount > 0
            ? `今日は${answeredCount}問まで進めたわ。${accuracy >= 70 ? 'ペースは悪くないし、' : ''}間違えた${retryCount}問は残してあるから、次はそこから整えていきなさい。`
            : `今日は${answeredCount}問まで進めたわ。${accuracy >= 70 ? 'この調子なら、続きも気持ちよく拾えるはずよ。' : 'ここで無理に詰め込むより、次に落ち着いて続けた方がいいわ。'}`;
    }

    return `今回は${totalQuestions}問ぶん、ちゃんと見られたわね。ここで締めても十分よ。`;
};

const getSoloCompactResultCardCopy = ({ isManualExit = false, clearedSoloRetry = false } = {}) => {
    if (isManualExit) {
        return {
            badge: 'Break Time',
            line: '今日はここで止めて大丈夫。続きは次にそのまま拾えるわ。',
        };
    }

    if (clearedSoloRetry) {
        return {
            badge: 'Retry Clear',
            line: '取りこぼしはきれいに回収できたわ。このまま気持ちよく締めていいわよ。',
        };
    }

    return {
        badge: 'Good Work',
        line: '今回はここまで確認できたわ。この感触、ちゃんと覚えておきなさい。',
    };
};

const getSoloResultNotice = ({
    accuracy = 0,
    answeredCount = 0,
    totalQuestions = 0,
    soloRetryQuestions = [],
    isManualExit = false,
    clearedSoloRetry = false,
    isRetrySession = false,
    sessionLabel = '',
    sourceQuestionCount = 0,
} = {}) => {
    const reaction = getSoloAccuracyReaction({
        accuracy,
        answeredCount,
        clearedSoloRetry,
        isRetrySession,
    });
    const retryCount = Array.isArray(soloRetryQuestions) ? soloRetryQuestions.length : 0;

    if (isManualExit) {
        return getSoloManualExitNotice({
            answeredCount,
            totalQuestions,
            accuracy,
            retryCount,
        });
    }

    if (clearedSoloRetry) {
        return `${reaction} 今回の取りこぼしは、これで全部回収完了よ。`;
    }

    return `${reaction} ${isRetrySession ? '苦手克服チャレンジ完了。' : `${sessionLabel || `${totalQuestions}問セット`}完了。`}${sourceQuestionCount > totalQuestions ? ` このレベル全${sourceQuestionCount}問のうち、今回は${totalQuestions}問で区切りました。` : ` 全${totalQuestions}問を確認しました。`}${retryCount > 0 ? ` 間違えた${retryCount}問だけ苦手克服チャレンジに進めます。` : ' 全問正解です。'}`;
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
    const { isMuted, playSE, playVoice, voiceVolume, acquireVoiceFocus } = useSound();
    const searchParams = new URLSearchParams(location.search);
    const isSolo = searchParams.get('mode') === 'solo';
    const isNativePlatform = Capacitor.isNativePlatform();
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
    const resolvedRenderer = resolveCharacterRenderer({
        preferredRenderer,
        characterId: myCharacterId,
        skinId: myEquippedSkin,
    });
    const renderer = isNativePlatform ? 'image' : resolvedRenderer;
    
    const [phase, setPhase] = useState('init'); // init | matching | countdown | playing | result | error
    const [roomId, setRoomId] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [myUid, setMyUid] = useState(null);
    const [myDisplayName, setMyDisplayName] = useState('');
    const [myQuestionIndex, setMyQuestionIndex] = useState(0); // 自分の現在の問題番号（ローカル管理）
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [countdown, setCountdown] = useState(3);
    const [timer, setTimer] = useState(ANSWER_TIME_LIMIT);
    const [soloAssistState, setSoloAssistState] = useState(createInitialSoloAssistState);
    const [hiddenOption, setHiddenOption] = useState(null);
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
    const [persistentEmotion, setPersistentEmotion] = useState(null);
    const [answerTone, setAnswerTone] = useState(null);
    const [momentumCallout, setMomentumCallout] = useState(null);
    const [lastAnswerResult, setLastAnswerResult] = useState(null);
    const [highestCorrectStreak, setHighestCorrectStreak] = useState(0);
    const [isFeverFxActive, setIsFeverFxActive] = useState(false);
    const [feverFxKey, setFeverFxKey] = useState(0);
    const [selectedSoloSessionId, setSelectedSoloSessionId] = useState('standard');
    const [selectedSoloStudyMode, setSelectedSoloStudyMode] = useState('quiz');
    const [isSoloQuestionBatchLoading, setIsSoloQuestionBatchLoading] = useState(false);
    const [flashcardSessionCards, setFlashcardSessionCards] = useState([]);
    const [flashcardSessionMeta, setFlashcardSessionMeta] = useState(null);

    // 連鎖ボイスを事前読み込みしておく（ラグ解消のため）
    const chainAudioCacheRef = useRef({});
    useEffect(() => {
        if (isNativePlatform || typeof window === 'undefined') {
            return;
        }

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
    }, [isNativePlatform]);

    const chainLipIntervalRef = useRef(null);
    const soloQuestionQueueRef = useRef([]);
    const soloBatchLoadingRef = useRef(false);
    const soloBatchTimeoutRef = useRef(null);

    const unsubscribeRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const feedbackTimeoutRef = useRef(null);
    const matchingTimeoutRef = useRef(null);
    const autoStartAttemptedRef = useRef(false);
    const answerFxTimeoutRef = useRef(null);
    const resultFxTimeoutRef = useRef(null);
    const resultFxPlayedRef = useRef(null);
    const battleResultPersistedRef = useRef(false);
    const previousPhaseRef = useRef('init');
    const audioContextRef = useRef(null);
    const chainCalloutTimeoutRef = useRef(null);
    const momentumCalloutTimeoutRef = useRef(null);
    const feverFxTimeoutRef = useRef(null);
    const pronunciationRequestIdRef = useRef(0);
    const lastMomentumEventKeyRef = useRef(null);

    useEffect(() => () => {
        if (feverFxTimeoutRef.current) {
            clearTimeout(feverFxTimeoutRef.current);
        }
    }, []);

    // レート関連の情報
    const myRating = stats?.multiplayerRating || DEFAULT_RATING;
    const myLevelInfo = getLevelFromRating(myRating);
    const gameLoopSnapshot = useMemo(() => getGameLoopSnapshot(stats), [stats]);
    const soloLevel = queryLevel || myLevelInfo.level;
    const soloLevelMeta = useMemo(() => getSoloLevelMeta(soloLevel), [soloLevel]);
    useEffect(() => {
        if (!isSolo) {
            return;
        }

        saveLastStudyTopic('english', 'eng_vocab', `eng_vocab_${soloLevel}`, soloLevelMeta.label, '英単語', {
            routePath: `/multiplayer-match?mode=solo&level=${encodeURIComponent(soloLevel)}`,
            subjectName: '英語',
            categoryName: '単語',
            unitName: '英単語',
            mode: 'vocab',
            modeLabel: '英単語',
            level: soloLevel,
            resumeLabel: `${soloLevelMeta.label}の単語`,
        });
    }, [isSolo, soloLevel, soloLevelMeta.label]);
    const soloVocabPool = useMemo(
        () => sanitizeVocabItems(
            soloLevel === CUSTOM_SOLO_LEVEL
                ? getCustomVocabStudyItems()
                : getVocabByLevel(soloLevel)
        ),
        [soloLevel]
    );
    const questionOptionMeanings = useMemo(
        () => soloVocabPool.map((item) => String(item?.meaning ?? '').trim()).filter(Boolean),
        [soloVocabPool]
    );
    const soloInitialBatchSize = isNativePlatform ? 1 : SOLO_INITIAL_QUESTION_BATCH;
    const soloBackgroundBatchSize = isNativePlatform ? 2 : SOLO_BACKGROUND_QUESTION_BATCH;
    const soloPreloadThreshold = isNativePlatform ? 0 : SOLO_PRELOAD_THRESHOLD;
    const shouldRenderMatchCharacter = !(isNativePlatform && isSolo);
    const soloSessionOptions = useMemo(
        () => (isSolo ? getSoloSessionOptions(soloVocabPool.length) : []),
        [isSolo, soloVocabPool.length]
    );
    const selectedSoloSessionOption = useMemo(() => {
        if (!soloSessionOptions.length) return null;

        return soloSessionOptions.find((option) => option.id === selectedSoloSessionId) || soloSessionOptions[0];
    }, [selectedSoloSessionId, soloSessionOptions]);
    const canStartSoloSession = !isSolo || soloVocabPool.length >= 2;
    const friendBattleLevelInfo = getLevelMeta(roomData?.level || friendLevelParam);
    const matchTargetCorrect = normalizeTargetCorrect(roomData?.targetCorrect || friendTargetParam, TARGET_CORRECT);
    const battleMode = normalizeBattleMode(roomData?.battleMode || friendModeParam);
    const battleModeLabel = getBattleModeLabel(battleMode);
    const isListeningBattle = isFriendMatch && battleMode === 'listening';
    const canUseSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const isPoseSpeaking = isCharacterSpeaking || isPronouncingQuestion;
    const inventory = stats?.inventory || [];
    const hintAssistCount = getInventoryItemQuantity(inventory, SOLO_ASSIST_HINT_ITEM_ID);
    const continueAssistCount = getInventoryItemQuantity(inventory, SOLO_ASSIST_CONTINUE_ITEM_ID);
    const timeAssistCount = getInventoryItemQuantity(inventory, SOLO_ASSIST_TIME_ITEM_ID);
    const currentQuestion = roomData?.questions?.[myQuestionIndex] ?? null;
    const totalQuestionCount = roomData?.totalQuestionCount || roomData?.questions?.length || 0;
    const hasCurrentQuestion = Boolean(
        currentQuestion &&
        String(currentQuestion.word ?? '').trim() &&
        String(currentQuestion.correctAnswer ?? '').trim() &&
        Array.isArray(currentQuestion.options) &&
        currentQuestion.options.length > 0
    );
    const visibleOptions = useMemo(() => {
        if (!Array.isArray(currentQuestion?.options)) {
            return [];
        }

        return hiddenOption
            ? currentQuestion.options.filter((option) => option !== hiddenOption)
            : currentQuestion.options;
    }, [currentQuestion?.options, hiddenOption]);

    useEffect(() => {
        if (!soloSessionOptions.length) return;

        if (!soloSessionOptions.some((option) => option.id === selectedSoloSessionId)) {
            setSelectedSoloSessionId(soloSessionOptions[0].id);
        }
    }, [selectedSoloSessionId, soloSessionOptions]);

    useEffect(() => {
        setHiddenOption(null);
    }, [myQuestionIndex, phase]);

    const matchEmotion = useMemo(() => {
        if (phase === 'result' && roomData) {
            const opponent = roomData.player1?.uid === myUid ? roomData.player2 : roomData.player1;
            const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, matchTargetCorrect);
            const didWin = isSolo || winnerUid === myUid || (!winnerUid && (myScore > (opponent?.score || 0)));
            return didWin ? 'happy' : 'serious';
        }

        if (resultFx === 'victory') {
            return 'happy';
        }

        if (answerFx === 'correct') {
            return getReactionEmotion(answerTone, correctStreak >= 2 ? 'happy' : 'smile');
        }

        if (answerFx === 'wrong') {
            return getReactionEmotion(answerTone, 'angry');
        }

        if (persistentEmotion) {
            return persistentEmotion;
        }

        if (phase === 'countdown') {
            return 'serious';
        }

        if (isListeningBattle && isPronouncingQuestion) {
            return 'surprised';
        }

        if (!isSolo && roomData && phase === 'playing') {
            const opponent = roomData.player1?.uid === myUid ? roomData.player2 : roomData.player1;
            const gap = myScore - (opponent?.score || 0);

            if (gap >= 2) return 'happy';
            if (gap < 0) return 'serious';
        }

        return 'normal';
    }, [
        answerFx,
        answerTone,
        correctStreak,
        isListeningBattle,
        isPronouncingQuestion,
        isSolo,
        matchTargetCorrect,
        myScore,
        myUid,
        phase,
        persistentEmotion,
        resultFx,
        roomData,
    ]);
    const matchExpressionState = useMemo(() => resolveMatchCharacterPose({
            answerFx,
            answerTone,
            correctStreak,
            isPoseSpeaking,
            matchEmotion,
            persistentEmotion,
            phase,
            resultFx,
        }), [answerFx, answerTone, correctStreak, isPoseSpeaking, matchEmotion, persistentEmotion, phase, resultFx]);
    const matchPose = matchExpressionState.matchPose;
    const matchFaceAccent = matchExpressionState.matchFaceAccent;
    const visibleFaceAccent = renderer === 'live2d' && matchFaceAccent !== 'angry'
        ? null
        : matchFaceAccent;
    const matchFeedbackCopy = useMemo(() => getMatchFeedbackCopy({
        tone: answerTone,
        answerKind: selectedAnswer === '__timeout__'
            ? 'timeout'
            : selectedAnswer === '__skip__'
                ? 'skip'
                : 'answer',
    }), [answerTone, selectedAnswer]);

    const playUiTone = useCallback((frequency, durationMs, { type = 'sine', gain = 0.03, delayMs = 0 } = {}) => {
        if (isMuted || isNativePlatform || typeof window === 'undefined') return;

        try {
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
        } catch (toneError) {
            console.warn('Battle UI tone is unavailable on this device.', toneError);
        }
    }, [isMuted, isNativePlatform]);

    const playMatchSE = useCallback((filename) => {
        if (!filename || isNativePlatform) return;

        try {
            playSE(filename);
        } catch (soundError) {
            console.warn(`Battle SE failed: ${filename}`, soundError);
        }
    }, [isNativePlatform, playSE]);

    const triggerAnswerFx = useCallback((type) => {
        clearTimeout(answerFxTimeoutRef.current);
        setAnswerFx(type);
        answerFxTimeoutRef.current = setTimeout(() => {
            setAnswerFx(null);
        }, type === 'correct' ? 420 : 520);
    }, []);

    const playChainVoiceClip = useCallback((voiceSrc, volume = 0.8) => {
        if (isMuted || isNativePlatform || typeof window === 'undefined' || !voiceSrc) {
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

        const releaseVoiceFocus = acquireVoiceFocus();
        audio.volume = Math.max(0, Math.min(1, volume * voiceVolume));

        const startLipSync = () => {
            setIsCharacterSpeaking(true);
        };

        const stopLipSync = () => {
            releaseVoiceFocus();
            setIsCharacterSpeaking(false);
        };

        audio.onplay = startLipSync;
        audio.onended = stopLipSync;
        audio.onerror = stopLipSync;

        audio.play().catch((err) => {
            console.error('Chain voice playback error:', err);
            stopLipSync();
        });
    }, [acquireVoiceFocus, isMuted, isNativePlatform, voiceVolume]);
    const triggerFeverFx = useCallback(() => {
        if (feverFxTimeoutRef.current) {
            clearTimeout(feverFxTimeoutRef.current);
        }

        setFeverFxKey((prev) => prev + 1);
        setIsFeverFxActive(true);
        feverFxTimeoutRef.current = setTimeout(() => {
            setIsFeverFxActive(false);
            feverFxTimeoutRef.current = null;
        }, 920);
    }, []);
    const playReactionVoice = useCallback((tone, streak = 0) => {
        const selection = resolveReactionVoiceSelection({ characterId: myCharacterId, tone, streak });
        if (selection.shouldTriggerFeverFx) {
            triggerFeverFx();
        }
        if (!selection.file) return;

        playVoice(selection.file, {
            channel: 'study-reaction',
        }).catch(() => { });
    }, [myCharacterId, playVoice, triggerFeverFx]);

    const speakBattleVoice = useCallback(async (text, settings, speakerValue) => {
        if (!text || !speakerValue) {
            return false;
        }

        const releaseVoiceFocus = acquireVoiceFocus();

        const engineOrder = settings.engine === TTS_ENGINES.AUTO
            ? [TTS_ENGINES.DEEPGRAM, TTS_ENGINES.AIVIS, TTS_ENGINES.VOICEVOX]
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

            const resolvedSpeakerValue = engine === TTS_ENGINES.DEEPGRAM
                ? settings.deepgramVoiceModel
                : speakerValue;
            const speakerId = await resolveSpeakerIdForEngine(engine, resolvedSpeakerValue, { baseUrl });
            const success = await speakWithEngine(engine, text, speakerId, {
                baseUrl,
                onEnd: releaseVoiceFocus,
            });
            if (success) {
                return true;
            }
        }

        releaseVoiceFocus();
        return false;
    }, [acquireVoiceFocus]);

    const clearChainCallout = useCallback(() => {
        clearTimeout(chainCalloutTimeoutRef.current);
        setChainCallout(null);
    }, []);

    const clearMomentumCallout = useCallback(() => {
        clearTimeout(momentumCalloutTimeoutRef.current);
        setMomentumCallout(null);
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
                    playChainVoiceClip(meta.voiceSrc);
                }
            }).catch(() => {
                if (meta.voiceSrc) {
                    playChainVoiceClip(meta.voiceSrc);
                }
            });
            return;
        }

        if (meta.voiceSrc) {
            playChainVoiceClip(meta.voiceSrc);
        }
    }, [isMuted, playChainVoiceClip, speakBattleVoice]);

    const resetMatchState = useCallback(() => {
        clearInterval(timerIntervalRef.current);
        clearTimeout(feedbackTimeoutRef.current);
        clearTimeout(matchingTimeoutRef.current);
        clearTimeout(answerFxTimeoutRef.current);
        clearTimeout(resultFxTimeoutRef.current);
        clearTimeout(chainCalloutTimeoutRef.current);
        clearTimeout(momentumCalloutTimeoutRef.current);
        clearTimeout(feverFxTimeoutRef.current);
        clearTimeout(soloBatchTimeoutRef.current);
        clearInterval(chainLipIntervalRef.current);
        cancelQuestionPronunciation();
        soloQuestionQueueRef.current = [];
        soloBatchLoadingRef.current = false;
        setRoomId(null);
        setRoomData(null);
        setMyQuestionIndex(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setMyScore(0);
        setCountdown(3);
        setTimer(ANSWER_TIME_LIMIT);
        setSoloAssistState(createInitialSoloAssistState());
        setHiddenOption(null);
        setRatingChange(null);
        setFailureState(null);
        setResultNotice(null);
        setIsRematchLoading(false);
        setAnswerFx(null);
        setAnswerTone(null);
        setResultFx(null);
        setCorrectStreak(0);
        setChainCallout(null);
        setMomentumCallout(null);
        setIsPronouncingQuestion(false);
        setIsCharacterSpeaking(false);
        setPronunciationReplayCount(0);
        setPersistentEmotion(null);
        setLastAnswerResult(null);
        setHighestCorrectStreak(0);
        setIsFeverFxActive(false);
        setIsSoloQuestionBatchLoading(false);
        setFlashcardSessionCards([]);
        setFlashcardSessionMeta(null);
        lastMomentumEventKeyRef.current = null;
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

        getPublicProfile(user.uid).then(result => {
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
                setResultNotice('規定問題を消化し、ゲージ差で対戦が終了しました。');
            } else {
                setResultNotice(null);
            }
            setPhase('result');
        }
    }, [roomData, phase, myUid, matchTargetCorrect]);

    useEffect(() => {
        if (isSolo || !roomData?.lastMomentumEvent || !myUid) {
            return;
        }

        const event = roomData.lastMomentumEvent;
        const eventKey = `${roomData.id}:${event.answerId || event.createdAt || 'momentum'}:${event.type || 'event'}`;
        if (lastMomentumEventKeyRef.current === eventKey) {
            return;
        }

        lastMomentumEventKeyRef.current = eventKey;
        const byMe = (event.by === 'player1' && roomData.player1?.uid === myUid)
            || (event.by === 'player2' && roomData.player2?.uid === myUid);

        setMomentumCallout({
            ...event,
            byMe,
        });
        clearTimeout(momentumCalloutTimeoutRef.current);
        momentumCalloutTimeoutRef.current = setTimeout(() => {
            setMomentumCallout(null);
        }, event.type === 'lead_change' ? 1300 : 980);

        if (byMe && event.type === 'lead_change') {
            playUiTone(1120, 180, { type: 'triangle', gain: 0.04 });
            playUiTone(1360, 220, { type: 'triangle', gain: 0.032, delayMs: 90 });
        }
    }, [isSolo, myUid, playUiTone, roomData]);

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
            clearTimeout(momentumCalloutTimeoutRef.current);
            clearTimeout(soloBatchTimeoutRef.current);
            cancelQuestionPronunciation();
            if (audioContextRef.current?.state && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, [cancelQuestionPronunciation]);

    useEffect(() => {
        if (phase === 'playing') return;
        clearChainCallout();
        clearMomentumCallout();
        cancelQuestionPronunciation();
    }, [phase, clearChainCallout, clearMomentumCallout, cancelQuestionPronunciation]);

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
            playMatchSE('se_correct');
            playUiTone(880, 180, { type: 'sine', gain: 0.03 });
        }

        previousPhaseRef.current = phase;
    }, [countdown, phase, playMatchSE, playUiTone]);

    useEffect(() => {
        if (phase !== 'result' || !roomData || resultFxPlayedRef.current === roomData.id) return;
        if (isSolo && isNativePlatform) return;

        resultFxPlayedRef.current = roomData.id;
        setResultFx(null);

        const opponent = roomData.player1?.uid === myUid ? roomData.player2 : roomData.player1;
        const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, matchTargetCorrect);
        const didWin = isSolo || winnerUid === myUid || (!winnerUid && (myScore > (opponent?.score || 0)));

        if (didWin) {
            setResultFx('victory');
            playMatchSE('gacha');
            playUiTone(784, 150, { type: 'triangle', gain: 0.03 });
            playUiTone(1046, 220, { type: 'triangle', gain: 0.028, delayMs: 120 });
            resultFxTimeoutRef.current = setTimeout(() => {
                setResultFx(null);
            }, 1800);
        }
    }, [phase, roomData, myUid, myScore, isNativePlatform, isSolo, matchTargetCorrect, playMatchSE, playUiTone]);

    // 次の問題へ進む（ローカル管理）
    const goToNextQuestion = useCallback(async (wasCorrect, submitResult = null) => {
        const newScore = wasCorrect ? myScore + 1 : myScore;
        const nextIndex = myQuestionIndex + 1;
        const totalQuestions = roomData?.totalQuestionCount || roomData?.questions.length || 0;

        if (!isSolo && submitResult?.status === 'finished') {
            clearInterval(timerIntervalRef.current);
            setMyScore(newScore);
            setPhase('result');
            return;
        }

        // 対戦モード：正解数が目標に達したか判定
        if (!isSolo && newScore >= matchTargetCorrect) {
            clearInterval(timerIntervalRef.current);
            setMyScore(newScore);
            await markFinished(roomId, myUid, 'completed');
            setPhase('result');
            return;
        }

        // 問題プールを使い切った場合もゲーム終了
        if (roomData && nextIndex >= totalQuestions) {
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
        setAnswerTone(null);
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

    useEffect(() => {
        if (phase !== 'result') {
            battleResultPersistedRef.current = false;
            return;
        }

        if (!roomData || !updateStats || battleResultPersistedRef.current) {
            return;
        }

        const myPlayer = roomData.player1?.uid === myUid ? roomData.player1 : roomData.player2;
        const opponent = roomData.player1?.uid === myUid ? roomData.player2 : roomData.player1;
        const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, matchTargetCorrect);
        const answeredCount = Array.isArray(myPlayer?.answers)
            ? myPlayer.answers.length
            : Math.max(0, Number(myPlayer?.score) || myScore);
        const correctCount = Array.isArray(myPlayer?.answers)
            ? myPlayer.answers.filter((answer) => answer?.isCorrect).length
            : Math.max(0, Number(myPlayer?.score) || myScore);
        const accuracy = answeredCount > 0
            ? Math.round((correctCount / answeredCount) * 100)
            : 0;
        const outcome = isSolo
            ? 'completed'
            : winnerUid === null
                ? 'draw'
                : winnerUid === myUid
                    ? 'win'
                    : 'lose';

        battleResultPersistedRef.current = true;
        updateStats((currentStats) => {
            const nextStats = {
                ...currentStats,
                lastBattleResult: {
                    mode: isSolo ? 'solo' : (isFriendMatch ? 'friend' : 'public'),
                    outcome,
                    level: String(roomData.level || soloLevel || myLevelInfo.level || ''),
                    score: Math.max(0, Number(myPlayer?.score) || myScore),
                    opponentScore: Math.max(0, Number(opponent?.score) || 0),
                    finishReason: String(roomData.finishReason || ''),
                    finishedAt: Date.now(),
                },
            };

            if (answeredCount <= 0) {
                return nextStats;
            }

            const dailyLoopPatch = buildDailyLoopPhasePatch(nextStats, 'battle');
            const dailyLoopStats = dailyLoopPatch
                ? { ...nextStats, ...dailyLoopPatch }
                : nextStats;
            return applyCharacterEvaluationResult(dailyLoopStats, {
                activityType: 'battle',
                answeredCount,
                correctCount,
                accuracy,
                completed: true,
                perfect: answeredCount > 0 && correctCount === answeredCount,
            }).nextStats;
        });
    }, [isFriendMatch, isSolo, matchTargetCorrect, myLevelInfo.level, myScore, myUid, roomData, soloLevel, updateStats, phase]);

    const queueAdvance = useCallback((wasCorrect, delayMs, submitPromise = Promise.resolve()) => {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => {
            void (async () => {
                let submitResult = null;
                try {
                    submitResult = await submitPromise;
                } catch (err) {
                    console.error('Submit answer error:', err);
                }

                await goToNextQuestion(wasCorrect, submitResult);
            })();
        }, delayMs);
    }, [goToNextQuestion]);

    const recordSoloVocabResult = useCallback((question, isCorrect) => {
        if (!isSolo || !question) {
            return;
        }

        recordVocabAttempt({
            level: roomData?.level || soloLevel,
            word: question.word,
            meaning: question.correctAnswer,
            itemId: question.itemId || question.questionId || '',
            isCorrect,
        });
    }, [isSolo, roomData?.level, soloLevel]);

    const appendSoloQuestionBatch = useCallback(({ immediate = false } = {}) => {
        if (!isSolo || soloBatchLoadingRef.current || soloQuestionQueueRef.current.length === 0) {
            return false;
        }

        soloBatchLoadingRef.current = true;
        setIsSoloQuestionBatchLoading(true);

        const loadBatch = () => {
            const nextVocabItems = soloQuestionQueueRef.current.splice(0, soloBackgroundBatchSize);
            const nextQuestions = buildQuestionsFromVocabItems(nextVocabItems, questionOptionMeanings);

            if (nextQuestions.length > 0) {
                setRoomData((prev) => (prev ? {
                    ...prev,
                    questions: [...prev.questions, ...nextQuestions],
                } : prev));
            }

            soloBatchLoadingRef.current = false;
            setIsSoloQuestionBatchLoading(false);
        };

        clearTimeout(soloBatchTimeoutRef.current);
        if (immediate) {
            loadBatch();
        } else {
            soloBatchTimeoutRef.current = setTimeout(loadBatch, 0);
        }

        return true;
    }, [isSolo, questionOptionMeanings, soloBackgroundBatchSize]);

    const startSoloSession = useCallback((questions, level, { retry = false, totalCount, sourceCount, queuedVocabItems = [], sessionLabel } = {}) => {
        const safeQuestions = sanitizeMatchQuestions(questions, questionOptionMeanings);

        if (safeQuestions.length === 0) {
            setFailureState({
                title: '問題を用意できませんでした',
                message: 'この範囲の問題データが見つかりませんでした。別のレベルでお試しください。',
            });
            setPhase('error');
            return;
        }

        resetMatchState();
        soloQuestionQueueRef.current = Array.isArray(queuedVocabItems) ? queuedVocabItems : [];
        setError(null);
        setPrevLevelLabel(myLevelInfo.label);
        setRoomData(buildSoloRoomData({
            questions: safeQuestions,
            uid: myUid,
            displayName: myDisplayName || 'Player',
            characterId: myCharacterId,
            skinId: myEquippedSkin,
            level,
            retry,
            sessionLabel: retry ? '苦手克服' : (sessionLabel || selectedSoloSessionOption?.label || `${safeQuestions.length}問`),
            totalQuestionCount: totalCount || safeQuestions.length,
            sourceQuestionCount: sourceCount || safeQuestions.length,
        }));
        setPhase('playing');
    }, [
        myDisplayName,
        myEquippedSkin,
        myCharacterId,
        myLevelInfo.label,
        myUid,
        questionOptionMeanings,
        resetMatchState,
        selectedSoloSessionOption?.label,
    ]);

    // マッチング開始
    const startMatching = useCallback(async (soloSessionOptionOverride = null) => {
        if (!myUid) return;
        if (isSolo && !canStartSoloSession) return;
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
            const targetLevel = soloLevel;
            const selectedSessionOption = soloSessionOptionOverride || selectedSoloSessionOption;
            const questionCount = Math.min(selectedSessionOption?.actualCount || soloVocabPool.length || 999, soloVocabPool.length);
            const selectedVocabItems = selectedSoloStudyMode === 'flashcard'
                ? getNextFlashcardVocabBatchForLevel(targetLevel, soloVocabPool, questionCount)
                : getNextVocabBatchForLevel(targetLevel, soloVocabPool, questionCount);

            if (selectedSoloStudyMode === 'flashcard') {
                setFlashcardSessionCards(selectedVocabItems.map((item) => ({
                    id: item.entryKey || item.itemId || item.word,
                    questionId: item.entryKey || item.itemId || item.word,
                    itemId: item.itemId || '',
                    level: targetLevel,
                    prompt: item.word,
                    answer: item.meaning,
                    frontHint: '意味を思い出せたらタップ',
                    backHint: soloLevelMeta.label,
                })));
                setFlashcardSessionMeta({
                    level: targetLevel,
                    sessionLabel: selectedSessionOption?.label || `${selectedVocabItems.length}問`,
                    totalCount: selectedVocabItems.length,
                });
                setPhase('flashcard');
                return;
            }

            const initialVocabItems = selectedVocabItems.slice(0, soloInitialBatchSize);
            const remainingVocabItems = selectedVocabItems.slice(initialVocabItems.length);
            const initialQuestions = buildQuestionsFromVocabItems(initialVocabItems, questionOptionMeanings);

            startSoloSession(initialQuestions, targetLevel, {
                totalCount: selectedVocabItems.length,
                sourceCount: soloVocabPool.length,
                queuedVocabItems: remainingVocabItems,
                sessionLabel: selectedSessionOption?.label,
            });
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
        canStartSoloSession,
        myCharacterId,
        myDisplayName,
        myEquippedSkin,
        myLevelInfo.label,
        myRating,
        myUid,
        questionOptionMeanings,
        resetMatchState,
        selectedSoloStudyMode,
        selectedSoloSessionOption?.actualCount,
        soloLevel,
        soloInitialBatchSize,
        soloLevelMeta.label,
        soloVocabPool,
        startSoloSession,
    ]);

    const handleSoloSessionOptionSelect = useCallback((option) => {
        setSelectedSoloSessionId(option.id);

        if (!canStartSoloSession) {
            return;
        }

        void startMatching(option);
    }, [canStartSoloSession, startMatching]);

    useEffect(() => {
        if (!isFriendMatch || !myUid || phase !== 'init' || autoStartAttemptedRef.current) return;

        autoStartAttemptedRef.current = true;
        void startMatching();
    }, [isFriendMatch, myUid, phase, startMatching]);

    useEffect(() => {
        if (!isSolo || isNativePlatform || phase !== 'playing' || roomData?.questions?.length !== soloInitialBatchSize) {
            return;
        }

        appendSoloQuestionBatch();
    }, [appendSoloQuestionBatch, isNativePlatform, isSolo, phase, roomData?.questions?.length, soloInitialBatchSize]);

    useEffect(() => {
        if (!isSolo || phase !== 'playing' || !roomData || soloQuestionQueueRef.current.length === 0) {
            return;
        }

        const loadedAheadCount = roomData.questions.length - (myQuestionIndex + 1);
        if (loadedAheadCount <= soloPreloadThreshold) {
            appendSoloQuestionBatch();
        }
    }, [appendSoloQuestionBatch, isSolo, myQuestionIndex, phase, roomData, soloPreloadThreshold]);

    useEffect(() => {
        if (phase !== 'playing' || !roomData?.questions?.length || hasCurrentQuestion) {
            return;
        }

        if (isSolo) {
            const hasQueuedQuestions = soloQuestionQueueRef.current.length > 0;
            if (hasQueuedQuestions) {
                appendSoloQuestionBatch({ immediate: true });
                return;
            }

            if (isSoloQuestionBatchLoading) {
                return;
            }

            if (myQuestionIndex >= roomData.questions.length) {
                clearInterval(timerIntervalRef.current);
                cancelQuestionPronunciation();
                setRoomData((prev) => (prev ? {
                    ...prev,
                    totalQuestionCount: prev.questions.length,
                    finishReason: prev.finishReason || 'questions_exhausted',
                } : prev));
                setPhase('result');
                return;
            }
        }

        console.warn('Current match question is missing or malformed.', {
            phase,
            myQuestionIndex,
            questionCount: roomData.questions.length,
        });
        clearInterval(timerIntervalRef.current);
        cancelQuestionPronunciation();
        setFailureState({
            title: '問題の読み込みに失敗しました',
            message: '最初の問題データが壊れていたため、この回は安全に中止しました。もう一度試してください。',
        });
        setPhase('error');
    }, [appendSoloQuestionBatch, cancelQuestionPronunciation, hasCurrentQuestion, isSolo, isSoloQuestionBatchLoading, myQuestionIndex, phase, roomData]);

    // 解答選択
    const handleAnswer = useCallback(async (answer) => {
        if (selectedAnswer !== null || !roomData || (!isSolo && !myUid) || showFeedback) return;

        const question = roomData.questions[myQuestionIndex];
        if (!question) return;
        const isCorrect = answer === question.correctAnswer;
        const answeredAt = Date.now();
        const opponent = !isSolo
            ? (roomData.player1?.uid === myUid ? roomData.player2 : roomData.player1)
            : null;
        const scoreGap = myScore - (opponent?.score || 0);
        const preserveChain = isSolo && soloAssistState.continueState === 'armed';

        cancelQuestionPronunciation();
        setSelectedAnswer(answer);
        setShowFeedback(true);
        clearInterval(timerIntervalRef.current);

        const submitPromise = !isSolo
            ? submitAnswer(roomId, myUid, myQuestionIndex, answer, isCorrect)
            : Promise.resolve();

        if (isCorrect) {
            const nextStreak = correctStreak + 1;
            const nextAnswerTone = resolveMatchReactionTone({
                isCorrect: true,
                nextCorrectStreak: nextStreak,
                previousResult: lastAnswerResult,
                timerRemaining: timer,
                scoreGap,
            });
            triggerAnswerFx('correct');
            playMatchSE('se_correct');
            setCorrectStreak(nextStreak);
            setHighestCorrectStreak((prev) => Math.max(prev, nextStreak));
            setAnswerTone(nextAnswerTone);
            setPersistentEmotion(getReactionEmotion(nextAnswerTone, nextStreak >= 2 ? 'happy' : 'smile'));
            setLastAnswerResult('correct');
            recordSoloVocabResult(question, true);
            if (shouldTriggerReactionFeverFx({ tone: nextAnswerTone, streak: nextStreak })) {
                triggerFeverFx();
            }
            if (nextAnswerTone === 'comeback_correct' || nextAnswerTone === 'clutch_correct') {
                playReactionVoice(nextAnswerTone, nextStreak);
            }
            triggerChainCallout(nextStreak);
            setMyScore(prev => prev + 1);
            if (isSolo) {
                setRoomData(prev => prev ? ({
                    ...prev,
                    player1: {
                        ...prev.player1,
                        score: (prev.player1?.score || 0) + 1,
                        answers: [
                            ...(prev.player1?.answers || []),
                            { questionIndex: myQuestionIndex, answer, isCorrect: true, timestamp: answeredAt },
                        ],
                    },
                }) : prev);
            }
            queueAdvance(true, 1000, submitPromise);
        } else {
            const nextAnswerTone = resolveMatchReactionTone({
                isCorrect: false,
                previousResult: lastAnswerResult,
                timerRemaining: timer,
                scoreGap,
                answerKind: 'answer',
            });
            if (!preserveChain) {
                setCorrectStreak(0);
                clearChainCallout();
            } else {
                setSoloAssistState((prev) => ({
                    ...prev,
                    continueState: 'spent',
                }));
            }
            setAnswerTone(nextAnswerTone);
            setPersistentEmotion(getReactionEmotion(nextAnswerTone, 'angry'));
            setLastAnswerResult('incorrect');
            recordSoloVocabResult(question, false);
            triggerAnswerFx('wrong');
            playUiTone(180, 180, { type: 'sawtooth', gain: 0.022 });
            if (isSolo) {
                setRoomData(prev => prev ? ({
                    ...prev,
                    player1: {
                        ...prev.player1,
                        answers: [
                            ...(prev.player1?.answers || []),
                            { questionIndex: myQuestionIndex, answer, isCorrect: false, timestamp: answeredAt },
                        ],
                    },
                }) : prev);
            }
            addWrongQuestion({
                subject: question.subject || '英単語バトル',
                questionId: question.questionId || question.word,
                questionText: question.word,
                correctAnswer: question.correctAnswer,
                userAnswer: answer,
                options: question.options
            });
            queueAdvance(false, WRONG_ANSWER_DELAY, submitPromise);
        }
    }, [selectedAnswer, roomData, myUid, showFeedback, isSolo, roomId, myQuestionIndex, correctStreak, lastAnswerResult, myScore, timer, playMatchSE, playReactionVoice, playUiTone, queueAdvance, recordSoloVocabResult, triggerAnswerFx, triggerChainCallout, clearChainCallout, cancelQuestionPronunciation, soloAssistState.continueState]);

    // 「わからない」：正解を見せて不正解扱いで次へ
    const handleSkip = useCallback(() => {
        if (selectedAnswer !== null || !roomData || (!isSolo && !myUid)) return;
        const question = roomData.questions[myQuestionIndex];
        if (!question) return;
        const answeredAt = Date.now();
        const nextAnswerTone = resolveMatchReactionTone({ answerKind: 'skip' });
        const preserveChain = isSolo && soloAssistState.continueState === 'armed';
        if (!preserveChain) {
            setCorrectStreak(0);
            clearChainCallout();
        } else {
            setSoloAssistState((prev) => ({
                ...prev,
                continueState: 'spent',
            }));
        }
        setAnswerTone(nextAnswerTone);
        setPersistentEmotion(getReactionEmotion(nextAnswerTone, 'angry'));
        setLastAnswerResult('incorrect');
        cancelQuestionPronunciation();
        setSelectedAnswer('__skip__');
        setShowFeedback(true);
        clearInterval(timerIntervalRef.current);
        recordSoloVocabResult(question, false);
        if (isSolo) {
            setRoomData(prev => prev ? ({
                ...prev,
                player1: {
                    ...prev.player1,
                    answers: [
                        ...(prev.player1?.answers || []),
                        { questionIndex: myQuestionIndex, answer: '__skip__', isCorrect: false, timestamp: answeredAt },
                    ],
                },
            }) : prev);
        }
        const submitPromise = !isSolo
            ? submitAnswer(roomId, myUid, myQuestionIndex, '__skip__', false)
            : Promise.resolve();
        triggerAnswerFx('wrong');
        playUiTone(165, 220, { type: 'sawtooth', gain: 0.02 });
        addWrongQuestion({
            subject: question.subject || '英単語バトル',
            questionId: question.questionId || question.word,
            questionText: question.word,
            correctAnswer: question.correctAnswer,
            userAnswer: '（わからない）',
            options: question.options
        });
        queueAdvance(false, WRONG_ANSWER_DELAY, submitPromise);
    }, [selectedAnswer, roomData, myUid, isSolo, roomId, myQuestionIndex, playUiTone, queueAdvance, recordSoloVocabResult, triggerAnswerFx, clearChainCallout, cancelQuestionPronunciation, soloAssistState.continueState]);

    const handleReplayPronunciation = useCallback(() => {
        if (!isListeningBattle || !roomData || selectedAnswer !== null) return;
        if (pronunciationReplayCount >= LISTENING_REPLAY_LIMIT) return;

        const question = roomData.questions[myQuestionIndex];
        if (!question?.word) return;

        setPronunciationReplayCount((prev) => prev + 1);
        speakQuestionWord(question.word, { isReplay: true });
    }, [isListeningBattle, roomData, selectedAnswer, pronunciationReplayCount, myQuestionIndex, speakQuestionWord]);

    const handleUseHint = useCallback(() => {
        if (!isSolo || selectedAnswer !== null || showFeedback || !currentQuestion) return;
        if (soloAssistState.hintState !== 'available' || hintAssistCount <= 0) return;

        const removableOptions = currentQuestion.options.filter((option) => option !== currentQuestion.correctAnswer);
        if (removableOptions.length === 0) return;

        const nextHiddenOption = removableOptions[Math.floor(Math.random() * removableOptions.length)];
        setHiddenOption(nextHiddenOption);
        updateStats?.((currentStats) => ({
            ...currentStats,
            inventory: removeFromInventory(currentStats?.inventory || [], SOLO_ASSIST_HINT_ITEM_ID, 1),
        }));
        setSoloAssistState((prev) => ({
            ...prev,
            hintState: 'spent',
        }));
        playUiTone(920, 140, { type: 'triangle', gain: 0.024 });
    }, [currentQuestion, hintAssistCount, isSolo, playUiTone, selectedAnswer, showFeedback, soloAssistState.hintState, updateStats]);

    const handleUseTimeAssist = useCallback(() => {
        if (!isSolo || selectedAnswer !== null || showFeedback) return;
        if (soloAssistState.extendState !== 'available' || timeAssistCount <= 0) return;

        setTimer((prev) => prev + SOLO_ASSIST_TIME_BONUS);
        updateStats?.((currentStats) => ({
            ...currentStats,
            inventory: removeFromInventory(currentStats?.inventory || [], SOLO_ASSIST_TIME_ITEM_ID, 1),
        }));
        setSoloAssistState((prev) => ({
            ...prev,
            extendState: 'spent',
        }));
        playUiTone(760, 150, { type: 'sine', gain: 0.022 });
        playUiTone(920, 180, { type: 'sine', gain: 0.018, delayMs: 80 });
    }, [isSolo, playUiTone, selectedAnswer, showFeedback, soloAssistState.extendState, timeAssistCount, updateStats]);

    const handleArmContinueAssist = useCallback(() => {
        if (!isSolo || selectedAnswer !== null || showFeedback) return;
        if (soloAssistState.continueState !== 'available' || continueAssistCount <= 0) return;

        updateStats?.((currentStats) => ({
            ...currentStats,
            inventory: removeFromInventory(currentStats?.inventory || [], SOLO_ASSIST_CONTINUE_ITEM_ID, 1),
        }));
        setSoloAssistState((prev) => ({
            ...prev,
            continueState: 'armed',
        }));
        playUiTone(540, 130, { type: 'triangle', gain: 0.02 });
    }, [continueAssistCount, isSolo, playUiTone, selectedAnswer, showFeedback, soloAssistState.continueState, updateStats]);

    // タイムアップ
    const handleTimeUp = useCallback(() => {
        if (selectedAnswer !== null || !roomData || (!isSolo && !myUid)) return;
        const question = roomData.questions[myQuestionIndex];
        if (!question) return;
        const answeredAt = Date.now();
        const nextAnswerTone = resolveMatchReactionTone({ answerKind: 'timeout' });
        const preserveChain = isSolo && soloAssistState.continueState === 'armed';
        if (!preserveChain) {
            setCorrectStreak(0);
            clearChainCallout();
        } else {
            setSoloAssistState((prev) => ({
                ...prev,
                continueState: 'spent',
            }));
        }
        setAnswerTone(nextAnswerTone);
        setPersistentEmotion(getReactionEmotion(nextAnswerTone, 'serious'));
        setLastAnswerResult('timeout');
        cancelQuestionPronunciation();
        setSelectedAnswer('__timeout__');
        setShowFeedback(true);
        triggerAnswerFx('wrong');
        playUiTone(140, 260, { type: 'sawtooth', gain: 0.02 });
        recordSoloVocabResult(question, false);
        if (isSolo) {
            setRoomData(prev => prev ? ({
                ...prev,
                player1: {
                    ...prev.player1,
                    answers: [
                        ...(prev.player1?.answers || []),
                        { questionIndex: myQuestionIndex, answer: '__timeout__', isCorrect: false, timestamp: answeredAt },
                    ],
                },
            }) : prev);
        }

        const submitPromise = !isSolo
            ? submitAnswer(roomId, myUid, myQuestionIndex, '__timeout__', false)
            : Promise.resolve();

        addWrongQuestion({
            subject: question.subject || '英単語バトル',
            questionId: question.questionId || question.word,
            questionText: question.word,
            correctAnswer: question.correctAnswer,
            userAnswer: '（時間切れ）',
            options: question.options
        });

        queueAdvance(false, WRONG_ANSWER_DELAY, submitPromise);
    }, [selectedAnswer, roomData, myUid, isSolo, roomId, myQuestionIndex, playUiTone, queueAdvance, recordSoloVocabResult, triggerAnswerFx, clearChainCallout, cancelQuestionPronunciation, soloAssistState.continueState]);

    // 問題タイマー（問題が変わるたびにリセット）
    useEffect(() => {
        if (phase !== 'playing' || !roomData || !hasCurrentQuestion) return;
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
    }, [phase, myQuestionIndex, roomData, hasCurrentQuestion, handleTimeUp]);

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
        setRoomData((prev) => (prev ? { ...prev, finishReason: 'manual_exit' } : prev));
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

    if (phase === 'flashcard') {
        return (
            <StudyFlashcardSession
                cards={flashcardSessionCards}
                title={`${soloLevelMeta.label} 単語めくり`}
                subtitle="四択とは別に、答えを見たあとで次回タイミングを自分で決められます。"
                emptyTitle="めくり用の単語がありません"
                emptyMessage="このレベルで表示できる単語が見つかりませんでした。"
                exitLabel="単語バトルに戻る"
                completionTitle="単語めくり 完了"
                completionMessage="選んだタイミングで、次に出す目安を保存しました。"
                characterId={myCharacterId}
                skinId={myEquippedSkin}
                preferredRenderer={preferredRenderer}
                characterScene="review"
                getChoices={() => getFlashcardScheduleChoices()}
                onApplyChoice={(card, choice) => recordVocabFlashcardSchedule({
                    level: card.level || flashcardSessionMeta?.level || soloLevel,
                    word: card.prompt,
                    meaning: card.answer,
                    itemId: card.itemId || card.questionId || '',
                    scheduleChoice: choice,
                })}
                onComplete={() => {
                    setPhase('init');
                    setFlashcardSessionCards([]);
                    setFlashcardSessionMeta(null);
                }}
            />
        );
    }

    // 初期画面
    if (phase === 'init') {
        const initCoachCopy = getSoloInitCoachCopy({
            characterId: myCharacterId,
            questionCount: selectedSoloSessionOption?.actualCount || 0,
            dueCount: gameLoopSnapshot.reviewLoad.due,
            levelLabel: soloLevelMeta.label,
        });
        const initCoachLine = isSolo ? initCoachCopy.line : '対戦の準備はいい？';
        const initCoachSubline = isSolo
            ? initCoachCopy.subline
            : `正解でゲージを押し込みつつ、先に${matchTargetCorrect}問取るか押し切れば勝ち。`;
        const initCoachLabel = getCharacterLabel(myCharacterId);
        const initStartLabel = isSolo
            ? selectedSoloStudyMode === 'flashcard'
                ? '単語めくりを始める'
                : '四択レッスンを始める'
            : '対戦相手を探す';
        const reviewDueCount = gameLoopSnapshot.reviewLoad.due;

        return (
            <div className="mp-screen mp-screen-init">
                {renderBackground()}
                <div className="mp-header">
                    <button className="mp-back-btn" onClick={() => navigate('/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1><Swords size={28} /> 英単語バトル</h1>
                </div>
                <div className="mp-init-content">
                    {isSolo ? (
                        <>
                            <div className="mp-init-stage">
                                <div className="mp-init-bubble">
                                    <span className="mp-init-bubble-kicker">{initCoachLabel}</span>
                                    <h2>{initCoachLine}</h2>
                                    <p>{initCoachSubline}</p>
                                    <div className="mp-rules">
                                        <div className="mp-rule-item">📘 {soloLevelMeta.label}</div>
                                        <div className="mp-rule-item">⏱️ 1問{ANSWER_TIME_LIMIT}秒</div>
                                        <div className="mp-rule-item">🔁 ミスだけ再挑戦</div>
                                    </div>
                                </div>
                                <div className="mp-init-character-wrap" aria-hidden="true">
                                    {renderAvatar(null, myCharacterId, myEquippedSkin, myCharacterId)}
                                </div>
                            </div>
                            <div className="mp-init-bottom-sheet">
                                <div className="mp-init-sheet-top">
                                    <div className="mp-init-sheet-copy">
                                        <span className="mp-init-sheet-kicker">Solo Lesson</span>
                                        <h3>{soloLevelMeta.label}</h3>
                                    </div>
                                    <div className="mp-init-sheet-badge">全{soloVocabPool.length}問</div>
                                </div>
                                <div className="mp-init-sheet-meta">
                                    <div className="mp-rule-item">⏱️ 1問{ANSWER_TIME_LIMIT}秒</div>
                                    <div className="mp-rule-item">🔁 ミスだけ再挑戦</div>
                                    {reviewDueCount > 0 && <div className="mp-rule-item">📝 復習 {reviewDueCount}件</div>}
                                </div>
                                {selectedSoloSessionOption && (
                                    <div className="mp-solo-plan-card mp-solo-plan-card-init">
                                        <div className="mp-solo-plan-header">
                                            <div>
                                                <span className="mp-solo-plan-kicker">Today</span>
                                                <h3>今日はどこまでやる？</h3>
                                            </div>
                                            <div className="mp-solo-plan-total">
                                                {selectedSoloSessionOption.actualCount}問
                                            </div>
                                        </div>
                                        <div className="mp-study-mode-toggle" aria-label="学習モード">
                                            <button
                                                type="button"
                                                className={`mp-study-mode-option ${selectedSoloStudyMode === 'quiz' ? 'active' : ''}`}
                                                onClick={() => setSelectedSoloStudyMode('quiz')}
                                            >
                                                <strong>四択クイズ</strong>
                                                <span>テンポよく答える</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`mp-study-mode-option ${selectedSoloStudyMode === 'flashcard' ? 'active' : ''}`}
                                                onClick={() => setSelectedSoloStudyMode('flashcard')}
                                            >
                                                <strong>単語めくり</strong>
                                                <span>答えを見て次回を決める</span>
                                            </button>
                                        </div>
                                        <div className="mp-solo-plan-grid">
                                            {soloSessionOptions.map((option) => (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    className={`mp-solo-plan-option ${selectedSoloSessionOption.id === option.id ? 'active' : ''}`}
                                                    onClick={() => handleSoloSessionOptionSelect(option)}
                                                    disabled={!canStartSoloSession}
                                                >
                                                    <span className="mp-solo-plan-option-kicker">{option.label}</span>
                                                    <strong>{option.actualCount}問</strong>
                                                    <span>{option.eta}</span>
                                                    <p>{option.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mp-solo-plan-summary">
                                            <span>{selectedSoloSessionOption.actualCount}問でひと区切り</span>
                                            <span>{selectedSoloStudyMode === 'flashcard' ? '答え確認後に次回タイミングを選ぶ' : '四択でテンポよく確認'}</span>
                                            {reviewDueCount > 0 && <span>終わったら復習 {reviewDueCount}件</span>}
                                        </div>
                                    </div>
                                )}
                                <div className="mp-init-actions mp-init-actions-solo">
                                    {canStartSoloSession && selectedSoloSessionOption && (
                                        <div className="mp-init-inline-hint">
                                            {selectedSoloSessionOption.actualCount}問を押すとそのまま{selectedSoloStudyMode === 'flashcard' ? '単語めくり' : '四択レッスン'}が始まります
                                        </div>
                                    )}
                                    {isSolo && !canStartSoloSession && (
                                        <div className="mp-error">
                                            {soloLevel === CUSTOM_SOLO_LEVEL
                                                ? '自作単語は2語以上登録すると出題できます。'
                                                : 'このレベルは出題できる単語が不足しています。'}
                                        </div>
                                    )}
                                    {error && <div className="mp-error">{error}</div>}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mp-title-card">
                                <div className="mp-title-icon">⚔️</div>
                                <h2>英単語 早押しクイズ</h2>
                                <p>フレンドやライバルと英単語の知識で対決！<br />
                                    {`正解でゲージを押し込みつつ、先に${matchTargetCorrect}問取るか押し切れば勝ち！`}</p>
                                <div className="mp-rules">
                                    <div className="mp-rule-item">🎯 ゲージ押し切り or {matchTargetCorrect}問先取</div>
                                    <div className="mp-rule-item">⏱️ 1問{ANSWER_TIME_LIMIT}秒</div>
                                    <div className="mp-rule-item">❌ 誤答ペナルティ有</div>
                                </div>
                            </div>
                            <div className="mp-loop-bridge-card">
                                <span className="mp-loop-bridge-kicker">実戦フェーズ</span>
                                <h3>{gameLoopSnapshot.recommendedNextAction.label}</h3>
                                <p>
                                    {gameLoopSnapshot.reviewLoad.due > 0
                                        ? `いまは弱点ノートに ${gameLoopSnapshot.reviewLoad.due} 件あるので、終わったら復習に戻る流れがきれいです。`
                                    : 'ここで知識を実戦で試し、取りこぼした分を弱点ノートへ返していくのが主ループです。'}
                                </p>
                            </div>
                            <div className="mp-init-actions">
                                <button
                                    className="mp-start-btn mp-start-btn-init"
                                    onClick={startMatching}
                                    disabled={!canStartSoloSession}
                                >
                                    <Swords size={24} />
                                    <span>{initStartLabel}</span>
                                </button>
                                {error && <div className="mp-error">{error}</div>}
                            </div>
                        </>
                    )}
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
                ? `${battleModeLabel}・${friendBattleLevelInfo.label}・${matchTargetCorrect}問設定で対戦が始まります`
                : '相手の準備が整うまで少しお待ちください'
            : '対戦相手が見つかるまでお待ちください';
        const matchingStatusBody = isFriendMatch
            ? roomData?.player1?.uid === myUid
                ? `この画面を開いたまま待機できます。キャンセルすると${battleModeLabel}・${friendBattleLevelInfo.label}・${matchTargetCorrect}問設定の招待は取り消されます。`
                : `参加が完了すると${battleModeLabel}・${friendBattleLevelInfo.label}・${matchTargetCorrect}問設定の対戦へ自動で進みます。`
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
    if (phase === 'playing' && roomData && totalQuestionCount > 0) {
        if (myQuestionIndex >= totalQuestionCount) {
            return (
                <div className="mp-screen">
                    <div className="mp-loading-content">
                        <Loader2 className="mp-spin" size={48} />
                        <p>結果を集計中...</p>
                    </div>
                </div>
            );
        }

        if (!hasCurrentQuestion) {
            return (
                <div className="mp-screen">
                    <div className="mp-loading-content">
                        <Loader2 className="mp-spin" size={48} />
                        <p>問題データを確認中...</p>
                    </div>
                </div>
            );
        }

        const question = currentQuestion;
        const opponent = getOpponent();
        const myRoomPlayer = getMyPlayerFromRoom();
        const opScore = opponent?.score || 0;
        const totalQuestions = totalQuestionCount;
        const currentQuestionLabel = `${Math.min(myQuestionIndex + 1, totalQuestions)} / ${totalQuestions}`;
        const tugPerspective = !isSolo && roomData?.player2?.uid === myUid ? 'player2' : 'player1';
        const roomTugPosition = !isSolo ? clampTugPosition(roomData?.tugPosition) : 0;
        const myTugPosition = !isSolo && tugPerspective === 'player2'
            ? -roomTugPosition
            : roomTugPosition;
        const tugMeta = !isSolo ? resolveTugAdvantageMeta(roomTugPosition, tugPerspective) : null;
        const tugLabel = !isSolo
            ? myTugPosition === 0
                ? 'ゲージ中央'
                : myTugPosition > 0
                    ? `自分側 +${myTugPosition}`
                    : `相手側 +${Math.abs(myTugPosition)}`
            : '';
        const myTugFillPercent = !isSolo ? (Math.max(myTugPosition, 0) / TUG_GAUGE_LIMIT) * 50 : 0;
        const opponentTugFillPercent = !isSolo ? (Math.max(-myTugPosition, 0) / TUG_GAUGE_LIMIT) * 50 : 0;
        const mySummary = summarizeAnswers(myRoomPlayer?.answers || []);
        const canUseSoloAssist = isSolo && selectedAnswer === null && !showFeedback;
        const canUseHintAssist = canUseSoloAssist && soloAssistState.hintState === 'available' && hintAssistCount > 0 && visibleOptions.length > 2;
        const canUseContinueAssist = canUseSoloAssist && soloAssistState.continueState === 'available' && continueAssistCount > 0;
        const canUseTimeAssist = canUseSoloAssist && soloAssistState.extendState === 'available' && timeAssistCount > 0;
        const continueAssistLabel = soloAssistState.continueState === 'armed'
            ? '見直し 待機中'
            : soloAssistState.continueState === 'spent'
                ? '見直し 発動済み'
                : '見直し';
        const continueAssistCompactStatus = soloAssistState.continueState === 'armed'
            ? '待機中'
            : soloAssistState.continueState === 'spent'
                ? '使用済'
                : continueAssistCount > 0
                    ? `x${continueAssistCount}`
                    : 'なし';
        const hintAssistCompactStatus = hintAssistCount > 0 ? `x${hintAssistCount}` : 'なし';
        const timeAssistCompactStatus = timeAssistCount > 0 ? `+${SOLO_ASSIST_TIME_BONUS}秒` : 'なし';

        // 進行度の計算 (%)
        // ソロモード時は「全問題数」に対する進捗、対戦モード時は「目標正解数」に対する進捗
        const myProgressPercent = isSolo 
            ? Math.min(((myQuestionIndex + 1) / totalQuestions) * 100, 100)
            : Math.min((myScore / matchTargetCorrect) * 100, 100);
            
        const opProgressPercent = Math.min((opScore / matchTargetCorrect) * 100, 100);

        return (
            <div className={`mp-screen mp-playing-screen ${answerFx ? `mp-answer-fx-${answerFx}` : ''} ${isFeverFxActive ? 'mp-fever-active' : ''}`}>
                {renderBackground()}
                {isFeverFxActive && (
                    <div className="mp-fever-burst" key={`mp-fever-${feverFxKey}`} aria-hidden="true">
                        <span className="mp-fever-kicker">RARE VOICE</span>
                        <strong>FEVER</strong>
                        <i className="mp-fever-spark mp-fever-spark-1" />
                        <i className="mp-fever-spark mp-fever-spark-2" />
                        <i className="mp-fever-spark mp-fever-spark-3" />
                        <i className="mp-fever-spark mp-fever-spark-4" />
                        <i className="mp-fever-spark mp-fever-spark-5" />
                    </div>
                )}
                {answerFx && <div className={`mp-answer-fx-overlay mp-answer-fx-overlay-${answerFx}`} aria-hidden="true" />}
                
                {/* 途中終了ボタン（ソロモード時） */}
                {isSolo && (
                    <button className="mp-end-quiz-btn" onClick={handleEndQuiz} title="今の結果で区切る">
                        <Flag size={18} />
                        <span>ここで区切る</span>
                    </button>
                )}
                
                {/* キャラクター（mp-playing-screenに対してabsolute配置） */}
                {shouldRenderMatchCharacter && (
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
                        {visibleFaceAccent && (
                            <div className={`mp-face-accent mp-face-accent-${visibleFaceAccent}`} aria-hidden="true">
                                {visibleFaceAccent === 'angry' ? (
                                    <>
                                        <span className="mp-face-cheek mp-face-cheek-left" />
                                        <span className="mp-face-cheek mp-face-cheek-right" />
                                        <span className="mp-face-mouth" />
                                    </>
                                ) : (
                                    <>
                                        {visibleFaceAccent === 'heart' && (
                                            <>
                                                <span className="mp-face-heart-orbit mp-face-heart-orbit-left">♥</span>
                                                <span className="mp-face-heart-orbit mp-face-heart-orbit-right">♥</span>
                                            </>
                                        )}
                                        <span className="mp-face-eye mp-face-eye-left">{visibleFaceAccent === 'heart' ? '♥' : '★'}</span>
                                        <span className="mp-face-eye mp-face-eye-right">{visibleFaceAccent === 'heart' ? '♥' : '★'}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
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
                            <div className="mp-tug-card">
                                <div className="mp-tug-header">
                                    <div className={`mp-tug-badge mp-tug-badge-${tugMeta.tone}`}>{tugMeta.label}</div>
                                    <div className="mp-tug-caption">{tugLabel}</div>
                                </div>
                                <div className="mp-tug-track" aria-label="battle momentum gauge">
                                    <div className="mp-tug-center-line" />
                                    <div className="mp-tug-fill mp-tug-fill-me" style={{ width: `${myTugFillPercent}%` }} />
                                    <div className="mp-tug-fill mp-tug-fill-op" style={{ width: `${opponentTugFillPercent}%` }} />
                                    <div className="mp-tug-edge mp-tug-edge-me">ME</div>
                                    <div className="mp-tug-edge mp-tug-edge-op">RIVAL</div>
                                </div>
                                <div className="mp-tug-detail">{tugMeta.detail}</div>
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
                        {momentumCallout && !isSolo && (
                            <div
                                className={`mp-momentum-callout ${momentumCallout.byMe ? 'is-me' : 'is-opponent'} ${momentumCallout.tone ? `mp-momentum-callout-${momentumCallout.tone}` : ''}`}
                                key={`momentum-${momentumCallout.answerId || momentumCallout.createdAt || momentumCallout.label}`}
                            >
                                <div className="mp-momentum-label">{momentumCallout.label}</div>
                                <div className="mp-momentum-text">{momentumCallout.detail}</div>
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
                            {!isSolo && (
                                <div className="mp-question-pill">
                                    {tugLabel}
                                </div>
                            )}
                            {!isSolo && (
                                <div className={`mp-question-pill mp-question-pill-${tugMeta.tone}`}>
                                    {tugMeta.label}
                                </div>
                            )}
                            {isSolo && (
                                <div className="mp-question-pill mp-question-pill-neutral">
                                    正答率 {mySummary.accuracy}%
                                </div>
                            )}
                            {isSolo && (
                                <div className={`mp-question-pill ${highestCorrectStreak >= 8 ? 'mp-question-pill-lead' : highestCorrectStreak >= 5 ? 'mp-question-pill-primary' : 'mp-question-pill-neutral'} mp-question-pill-chain`}>
                                    {highestCorrectStreak > 0 ? `Best ${highestCorrectStreak} CHAIN` : 'CHAIN 0'}
                                </div>
                            )}
                            {isSolo && isSoloQuestionBatchLoading && (
                                <div className="mp-question-pill mp-question-pill-neutral">
                                    次の問題を準備中...
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
                            <div className={`mp-question-word ${isListeningBattle && !showFeedback ? 'is-hidden' : ''} ${getQuestionWordSizeClass(question.word)}`}>
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
                                style={{ width: `${Math.min((timer / ANSWER_TIME_LIMIT) * 100, 100)}%` }}
                            />
                            <div className="mp-timer-text-overlay">
                                <Clock size={16} /> {timer}秒
                            </div>
                        </div>
                    </div>

                    {/* 下部：解答ボタン＆自分のステータス */}
                    <div className="mp-bottom-area">
                        {isSolo && (
                            <div className="mp-assist-panel">
                                <div className="mp-assist-grid">
                                    <button
                                        type="button"
                                        className={`mp-assist-btn ${soloAssistState.hintState !== 'available' ? 'is-used' : ''}`}
                                        onClick={handleUseHint}
                                        disabled={!canUseHintAssist}
                                    >
                                        <strong>ヒント</strong>
                                        <span>{hintAssistCompactStatus}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`mp-assist-btn ${soloAssistState.continueState === 'armed' ? 'is-armed' : ''} ${soloAssistState.continueState === 'spent' ? 'is-used' : ''}`}
                                        onClick={handleArmContinueAssist}
                                        disabled={!canUseContinueAssist}
                                        title={continueAssistLabel}
                                    >
                                        <strong>見直し</strong>
                                        <span>{continueAssistCompactStatus}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`mp-assist-btn ${soloAssistState.extendState !== 'available' ? 'is-used' : ''}`}
                                        onClick={handleUseTimeAssist}
                                        disabled={!canUseTimeAssist}
                                    >
                                        <strong>集中</strong>
                                        <span>{timeAssistCompactStatus}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="mp-assist-btn mp-assist-btn-skip"
                                        onClick={handleSkip}
                                        disabled={selectedAnswer !== null}
                                    >
                                        <strong>わからない</strong>
                                        <span>次へ</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 解答ボタン */}
                        <div className="mp-options-grid">
                            {visibleOptions.map((option, idx) => {
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
                                        <span className={`mp-option-text ${getOptionTextSizeClass(option)}`}>{option}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {!isSolo && (
                            <div className="mp-skip-wrapper">
                                <button 
                                    className="mp-skip-btn" 
                                    onClick={handleSkip}
                                    disabled={selectedAnswer !== null}
                                >
                                    🤔 わからない
                                </button>
                            </div>
                        )}

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
                                    <h2>{matchFeedbackCopy.title}</h2>
                                    <p>{matchFeedbackCopy.detail}</p>
                                    <p>正解: {question.correctAnswer}</p>
                                </div>
                            ) : (
                                <div className="mp-feedback-card mp-fc-wrong">
                                    <h2>{matchFeedbackCopy.title}</h2>
                                    <p>{matchFeedbackCopy.detail}</p>
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
        const totalQuestions = roomData.totalQuestionCount || roomData.questions.length;
        const sourceQuestionCount = roomData.sourceQuestionCount || totalQuestions;
        const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, matchTargetCorrect);
        const mySummary = summarizeAnswers(myPlayerRoom?.answers || []);
        const opponentSummary = summarizeAnswers(opponent?.answers || []);
        const isManualExit = Boolean(isSolo && roomData.finishReason === 'manual_exit');
        const shouldUseLiteSoloResult = Boolean(isSolo && isNativePlatform);
        const soloWrongQuestionIndices = isSolo
            ? [...new Set(
                (myPlayerRoom?.answers || [])
                    .filter((answer) => !answer?.isCorrect && Number.isInteger(answer?.questionIndex))
                    .map((answer) => answer.questionIndex)
            )]
            : [];
        const soloRetryQuestions = isSolo
            ? soloWrongQuestionIndices.map((index) => roomData.questions[index]).filter(Boolean)
            : [];
        const clearedSoloRetry = Boolean(isSolo && roomData.soloRetry && soloRetryQuestions.length === 0);
        const soloResultNotice = isSolo
            ? getSoloResultNotice({
                accuracy: mySummary.accuracy,
                answeredCount: mySummary.answeredCount,
                totalQuestions,
                soloRetryQuestions,
                isManualExit,
                clearedSoloRetry,
                isRetrySession: Boolean(roomData.soloRetry),
                sessionLabel: roomData.sessionLabel,
                sourceQuestionCount,
            })
            : '';
        const finishReasonLabel = getFinishReasonLabel(roomData.finishReason, isSolo);
        const shouldUseSoloCompactResultLayout = Boolean(isSolo && !resultNotice && (isManualExit || clearedSoloRetry));
        const soloCompactResultCardCopy = getSoloCompactResultCardCopy({
            isManualExit,
            clearedSoloRetry,
        });
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
            resultText = isManualExit ? '今回はここまでね' : '結果、出たわよ';
            resultEmoji = isManualExit ? '☕' : '🎉';
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

        if (shouldUseLiteSoloResult) {
            return (
                <div className="mp-screen">
                    {renderBackground()}
                    <div className="mp-header">
                        <button className="mp-back-btn" onClick={() => navigate('/home')}>
                            <ArrowLeft size={24} />
                        </button>
                        <h1>学習結果</h1>
                    </div>
                    <div className="mp-matching-content">
                        <div className="mp-error-panel mp-error-panel-solo-result">
                            <div className="mp-error-icon">{isManualExit ? '☕' : '🎉'}</div>
                            <h2>{resultText}</h2>
                            <p>{mySummary.correctCount} / {totalQuestions} 問正解</p>
                            <p>正答率 {mySummary.accuracy}% ・ 最高 {highestCorrectStreak} CHAIN</p>
                            <div className="mp-result-noa-line is-compact">
                                <div className="mp-result-noa-kicker">NOA</div>
                                <p className="mp-result-noa-text">{soloResultNotice}</p>
                            </div>
                            <div className="mp-error-actions">
                                {soloRetryQuestions.length > 0 && (
                                    <button
                                        className="mp-start-btn"
                                        onClick={() => startSoloSession(soloRetryQuestions, roomData.level || queryLevel || myLevelInfo.level, { retry: true })}
                                    >
                                        苦手克服チャレンジ {soloRetryQuestions.length} 問
                                    </button>
                                )}
                                <button className="mp-start-btn" onClick={resetToInit}>
                                    最初からもう1周する
                                </button>
                                <button className="mp-cancel-btn" onClick={() => navigate('/home')}>
                                    ホームに戻る
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

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
                <div className={`mp-result-content ${resultClass} ${isSolo ? 'is-solo-showcase' : ''}`}>
                    
                    <div className={`mp-result-character-bg ${renderer === 'live2d' ? 'is-live2d' : ''}`}>
                        {shouldRenderMatchCharacter && (isSolo || finalMyScore >= opScore) && (
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

                    {!resultNotice && isSolo && (
                        <div className={`mp-result-noa-stage ${shouldUseSoloCompactResultLayout ? 'is-manual-exit' : ''}`}>
                            <div className={`mp-result-noa-line ${shouldUseSoloCompactResultLayout ? 'is-manual-exit' : ''}`}>
                                <div className="mp-result-noa-kicker">NOA</div>
                                <p className="mp-result-noa-text">{soloResultNotice}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className={`mp-result-panel ${isSolo ? 'is-solo-showcase' : ''} ${shouldUseSoloCompactResultLayout ? 'is-manual-exit' : ''}`}>
                        {!shouldUseSoloCompactResultLayout && (
                            <>
                                <div className="mp-result-emoji">{resultEmoji}</div>
                                <h2 className="mp-result-text">{resultText}</h2>
                                <div className="mp-result-detail">{finishReasonLabel}</div>
                                {isFriendMatch && (
                                    <div className="mp-result-detail">{battleModeLabel} / {resultLevelInfo.label} / {matchTargetCorrect}問設定</div>
                                )}

                                <div className={`mp-result-scores ${isSolo ? 'is-solo-showcase' : ''}`}>
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

                                <div className={`mp-result-summary-grid ${isSolo ? 'is-solo is-solo-showcase' : ''}`}>
                                    <div className={`mp-result-summary-card ${isSolo ? 'is-solo-showcase' : ''}`}>
                                        <div className="mp-result-summary-label">自分の正答率</div>
                                        <div className="mp-result-summary-value">{mySummary.accuracy}%</div>
                                        <div className="mp-result-summary-sub">{mySummary.correctCount} / {Math.max(mySummary.answeredCount, finalMyScore)} 正解</div>
                                    </div>
                                    {isSolo && (
                                        <div className="mp-result-summary-card is-solo-showcase">
                                            <div className="mp-result-summary-label">最高チェーン</div>
                                            <div className="mp-result-summary-value">{highestCorrectStreak}</div>
                                            <div className="mp-result-summary-sub">
                                                {highestCorrectStreak >= 8 ? 'Perfect ペース' : highestCorrectStreak >= 5 ? 'Great ペース' : highestCorrectStreak >= 3 ? 'Good ペース' : 'ここから伸ばせる'}
                                            </div>
                                        </div>
                                    )}
                                    <div className={`mp-result-summary-card ${isSolo ? 'is-solo-showcase' : ''}`}>
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
                            </>
                        )}

                        {shouldUseSoloCompactResultLayout && (
                            <div className="mp-result-manual-exit-copy">
                                <div className="mp-result-manual-exit-badge">{soloCompactResultCardCopy.badge}</div>
                                <p>{soloCompactResultCardCopy.line}</p>
                            </div>
                        )}

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

                        <div className={`mp-result-actions ${shouldUseSoloCompactResultLayout ? 'is-manual-exit' : ''}`}>
                            {isSolo && soloRetryQuestions.length > 0 && (
                                <button
                                    className="mp-rematch-btn"
                                    onClick={() => startSoloSession(soloRetryQuestions, roomData.level || queryLevel || myLevelInfo.level, { retry: true })}
                                >
                                    苦手克服チャレンジ {soloRetryQuestions.length} 問
                                </button>
                            )}
                            {!isFriendMatch && (
                                <button className="mp-rematch-btn" onClick={resetToInit}>
                                    {isSolo ? '最初からもう1周する' : 'もう一度対戦する'}
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
