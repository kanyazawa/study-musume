/**
 * Firebase Firestore を使用したマルチプレイ対戦マッチング・ゲーム同期ロジック
 *
 * Firestore コレクション: matchRooms
 * ドキュメント構造:
 * {
 *   status: 'waiting' | 'playing' | 'finished',
 *   player1: { uid, displayName, score, answers: [] },
 *   player2: { uid, displayName, score, answers: [] } | null,
 *   questions: [ { word, meaning, options: [4つ] }, ... ],
 *   currentQuestion: 0,
 *   createdAt: Timestamp,
 *   startedAt: Timestamp | null,
 * }
 */

import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    limit,
    onSnapshot,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getVocabByLevel, getAllVocab } from '../data/vocabData';
import { getLevelFromRating, DEFAULT_RATING } from '../utils/ratingUtils';
import { buildQuestionOptions, resolveWinnerUid, shuffleArray } from '../utils/matchUtils';

const MATCH_ROOMS_COLLECTION = 'matchRooms';
const TARGET_CORRECT = 10; // 先に10問正解で勝ち
const QUESTIONS_POOL_SIZE = 30; // 多めに問題を用意

/**
 * ランダムに問題を生成する（レベル別）
 * 英単語を表示し、4つの日本語の意味から正解を選ぶ形式
 * @param {string} level - 'grade5' | 'grade4' | 'grade3' | 'grade_pre2'
 * @param {number} count - 出題数
 */
export function generateQuestions(level = 'grade5', count = QUESTIONS_POOL_SIZE) {
    const levelVocab = getVocabByLevel(level);
    const allVocab = getAllVocab();
    const allMeanings = allVocab.map(v => v.meaning);

    const shuffled = shuffleArray(levelVocab);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map(item => {
        return {
            word: item.word,
            correctAnswer: item.meaning,
            options: buildQuestionOptions(item.meaning, allMeanings)
        };
    });
}

/**
 * 空いているルームを探すか、新規作成してマッチング開始
 * @param {string} uid - プレイヤーのUID
 * @param {string} displayName - 表示名
 * @param {string} characterId - キャラクターID
 * @param {string} equippedSkin - 装備スキンID
 * @param {number} rating - プレイヤーのレート
 * @returns {{ roomId: string, isCreator: boolean }}
 */
export async function findOrCreateRoom(uid, displayName, characterId = 'noah', equippedSkin = 'default', rating = DEFAULT_RATING) {
    const roomsRef = collection(db, MATCH_ROOMS_COLLECTION);

    // 1. 待機中のルームを探す（自分が作ったルーム以外）
    const q = query(
        roomsRef,
        where('status', '==', 'waiting'),
        limit(5)
    );
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
        const roomRef = doc(db, MATCH_ROOMS_COLLECTION, docSnap.id);
        const joinResult = await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef);
            if (!roomSnap.exists()) return null;

            const roomData = roomSnap.data();
            if (roomData.status !== 'waiting' || roomData.player2 || roomData.player1.uid === uid) {
                return null;
            }

            const p1Rating = roomData.player1.rating || DEFAULT_RATING;
            const matchLevel = getLevelFromRating(Math.min(p1Rating, rating)).level;
            const questions = generateQuestions(matchLevel);

            transaction.update(roomRef, {
                status: 'playing',
                player2: {
                    uid,
                    displayName,
                    score: 0,
                    answers: [],
                    characterId,
                    equippedSkin,
                    rating
                },
                questions,
                level: matchLevel,
                currentQuestion: 0,
                winnerUid: null,
                finishReason: null,
                startedAt: serverTimestamp(),
                finishedAt: null
            });

            return { roomId: docSnap.id, isCreator: false };
        });

        if (joinResult) {
            return joinResult;
        }
    }

    // 2. 空きルームがない → 新規作成
    const myLevel = getLevelFromRating(rating).level;
    const newRoom = await addDoc(roomsRef, {
        status: 'waiting',
        player1: {
            uid,
            displayName,
            score: 0,
            answers: [],
            characterId,
            equippedSkin,
            rating
        },
        player2: null,
        questions: [],
        level: myLevel,
        currentQuestion: 0,
        createdAt: serverTimestamp(),
        startedAt: null,
        winnerUid: null,
        finishReason: null,
        finishedAt: null
    });

    return { roomId: newRoom.id, isCreator: true };
}

