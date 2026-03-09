import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Swords, Clock, Trophy, Loader2 } from 'lucide-react';
import { getCurrentUser, getUserProfile } from '../firebase/auth';
import {
    findOrCreateRoom,
    subscribeToRoom,
    submitAnswer,
    leaveRoom,
    markFinished,
    TARGET_CORRECT
} from '../firebase/matching';
import './MultiplayerMatch.css';

const ANSWER_TIME_LIMIT = 10; // 1問あたりの制限時間（秒）
const WRONG_ANSWER_DELAY = 1200; // 不正解時に正解を表示する時間（ms）

const MultiplayerMatch = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('init'); // init | matching | countdown | playing | result
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

    const unsubscribeRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const feedbackTimeoutRef = useRef(null);

    // 初期化: ユーザー確認
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setMyUid(user.uid);

        getUserProfile(user.uid).then(result => {
            if (result.success) {
                setMyDisplayName(result.data.displayName || user.displayName || 'Player');
            } else {
                setMyDisplayName(user.displayName || 'Player');
            }
        });
    }, [navigate]);

    // ルームデータ更新時
    useEffect(() => {
        if (!roomData || !myUid) return;

        // ゲーム開始検出
        if (roomData.status === 'playing' && phase === 'matching') {
            setPhase('countdown');
        }

        // ゲーム終了検出（相手が先にフィニッシュした時）
        if (roomData.status === 'finished' && phase === 'playing') {
            clearInterval(timerIntervalRef.current);
            clearTimeout(feedbackTimeoutRef.current);
            setPhase('result');
        }
    }, [roomData, phase, myUid]);

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
    }, [phase, myQuestionIndex]);

    // クリーンアップ
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
            clearInterval(timerIntervalRef.current);
            clearTimeout(feedbackTimeoutRef.current);
        };
    }, []);

    // 次の問題へ進む（ローカル管理）
    const goToNextQuestion = useCallback((wasCorrect) => {
        // 正解数が目標に達したか判定
        const newScore = wasCorrect ? myScore + 1 : myScore;
        if (newScore >= TARGET_CORRECT) {
            // 勝利！ → Firestoreに完了を通知
            clearInterval(timerIntervalRef.current);
            setMyScore(newScore);
            markFinished(roomId, myUid);
            setPhase('result');
            return;
        }

        const nextIndex = myQuestionIndex + 1;

        // 問題プールを使い切った場合もゲーム終了
        if (roomData && nextIndex >= roomData.questions.length) {
            clearInterval(timerIntervalRef.current);
            setMyScore(newScore);
            markFinished(roomId, myUid);
            setPhase('result');
            return;
        }

        setMyQuestionIndex(nextIndex);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setTimer(ANSWER_TIME_LIMIT);
    }, [myQuestionIndex, roomId, myUid, myScore, roomData]);

    // マッチング開始
    const startMatching = async () => {
        if (!myUid) return;
        setPhase('matching');
        setError(null);

        try {
            const { roomId: newRoomId } = await findOrCreateRoom(myUid, myDisplayName);
            setRoomId(newRoomId);

            const unsub = subscribeToRoom(newRoomId, (data) => {
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

        // Firestoreに記録
        submitAnswer(roomId, myUid, myQuestionIndex, answer, isCorrect);

        if (isCorrect) {
            // 正解 → スコア加算して即次の問題へ
            setMyScore(prev => prev + 1);
            feedbackTimeoutRef.current = setTimeout(() => {
                goToNextQuestion(true);
            }, 150);
        } else {
            // 不正解 → 1秒間正解を表示してから次の問題へ
            feedbackTimeoutRef.current = setTimeout(() => {
                goToNextQuestion(false);
            }, WRONG_ANSWER_DELAY);
        }
    }, [selectedAnswer, roomData, myUid, roomId, showFeedback, myQuestionIndex, goToNextQuestion]);

    // タイムアップ
    const handleTimeUp = useCallback(async () => {
        if (selectedAnswer !== null || !roomData || !myUid) return;

        setSelectedAnswer('__timeout__');
        setShowFeedback(true);

        submitAnswer(roomId, myUid, myQuestionIndex, '__timeout__', false);

        // タイムアウトも不正解扱い → 1秒待って次へ
        feedbackTimeoutRef.current = setTimeout(() => {
            goToNextQuestion(false);
        }, WRONG_ANSWER_DELAY);
    }, [selectedAnswer, roomData, myUid, roomId, myQuestionIndex, goToNextQuestion]);

    // 退出
    const handleLeave = async () => {
        if (unsubscribeRef.current) unsubscribeRef.current();
        if (roomId) await leaveRoom(roomId, myUid);
        navigate('/home');
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
    // レンダリング
    // ================================================================

    // 初期画面
    if (phase === 'init') {
        return (
            <div className="mp-screen">
                <div className="mp-header">
                    <button className="mp-back-btn" onClick={() => navigate('/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1><Swords size={28} /> 英単語バトル</h1>
                </div>
                <div className="mp-init-content">
                    <div className="mp-title-card">
                        <div className="mp-title-icon">⚔️</div>
                        <h2>英単語 早押しクイズ</h2>
                        <p>フレンドやライバルと英単語の知識で対決！<br />
                            先に{TARGET_CORRECT}問正解した方の勝ち！</p>
                        <div className="mp-rules">
                            <div className="mp-rule-item">🎯 {TARGET_CORRECT}問正解で勝利</div>
                            <div className="mp-rule-item">⏱️ 1問{ANSWER_TIME_LIMIT}秒</div>
                            <div className="mp-rule-item">❌ 誤答ペナルティ有</div>
                        </div>
                    </div>
                    <button className="mp-start-btn" onClick={startMatching}>
                        <Swords size={24} />
                        <span>対戦相手を探す</span>
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
                    <button className="mp-cancel-btn" onClick={handleLeave}>
                        キャンセル
                    </button>
                </div>
            </div>
        );
    }

    // カウントダウン
    if (phase === 'countdown') {
        const opponent = getOpponent();
        return (
            <div className="mp-screen">
                <div className="mp-countdown-content">
                    <div className="mp-vs-display">
                        <div className="mp-vs-player">
                            <div className="mp-vs-avatar">🧑</div>
                            <div className="mp-vs-name">{myDisplayName}</div>
                        </div>
                        <div className="mp-vs-icon">VS</div>
                        <div className="mp-vs-player">
                            <div className="mp-vs-avatar">👤</div>
                            <div className="mp-vs-name">{opponent?.displayName || '???'}</div>
                        </div>
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
        const opScore = opponent?.score || 0;
        const opProgress = opponent?.answers?.length || 0;

        return (
            <div className="mp-screen">
                {/* スコアバー */}
                <div className="mp-score-bar">
                    <div className="mp-score-player mp-score-me">
                        <span className="mp-score-name">{myDisplayName}</span>
                        <span className="mp-score-value">{myScore}</span>
                    </div>
                    <div className="mp-score-question">
                        <span>正解 {myScore} / {TARGET_CORRECT}</span>
                    </div>
                    <div className="mp-score-player mp-score-opponent">
                        <span className="mp-score-value">{opScore}</span>
                        <span className="mp-score-name">{opponent?.displayName || '???'}</span>
                    </div>
                </div>

                {/* 相手の進捗 */}
                <div className="mp-opponent-progress">
                    <span>相手: {opScore}/{TARGET_CORRECT} 正解</span>
                </div>

                {/* タイマー */}
                <div className="mp-timer-bar">
                    <div
                        className={`mp-timer-fill ${timer <= 3 ? 'mp-timer-danger' : ''}`}
                        style={{ width: `${(timer / ANSWER_TIME_LIMIT) * 100}%` }}
                    />
                </div>
                <div className="mp-timer-text">
                    <Clock size={16} />
                    <span>{timer}秒</span>
                </div>

                {/* 問題 */}
                <div className="mp-question-area">
                    <div className="mp-question-word">{question.word}</div>
                    <p className="mp-question-hint">この単語の意味は？</p>
                </div>

                {/* 選択肢 */}
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
                                <span className="mp-option-label">{['A', 'B', 'C', 'D'][idx]}</span>
                                <span className="mp-option-text">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {/* フィードバック表示 */}
                {showFeedback && (
                    <div className="mp-feedback-overlay">
                        {selectedAnswer === '__timeout__' ? (
                            <div className="mp-feedback mp-feedback-timeout">⏰ タイムアップ！ 正解: {question.correctAnswer}</div>
                        ) : selectedAnswer === question.correctAnswer ? (
                            <div className="mp-feedback mp-feedback-correct">🎉 正解！</div>
                        ) : (
                            <div className="mp-feedback mp-feedback-wrong">❌ 不正解... 正解: {question.correctAnswer}</div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // リザルト画面
    if (phase === 'result' && roomData) {
        const opponent = getOpponent();
        const myPlayerRoom = getMyPlayerFromRoom();
        // Firestoreの最新スコアを使う（自分のローカルスコアと相手のリモートスコア）
        const finalMyScore = myPlayerRoom?.score || myScore;
        const opScore = opponent?.score || 0;
        const myAnswered = myPlayerRoom?.answers?.length || 0;
        const opAnswered = opponent?.answers?.length || 0;

        // 勝敗判定: 先に10問正解した方が勝ち
        let resultClass = 'mp-result-draw';
        let resultText = '引き分け！';
        let resultEmoji = '🤝';
        if (finalMyScore >= TARGET_CORRECT) {
            resultClass = 'mp-result-win';
            resultText = '勝利！';
            resultEmoji = '🏆';
        } else if (opScore >= TARGET_CORRECT) {
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

        return (
            <div className="mp-screen">
                <div className={`mp-result-content ${resultClass}`}>
                    <div className="mp-result-emoji">{resultEmoji}</div>
                    <h2 className="mp-result-text">{resultText}</h2>

                    <div className="mp-result-scores">
                        <div className="mp-result-player mp-result-me">
                            <div className="mp-result-player-name">{myDisplayName}</div>
                            <div className="mp-result-player-score">{finalMyScore}</div>
                        </div>
                        <div className="mp-result-vs">-</div>
                        <div className="mp-result-player mp-result-op">
                            <div className="mp-result-player-name">{opponent?.displayName || '???'}</div>
                            <div className="mp-result-player-score">{opScore}</div>
                        </div>
                    </div>

                    <div className="mp-result-detail">
                        <p>{TARGET_CORRECT}問正解で勝利</p>
                    </div>

                    <div className="mp-result-actions">
                        <button className="mp-rematch-btn" onClick={() => {
                            if (unsubscribeRef.current) unsubscribeRef.current();
                            setRoomId(null);
                            setRoomData(null);
                            setSelectedAnswer(null);
                            setShowFeedback(false);
                            setMyQuestionIndex(0);
                            setMyScore(0);
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
