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
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { getVocabByLevel, getAllVocab } from '../data/vocabData';
import { getLevelFromRating, DEFAULT_RATING } from '../utils/ratingUtils';

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

    const shuffled = [...levelVocab].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map(item => {
        // 不正解の選択肢を3つ選ぶ（同レベルの単語リスト + 全体から補完）
        const wrongMeanings = allMeanings
            .filter(m => m !== item.meaning)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // 4択をシャッフル
        const options = [item.meaning, ...wrongMeanings].sort(() => Math.random() - 0.5);

        return {
            word: item.word,
            correctAnswer: item.meaning,
            options
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
        const data = docSnap.data();
        // 自分が作成したルームは除外
        if (data.player1.uid === uid) continue;

        // このルームに参加 → 両者のレートの低い方に合わせてレベルを決定
        const roomRef = doc(db, MATCH_ROOMS_COLLECTION, docSnap.id);
        const p1Rating = data.player1.rating || DEFAULT_RATING;
        const matchLevel = getLevelFromRating(Math.min(p1Rating, rating)).level;
        const questions = generateQuestions(matchLevel);

        await updateDoc(roomRef, {
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
            startedAt: serverTimestamp()
        });

        return { roomId: docSnap.id, isCreator: false };
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
        startedAt: null
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
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data();
    const isPlayer1 = roomData.player1.uid === uid;
    const playerKey = isPlayer1 ? 'player1' : 'player2';
    const player = roomData[playerKey];

    // すでにこの問題に回答済みかチェック
    if (player.answers && player.answers.some(a => a.questionIndex === questionIndex)) {
        return; // 重複回答防止
    }

    const newAnswer = {
        questionIndex,
        selectedAnswer,
        isCorrect,
        timestamp: Date.now()
    };

    const updatedAnswers = [...(player.answers || []), newAnswer];
    const updatedScore = isCorrect ? player.score + 1 : player.score;

    const updateData = {};
    updateData[`${playerKey}.answers`] = updatedAnswers;
    updateData[`${playerKey}.score`] = updatedScore;

    await updateDoc(roomRef, updateData);
}

/**
 * プレイヤーが全問回答完了した時にゲームを終了させる
 * @param {string} roomId
 * @param {string} uid
 */
export async function markFinished(roomId) {
    const roomRef = doc(db, MATCH_ROOMS_COLLECTION, roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;

    // ゲームを終了状態にする
    await updateDoc(roomRef, {
        status: 'finished'
    });
}

/**
 * ルームから退出（マッチング中に離脱した場合）
 * @param {string} roomId
 * @param {string} uid
 */
export async function leaveRoom(roomId) {
    try {
        const roomRef = doc(db, MATCH_ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data();

        if (roomData.status === 'waiting') {
            // 待機中なら部屋を削除
            await deleteDoc(roomRef);
        } else if (roomData.status === 'playing') {
            // プレイ中なら強制終了
            await updateDoc(roomRef, {
                status: 'finished'
            });
        }
    } catch (e) {
        console.error('Error leaving room:', e);
    }
}

export { TARGET_CORRECT };
