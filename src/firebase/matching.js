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
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './config';

const MATCH_ROOMS_COLLECTION = 'matchRooms';
const TARGET_CORRECT = 10; // 先に10問正解で勝ち
const QUESTIONS_POOL_SIZE = 30; // 多めに問題を用意

// ==============================
// 英単語データ (ローカルフォールバック)
// ==============================
const VOCAB_POOL = [
    { word: 'abandon', meaning: '捨てる、見捨てる' },
    { word: 'abolish', meaning: '廃止する' },
    { word: 'abstract', meaning: '抽象的な' },
    { word: 'abundant', meaning: '豊富な' },
    { word: 'accomplish', meaning: '成し遂げる' },
    { word: 'accurate', meaning: '正確な' },
    { word: 'acquire', meaning: '取得する' },
    { word: 'adequate', meaning: '十分な' },
    { word: 'admire', meaning: '称賛する' },
    { word: 'adolescent', meaning: '青年期の' },
    { word: 'agriculture', meaning: '農業' },
    { word: 'ancestor', meaning: '祖先' },
    { word: 'apparent', meaning: '明らかな' },
    { word: 'appetite', meaning: '食欲' },
    { word: 'atmosphere', meaning: '大気、雰囲気' },
    { word: 'attitude', meaning: '態度' },
    { word: 'author', meaning: '著者' },
    { word: 'authority', meaning: '権威、当局' },
    { word: 'brief', meaning: '簡潔な' },
    { word: 'brilliant', meaning: '素晴らしい' },
    { word: 'calculate', meaning: '計算する' },
    { word: 'capable', meaning: '有能な' },
    { word: 'colleague', meaning: '同僚' },
    { word: 'commerce', meaning: '商業' },
    { word: 'committee', meaning: '委員会' },
    { word: 'companion', meaning: '仲間' },
    { word: 'complicate', meaning: '複雑にする' },
    { word: 'concentrate', meaning: '集中する' },
    { word: 'conflict', meaning: '紛争、対立' },
    { word: 'conscience', meaning: '良心' },
    { word: 'consequence', meaning: '結果' },
    { word: 'considerable', meaning: 'かなりの' },
    { word: 'continent', meaning: '大陸' },
    { word: 'contribute', meaning: '貢献する' },
    { word: 'convenient', meaning: '便利な' },
    { word: 'correspond', meaning: '一致する' },
    { word: 'creature', meaning: '生き物' },
    { word: 'curiosity', meaning: '好奇心' },
    { word: 'declare', meaning: '宣言する' },
    { word: 'demonstrate', meaning: '実証する' },
    { word: 'deserve', meaning: '値する' },
    { word: 'determine', meaning: '決定する' },
    { word: 'disaster', meaning: '災害' },
    { word: 'discipline', meaning: '規律' },
    { word: 'distinguish', meaning: '区別する' },
    { word: 'domestic', meaning: '国内の' },
    { word: 'eliminate', meaning: '除去する' },
    { word: 'embrace', meaning: '受け入れる' },
    { word: 'emerge', meaning: '現れる' },
    { word: 'emphasis', meaning: '強調' },
    { word: 'encounter', meaning: '遭遇する' },
    { word: 'enormous', meaning: '巨大な' },
    { word: 'enthusiasm', meaning: '熱意' },
    { word: 'essential', meaning: '不可欠な' },
    { word: 'evaluate', meaning: '評価する' },
    { word: 'evidence', meaning: '証拠' },
    { word: 'exaggerate', meaning: '誇張する' },
    { word: 'fascinating', meaning: '魅力的な' },
    { word: 'fortune', meaning: '運、財産' },
    { word: 'frequent', meaning: '頻繁な' },
    { word: 'genuine', meaning: '本物の' },
    { word: 'hesitate', meaning: 'ためらう' },
    { word: 'illustrate', meaning: '説明する' },
    { word: 'implement', meaning: '実行する' },
    { word: 'incredible', meaning: '信じられない' },
    { word: 'inevitable', meaning: '避けられない' },
    { word: 'interpret', meaning: '解釈する' },
    { word: 'investigate', meaning: '調査する' },
    { word: 'justify', meaning: '正当化する' },
    { word: 'luxury', meaning: '贅沢' },
    { word: 'magnificent', meaning: '壮大な' },
    { word: 'manufacture', meaning: '製造する' },
    { word: 'moderate', meaning: '適度な' },
    { word: 'negotiate', meaning: '交渉する' },
    { word: 'obligation', meaning: '義務' },
    { word: 'obstacle', meaning: '障害' },
    { word: 'opportunity', meaning: '機会' },
    { word: 'phenomenon', meaning: '現象' },
    { word: 'prejudice', meaning: '偏見' },
    { word: 'preserve', meaning: '保存する' },
    { word: 'privilege', meaning: '特権' },
    { word: 'proportion', meaning: '割合' },
    { word: 'prospect', meaning: '見込み' },
    { word: 'pursue', meaning: '追求する' },
    { word: 'reluctant', meaning: '気が進まない' },
    { word: 'reputation', meaning: '評判' },
    { word: 'resemble', meaning: '似ている' },
    { word: 'sacrifice', meaning: '犠牲にする' },
    { word: 'sufficient', meaning: '十分な' },
    { word: 'temporary', meaning: '一時的な' },
    { word: 'tremendous', meaning: '途方もない' },
    { word: 'triumph', meaning: '勝利' },
    { word: 'vulnerable', meaning: '脆弱な' },
];

/**
 * ランダムに問題を生成する
 * 英単語を表示し、4つの日本語の意味から正解を選ぶ形式
 */
function generateQuestions(count = QUESTIONS_POOL_SIZE) {
    const shuffled = [...VOCAB_POOL].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    const allMeanings = VOCAB_POOL.map(v => v.meaning);

    return selected.map(item => {
        // 不正解の選択肢を3つ選ぶ
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
 * @returns {{ roomId: string, isCreator: boolean }}
 */
export async function findOrCreateRoom(uid, displayName) {
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

        // このルームに参加
        const roomRef = doc(db, MATCH_ROOMS_COLLECTION, docSnap.id);
        const questions = generateQuestions();

        await updateDoc(roomRef, {
            status: 'playing',
            player2: {
                uid,
                displayName,
                score: 0,
                answers: []
            },
            questions,
            currentQuestion: 0,
            startedAt: serverTimestamp()
        });

        return { roomId: docSnap.id, isCreator: false };
    }

    // 2. 空きルームがない → 新規作成
    const newRoom = await addDoc(roomsRef, {
        status: 'waiting',
        player1: {
            uid,
            displayName,
            score: 0,
            answers: []
        },
        player2: null,
        questions: [],
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
export async function markFinished(roomId, uid) {
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
export async function leaveRoom(roomId, uid) {
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