/**
 * ルームの状態変更をリアルタイムで監視する
 * @param {string} roomId
 * @param {function} callback - (roomData) => void
 * @returns {function} unsubscribe
 */
export function subscribeToRoom(roomId, callback) {
    const roomRef = doc(db, MATCH_ROOMS_COLLECTION, roomId);
    return onSnapshot(roomRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    });
}

/**
 * プレイヤーの解答を送信する
 * @param {string} roomId
 * @param {string} uid - 解答したプレイヤーのUID
 * @param {number} questionIndex - 何問目か
 * @param {string} selectedAnswer - 選んだ答え
 * @param {boolean} isCorrect - 正解かどうか
 */
export async function submitAnswer(roomId, uid, questionIndex, selectedAnswer, isCorrect) {
    const roomRef = doc(db, MATCH_ROOMS_COLLECTION, roomId);
    return runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return false;

        const roomData = roomSnap.data();
        if (roomData.status !== 'playing') return false;

        const isPlayer1 = roomData.player1.uid === uid;
        const playerKey = isPlayer1 ? 'player1' : 'player2';
        const player = roomData[playerKey];
        if (!player) return false;

        if (player.answers && player.answers.some(a => a.questionIndex === questionIndex)) {
            return false;
        }

        const newAnswer = {
            questionIndex,
            selectedAnswer,
            isCorrect,
            timestamp: Date.now()
        };

        const updatedAnswers = [...(player.answers || []), newAnswer];
        const updatedScore = isCorrect ? player.score + 1 : player.score;

        transaction.update(roomRef, {
            [`${playerKey}.answers`]: updatedAnswers,
            [`${playerKey}.score`]: updatedScore
        });

        return true;
    });
}

/**
 * プレイヤーが全問回答完了した時にゲームを終了させる
 * @param {string} roomId
 * @param {string} uid
 */
export async function markFinished(roomId, uid, finishReason = 'completed') {
    const roomRef = doc(db, MATCH_ROOMS_COLLECTION, roomId);
    return runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return null;

        const roomData = roomSnap.data();
        if (roomData.status === 'finished') {
            return {
                winnerUid: roomData.winnerUid || null,
                finishReason: roomData.finishReason || finishReason
            };
        }

        const belongsToRoom = roomData.player1?.uid === uid || roomData.player2?.uid === uid;
        if (!belongsToRoom) {
            return null;
        }

        const winnerUid = resolveWinnerUid(roomData, TARGET_CORRECT);

        transaction.update(roomRef, {
            status: 'finished',
            winnerUid,
            finishReason,
            finishedAt: serverTimestamp()
        });

        return { winnerUid, finishReason };
    });
}

/**
 * ルームから退出（マッチング中に離脱した場合）
 * @param {string} roomId
 * @param {string} uid
 */
export async function leaveRoom(roomId, uid, options = {}) {
    const { waitingOnly = false } = options;

    try {
        const roomRef = doc(db, MATCH_ROOMS_COLLECTION, roomId);
        return await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef);
            if (!roomSnap.exists()) {
                return { status: 'missing' };
            }

            const roomData = roomSnap.data();

            if (roomData.status === 'waiting') {
                transaction.delete(roomRef);
                return { status: 'deleted' };
            }

            if (waitingOnly) {
                return { status: 'already_started' };
            }

            if (roomData.status === 'playing') {
                const opponent = roomData.player1?.uid === uid ? roomData.player2 : roomData.player1;
                const winnerUid = opponent?.uid || null;

                transaction.update(roomRef, {
                    status: 'finished',
                    winnerUid,
                    finishReason: 'opponent_left',
                    finishedAt: serverTimestamp()
                });

                return { status: 'finished', winnerUid };
            }

            return {
                status: roomData.status,
                winnerUid: roomData.winnerUid || null
            };
        });
    } catch (e) {
        console.error('Error leaving room:', e);
        return { status: 'error', error: e };
    }
}

export { TARGET_CORRECT };
