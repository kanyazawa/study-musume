import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Swords, Clock, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { getCurrentUser, getUserProfile } from '../firebase/auth';
import {
    findOrCreateRoom,
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
    DEFAULT_RATING
} from '../utils/ratingUtils';
import { resolveWinnerUid } from '../utils/matchUtils';
import { addWrongQuestion } from '../utils/reviewUtils';
import './MultiplayerMatch.css';

// Background & Character Images
import BgClassroom from '../assets/images/bg_classroom.png';
import CharacterMain from '../assets/images/character_new.png';
import CharacterRen from '../assets/images/character_ren.png';
import CharacterCasual from '../assets/images/character_casual_v9.png';
import CharacterGym from '../assets/images/character_gym.jpg';
import CharacterCasualGray from '../assets/images/character_casual_gray_hoodie.jpg';
import CharacterCasualBlack from '../assets/images/character_casual_hoodie.png';

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

const getOpponentStatusMeta = (opponent, myQuestionIndex, showFeedback) => {
    if (!opponent) {
        return {
            label: '再接続待ち',
            detail: '相手の接続を確認しています。しばらくすると終了判定されます。',
            tone: 'warn'
        };
    }

    const answeredCount = opponent.answers?.length || 0;
    if (answeredCount < myQuestionIndex) {
        return {
            label: '相手待ち',
            detail: 'こちらが先行しています。相手の回答を待っています。',
            tone: 'wait'
        };
    }

    if (showFeedback) {
        return {
            label: '回答判定中',
            detail: '次の問題へ進むまで少し待ってください。',
            tone: 'neutral'
        };
    }

    return {
        label: '対戦中',
        detail: '相手も回答中です。',
        tone: 'ok'
    };
};

const MultiplayerMatch = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isSolo = searchParams.get('mode') === 'solo';
    const queryLevel = searchParams.get('level');
    
    // 自分のキャラ・背景情報 (フォールバックあり)
    const myCharacterId = stats?.characterId || 'noah';
    const myEquippedSkin = stats?.equippedSkin || 'default';
    const myEquippedBackground = stats?.equippedBackground || 'default';
    const currentBgStyle = getBackgroundStyle(myEquippedBackground);
    
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

    const unsubscribeRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const feedbackTimeoutRef = useRef(null);
    const matchingTimeoutRef = useRef(null);

    const resetMatchState = useCallback(() => {
        clearInterval(timerIntervalRef.current);
        clearTimeout(feedbackTimeoutRef.current);
        clearTimeout(matchingTimeoutRef.current);
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
    }, []);

    // 初期化: ユーザー確認
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setMyUid(user.uid);

        if (stats?.name) {
            setMyDisplayName(stats.name);
        } else {
            getUserProfile(user.uid).then(result => {
                if (result.success) {
                    setMyDisplayName(result.data.displayName || user.displayName || 'Player');
                } else {
                    setMyDisplayName(user.displayName || 'Player');
                }
            });
        }
    }, [navigate, stats?.name]);

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
            } else if (localMyScore < TARGET_CORRECT && opponentScore < TARGET_CORRECT) {
                setResultNotice('規定問題を消化して対戦が終了しました。');
            } else {
                setResultNotice(null);
            }
            setPhase('result');
        }
    }, [roomData, phase, myUid]);

    useEffect(() => {
        if (phase !== 'matching') return;

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
    }, [phase, roomId, myUid, isSolo]);

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
        };
    }, []);

    // 次の問題へ進む（ローカル管理）
    const goToNextQuestion = useCallback(async (wasCorrect) => {
        const newScore = wasCorrect ? myScore + 1 : myScore;
        const nextIndex = myQuestionIndex + 1;

        // 対戦モード：正解数が目標に達したか判定
        if (!isSolo && newScore >= TARGET_CORRECT) {
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
    }, [isSolo, myQuestionIndex, roomId, myUid, myScore, roomData]);

    // レート関連の情報
    const myRating = stats?.multiplayerRating || DEFAULT_RATING;
    const myLevelInfo = getLevelFromRating(myRating);
    const myRankInfo = getRankFromRating(myRating);
    const nextLevelInfo = getNextLevelInfo(myRating);

    useEffect(() => {
        if (phase !== 'result' || !roomData || ratingChange !== null || !updateStats) return;
        if (!isSolo && roomData.status !== 'finished') return;

        if (isSolo) {
            setRatingChange({ newRating: myRating, change: 0 });
            return;
        }

        const opponent = roomData.player1.uid === myUid ? roomData.player2 : roomData.player1;
        const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, TARGET_CORRECT);
        const didWin = winnerUid === null ? null : winnerUid === myUid;
        const opRating = opponent?.rating || DEFAULT_RATING;
        const result = didWin === null
            ? calculateDrawRatingChange(myRating, opRating)
            : calculateRatingChange(myRating, opRating, didWin);

        setRatingChange(result);
        updateStats({ multiplayerRating: result.newRating });
    }, [phase, roomData, ratingChange, updateStats, isSolo, myUid, myRating]);

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
    const startMatching = async () => {
        if (!myUid) return;
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        resetMatchState();
        setPhase('matching');
        setError(null);
        setPrevLevelLabel(myLevelInfo.label);

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
    };

    // 解答選択
    const handleAnswer = useCallback(async (answer) => {
        if (selectedAnswer !== null || !roomData || !myUid || showFeedback) return;

        const question = roomData.questions[myQuestionIndex];
        const isCorrect = answer === question.correctAnswer;

        setSelectedAnswer(answer);
        setShowFeedback(true);
        clearInterval(timerIntervalRef.current);

        const submitPromise = !isSolo
            ? submitAnswer(roomId, myUid, myQuestionIndex, answer, isCorrect)
            : Promise.resolve();

        if (isCorrect) {
            setMyScore(prev => prev + 1);
            queueAdvance(true, 1000, submitPromise);
        } else {
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
    }, [selectedAnswer, roomData, myUid, showFeedback, isSolo, roomId, myQuestionIndex, queueAdvance]);

    // 「わからない」：正解を見せて不正解扱いで次へ
    const handleSkip = useCallback(() => {
        if (selectedAnswer !== null || !roomData || !myUid) return;
        const question = roomData.questions[myQuestionIndex];
        setSelectedAnswer('__skip__');
        setShowFeedback(true);
        clearInterval(timerIntervalRef.current);
        const submitPromise = !isSolo
            ? submitAnswer(roomId, myUid, myQuestionIndex, '__skip__', false)
            : Promise.resolve();
        addWrongQuestion({
            subject: '英単語バトル',
            questionId: question.word,
            questionText: question.word,
            correctAnswer: question.correctAnswer,
            userAnswer: '（わからない）',
            options: question.options
        });
        queueAdvance(false, WRONG_ANSWER_DELAY, submitPromise);
    }, [selectedAnswer, roomData, myUid, isSolo, roomId, myQuestionIndex, queueAdvance]);

    // タイムアップ
    const handleTimeUp = useCallback(() => {
        if (selectedAnswer !== null || !roomData || !myUid) return;

        setSelectedAnswer('__timeout__');
        setShowFeedback(true);

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
    }, [selectedAnswer, roomData, myUid, isSolo, roomId, myQuestionIndex, queueAdvance]);

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
        clearTimeout(matchingTimeoutRef.current);
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        if (roomId && !isSolo) await leaveRoom(roomId, myUid);
        navigate('/home');
    };

    // プレイ中の途中終了（結果画面へ）
    const handleEndQuiz = () => {
        clearInterval(timerIntervalRef.current);
        clearTimeout(feedbackTimeoutRef.current);
        setPhase('result');
    };

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
                            {isSolo ? '限界まで挑戦！出題される単語に次々答えていこう！' : `先に${TARGET_CORRECT}問正解した方の勝ち！`}</p>
                        <div className="mp-rules">
                            <div className="mp-rule-item">🎯 {isSolo ? '限界まで挑戦' : `${TARGET_CORRECT}問正解で勝利`}</div>
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
        return (
            <div className="mp-screen">
                {renderBackground()}
                <div className="mp-header">
                    <button className="mp-back-btn" onClick={handleLeave}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>対戦相手を探しています...</h1>
                </div>
                <div className="mp-matching-content">
                    <div className="mp-matching-spinner">
                        <Loader2 className="mp-spin" size={64} />
                    </div>
                    <p className="mp-matching-text">マッチング中...</p>
                    <p className="mp-matching-hint">対戦相手が見つかるまでお待ちください</p>
                    <div className="mp-matching-status-card">
                        <div className="mp-matching-status-title">待機の目安</div>
                        <div className="mp-matching-status-body">30秒以内に相手が見つからない場合は自動で待機を終了します。</div>
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
                    <button className="mp-back-btn" onClick={() => navigate('/home')}>
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
                            <button className="mp-cancel-btn" onClick={() => navigate('/home')}>
                                ホームに戻る
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
            <div className="mp-screen">
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
                    <div className="mp-countdown-number">{countdown}</div>
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
        const opponentStatus = !isSolo ? getOpponentStatusMeta(opponent, myQuestionIndex, showFeedback) : null;
        const opScore = opponent?.score || 0;
        const totalQuestions = roomData.questions.length;

        // 進行度の計算 (%)
        // ソロモード時は「全問題数」に対する進捗、対戦モード時は「目標正解数」に対する進捗
        const myProgressPercent = isSolo 
            ? Math.min(((myQuestionIndex + 1) / totalQuestions) * 100, 100)
            : Math.min((myScore / TARGET_CORRECT) * 100, 100);
            
        const opProgressPercent = Math.min((opScore / TARGET_CORRECT) * 100, 100);

        return (
            <div className="mp-screen mp-playing-screen">
                {renderBackground()}
                
                {/* 途中終了ボタン（ソロモード時） */}
                {isSolo && (
                    <button className="mp-end-quiz-btn" onClick={handleEndQuiz} title="クイズを終了して結果を見る">
                        <ArrowLeft size={24} />
                    </button>
                )}
                
                {/* キャラクター（mp-playing-screenに対してabsolute配置） */}
                <div className="mp-character-area">
                    <img 
                        className="mp-center-character" 
                        src={getCharacterImage(myCharacterId, myEquippedSkin)} 
                        alt="Character" 
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
                                    <div className="mp-status-score">{opScore} / {TARGET_CORRECT}</div>
                                </div>
                                <div className={`mp-opponent-status mp-status-${opponentStatus.tone}`}>
                                    <span className="mp-opponent-status-label">{opponentStatus.label}</span>
                                    <span className="mp-opponent-status-detail">{opponentStatus.detail}</span>
                                </div>
                            </div>
                            <div className="mp-progress-bar-container">
                                <div className="mp-progress-bar-fill mp-bg-op" style={{ width: `${opProgressPercent}%` }} />
                            </div>
                        </div>
                    )}


                    {/* 問題とタイマー（中央） */}
                    <div className="mp-question-container">
                        <div className="mp-question-card">
                            <div className="mp-question-word">{question.word}</div>
                            <p className="mp-question-hint">この単語の意味は？</p>
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
                                    {isSolo ? `${myScore} / ${totalQuestions}` : `${myScore} / ${TARGET_CORRECT}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* フィードバック表示 (画面全体の中央に大きく被せる) */}
                    {showFeedback && (
                        <div className="mp-feedback-center">
                            {selectedAnswer === '__timeout__' ? (
                                <div className="mp-feedback-card mp-fc-timeout">
                                    <h2>❌</h2>
                                    <p>正解: {question.correctAnswer}</p>
                                </div>
                            ) : selectedAnswer === question.correctAnswer ? (
                                <div className="mp-feedback-card mp-fc-correct">
                                    <h2>◯</h2>
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
        const winnerUid = roomData.winnerUid ?? resolveWinnerUid(roomData, TARGET_CORRECT);

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
            <div className="mp-screen">
                {renderBackground()}
                <div className={`mp-result-content ${resultClass}`}>
                    
                    <div className="mp-result-character-bg">
                        {(isSolo || finalMyScore >= opScore) && (
                            <img className="mp-result-char-img mp-result-char-me" 
                                 src={getCharacterImage(myCharacterId, myEquippedSkin)} alt="Me Win" />
                        )}
                    </div>
                    
                    <div className="mp-result-panel">
                        <div className="mp-result-emoji">{resultEmoji}</div>
                        <h2 className="mp-result-text">{resultText}</h2>

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

                    {/* レート変動表示 */}
                    {resultNotice && (
                        <div className="mp-result-notice">
                            {resultNotice}
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
                        <button className="mp-rematch-btn" onClick={() => {
                            if (unsubscribeRef.current) {
                                unsubscribeRef.current();
                                unsubscribeRef.current = null;
                            }
                            resetMatchState();
                            setPrevLevelLabel(null);
                            setPhase('init');
                        }}>
                            もう一度対戦する
                        </button>
                        <button className="mp-home-btn" onClick={() => navigate('/home')}>
                            ホームに戻る
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
