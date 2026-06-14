import { CUSTOM_VOCAB_GRADE5 } from './customGrade5Vocab';
import { CUSTOM_VOCAB_GRADE4 } from './customGrade4Vocab';
import { CUSTOM_VOCAB_GRADE3 } from './customGrade3Vocab';
import { CUSTOM_VOCAB_GRADE_PRE2 } from './customPre2Vocab';
import { CUSTOM_VOCAB_GRADE2 } from './customGrade2Vocab';
import { CUSTOM_VOCAB_GRADE_PRE1 } from './customPre1Vocab';
import { CUSTOM_VOCAB_GRADE1 } from './customGrade1Vocab';

/**
 * 英検レベル別 英単語マスターデータ
 * 
 * レベル構成:
 *   - grade5: 英検5級（中学初級）       レート 0〜1199
 *   - grade4: 英検4級（中学中級）       レート 1200〜1499
 *   - grade3: 英検3級（中学卒業程度）   レート 1500〜1799
 *   - grade_pre2: 英検準2級（高校中級） レート 1800〜
 */

// ==============================
// 英検5級 (中学初級 / 基礎単語)
// ==============================
const LEGACY_GRADE5_VOCAB = [
    { word: 'apple', meaning: 'りんご' },
    { word: 'book', meaning: '本' },
    { word: 'cat', meaning: '猫' },
    { word: 'dog', meaning: '犬' },
    { word: 'egg', meaning: '卵' },
    { word: 'fish', meaning: '魚' },
    { word: 'girl', meaning: '女の子' },
    { word: 'house', meaning: '家' },
    { word: 'ice', meaning: '氷' },
    { word: 'juice', meaning: 'ジュース' },
    { word: 'king', meaning: '王' },
    { word: 'lion', meaning: 'ライオン' },
    { word: 'milk', meaning: '牛乳' },
    { word: 'name', meaning: '名前' },
    { word: 'orange', meaning: 'オレンジ' },
    { word: 'park', meaning: '公園' },
    { word: 'rain', meaning: '雨' },
    { word: 'school', meaning: '学校' },
    { word: 'tree', meaning: '木' },
    { word: 'uncle', meaning: 'おじ' },
    { word: 'water', meaning: '水' },
    { word: 'blue', meaning: '青い' },
    { word: 'red', meaning: '赤い' },
    { word: 'big', meaning: '大きい' },
    { word: 'small', meaning: '小さい' },
    { word: 'happy', meaning: '幸せな' },
    { word: 'sad', meaning: '悲しい' },
    { word: 'new', meaning: '新しい' },
    { word: 'old', meaning: '古い' },
    { word: 'good', meaning: '良い' },
    { word: 'bad', meaning: '悪い' },
    { word: 'hot', meaning: '暑い' },
    { word: 'cold', meaning: '寒い' },
    { word: 'long', meaning: '長い' },
    { word: 'short', meaning: '短い' },
    { word: 'run', meaning: '走る' },
    { word: 'walk', meaning: '歩く' },
    { word: 'eat', meaning: '食べる' },
    { word: 'drink', meaning: '飲む' },
    { word: 'play', meaning: '遊ぶ' },
    { word: 'study', meaning: '勉強する' },
    { word: 'read', meaning: '読む' },
    { word: 'write', meaning: '書く' },
    { word: 'speak', meaning: '話す' },
    { word: 'listen', meaning: '聞く' },
    { word: 'open', meaning: '開ける' },
    { word: 'close', meaning: '閉める' },
    { word: 'come', meaning: '来る' },
    { word: 'go', meaning: '行く' },
    { word: 'like', meaning: '好き' },
    { word: 'want', meaning: '欲しい' },
    { word: 'know', meaning: '知っている' },
    { word: 'think', meaning: '考える' },
    { word: 'see', meaning: '見る' },
    { word: 'make', meaning: '作る' },
    { word: 'bird', meaning: '鳥' },
    { word: 'flower', meaning: '花' },
    { word: 'music', meaning: '音楽' },
    { word: 'morning', meaning: '朝' },
    { word: 'night', meaning: '夜' },
    { word: 'summer', meaning: '夏' },
    { word: 'winter', meaning: '冬' },
    { word: 'spring', meaning: '春' },
    { word: 'autumn', meaning: '秋' },
    { word: 'mother', meaning: '母' },
    { word: 'father', meaning: '父' },
    { word: 'brother', meaning: '兄・弟' },
    { word: 'sister', meaning: '姉・妹' },
    { word: 'friend', meaning: '友達' },
    { word: 'teacher', meaning: '先生' },
    { word: 'student', meaning: '生徒' },
    { word: 'color', meaning: '色' },
    { word: 'hand', meaning: '手' },
    { word: 'head', meaning: '頭' },
    { word: 'eye', meaning: '目' },
    { word: 'mouth', meaning: '口' },
    { word: 'nose', meaning: '鼻' },
    { word: 'ear', meaning: '耳' },
    { word: 'food', meaning: '食べ物' },
    { word: 'chair', meaning: '椅子' },
    { word: 'table', meaning: 'テーブル' },
    { word: 'door', meaning: 'ドア' },
    { word: 'window', meaning: '窓' },
    { word: 'bag', meaning: 'かばん' },
    { word: 'box', meaning: '箱' },
    { word: 'car', meaning: '車' },
    { word: 'bicycle', meaning: '自転車' },
    { word: 'train', meaning: '電車' },
    { word: 'station', meaning: '駅' },
    { word: 'hospital', meaning: '病院' },
    { word: 'hotel', meaning: 'ホテル' },
    { word: 'city', meaning: '都市、市' },
    { word: 'town', meaning: '町' },
    { word: 'country', meaning: '国、田舎' },
    { word: 'morning', meaning: '朝' },
    { word: 'afternoon', meaning: '午後' },
    { word: 'evening', meaning: '夕方' },
    { word: 'today', meaning: '今日' },
    { word: 'tomorrow', meaning: '明日' },
    { word: 'yesterday', meaning: '昨日' },
    { word: 'week', meaning: '週' },
    { word: 'month', meaning: '月' },
    { word: 'year', meaning: '年' },
    { word: 'time', meaning: '時間' },
    { word: 'clock', meaning: '時計' },
    { word: 'picture', meaning: '写真、絵' },
    { word: 'movie', meaning: '映画' },
    { word: 'song', meaning: '歌' },
    { word: 'game', meaning: 'ゲーム' },
    { word: 'sport', meaning: 'スポーツ' },
    { word: 'animal', meaning: '動物' },
    { word: 'bear', meaning: '熊' },
    { word: 'monkey', meaning: '猿' },
    { word: 'pig', meaning: '豚' },
    { word: 'horse', meaning: '馬' },
    { word: 'cow', meaning: '牛' },
    { word: 'sheep', meaning: '羊' },
    { word: 'chicken', meaning: '鶏' },
    { word: 'beautiful', meaning: '美しい' },
    { word: 'cute', meaning: 'かわいい' },
    { word: 'tall', meaning: '背が高い' },
    { word: 'fast', meaning: '速い' },
    { word: 'slow', meaning: '遅い' },
    { word: 'white', meaning: '白い' },
    { word: 'black', meaning: '黒い' },
    { word: 'green', meaning: '緑の' },
    { word: 'yellow', meaning: '黄色の' },
    { word: 'purple', meaning: '紫の' },
    { word: 'brown', meaning: '茶色の' },
    { word: 'pink', meaning: 'ピンクの' },
    { word: 'gray', meaning: '灰色の' },
    { word: 'boy', meaning: '男の子' },
    { word: 'man', meaning: '男性' },
    { word: 'woman', meaning: '女性' },
    { word: 'family', meaning: '家族' },
    { word: 'baby', meaning: '赤ちゃん' },
    { word: 'hello', meaning: 'こんにちは' },
    { word: 'goodbye', meaning: 'さようなら' },
    { word: 'thank', meaning: '感謝する' },
    { word: 'please', meaning: 'どうか' },
    { word: 'sorry', meaning: 'ごめんなさい' },
    { word: 'breakfast', meaning: '朝食' },
    { word: 'lunch', meaning: '昼食' },
    { word: 'dinner', meaning: '夕食' },
    { word: 'desk', meaning: '机' },
    { word: 'pen', meaning: 'ペン' },
    { word: 'pencil', meaning: '鉛筆' },
    { word: 'notebook', meaning: 'ノート' },
    { word: 'dictionary', meaning: '辞書' },
    { word: 'buy', meaning: '買う' },
    { word: 'sell', meaning: '売る' },
    { word: 'give', meaning: '与える' },
    { word: 'take', meaning: '取る、持っていく' },
    { word: 'bring', meaning: '持ってくる' },
    { word: 'use', meaning: '使う' },
    { word: 'help', meaning: '手伝う' },
    { word: 'call', meaning: '呼ぶ、電話する' },
    { word: 'wash', meaning: '洗う' },
    { word: 'watch', meaning: '見る（動くものを）' },
    { word: 'wait', meaning: '待つ' },
    { word: 'stop', meaning: '止まる' },
    { word: 'start', meaning: '始まる' },
    { word: 'find', meaning: '見つける' },
    { word: 'meet', meaning: '会う' },
    { word: 'live', meaning: '住む' },
    { word: 'work', meaning: '働く' },
    { word: 'sleep', meaning: '眠る' },
    { word: 'swim', meaning: '泳ぐ' },
    { word: 'money', meaning: 'お金' },
    { word: 'shop', meaning: '店' },
    { word: 'supermarket', meaning: 'スーパー' },
    { word: 'camera', meaning: 'カメラ' },
    { word: 'computer', meaning: 'コンピューター' },
    { word: 'phone', meaning: '電話' },
    { word: 'letter', meaning: '手紙' },
    { word: 'stamp', meaning: '切手' },
    { word: 'umbrella', meaning: '傘' },
    { word: 'mountain', meaning: '山' },
    { word: 'river', meaning: '川' },
    { word: 'sea', meaning: '海' },
    { word: 'sky', meaning: '空' },
    { word: 'moon', meaning: '月（天体）' },
    { word: 'sun', meaning: '太陽' },
    { word: 'star', meaning: '星' },
    { word: 'cloud', meaning: '雲' },
    { word: 'snow', meaning: '雪' },
];

// ==============================
// 英検4級 (中学中級)
// ==============================
const LEGACY_GRADE4_VOCAB = [
    { word: 'agree', meaning: '同意する' },
    { word: 'arrive', meaning: '到着する' },
    { word: 'believe', meaning: '信じる' },
    { word: 'borrow', meaning: '借りる' },
    { word: 'build', meaning: '建てる' },
    { word: 'carry', meaning: '運ぶ' },
    { word: 'catch', meaning: '捕まえる' },
    { word: 'change', meaning: '変える' },
    { word: 'choose', meaning: '選ぶ' },
    { word: 'clean', meaning: 'きれいにする' },
    { word: 'climb', meaning: '登る' },
    { word: 'collect', meaning: '集める' },
    { word: 'continue', meaning: '続ける' },
    { word: 'cook', meaning: '料理する' },
    { word: 'decide', meaning: '決める' },
    { word: 'describe', meaning: '説明する' },
    { word: 'discover', meaning: '発見する' },
    { word: 'enjoy', meaning: '楽しむ' },
    { word: 'enter', meaning: '入る' },
    { word: 'explain', meaning: '説明する' },
    { word: 'fall', meaning: '落ちる' },
    { word: 'feel', meaning: '感じる' },
    { word: 'finish', meaning: '終える' },
    { word: 'follow', meaning: 'ついていく' },
    { word: 'forget', meaning: '忘れる' },
    { word: 'grow', meaning: '成長する' },
    { word: 'happen', meaning: '起こる' },
    { word: 'hurry', meaning: '急ぐ' },
    { word: 'imagine', meaning: '想像する' },
    { word: 'invite', meaning: '招待する' },
    { word: 'join', meaning: '参加する' },
    { word: 'keep', meaning: '保つ' },
    { word: 'laugh', meaning: '笑う' },
    { word: 'learn', meaning: '学ぶ' },
    { word: 'leave', meaning: '去る' },
    { word: 'lend', meaning: '貸す' },
    { word: 'lose', meaning: '失う' },
    { word: 'miss', meaning: '見逃す' },
    { word: 'move', meaning: '動く' },
    { word: 'notice', meaning: '気づく' },
    { word: 'paint', meaning: '描く、塗る' },
    { word: 'pass', meaning: '通り過ぎる、合格する' },
    { word: 'pay', meaning: '払う' },
    { word: 'pick', meaning: '選ぶ、摘む' },
    { word: 'practise', meaning: '練習する' },
    { word: 'pull', meaning: '引く' },
    { word: 'push', meaning: '押す' },
    { word: 'rest', meaning: '休む' },
    { word: 'return', meaning: '戻る' },
    { word: 'save', meaning: '救う、貯める' },
    { word: 'serve', meaning: '食事を出す、仕える' },
    { word: 'show', meaning: '見せる' },
    { word: 'smell', meaning: 'においがする' },
    { word: 'smile', meaning: '微笑む' },
    { word: 'sound', meaning: '〜に聞こえる' },
    { word: 'stand', meaning: '立つ' },
    { word: 'stay', meaning: '滞在する' },
    { word: 'taste', meaning: '味がする' },
    { word: 'teach', meaning: '教える' },
    { word: 'throw', meaning: '投げる' },
    { word: 'touch', meaning: '触れる' },
    { word: 'travel', meaning: '旅行する' },
    { word: 'try', meaning: '試す' },
    { word: 'turn', meaning: '曲がる、回る' },
    { word: 'understand', meaning: '理解する' },
    { word: 'visit', meaning: '訪問する' },
    { word: 'wear', meaning: '着ている' },
    { word: 'win', meaning: '勝つ' },
    { word: 'abroad', meaning: '海外へ' },
    { word: 'accident', meaning: '事故' },
    { word: 'adventure', meaning: '冒険' },
    { word: 'advice', meaning: '助言' },
    { word: 'already', meaning: 'もう、すでに' },
    { word: 'angry', meaning: '怒っている' },
    { word: 'careful', meaning: '注意深い' },
    { word: 'corner', meaning: '角' },
    { word: 'culture', meaning: '文化' },
    { word: 'dangerous', meaning: '危険な' },
    { word: 'difference', meaning: '違い' },
    { word: 'difficult', meaning: '難しい' },
    { word: 'example', meaning: '例' },
    { word: 'excite', meaning: '興奮させる' },
    { word: 'famous', meaning: '有名な' },
    { word: 'foreign', meaning: '外国の' },
    { word: 'future', meaning: '未来' },
    { word: 'health', meaning: '健康' },
    { word: 'history', meaning: '歴史' },
    { word: 'human', meaning: '人間' },
    { word: 'important', meaning: '重要な' },
    { word: 'information', meaning: '情報' },
    { word: 'island', meaning: '島' },
    { word: 'language', meaning: '言語' },
    { word: 'member', meaning: 'メンバー' },
    { word: 'natural', meaning: '自然の' },
    { word: 'necessary', meaning: '必要な' },
    { word: 'popular', meaning: '人気のある' },
    { word: 'possible', meaning: '可能な' },
    { word: 'powerful', meaning: '力強い' },
    { word: 'problem', meaning: '問題' },
    { word: 'promise', meaning: '約束する' },
    { word: 'purpose', meaning: '目的' },
    { word: 'reason', meaning: '理由' },
    { word: 'receive', meaning: '受け取る' },
    { word: 'remember', meaning: '覚えている' },
    { word: 'several', meaning: 'いくつかの' },
    { word: 'society', meaning: '社会' },
    { word: 'surprise', meaning: '驚かせる' },
    { word: 'typical', meaning: '典型的な' },
    { word: 'weather', meaning: '天気' },
    { word: 'alone', meaning: '一人で' },
    { word: 'always', meaning: 'いつも' },
    { word: 'often', meaning: 'よく、しばしば' },
    { word: 'sometimes', meaning: '時々' },
    { word: 'usually', meaning: 'たいてい' },
    { word: 'never', meaning: '決して〜ない' },
    { word: 'airport', meaning: '空港' },
    { word: 'art', meaning: '芸術' },
    { word: 'bank', meaning: '銀行' },
    { word: 'bath', meaning: '入浴' },
    { word: 'beach', meaning: 'ビーチ' },
    { word: 'bridge', meaning: '橋' },
    { word: 'business', meaning: 'ビジネス' },
    { word: 'capital', meaning: '首都' },
    { word: 'center', meaning: '中心' },
    { word: 'church', meaning: '教会' },
    { word: 'class', meaning: '授業、クラス' },
    { word: 'club', meaning: 'クラブ' },
    { word: 'college', meaning: '大学' },
    { word: 'company', meaning: '会社' },
    { word: 'concert', meaning: 'コンサート' },
    { word: 'dictionary', meaning: '辞書' },
    { word: 'earth', meaning: '地球' },
    { word: 'end', meaning: '終わり' },
    { word: 'exam', meaning: '試験' },
    { word: 'fact', meaning: '事実' },
    { word: 'factory', meaning: '工場' },
    { word: 'festival', meaning: '祭り' },
    { word: 'field', meaning: '野原、分野' },
    { word: 'fire', meaning: '火' },
    { word: 'forest', meaning: '森' },
    { word: 'front', meaning: '前' },
    { word: 'fun', meaning: '楽しみ' },
    { word: 'gift', meaning: '贈り物' },
    { word: 'glass', meaning: 'ガラス、コップ' },
    { word: 'guide', meaning: '案内者' },
    { word: 'half', meaning: '半分' },
    { word: 'hole', meaning: '穴' },
    { word: 'holiday', meaning: '休日' },
    { word: 'idea', meaning: '考え' },
    { word: 'job', meaning: '仕事' },
    { word: 'king', meaning: '王' },
    { word: 'lake', meaning: '湖' },
    { word: 'land', meaning: '陸地' },
    { word: 'life', meaning: '生活、命' },
    { word: 'line', meaning: '線' },
    { word: 'list', meaning: 'リスト' },
    { word: 'machine', meaning: '機械' },
    { word: 'matter', meaning: '問題、事柄' },
    { word: 'meat', meaning: '肉' },
    { word: 'meeting', meaning: '会議' },
    { word: 'message', meaning: '伝言' },
    { word: 'minute', meaning: '分' },
    { word: 'mirror', meaning: '鏡' }
];

// ==============================
// 英検3級 (中学卒業程度)
// ==============================
const LEGACY_GRADE3_VOCAB = [
    { word: 'accept', meaning: '受け入れる' },
    { word: 'achieve', meaning: '達成する' },
    { word: 'affect', meaning: '影響する' },
    { word: 'allow', meaning: '許す' },
    { word: 'announce', meaning: '発表する' },
    { word: 'appear', meaning: '現れる' },
    { word: 'apply', meaning: '応募する' },
    { word: 'arrange', meaning: '手配する' },
    { word: 'attend', meaning: '出席する' },
    { word: 'avoid', meaning: '避ける' },
    { word: 'behave', meaning: '振る舞う' },
    { word: 'belong', meaning: '属する' },
    { word: 'blame', meaning: '非難する' },
    { word: 'bother', meaning: '悩ます' },
    { word: 'celebrate', meaning: '祝う' },
    { word: 'compare', meaning: '比較する' },
    { word: 'complain', meaning: '不満を言う' },
    { word: 'concern', meaning: '心配させる' },
    { word: 'consider', meaning: '考慮する' },
    { word: 'create', meaning: '創造する' },
    { word: 'damage', meaning: '損害を与える' },
    { word: 'decrease', meaning: '減少する' },
    { word: 'deliver', meaning: '届ける' },
    { word: 'demand', meaning: '要求する' },
    { word: 'depend', meaning: '依存する' },
    { word: 'develop', meaning: '発展する' },
    { word: 'disappear', meaning: '消える' },
    { word: 'earn', meaning: '稼ぐ' },
    { word: 'encourage', meaning: '励ます' },
    { word: 'expect', meaning: '期待する' },
    { word: 'experience', meaning: '経験する' },
    { word: 'express', meaning: '表現する' },
    { word: 'fail', meaning: '失敗する' },
    { word: 'focus', meaning: '集中する' },
    { word: 'gain', meaning: '得る' },
    { word: 'include', meaning: '含む' },
    { word: 'increase', meaning: '増加する' },
    { word: 'influence', meaning: '影響を与える' },
    { word: 'introduce', meaning: '紹介する' },
    { word: 'manage', meaning: '管理する' },
    { word: 'environment', meaning: '環境' },
    { word: 'condition', meaning: '条件' },
    { word: 'communication', meaning: 'コミュニケーション' },
    { word: 'ability', meaning: '能力' },
    { word: 'advantage', meaning: '利点' },
    { word: 'amount', meaning: '量' },
    { word: 'article', meaning: '記事' },
    { word: 'attention', meaning: '注意' },
    { word: 'audience', meaning: '聴衆' },
    { word: 'background', meaning: '背景' },
    { word: 'benefit', meaning: '利益' },
    { word: 'challenge', meaning: '挑戦' },
    { word: 'character', meaning: '性格' },
    { word: 'community', meaning: '地域社会' },
    { word: 'competition', meaning: '競争' },
    { word: 'connection', meaning: 'つながり' },
    { word: 'courage', meaning: '勇気' },
    { word: 'custom', meaning: '習慣' },
    { word: 'education', meaning: '教育' },
    { word: 'effort', meaning: '努力' },
    { word: 'emotion', meaning: '感情' },
    { word: 'excellent', meaning: '優れた' },
    { word: 'gentle', meaning: '穏やかな' },
    { word: 'graduate', meaning: '卒業する' },
    { word: 'honest', meaning: '正直な' },
    { word: 'impressive', meaning: '印象的な' },
    { word: 'independent', meaning: '独立した' },
    { word: 'material', meaning: '材料' },
    { word: 'method', meaning: '方法' },
    { word: 'opinion', meaning: '意見' },
    { word: 'patient', meaning: '辛抱強い' },
    { word: 'performance', meaning: '性能' },
    { word: 'personal', meaning: '個人的な' },
    { word: 'physical', meaning: '身体の' },
    { word: 'polite', meaning: '礼儀正しい' },
    { word: 'prevent', meaning: '防ぐ' },
    { word: 'produce', meaning: '生産する' },
    { word: 'provide', meaning: '提供する' },
    { word: 'realize', meaning: '気づく' },
    { word: 'recently', meaning: '最近' },
    { word: 'require', meaning: '必要とする' },
    { word: 'respect', meaning: '尊敬する' },
    { word: 'result', meaning: '結果' },
    { word: 'situation', meaning: '状況' },
    { word: 'suggest', meaning: '提案する' },
    { word: 'support', meaning: '支持する' },
    { word: 'technology', meaning: '技術' },
    { word: 'tradition', meaning: '伝統' },
    { word: 'value', meaning: '価値' },
    { word: 'variety', meaning: '多様性' },
    { word: 'offer', meaning: '提供する、申し出る' },
    { word: 'warn', meaning: '警告する' },
    { word: 'reduce', meaning: '減らす' },
    { word: 'release', meaning: '解放する' },
    { word: 'replace', meaning: '取り替える' },
    { word: 'solve', meaning: '解決する' },
    { word: 'search', meaning: '探す' },
    { word: 'add', meaning: '加える' },
    { word: 'cause', meaning: '引き起こす' },
    { word: 'share', meaning: '共有する' },
    { word: 'protect', meaning: '保護する' },
    { word: 'lead', meaning: '導く' },
    { word: 'prove', meaning: '証明する' },
    { word: 'guess', meaning: '推測する' },
    { word: 'feed', meaning: '食物を与える' },
    { word: 'improve', meaning: '改善する' },
    { word: 'prepare', meaning: '準備する' },
    { word: 'publish', meaning: '出版する' },
    { word: 'recognize', meaning: '認識する' },
    { word: 'recover', meaning: '回復する' },
    { word: 'relax', meaning: 'リラックスする' },
    { word: 'reply', meaning: '返事をする' },
    { word: 'act', meaning: '行動する' },
    { word: 'answer', meaning: '答える' },
    { word: 'ask', meaning: '尋ねる' },
    { word: 'bite', meaning: '噛む' },
    { word: 'blow', meaning: '吹く' },
    { word: 'break', meaning: '壊す' },
    { word: 'care', meaning: '気にかける' },
    { word: 'cost', meaning: '費用がかかる' },
    { word: 'cover', meaning: '覆う' },
    { word: 'cross', meaning: '横切る' },
    { word: 'crowd', meaning: '群衆、群がる' },
    { word: 'cry', meaning: '泣く' },
    { word: 'cut', meaning: '切る' },
    { word: 'dance', meaning: '踊る' },
    { word: 'die', meaning: '死ぬ' },
    { word: 'draw', meaning: '描く' },
    { word: 'drive', meaning: '運転する' },
    { word: 'drop', meaning: '落とす' },
    { word: 'exchange', meaning: '交換する' },
    { word: 'exist', meaning: '存在する' },
    { word: 'fill', meaning: '満たす' },
    { word: 'fly', meaning: '飛ぶ' },
    { word: 'gather', meaning: '集まる' },
    { word: 'hate', meaning: '憎む' },
    { word: 'hide', meaning: '隠す' },
    { word: 'hit', meaning: '打つ' },
    { word: 'hold', meaning: '持つ、開催する' },
    { word: 'hope', meaning: '希望する' },
    { word: 'hurt', meaning: '傷つける' },
    { word: 'jump', meaning: '跳ぶ' },
    { word: 'kick', meaning: '蹴る' },
    { word: 'kill', meaning: '殺す' },
    { word: 'kiss', meaning: 'キスする' },
    { word: 'lay', meaning: '置く、横たえる' },
    { word: 'lie', meaning: '横たわる、嘘をつく' },
    { word: 'love', meaning: '愛する' },
    { word: 'marry', meaning: '結婚する' },
    { word: 'mean', meaning: '意味する' },
    { word: 'mind', meaning: '気にする' }
];

// ==============================
// 英検準2級 (高校中級)
// ==============================
const LEGACY_GRADE_PRE2_VOCAB = [
    { word: 'a number of', meaning: 'いくつかの' },
    { word: 'a variety of', meaning: 'さまざまな' },
    { word: 'abandon', meaning: '捨てる、諦める' },
    { word: 'ability', meaning: '能力' },
    { word: 'abroad', meaning: '海外に' },
    { word: 'absolutely', meaning: '絶対に' },
    { word: 'absorb', meaning: '吸収する' },
    { word: 'academic', meaning: '学問的な' },
    { word: 'accept', meaning: '受け入れる' },
    { word: 'accidentally', meaning: '偶然に' },
    { word: 'accompany', meaning: '同行する' },
    { word: 'accomplish', meaning: '成し遂げる' },
    { word: 'according to', meaning: '〜によると' },
    { word: 'account', meaning: '説明する、口座' },
    { word: 'accurate', meaning: '正確な' },
    { word: 'accuse', meaning: '告訴する' },
    { word: 'achieve', meaning: '達成する' },
    { word: 'achievement', meaning: '業績、成果' },
    { word: 'active', meaning: '活発な' },
    { word: 'activist', meaning: '活動家' },
    { word: 'activity', meaning: '活動' },
    { word: 'actual', meaning: '実際の' },
    { word: 'actually', meaning: '実際には' },
    { word: 'adapt', meaning: '適応する' },
    { word: 'addition', meaning: '追加、加算' },
    { word: 'additionally', meaning: 'さらに' },
    { word: 'address', meaning: '取り組む、住所' },
    { word: 'administration', meaning: '行政、経営' },
    { word: 'admire', meaning: '称賛する' },
    { word: 'admission', meaning: '入学、認めること' },
    { word: 'admit', meaning: '認める' },
    { word: 'adopt', meaning: '採用する' },
    { word: 'advantage', meaning: '有利な点' },
    { word: 'advertise', meaning: '広告する' },
    { word: 'advertising', meaning: '広告、宣伝' },
    { word: 'advice', meaning: '助言' },
    { word: 'advocate', meaning: '主張する、支持者' },
    { word: 'affair', meaning: '事柄、情事' },
    { word: 'affect', meaning: '影響する' },
    { word: 'afford', meaning: '余裕がある' },
    { word: 'afraid', meaning: '恐れている' },
    { word: 'after all', meaning: '結局' },
    { word: 'agenda', meaning: '議題' },
    { word: 'agent', meaning: '代理人' },
    { word: 'agree with', meaning: '〜に同意する' },
    { word: 'agreement', meaning: '合意' },
    { word: 'agriculture', meaning: '農業' },
    { word: 'aid', meaning: '援助する' },
    { word: 'aim', meaning: '目的、狙う' },
    { word: 'aircraft', meaning: '航空機' },
    { word: 'airline', meaning: '航空会社' },
    { word: 'alike', meaning: '同様に' },
    { word: 'all the way', meaning: 'ずっと、はるばる' },
    { word: 'alliance', meaning: '同盟' },
    { word: 'allow', meaning: '許可する' },
    { word: 'ally', meaning: '同盟国、味方' },
    { word: 'alter', meaning: '変える' },
    { word: 'alternative', meaning: '代替案' },
    { word: 'although', meaning: '〜だけれども' },
    { word: 'amendment', meaning: '修正案' },
    { word: 'amount', meaning: '量' },
    { word: 'analysis', meaning: '分析' },
    { word: 'analyst', meaning: 'アナリスト' },
    { word: 'analyze', meaning: '分析する' },
    { word: 'ancestor', meaning: '祖先' },
    { word: 'ancient', meaning: '古代の' },
    { word: 'and so on', meaning: 'など' },
    { word: 'anniversary', meaning: '記念日' },
    { word: 'annoy', meaning: '悩ます' },
    { word: 'annually', meaning: '毎年' },
    { word: 'answer for', meaning: '〜の責任を取る' },
    { word: 'anxiety', meaning: '不安' },
    { word: 'anxious', meaning: '心配している' },
    { word: 'anyway', meaning: 'とにかく' },
    { word: 'apart', meaning: '離れて' },
    { word: 'apologize', meaning: '謝る' },
    { word: 'apology', meaning: '謝罪' },
    { word: 'apparently', meaning: '明らかに' },
    { word: 'appeal', meaning: '訴える、魅力' },
    { word: 'appeal to', meaning: '〜に訴える' },
    { word: 'appear', meaning: '現れる' },
    { word: 'appearance', meaning: '外見、登場' },
    { word: 'apply', meaning: '申し込む' },
    { word: 'apply to', meaning: '〜に当てはまる' },
    { word: 'appoint', meaning: '任命する' },
    { word: 'appointment', meaning: '予約、任命' },
    { word: 'appreciate', meaning: '感謝する' },
    { word: 'approach', meaning: '近づく、方法' },
    { word: 'appropriate', meaning: '適切な' },
    { word: 'approval', meaning: '承認' },
    { word: 'argue', meaning: '議論する' },
    { word: 'argument', meaning: '議論、口論' },
    { word: 'arise', meaning: '生じる' },
    { word: 'armed', meaning: '武装した' },
    { word: 'arms', meaning: '武器' },
    { word: 'arrange', meaning: '手配する' },
    { word: 'arrangement', meaning: '取り決め' },
    { word: 'arrest', meaning: '逮捕する' },
    { word: 'arrival', meaning: '到着' },
    { word: 'article', meaning: '記事、品物' },
    { word: 'artificial', meaning: '人工的な' },
    { word: 'as a result', meaning: 'その結果' },
    { word: 'as to', meaning: '〜に関して' },
    { word: 'as well', meaning: 'また、同様に' },
    { word: 'aspect', meaning: '側面' },
    { word: 'assault', meaning: '暴行する' },
    { word: 'assessment', meaning: '評価' },
    { word: 'asset', meaning: '資産' },
    { word: 'assignment', meaning: '課題、任務' },
    { word: 'assistance', meaning: '援助' },
    { word: 'associate', meaning: '関連付ける' },
    { word: 'association', meaning: '協会、連携' },
    { word: 'assumption', meaning: '仮定' },
    { word: 'at a time', meaning: '一度に' },
    { word: 'at any cost', meaning: 'どんな犠牲を払っても' },
    { word: 'at first', meaning: '最初は' },
    { word: 'at last', meaning: 'ついに' },
    { word: 'at most', meaning: 'せいぜい' },
    { word: 'at one time', meaning: 'かつては' },
    { word: 'at present', meaning: '現在は' },
    { word: 'at that time', meaning: 'その時は' },
    { word: 'at the same time', meaning: '同時に' },
    { word: 'atmosphere', meaning: '大気、雰囲気' },
    { word: 'attach', meaning: '取り付ける' },
    { word: 'attempt', meaning: '試みる' },
    { word: 'attend', meaning: '出席する' },
    { word: 'attitude', meaning: '態度' },
    { word: 'attorney', meaning: '弁護士' },
    { word: 'attract', meaning: '引きつける' },
    { word: 'attractive', meaning: '魅力的な' },
    { word: 'attribute', meaning: '帰する、特性' },
    { word: 'audience', meaning: '聴衆' },
    { word: 'author', meaning: '著者' },
    { word: 'authority', meaning: '権威、当局' },
    { word: 'available', meaning: '利用できる' },
    { word: 'avoid', meaning: '避ける' },
    { word: 'aware', meaning: '気づいている' },
    { word: 'awareness', meaning: '意識、認識' },
    { word: 'ban', meaning: '禁止する' },
    { word: 'barely', meaning: 'かろうじて' },
    { word: 'basis', meaning: '基礎' },
    { word: 'be affected by', meaning: '〜に影響される' },
    { word: 'be beneficial to', meaning: '〜に有益である' },
    { word: 'be concerned with', meaning: '〜に関係している' },
    { word: 'be filled with', meaning: '〜で満たされている' },
    { word: 'be good at', meaning: '〜が得意だ' },
    { word: 'be known as', meaning: '〜として知られている' },
    { word: 'be likely to', meaning: '〜しそうだ' },
    { word: 'be popular with', meaning: '〜に人気がある' },
    { word: 'be responsible for', meaning: '〜に責任がある' },
    { word: 'because of', meaning: '〜のために' },
    { word: 'behave', meaning: '振る舞う' },
    { word: 'behavior', meaning: '行動' },
    { word: 'belief', meaning: '信念' },
    { word: 'belong', meaning: '属する' },
    { word: 'benefit', meaning: '利益、恩恵' },
    { word: 'betray', meaning: '裏切る' },
    { word: 'beyond', meaning: '〜を超えて' },
    { word: 'biological', meaning: '生物学的な' },
    { word: 'blame', meaning: '非難する' },
    { word: 'bond', meaning: '絆、つながり' },
    { word: 'boundary', meaning: '境界' },
    { word: 'break into', meaning: '侵入する' },
    { word: 'brief', meaning: '簡潔な' },
    { word: 'brilliant', meaning: '素晴らしい' },
    { word: 'broad', meaning: '広い' },
    { word: 'broadcast', meaning: '放送する' },
    { word: 'by chance', meaning: '偶然に' },
    { word: 'by the time', meaning: '〜する頃には' },
    { word: 'calculate', meaning: '計算する' },
    { word: 'call off', meaning: '中止する' },
    { word: 'capable', meaning: '有能な' },
    { word: 'capable of', meaning: '〜ができる' },
    { word: 'capital', meaning: '首都、資本' },
    { word: 'carbon', meaning: '炭素' },
    { word: 'catch up with', meaning: '追いつく' },
    { word: 'cause', meaning: '引き起こす、原因' },
    { word: 'celebrate', meaning: '祝う' },
    { word: 'celebration', meaning: '祝典' },
    { word: 'certain', meaning: '確かな' },
    { word: 'certainly', meaning: '確かに' },
    { word: 'characteristic', meaning: '特徴' },
    { word: 'charge', meaning: '請求する、担当' },
    { word: 'chemical', meaning: '化学的な' },
    { word: 'circumstance', meaning: '状況' },
    { word: 'citizen', meaning: '市民' },
    { word: 'civilization', meaning: '文明' },
    { word: 'claim to do', meaning: '〜すると主張する' },
    { word: 'climate', meaning: '気候' },
    { word: 'closely', meaning: '密接に' },
    { word: 'clue', meaning: '手がかり' },
    { word: 'coalition', meaning: '連合' },
    { word: 'collaboration', meaning: '協力' },
    { word: 'collapse', meaning: '崩壊する' },
    { word: 'combat', meaning: '戦う、戦闘' },
    { word: 'combine', meaning: '組み合わせる' },
    { word: 'come up with', meaning: '思いつく' },
    { word: 'comfortable', meaning: '快適な' },
    { word: 'commercial', meaning: '商業的な' },
    { word: 'commitment', meaning: '約束、責任' },
    { word: 'community', meaning: '地域社会' },
    { word: 'compare', meaning: '比較する' },
    { word: 'compete', meaning: '競争する' },
    { word: 'competition', meaning: '競争' },
    { word: 'competitive', meaning: '競争の激しい' },
    { word: 'complain', meaning: '不満を言う' },
    { word: 'complex', meaning: '複雑な' },
    { word: 'complicated', meaning: '複雑な' },
    { word: 'component', meaning: '構成要素' },
    { word: 'comprehensive', meaning: '包括的な' },
    { word: 'compromise', meaning: '妥協する' },
    { word: 'concentrate on', meaning: '〜に集中する' },
    { word: 'concept', meaning: '概念' },
    { word: 'concern', meaning: '懸念する' },
    { word: 'conclude', meaning: '結論づける' },
    { word: 'conclusion', meaning: '結論' },
    { word: 'condition', meaning: '状態、条件' },
    { word: 'conduct', meaning: '行う、指揮する' },
    { word: 'confidence', meaning: '自信' },
    { word: 'conflict', meaning: '対立、紛争' },
    { word: 'congress', meaning: '議会' },
    { word: 'consequence', meaning: '結果' },
    { word: 'considerable', meaning: 'かなりの' },
    { word: 'consideration', meaning: '考慮' },
    { word: 'consistent', meaning: '一貫した' },
    { word: 'construct', meaning: '建設する' },
    { word: 'consume', meaning: '消費する' },
    { word: 'consumer', meaning: '消費者' },
    { word: 'consumption', meaning: '消費' },
    { word: 'contain', meaning: '含む' },
    { word: 'contemporary', meaning: '現代の' },
    { word: 'context', meaning: '文脈' },
    { word: 'continue', meaning: '続ける' },
    { word: 'contrary', meaning: '反対の' },
    { word: 'contrast', meaning: '対比' },
    { word: 'contribute', meaning: '貢献する' },
    { word: 'contribution', meaning: '貢献' },
    { word: 'controversial', meaning: '議論を呼ぶ' },
    { word: 'conventional', meaning: '従来の' },
    { word: 'convince', meaning: '説得する' },
    { word: 'cooperation', meaning: '協力' },
    { word: 'cope', meaning: '対処する' },
    { word: 'correct', meaning: '正しい' },
    { word: 'council', meaning: '議会、評議会' },
    { word: 'crime', meaning: '犯罪' },
    { word: 'criminal', meaning: '犯罪者、犯罪の' },
    { word: 'crisis', meaning: '危機' },
    { word: 'critical', meaning: '批判的な、重大な' },
    { word: 'criticism', meaning: '批判' },
    { word: 'crucial', meaning: '重要な' },
    { word: 'curiosity', meaning: '好奇心' },
    { word: 'curious', meaning: '好奇心旺盛な' },
    { word: 'currency', meaning: '通貨' },
    { word: 'current', meaning: '現在の、流れ' },
    { word: 'cut down on', meaning: '〜を減らす' },
    { word: 'deadline', meaning: '締め切り' },
    { word: 'debate', meaning: '議論する' },
    { word: 'debt', meaning: '借金' },
    { word: 'decade', meaning: '10年' },
    { word: 'deceive', meaning: '騙す' },
    { word: 'decision', meaning: '決定' },
    { word: 'declare', meaning: '宣言する' },
    { word: 'decline', meaning: '断る、低下する' },
    { word: 'decrease', meaning: '減少する' },
    { word: 'defeat', meaning: '打ち負かす' },
    { word: 'defendant', meaning: '被告' },
    { word: 'definitely', meaning: '確かに' },
    { word: 'degree', meaning: '程度、学位' },
    { word: 'delay', meaning: '遅らせる' },
    { word: 'demand', meaning: '要求する' },
    { word: 'democracy', meaning: '民主主義' },
    { word: 'demonstrate', meaning: 'デモをする、証明する' },
    { word: 'deny', meaning: '否定する' },
    { word: 'depend on', meaning: '〜に頼る' },
    { word: 'depression', meaning: '不景気、うつ' },
    { word: 'derive', meaning: '由来する' },
    { word: 'deserve', meaning: '〜に値する' },
    { word: 'desire', meaning: '欲望' },
    { word: 'despite', meaning: '〜にもかかわらず' },
    { word: 'destroy', meaning: '破壊する' },
    { word: 'destruction', meaning: '破壊' },
    { word: 'detect', meaning: '検出する' },
    { word: 'determine', meaning: '決定する' },
    { word: 'develop', meaning: '発展させる' },
    { word: 'development', meaning: '発展' },
    { word: 'device', meaning: '装置' },
    { word: 'diet', meaning: '食事、国会' },
    { word: 'differ from', meaning: '〜と異なる' },
    { word: 'directly', meaning: '直接に' },
    { word: 'disappear', meaning: '消える' },
    { word: 'disappoint', meaning: 'がっかりさせる' },
    { word: 'disaster', meaning: '災害' },
    { word: 'discipline', meaning: '規律' },
    { word: 'discovery', meaning: '発見' },
    { word: 'discussion', meaning: '議論' },
    { word: 'disease', meaning: '病気' },
    { word: 'dismiss', meaning: '解雇する' },
    { word: 'disorder', meaning: '障害、混乱' },
    { word: 'distance', meaning: '距離' },
    { word: 'distinction', meaning: '区別' },
    { word: 'distribute', meaning: '配布する' },
    { word: 'district', meaning: '地区' },
    { word: 'divide', meaning: '分割する' },
    { word: 'domestic', meaning: '国内の' },
    { word: 'doubt', meaning: '疑う' },
    { word: 'dramatic', meaning: '劇的な' },
    { word: 'dress up', meaning: '着飾る' },
    { word: 'drop by', meaning: '立ち寄る' },
    { word: 'due', meaning: '〜が原因で、期日' },
    { word: 'duty', meaning: '義務' },
    { word: 'eager', meaning: '熱心な' },
    { word: 'earn', meaning: '稼ぐ' },
    { word: 'economic', meaning: '経済的な' },
    { word: 'economy', meaning: '経済' },
    { word: 'educate', meaning: '教育する' },
    { word: 'education', meaning: '教育' },
    { word: 'effect', meaning: '効果' },
    { word: 'effective', meaning: '効果的な' },
    { word: 'efficiency', meaning: '効率' },
    { word: 'efficient', meaning: '効率的な' },
    { word: 'elderly', meaning: '高齢の' },
    { word: 'elect', meaning: '選ぶ' },
    { word: 'election', meaning: '選挙' },
    { word: 'element', meaning: '要素' },
    { word: 'emerge', meaning: '現れる' },
    { word: 'emergency', meaning: '緊急事態' },
    { word: 'emphasis', meaning: '強調' },
    { word: 'emphasize', meaning: '強調する' },
    { word: 'employ', meaning: '雇用する' },
    { word: 'employee', meaning: '従業員' },
    { word: 'employment', meaning: '雇用' },
    { word: 'enable', meaning: '可能にする' },
    { word: 'encounter', meaning: '出会う' },
    { word: 'encourage', meaning: '励ます' },
    { word: 'end up', meaning: '最終的に〜になる' },
    { word: 'endure', meaning: '耐える' },
    { word: 'enhance', meaning: '高める' },
    { word: 'enormous', meaning: '巨大な' },
    { word: 'entertain', meaning: '楽しませる' },
    { word: 'entertainment', meaning: '娯楽' },
    { word: 'entire', meaning: '全体の' },
    { word: 'entirely', meaning: '完全に' },
    { word: 'environment', meaning: '環境' },
    { word: 'environmental', meaning: '環境の' },
    { word: 'equal', meaning: '等しい' },
    { word: 'escape', meaning: '逃げる' },
    { word: 'especially', meaning: '特に' },
    { word: 'establish', meaning: '設立する' },
    { word: 'establishment', meaning: '設立' },
    { word: 'estimate', meaning: '見積もる' },
    { word: 'evaluate', meaning: '評価する' },
    { word: 'even though', meaning: '〜であっても' },
    { word: 'eventually', meaning: '最終的に' },
    { word: 'evidence', meaning: '証拠' },
    { word: 'evolution', meaning: '進化' },
    { word: 'examine', meaning: '調べる' },
    { word: 'except', meaning: '〜を除いては' },
    { word: 'expand', meaning: '拡大する' },
    { word: 'expectation', meaning: '期待' },
    { word: 'experiment', meaning: '実験' },
    { word: 'expert', meaning: '専門家' },
    { word: 'explain', meaning: '説明する' },
    { word: 'explore', meaning: '探索する' },
    { word: 'export', meaning: '輸出する' },
    { word: 'expose', meaning: 'さらす' },
    { word: 'express', meaning: '表現する' },
    { word: 'extend', meaning: '延長する' },
    { word: 'extensive', meaning: '広範な' },
    { word: 'extra', meaning: '余分な' },
    { word: 'extraordinary', meaning: '並外れた' },
    { word: 'factor', meaning: '要因' },
    { word: 'failure', meaning: '失敗' },
    { word: 'fairly', meaning: 'かなり、公平に' },
    { word: 'faith', meaning: '信頼、信仰' },
    { word: 'fate', meaning: '運命' },
    { word: 'favor', meaning: '好意、支持する' },
    { word: 'feature', meaning: '特徴' },
    { word: 'federal', meaning: '連邦の' },
    { word: 'fertilizer', meaning: '肥料' },
    { word: 'fill out', meaning: '記入する' },
    { word: 'finance', meaning: '財政' },
    { word: 'financial', meaning: '財政的な' },
    { word: 'find out', meaning: '見つける、調べる' },
    { word: 'flexibility', meaning: '柔軟性' },
    { word: 'flood', meaning: '洪水' },
    { word: 'focus', meaning: '集中する' },
    { word: 'for fear of', meaning: '〜を恐れて' },
    { word: 'for instance', meaning: '例えば' },
    { word: 'force', meaning: '強制する、力' },
    { word: 'foreign', meaning: '外国の' },
    { word: 'formal', meaning: '正式な' },
    { word: 'fossil fuel', meaning: '化石燃料' },
    { word: 'foundation', meaning: '基盤、財団' },
    { word: 'founder', meaning: '創設者' },
    { word: 'frequent', meaning: '頻繁な' },
    { word: 'frequently', meaning: '頻繁に' },
    { word: 'from time to time', meaning: '時折' },
    { word: 'fundamental', meaning: '基本的な' },
    { word: 'furthermore', meaning: 'さらに' },
    { word: 'gain', meaning: '得る' },
    { word: 'gather', meaning: '集める' },
    { word: 'generous', meaning: '寛大な' },
    { word: 'get along with', meaning: '〜とうまくやる' },
    { word: 'get rid of', meaning: '〜を取り除く' },
    { word: 'global', meaning: '地球規模の' },
    { word: 'govern', meaning: '統治する' },
    { word: 'government', meaning: '政府' },
    { word: 'gradually', meaning: '徐々に' },
    { word: 'grant', meaning: '与える、助成金' },
    { word: 'guarantee', meaning: '保証する' },
    { word: 'guilty of', meaning: '〜の罪を犯した' },
    { word: 'handle', meaning: '対処する' },
    { word: 'hardly', meaning: 'ほとんど〜ない' },
    { word: 'harm', meaning: '害を与える' },
    { word: 'harmful', meaning: '有害な' },
    { word: 'harvest', meaning: '収穫する' },
    { word: 'have an effect on', meaning: '〜に影響を与える' },
    { word: 'headline', meaning: '見出し' },
    { word: 'heritage', meaning: '遺産' },
    { word: 'hesitate', meaning: 'ためらう' },
    { word: 'highlight', meaning: '強調する' },
    { word: 'hire', meaning: '雇う' },
    { word: 'historic', meaning: '歴史的な' },
    { word: 'honest', meaning: '正直な' },
    { word: 'huge', meaning: '巨大な' },
    { word: 'identify', meaning: '特定する' },
    { word: 'identity', meaning: 'アイデンティティ' },
    { word: 'ignore', meaning: '無視する' },
    { word: 'illegal', meaning: '違法な' },
    { word: 'immediately', meaning: 'すぐに' },
    { word: 'immigrant', meaning: '移民' },
    { word: 'imply', meaning: '暗示する' },
    { word: 'import', meaning: '輸入する' },
    { word: 'impress', meaning: '感動させる' },
    { word: 'impression', meaning: '印象' },
    { word: 'impressive', meaning: '印象的な' },
    { word: 'improve', meaning: '改善する' },
    { word: 'in a hurry', meaning: '急いで' },
    { word: 'in addition', meaning: 'さらに' },
    { word: 'in advance', meaning: '前もって' },
    { word: 'in case', meaning: '〜の場合に備えて' },
    { word: 'in common', meaning: '共通して' },
    { word: 'in contrast', meaning: '対照的に' },
    { word: 'in detail', meaning: '詳細に' },
    { word: 'in order to', meaning: '〜するために' },
    { word: 'in particular', meaning: '特に' },
    { word: 'in reality', meaning: '実際には' },
    { word: 'in response to', meaning: '〜に応じて' },
    { word: 'in spite of', meaning: '〜にもかかわらず' },
    { word: 'in the long run', meaning: '長い目で見れば' },
    { word: 'in the past', meaning: '過去には' },
    { word: 'include', meaning: '含む' },
    { word: 'income', meaning: '収入' },
    { word: 'increase', meaning: '増やす、増加' },
    { word: 'independence', meaning: '独立' },
    { word: 'independent', meaning: '独立した' },
    { word: 'indicate', meaning: '示す' },
    { word: 'individual', meaning: '個人の' },
    { word: 'industrial', meaning: '工業の' },
    { word: 'industry', meaning: '産業' },
    { word: 'influence', meaning: '影響' },
    { word: 'inform', meaning: '知らせる' },
    { word: 'ingredient', meaning: '材料' },
    { word: 'initiative', meaning: '主導権' },
    { word: 'injury', meaning: '怪我' },
    { word: 'innocent', meaning: '無実の' },
    { word: 'insist on', meaning: '〜を主張する' },
    { word: 'instead of', meaning: '〜の代わりに' },
    { word: 'instinct', meaning: '本能' },
    { word: 'intend to', meaning: '〜するつもりだ' },
    { word: 'intense', meaning: '激しい' },
    { word: 'internal', meaning: '内部の' },
    { word: 'international', meaning: '国際的な' },
    { word: 'interpret', meaning: '解釈する' },
    { word: 'intervention', meaning: '介入' },
    { word: 'invest in', meaning: '〜に投資する' },
    { word: 'investigation', meaning: '調査' },
    { word: 'involve', meaning: '含む、巻き込む' },
    { word: 'issue', meaning: '問題、発行する' },
    { word: 'joint', meaning: '共同の、関節' },
    { word: 'judge', meaning: '判断する、裁判官' },
    { word: 'keep in mind', meaning: '心に留めておく' },
    { word: 'keep up with', meaning: '〜に追いつく' },
    { word: 'knowledge', meaning: '知識' },
    { word: 'labor', meaning: '労働' },
    { word: 'lack', meaning: '欠如、欠けている' },
    { word: 'largely', meaning: '主に' },
    { word: 'latter', meaning: '後者の' },
    { word: 'launch', meaning: '始める、打ち上げる' },
    { word: 'lead to', meaning: '〜につながる' },
    { word: 'learn by heart', meaning: '暗記する' },
    { word: 'leave out', meaning: '省く' },
    { word: 'lecture', meaning: '講義' },
    { word: 'legislation', meaning: '法律' },
    { word: 'leisure', meaning: '余暇' },
    { word: 'literature', meaning: '文学' },
    { word: 'locate', meaning: '位置を特定する' },
    { word: 'look down on', meaning: '見下す' },
    { word: 'maintain', meaning: '維持する' },
    { word: 'maintenance', meaning: '維持、整備' },
    { word: 'majority', meaning: '大多数' },
    { word: 'make a difference', meaning: '変化をもたらす' },
    { word: 'make sure', meaning: '確認する' },
    { word: 'manage', meaning: '管理する' },
    { word: 'manufacturer', meaning: 'メーカー' },
    { word: 'manufacturing', meaning: '製造' },
    { word: 'mass', meaning: '大量の' },
    { word: 'material', meaning: '材料、素材' },
    { word: 'maximum', meaning: '最大限' },
    { word: 'mayor', meaning: '市長' },
    { word: 'meanwhile', meaning: 'その間に' },
    { word: 'measure', meaning: '測る、対策' },
    { word: 'mental', meaning: '精神的な' },
    { word: 'merely', meaning: '単に' },
    { word: 'method', meaning: '方法' },
    { word: 'military', meaning: '軍事の' },
    { word: 'minister', meaning: '大臣' },
    { word: 'mixture', meaning: '混合物' },
    { word: 'modern', meaning: '現代の' },
    { word: 'modify', meaning: '修正する' },
    { word: 'moral', meaning: '道徳的な' },
    { word: 'more and more', meaning: 'ますます' },
    { word: 'moreover', meaning: 'さらに' },
    { word: 'mostly', meaning: '主に' },
    { word: 'multiple', meaning: '複数の' },
    { word: 'murder', meaning: '殺人' },
    { word: 'mysterious', meaning: '神秘的な' },
    { word: 'narrow', meaning: '狭い' },
    { word: 'national', meaning: '国家の' },
    { word: 'necessarily', meaning: '必ずしも' },
    { word: 'necessary', meaning: '必要な' },
    { word: 'negotiate', meaning: '交渉する' },
    { word: 'negotiation', meaning: '交渉' },
    { word: 'neighborhood', meaning: '近所' },
    { word: 'nevertheless', meaning: 'それにもかかわらず' },
    { word: 'normally', meaning: '通常は' },
    { word: 'not always', meaning: '必ずしも〜ではない' },
    { word: 'notice', meaning: '気づく' },
    { word: 'notion', meaning: '概念、考え' },
    { word: 'nowadays', meaning: '最近では' },
    { word: 'nuclear', meaning: '核の' },
    { word: 'objective', meaning: '目標、客観的な' },
    { word: 'observation', meaning: '観察' },
    { word: 'observe', meaning: '観察する' },
    { word: 'obtain', meaning: '手に入れる' },
    { word: 'obvious', meaning: '明らかな' },
    { word: 'obviously', meaning: '明らかに' },
    { word: 'occasionally', meaning: '時々' },
    { word: 'occupation', meaning: '職業' },
    { word: 'occur', meaning: '起こる' },
    { word: 'on account of', meaning: '〜のために' },
    { word: 'on average', meaning: '平均して' },
    { word: 'on behalf of', meaning: '〜を代表して' },
    { word: 'on purpose', meaning: '故意に' },
    { word: 'on the contrary', meaning: '逆に' },
    { word: 'on the other hand', meaning: '一方で' },
    { word: 'on the way to', meaning: '〜に向かう途中で' },
    { word: 'operate', meaning: '操作する' },
    { word: 'opponent', meaning: '反対者、競争相手' },
    { word: 'opportunity', meaning: '機会' },
    { word: 'oppose', meaning: '反対する' },
    { word: 'opposition', meaning: '反対' },
    { word: 'organization', meaning: '組織' },
    { word: 'origin', meaning: '起源' },
    { word: 'outcome', meaning: '結果' },
    { word: 'over time', meaning: '時間が経つにつれて' },
    { word: 'overall', meaning: '全体的な' },
    { word: 'overcome', meaning: '克服する' },
    { word: 'participate in', meaning: '〜に参加する' },
    { word: 'particular', meaning: '特定の' },
    { word: 'particularly', meaning: '特に' },
    { word: 'partly', meaning: '一部は' },
    { word: 'passenger', meaning: '乗客' },
    { word: 'patient', meaning: '辛抱強い、患者' },
    { word: 'perceive', meaning: '知覚する' },
    { word: 'percentage', meaning: 'パーセンテージ' },
    { word: 'permission', meaning: '許可' },
    { word: 'permit', meaning: '許可する' },
    { word: 'persuade', meaning: '説得する' },
    { word: 'phenomenon', meaning: '現象' },
    { word: 'physical', meaning: '身体的な' },
    { word: 'policy', meaning: '政策' },
    { word: 'political', meaning: '政治的な' },
    { word: 'politician', meaning: '政治家' },
    { word: 'politics', meaning: '政治' },
    { word: 'pollution', meaning: '汚染' },
    { word: 'popular', meaning: '人気のある' },
    { word: 'population', meaning: '人口' },
    { word: 'possess', meaning: '所有する' },
    { word: 'possibility', meaning: '可能性' },
    { word: 'potential', meaning: '潜在的な、可能性' },
    { word: 'poverty', meaning: '貧困' },
    { word: 'predict', meaning: '予測する' },
    { word: 'preparation', meaning: '準備' },
    { word: 'preserve', meaning: '保護する' },
    { word: 'prevent', meaning: '防ぐ' },
    { word: 'prevent A from B', meaning: 'AがBするのを防ぐ' },
    { word: 'priority', meaning: '優先事項' },
    { word: 'probably', meaning: 'おそらく' },
    { word: 'process', meaning: '過程' },
    { word: 'production', meaning: '生産' },
    { word: 'profit', meaning: '利益' },
    { word: 'progress', meaning: '進歩' },
    { word: 'promote', meaning: '促進する' },
    { word: 'proof', meaning: '証拠' },
    { word: 'proper', meaning: '適切な' },
    { word: 'property', meaning: '財産' },
    { word: 'proposal', meaning: '提案' },
    { word: 'propose', meaning: '提案する' },
    { word: 'protect', meaning: '守る' },
    { word: 'provide', meaning: '提供する' },
    { word: 'psychological', meaning: '心理的な' },
    { word: 'publish', meaning: '出版する' },
    { word: 'punish', meaning: '罰する' },
    { word: 'pursue', meaning: '追う、追求する' },
    { word: 'qualify', meaning: '資格を得る' },
    { word: 'quality', meaning: '質' },
    { word: 'quite', meaning: 'かなり' },
    { word: 'raise', meaning: '上げる、育てる' },
    { word: 'rapidly', meaning: '急速に' },
    { word: 'rarely', meaning: 'めったに〜しない' },
    { word: 'rather than', meaning: '〜よりもむしろ' },
    { word: 'react', meaning: '反応する' },
    { word: 'reaction', meaning: '反応' },
    { word: 'realize', meaning: '気づく、実現する' },
    { word: 'recently', meaning: '最近' },
    { word: 'recession', meaning: '景気後退' },
    { word: 'recommend', meaning: '勧める' },
    { word: 'recover', meaning: '回復する' },
    { word: 'reduce', meaning: '減らす' },
    { word: 'reduction', meaning: '削減' },
    { word: 'refugee', meaning: '難民' },
    { word: 'refuse', meaning: '断る' },
    { word: 'regarding', meaning: '〜に関して' },
    { word: 'region', meaning: '地域' },
    { word: 'regulation', meaning: '規制' },
    { word: 'reject', meaning: '拒否する' },
    { word: 'related to', meaning: '〜に関連した' },
    { word: 'release', meaning: '解放する' },
    { word: 'relevant', meaning: '関連した' },
    { word: 'religion', meaning: '宗教' },
    { word: 'rely on', meaning: '〜に頼る' },
    { word: 'remark', meaning: '発言する' },
    { word: 'remarkable', meaning: '驚くべき' },
    { word: 'remind', meaning: '思い出させる' },
    { word: 'remove', meaning: '取り除く' },
    { word: 'replace', meaning: '取り換える' },
    { word: 'represent', meaning: '代表する' },
    { word: 'reputation', meaning: '評判' },
    { word: 'research', meaning: '研究' },
    { word: 'resist', meaning: '抵抗する' },
    { word: 'resource', meaning: '資源' },
    { word: 'respond', meaning: '反応する' },
    { word: 'responsibility', meaning: '責任' },
    { word: 'responsible', meaning: '責任のある' },
    { word: 'restore', meaning: '回復させる' },
    { word: 'restrict', meaning: '制限する' },
    { word: 'result', meaning: '結果' },
    { word: 'revenue', meaning: '収益' },
    { word: 'revolution', meaning: '革命' },
    { word: 'role', meaning: '役割' },
    { word: 'run out of', meaning: '〜が尽きる' },
    { word: 'rural', meaning: '田舎の' },
    { word: 'salary', meaning: '給料' },
    { word: 'satisfaction', meaning: '満足' },
    { word: 'satisfy', meaning: '満足させる' },
    { word: 'scheme', meaning: '計画' },
    { word: 'scientific', meaning: '科学的な' },
    { word: 'search for', meaning: '〜を探す' },
    { word: 'seek', meaning: '求める' },
    { word: 'seize', meaning: '捕らえる' },
    { word: 'seldom', meaning: 'めったに〜しない' },
    { word: 'significant', meaning: '重要な' },
    { word: 'significantly', meaning: '大幅に' },
    { word: 'similar to', meaning: '〜に似ている' },
    { word: 'similarly', meaning: '同様に' },
    { word: 'so far', meaning: '今のところ' },
    { word: 'so that', meaning: '〜するために' },
    { word: 'so-called', meaning: 'いわゆる' },
    { word: 'solution', meaning: '解決策' },
    { word: 'sooner or later', meaning: 'いずれ' },
    { word: 'sophisticated', meaning: '洗練された' },
    { word: 'source', meaning: '源、情報源' },
    { word: 'specific', meaning: '特定の' },
    { word: 'spread', meaning: '広がる' },
    { word: 'stable', meaning: '安定した' },
    { word: 'stand out', meaning: '目立つ' },
    { word: 'statistics', meaning: '統計' },
    { word: 'status', meaning: '地位' },
    { word: 'steam', meaning: '蒸気' },
    { word: 'stimulate', meaning: '刺激する' },
    { word: 'strategy', meaning: '戦略' },
    { word: 'structure', meaning: '構造' },
    { word: 'subject', meaning: '科目、主題' },
    { word: 'submit', meaning: '提出する' },
    { word: 'substance', meaning: '物質' },
    { word: 'succeed in', meaning: '〜に成功する' },
    { word: 'such as', meaning: '〜のような' },
    { word: 'suffer from', meaning: '〜に苦しむ' },
    { word: 'suggest', meaning: '提案する' },
    { word: 'suitable', meaning: '適切な' },
    { word: 'supply', meaning: '供給する' },
    { word: 'suppose', meaning: '仮定する' },
    { word: 'surface', meaning: '表面' },
    { word: 'survey', meaning: '調査' },
    { word: 'sustain', meaning: '支える' },
    { word: 'sustainable', meaning: '持続可能な' },
    { word: 'sympathy', meaning: '同情' },
    { word: 'take after', meaning: '〜に似る' },
    { word: 'take over', meaning: '引き継ぐ' },
    { word: 'take part in', meaning: '〜に参加する' },
    { word: 'task', meaning: '課題' },
    { word: 'tax', meaning: '税金' },
    { word: 'term', meaning: '用語、期間' },
    { word: 'terrible', meaning: 'ひどい' },
    { word: 'thanks to', meaning: '〜のおかげで' },
    { word: 'theory', meaning: '理論' },
    { word: 'therefore', meaning: 'それゆえ' },
    { word: 'threaten', meaning: '脅かす' },
    { word: 'throughout', meaning: '〜を通じて' },
    { word: 'throw away', meaning: '捨てる' },
    { word: 'to some extent', meaning: '〜ある程度まで' },
    { word: 'tolerate', meaning: '我慢する' },
    { word: 'totally', meaning: '完全に' },
    { word: 'toward', meaning: '〜に向かって' },
    { word: 'tradition', meaning: '伝統' },
    { word: 'traditional', meaning: '伝統的な' },
    { word: 'transfer', meaning: '移す、転送する' },
    { word: 'transform', meaning: '変える' },
    { word: 'transition', meaning: '移行' },
    { word: 'translate', meaning: '翻訳する' },
    { word: 'treat', meaning: '扱う、治療する' },
    { word: 'treatment', meaning: '治療、扱い' },
    { word: 'treaty', meaning: '条約' },
    { word: 'trigger', meaning: '引き起こす' },
    { word: 'truly', meaning: '本当に' },
    { word: 'trust', meaning: '信頼する' },
    { word: 'try on', meaning: '試着する' },
    { word: 'try out', meaning: '試す' },
    { word: 'turn A into B', meaning: 'AをBに変える' },
    { word: 'turn down', meaning: '断る、音を下げる' },
    { word: 'turn into', meaning: '〜になる' },
    { word: 'typical', meaning: '典型的な' },
    { word: 'typically', meaning: '典型的に' },
    { word: 'unique', meaning: '独特の' },
    { word: 'universal', meaning: '普遍的な' },
    { word: 'unless', meaning: '〜でない限り' },
    { word: 'unlike', meaning: '〜と異なり' },
    { word: 'urban', meaning: '都市の' },
    { word: 'valuable', meaning: '価値のある' },
    { word: 'various', meaning: 'さまざまな' },
    { word: 'vary', meaning: '異なる' },
    { word: 'victim', meaning: '被害者' },
    { word: 'violate', meaning: '違反する' },
    { word: 'violence', meaning: '暴力' },
    { word: 'virtually', meaning: '事実上' },
    { word: 'vital', meaning: '不可欠な' },
    { word: 'vote for', meaning: '〜に投票する' },
    { word: 'vulnerable', meaning: '傷つきやすい' },
    { word: 'warn', meaning: '警告する' },
    { word: 'waste', meaning: '無駄にする' },
    { word: 'wealthy', meaning: '裕福な' },
    { word: 'well-known', meaning: 'よく知られた' },
    { word: 'whatever', meaning: '何であっても' },
    { word: 'whenever', meaning: 'いつでも' },
    { word: 'whether', meaning: '〜かどうか' },
    { word: 'widely', meaning: '広く' },
    { word: 'wildlife', meaning: '野生生物' },
    { word: 'wisdom', meaning: '知恵' },
    { word: 'wise', meaning: '賢い' },
    { word: 'within', meaning: '〜以内に' },
    { word: 'wonder', meaning: '〜だろうか、驚き' },
    { word: 'work out', meaning: '解決する、運動する' },
    { word: 'worth', meaning: '〜の価値がある' },
    { word: 'yield', meaning: '生み出す、譲る' },
    { word: 'ankle', meaning: '足首' },
    { word: 'architect', meaning: '建築家' },
    { word: 'arrogant', meaning: '傲慢な' },
    { word: 'asleep', meaning: '眠っている' },
    { word: 'astronaut', meaning: '宇宙飛行士' },
    { word: 'awake', meaning: '目が覚めている' },
    { word: 'award', meaning: '賞、授与する' },
    { word: 'awful', meaning: 'ひどい' },
    { word: 'bare', meaning: '裸の、むき出しの' },
    { word: 'battery', meaning: 'バッテリー、電池' },
    { word: 'bear', meaning: '耐える、クマ' },
    { word: 'bend', meaning: '曲げる' },
    { word: 'bet', meaning: '賭ける' },
    { word: 'bite', meaning: '噛む' },
    { word: 'bitter', meaning: '苦い、つらい' },
    { word: 'block', meaning: '塞ぐ、ブロック' },
    { word: 'blood', meaning: '血' },
    { word: 'bloody', meaning: '血まみれの' },
    { word: 'blow', meaning: '吹く、打撃' },
    { word: 'bored', meaning: '退屈している' },
    { word: 'borrow', meaning: '借りる' },
    { word: 'bother', meaning: '悩ます、面倒をかける' },
    { word: 'brain', meaning: '脳' },
    { word: 'bravely', meaning: '勇敢に' },
    { word: 'breast', meaning: '胸、乳房' },
    { word: 'breath', meaning: '息' },
    { word: 'breathe', meaning: '呼吸する' },
    { word: 'brick', meaning: 'レンガ' },
    { word: 'bring', meaning: '持ってくる' },
    { word: 'bullet', meaning: '弾丸' },
    { word: 'call it a day', meaning: '今日はここまでにする' },
    { word: 'cast', meaning: '投げる、キャスト' },
    { word: 'ceiling', meaning: '天井' },
    { word: 'cell', meaning: '細胞、独房' },
    { word: 'chairman', meaning: '議長' },
    { word: 'chamber', meaning: '部屋、議院' },
    { word: 'chapter', meaning: '章' },
    { word: 'chase', meaning: '追いかける' },
    { word: 'check for', meaning: '〜を確認する' },
    { word: 'chest', meaning: '胸、箱' },
    { word: 'chew', meaning: '噛む' },
    { word: 'childhood', meaning: '幼少期' },
    { word: 'civilian', meaning: '民間人' },
    { word: 'clerk', meaning: '店員、事務員' },
    { word: 'client', meaning: '顧客' },
    { word: 'clothing', meaning: '衣類' },
    { word: 'coal', meaning: '石炭' },
    { word: 'coast', meaning: '海岸' },
    { word: 'collect', meaning: '集める' },
    { word: 'comedy', meaning: 'コメディ' },
    { word: 'comfort', meaning: '慰める、快適さ' },
    { word: 'comfortable', meaning: '快適な' },
    { word: 'commander', meaning: '司令官' },
    { word: 'commission', meaning: '委員会、手数料' },
    { word: 'compose', meaning: '作曲する、構成する' },
    { word: 'composer', meaning: '作曲家' },
    { word: 'compound', meaning: '複合の、化合物' },
    { word: 'concentrate', meaning: '集中する' },
    { word: 'concentration', meaning: '集中、濃度' },
    { word: 'conscious', meaning: '意識している' },
    { word: 'consist', meaning: '〜から成る' },
    { word: 'convert', meaning: '変換する' },
    { word: 'convey', meaning: '伝える、運ぶ' },
    { word: 'conviction', meaning: '確信、有罪判決' },
    { word: 'copyright', meaning: '著作権' },
    { word: 'correct', meaning: '正しい、修正する' },
    { word: 'correspondent', meaning: '特派員' },
    { word: 'corridor', meaning: '廊下' },
    { word: 'county', meaning: '郡、州' },
    { word: 'court', meaning: '裁判所、コート' },
    { word: 'crack', meaning: '割れる、ひび' },
    { word: 'craft', meaning: '工芸、技術' },
    { word: 'creation', meaning: '創造' },
    { word: 'creature', meaning: '生き物' },
    { word: 'credit', meaning: '信用、クレジット' },
    { word: 'crop', meaning: '作物、刈り取る' },
    { word: 'crowd', meaning: '群衆' },
    { word: 'cruel', meaning: '残酷な' },
    { word: 'custom', meaning: '習慣、慣習' },
    { word: 'customer', meaning: '顧客' },
    { word: 'dealer', meaning: '業者、販売員' },
    { word: 'deal', meaning: '扱う、取引' },
    { word: 'declaration', meaning: '宣言' },
    { word: 'delete', meaning: '削除する' },
    { word: 'delight', meaning: '喜び' },
    { word: 'delivery', meaning: '配達' },
    { word: 'dependent', meaning: '依存している' },
    { word: 'depending', meaning: '〜次第で' },
    { word: 'deposit', meaning: '預ける、預金' },
    { word: 'depth', meaning: '深さ' },
    { word: 'deputy', meaning: '代理人' },
    { word: 'describe', meaning: '描写する' },
    { word: 'desert', meaning: '砂漠、見捨てる' },
    { word: 'detail', meaning: '詳細' },
    { word: 'detailed', meaning: '詳細な' },
    { word: 'details', meaning: '詳細、細部' },
    { word: 'detective', meaning: '探偵' },
    { word: 'dig', meaning: '掘る' },
    { word: 'direction', meaning: '方向、指示' },
    { word: 'director', meaning: '監督、取締役' },
    { word: 'discover', meaning: '発見する' },
    { word: 'discuss', meaning: '議論する' },
    { word: 'disposal', meaning: '処分' },
    { word: 'distance', meaning: '距離' },
    { word: 'disturb', meaning: '邪魔する' },
    { word: 'do me a favor', meaning: 'お願いを聞いてもらえますか' },
    { word: 'do well', meaning: 'うまくやる' },
    { word: 'dozen', meaning: '12、ダース' },
    { word: 'drain', meaning: '排水する、使い果たす' },
    { word: 'draw', meaning: '描く、引き付ける' },
    { word: 'drift', meaning: '漂う' },
    { word: 'drop off', meaning: '降ろす、居眠りする' },
    { word: 'dull', meaning: 'つまらない、鈍い' },
    { word: 'dump', meaning: '捨てる' },
    { word: 'dust', meaning: 'ほこり' },
    { word: 'each other', meaning: 'お互い' },
    { word: 'earnings', meaning: '収入、利益' },
    { word: 'ease', meaning: '和らげる、容易さ' },
    { word: 'echo', meaning: 'こだまする、反響' },
    { word: 'edge', meaning: '端、優位' },
    { word: 'electric', meaning: '電気の' },
    { word: 'electricity', meaning: '電気' },
    { word: 'electronic', meaning: '電子の' },
    { word: 'embarrass', meaning: '恥ずかしくさせる' },
    { word: 'embrace', meaning: '抱擁する、受け入れる' },
    { word: 'emotional', meaning: '感情的な' },
    { word: 'emotionally', meaning: '感情的に' },
    { word: 'enforcement', meaning: '施行' },
    { word: 'engaged', meaning: '従事している、婚約している' },
    { word: 'enlarge', meaning: '拡大する' },
    { word: 'enter', meaning: '入る' },
    { word: 'entitle', meaning: '権利を与える' },
    { word: 'envelope', meaning: '封筒' },
    { word: 'environmentally', meaning: '環境的に' },
    { word: 'essay', meaning: '小論文、エッセイ' },
    { word: 'estate', meaning: '不動産' },
    { word: 'ethnic', meaning: '民族の' },
    { word: 'evil', meaning: '悪い、邪悪' },
    { word: 'exactly', meaning: '正確に' },
    { word: 'examination', meaning: '試験、検査' },
    { word: 'exception', meaning: '例外' },
    { word: 'exceptionally', meaning: '例外的に' },
    { word: 'exclude', meaning: '除外する' },
    { word: 'excuse', meaning: '言い訳する' },
    { word: 'exhibition', meaning: '展覧会' },
    { word: 'exist', meaning: '存在する' },
    { word: 'existence', meaning: '存在' },
    { word: 'existing', meaning: '既存の' },
    { word: 'expansion', meaning: '拡大' },
    { word: 'expense', meaning: '費用' },
    { word: 'expensive', meaning: '高価な' },
    { word: 'explanation', meaning: '説明' },
    { word: 'explorer', meaning: '探検家' },
    { word: 'exposure', meaning: '露出、暴露' },
    { word: 'expression', meaning: '表現' },
    { word: 'extension', meaning: '延長' },
    { word: 'extent', meaning: '程度' },
    { word: 'extreme', meaning: '極端な' },
    { word: 'extremely', meaning: '極めて' },
    { word: 'fabric', meaning: '布、生地' },
    { word: 'face', meaning: '直面する、顔' },
    { word: 'fact', meaning: '事実' },
    { word: 'fail', meaning: '失敗する' },
    { word: 'fair', meaning: '公平な' },
    { word: 'false', meaning: '偽の' },
    { word: 'famous', meaning: '有名な' },
    { word: 'far off', meaning: '遠い' },
    { word: 'fat', meaning: '太った、脂肪' },
    { word: 'fault', meaning: '欠点、過失' },
    { word: 'fear', meaning: '恐れ' },
    { word: 'fee', meaning: '料金' },
    { word: 'feed', meaning: '食べ物を与える' },
    { word: 'fellow', meaning: '仲間' },
    { word: 'female', meaning: '女性の' },
    { word: 'fiber', meaning: '繊維' },
    { word: 'firm', meaning: '会社、固い' },
    { word: 'five senses', meaning: '五感' },
    { word: 'fix', meaning: '修理する' },
    { word: 'flavor', meaning: '味' },
    { word: 'flee', meaning: '逃げる' },
    { word: 'float', meaning: '浮かぶ' },
    { word: 'flow', meaning: '流れる' },
    { word: 'folk', meaning: '民族の' },
    { word: 'forever', meaning: '永遠に' },
    { word: 'formation', meaning: '形成' },
    { word: 'former', meaning: '前の、前者の' },
    { word: 'forward', meaning: '前へ' },
    { word: 'freeze', meaning: '凍る' },
    { word: 'frighten', meaning: '怖がらせる' },
    { word: 'frightened', meaning: '怖がっている' },
    { word: 'fuel', meaning: '燃料' },
    { word: 'fully', meaning: '完全に' },
    { word: 'fund', meaning: '資金' },
    { word: 'funding', meaning: '資金提供' },
    { word: 'furniture', meaning: '家具' },
    { word: 'garbage', meaning: 'ゴミ' },
    { word: 'generously', meaning: '寛大に' },
    { word: 'genius', meaning: '天才' },
    { word: 'gentle', meaning: '優しい' },
    { word: 'get along', meaning: 'うまくやっていく' },
    { word: 'get back', meaning: '戻る' },
    { word: 'given', meaning: '与えられた、〜を考えると' },
    { word: 'glance', meaning: 'ちらっと見る' },
    { word: 'govern', meaning: '統治する' },
    { word: 'governor', meaning: '知事' },
    { word: 'graduate', meaning: '卒業する' },
    { word: 'grammar', meaning: '文法' },
    { word: 'gravity', meaning: '重力' },
    { word: 'greet', meaning: '挨拶する' },
    { word: 'guess', meaning: '推測する' },
    { word: 'habit', meaning: '習慣' },
    { word: 'hang', meaning: '掛ける、ぶら下がる' },
    { word: 'harbor', meaning: '港' },
    { word: 'hate', meaning: '嫌う' },
    { word: 'have effects on', meaning: '〜に影響を及ぼす' },
    { word: 'headquarters', meaning: '本社、本部' },
    { word: 'hear from', meaning: '〜から連絡をもらう' },
    { word: 'heart rate', meaning: '心拍数' },
    { word: 'heel', meaning: 'かかと' },
    { word: 'height', meaning: '高さ' },
    { word: 'hell', meaning: '地獄' },
    { word: 'hide', meaning: '隠す' },
    { word: 'historical', meaning: '歴史に関する' },
    { word: 'horror', meaning: '恐怖' },
    { word: 'household', meaning: '家庭の' },
    { word: 'however', meaning: 'しかし' },
    { word: 'humanity', meaning: '人類' },
    { word: 'hundreds of', meaning: '何百もの' },
    { word: 'hurt', meaning: '傷つける' },
    { word: 'ideal', meaning: '理想的な' },
    { word: 'illness', meaning: '病気' },
    { word: 'imagination', meaning: '想像力' },
    { word: 'imitate', meaning: '模倣する' },
    { word: 'immediate', meaning: '即座の' },
    { word: 'immigrate', meaning: '移住する' },
    { word: 'immune', meaning: '免疫がある' },
    { word: 'implement', meaning: '実施する' },
    { word: 'implication', meaning: '含意、影響' },
    { word: 'improvement', meaning: '改善' },
    { word: 'incorporate', meaning: '取り入れる' },
    { word: 'indeed', meaning: '確かに、実に' },
    { word: 'index', meaning: '指標、索引' },
    { word: 'infection', meaning: '感染' },
    { word: 'inflation', meaning: 'インフレ' },
    { word: 'initially', meaning: '最初は' },
    { word: 'inquiry', meaning: '問い合わせ' },
    { word: 'inspector', meaning: '検査官' },
    { word: 'install', meaning: 'インストールする' },
    { word: 'instead', meaning: '代わりに' },
    { word: 'instruction', meaning: '指示' },
    { word: 'instrument', meaning: '楽器、道具' },
    { word: 'insult', meaning: '侮辱する' },
    { word: 'intellectual', meaning: '知的な' },
    { word: 'intelligent', meaning: '知性のある' },
    { word: 'intelligently', meaning: '賢く' },
    { word: 'intend', meaning: '〜するつもりだ' },
    { word: 'intention', meaning: '意図' },
    { word: 'interior', meaning: '内部' },
    { word: 'interpretation', meaning: '解釈' },
    { word: 'invest', meaning: '投資する' },
    { word: 'investor', meaning: '投資家' },
    { word: 'involvement', meaning: '関与' },
    { word: 'isolate', meaning: '隔離する' },
    { word: 'isolated', meaning: '孤立した' },
    { word: 'it is common to hear', meaning: '〜はよく聞かれることだ' },
    { word: 'item', meaning: '項目、商品' },
    { word: 'jail', meaning: '刑務所' },
    { word: 'journal', meaning: '雑誌、日誌' },
    { word: 'journey', meaning: '旅' },
    { word: 'joy', meaning: '喜び' },
    { word: 'judgement', meaning: '判断' },
    { word: 'jury', meaning: '陪審員' },
    { word: 'lab', meaning: '実験室' },
    { word: 'laboratory', meaning: '実験室' },
    { word: 'landscape', meaning: '景観' },
    { word: 'language', meaning: '言語' },
    { word: 'lap', meaning: 'ひざ、周' },
    { word: 'later', meaning: '後で' },
    { word: 'laugh at', meaning: '〜を笑う' },
    { word: 'laughter', meaning: '笑い' },
    { word: 'law', meaning: '法律' },
    { word: 'lawn', meaning: '芝生' },
    { word: 'lean', meaning: '傾く、痩せた' },
    { word: 'leftover', meaning: '残り物' },
    { word: 'legend', meaning: '伝説' },
    { word: 'length', meaning: '長さ' },
    { word: 'lesser', meaning: 'より少ない' },
    { word: 'let A do', meaning: 'AにBをさせる' },
    { word: 'lie', meaning: '嘘をつく、横たわる' },
    { word: 'likely', meaning: '〜しそうな' },
    { word: 'literary', meaning: '文学の' },
    { word: 'look up', meaning: '調べる、見上げる' },
    { word: 'lose', meaning: '負ける、失う' },
    { word: 'lose face', meaning: '面目を失う' },
    { word: 'luckily', meaning: '幸運にも' },
    { word: 'luxury', meaning: '贅沢' },
    { word: 'mad', meaning: '怒っている、狂った' },
    { word: 'made of', meaning: '〜で作られた' },
    { word: 'mainly', meaning: '主に' },
    { word: 'male', meaning: '男性の' },
    { word: 'manager', meaning: '管理者' },
    { word: 'manner', meaning: '方法、態度' },
    { word: 'match', meaning: '合う、試合' },
    { word: 'mate', meaning: '仲間、配偶者' },
    { word: 'matter', meaning: '重要である、問題' },
    { word: 'maybe', meaning: 'たぶん' },
    { word: 'meal', meaning: '食事' },
    { word: 'mean', meaning: '意味する、意地悪な' },
    { word: 'medicine', meaning: '薬、医学' },
    { word: 'medium', meaning: '中間の、媒体' },
    { word: 'melt', meaning: '溶ける' },
    { word: 'mention', meaning: '言及する' },
    { word: 'merchant', meaning: '商人' },
    { word: 'mere', meaning: '単なる' },
    { word: 'mess', meaning: '散らかり、混乱' },
    { word: 'metal', meaning: '金属' },
    { word: 'million', meaning: '100万' },
    { word: 'mixture', meaning: '混合物' },
    { word: 'moment', meaning: '瞬間' },
    { word: 'more and more', meaning: 'ますます' },
    { word: 'mortgage', meaning: '住宅ローン' },
    { word: 'multiple', meaning: '複数の' },
    { word: 'muscle', meaning: '筋肉' },
    { word: 'naked', meaning: '裸の' },
    { word: 'nation', meaning: '国家' },
    { word: 'natural', meaning: '自然の' },
    { word: 'nature', meaning: '自然' },
    { word: 'nearby', meaning: '近くの' },
    { word: 'necessity', meaning: '必要性' },
    { word: 'negative', meaning: '否定的な' },
    { word: 'nor', meaning: '〜もまた〜ない' },
    { word: 'not yet', meaning: 'まだ〜ない' },
    { word: 'nowhere', meaning: 'どこにも〜ない' },
    { word: 'object', meaning: '物体、反対する' },
    { word: 'occupation', meaning: '職業、占拠' },
    { word: 'occupy', meaning: '占める' },
    { word: 'on foot', meaning: '徒歩で' },
    { word: 'one day', meaning: 'ある日、いつか' },
    { word: 'operation', meaning: '手術、作戦' },
    { word: 'operator', meaning: 'オペレーター' },
    { word: 'opinion', meaning: '意見' },
    { word: 'orbit', meaning: '軌道' },
    { word: 'order', meaning: '命令する、注文' },
    { word: 'ordinary', meaning: '普通の' },
    { word: 'organize', meaning: '組織する' },
    { word: 'originally', meaning: '元々' },
    { word: 'otherwise', meaning: 'そうでなければ' },
    { word: 'out of order', meaning: '故障中' },
    { word: 'overlap', meaning: '重なる' },
    { word: 'overtake', meaning: '追い越す' },
    { word: 'own', meaning: '自分の、所有する' },
    { word: 'pain', meaning: '痛み' },
    { word: 'palm', meaning: '手のひら' },
    { word: 'pan', meaning: 'フライパン' },
    { word: 'parking lot', meaning: '駐車場' },
    { word: 'passage', meaning: '通路、文章の一節' },
    { word: 'past', meaning: '過去、〜を過ぎて' },
    { word: 'patch', meaning: 'パッチ、修正する' },
    { word: 'path', meaning: '道' },
    { word: 'peak', meaning: '頂点' },
    { word: 'peer', meaning: '同僚、同等の人' },
    { word: 'pension', meaning: '年金' },
    { word: 'period', meaning: '期間' },
    { word: 'personality', meaning: '性格' },
    { word: 'personally', meaning: '個人的に' },
    { word: 'personnel', meaning: '人員' },
    { word: 'phase', meaning: '段階' },
    { word: 'philosopher', meaning: '哲学者' },
    { word: 'philosophy', meaning: '哲学' },
    { word: 'physician', meaning: '医師' },
    { word: 'physics', meaning: '物理学' },
    { word: 'pitch', meaning: '音程、投げる' },
    { word: 'planet', meaning: '惑星' },
    { word: 'plastic bag', meaning: 'ビニール袋' },
    { word: 'pleasant', meaning: '楽しい' },
    { word: 'pleasure', meaning: '喜び' },
    { word: 'plenty', meaning: '十分な' },
    { word: 'plenty of', meaning: '十分な〜' },
    { word: 'poet', meaning: '詩人' },
    { word: 'polite', meaning: '礼儀正しい' },
    { word: 'politely', meaning: '礼儀正しく' },
    { word: 'poll', meaning: '世論調査' },
    { word: 'portable', meaning: '携帯できる' },
    { word: 'portrait', meaning: '肖像画' },
    { word: 'possibly', meaning: 'おそらく' },
    { word: 'potentially', meaning: '潜在的に' },
    { word: 'pour', meaning: '注ぐ' },
    { word: 'practical', meaning: '実用的な' },
    { word: 'praise', meaning: '称賛する' },
    { word: 'prayer', meaning: '祈り' },
    { word: 'prefer', meaning: '好む' },
    { word: 'pregnant', meaning: '妊娠している' },
    { word: 'prescription', meaning: '処方箋' },
    { word: 'presence', meaning: '存在、出席' },
    { word: 'present', meaning: '提示する、現在の、プレゼント' },
    { word: 'president', meaning: '大統領、社長' },
    { word: 'pretend', meaning: 'ふりをする' },
    { word: 'pretty', meaning: 'かなり、かわいい' },
    { word: 'previous', meaning: '前の' },
    { word: 'previously', meaning: '以前に' },
    { word: 'primary', meaning: '主要な' },
    { word: 'primitive', meaning: '原始的な' },
    { word: 'principle', meaning: '原則' },
    { word: 'prior', meaning: '〜の前の' },
    { word: 'prison', meaning: '刑務所' },
    { word: 'prisoner', meaning: '囚人' },
    { word: 'procedure', meaning: '手順' },
    { word: 'promotion', meaning: '昇進、促進' },
    { word: 'prompt', meaning: '促す、即座の' },
    { word: 'proportion', meaning: '割合' },
    { word: 'proposed', meaning: '提案された' },
    { word: 'prosecution', meaning: '起訴' },
    { word: 'prosecutor', meaning: '検察官' },
    { word: 'prospect', meaning: '見込み' },
    { word: 'proud', meaning: '誇りに思う' },
    { word: 'proverb', meaning: 'ことわざ' },
    { word: 'provide A with B', meaning: 'AにBを提供する' },
    { word: 'province', meaning: '州、地方' },
    { word: 'provision', meaning: '規定、準備' },
    { word: 'psychologist', meaning: '心理学者' },
    { word: 'public', meaning: '公の' },
    { word: 'publication', meaning: '出版物' },
    { word: 'pull away', meaning: '引き離す' },
    { word: 'punctual', meaning: '時間を守る' },
    { word: 'purchase', meaning: '購入する' },
    { word: 'put down', meaning: '書き留める、降ろす' },
    { word: 'quarter', meaning: '4分の1' },
    { word: 'quit', meaning: 'やめる' },
    { word: 'radical', meaning: '根本的な、急進的な' },
    { word: 'range', meaning: '範囲' },
    { word: 'rapid', meaning: '急速な' },
    { word: 'rare', meaning: '珍しい' },
    { word: 'rather', meaning: 'むしろ' },
    { word: 'rational', meaning: '合理的な' },
    { word: 'reach', meaning: '届く、到達する' },
    { word: 'reach out', meaning: '手を伸ばす、連絡する' },
    { word: 'rebel', meaning: '反乱者、反抗する' },
    { word: 'recall', meaning: '思い出す' },
    { word: 'receive', meaning: '受け取る' },
    { word: 'recent', meaning: '最近の' },
    { word: 'recommendation', meaning: '推薦' },
    { word: 'recovery', meaning: '回復' },
    { word: 'refer', meaning: '言及する' },
    { word: 'reflection', meaning: '反射、熟考' },
    { word: 'refrigerator', meaning: '冷蔵庫' },
    { word: 'regret', meaning: '後悔する' },
    { word: 'reject', meaning: '拒否する' },
    { word: 'relation', meaning: '関係' },
    { word: 'remain', meaning: '残る' },
    { word: 'remaining', meaning: '残っている' },
    { word: 'remind of', meaning: '〜を思い出させる' },
    { word: 'rent', meaning: '賃貸する、家賃' },
    { word: 'repair', meaning: '修理する' },
    { word: 'replacement', meaning: '取り替え' },
    { word: 'reply', meaning: '返答する' },
    { word: 'representation', meaning: '代表、表現' },
    { word: 'representative', meaning: '代表者' },
    { word: 'reserve', meaning: '予約する、保護区' },
    { word: 'resident', meaning: '居住者' },
    { word: 'resistance', meaning: '抵抗' },
    { word: 'resolution', meaning: '決議、解決' },
    { word: 'respect', meaning: '尊重する' },
    { word: 'restriction', meaning: '制限' },
    { word: 'retire', meaning: '退職する' },
    { word: 'retirement', meaning: '退職' },
    { word: 'reverse', meaning: '逆にする' },
    { word: 'reward', meaning: '報酬' },
    { word: 'right', meaning: '権利、右、正しい' },
    { word: 'rise', meaning: '上がる' },
    { word: 'roll', meaning: '転がる' },
    { word: 'rough', meaning: '荒い、大まかな' },
    { word: 'rub', meaning: 'こする' },
    { word: 'ruin', meaning: '破壊する、廃墟' },
    { word: 'rush', meaning: '急ぐ' },
    { word: 'satellite', meaning: '衛星' },
    { word: 'science', meaning: '科学' },
    { word: 'sculpture', meaning: '彫刻' },
    { word: 'secretary', meaning: '秘書' },
    { word: 'seem', meaning: '〜に見える' },
    { word: 'senior', meaning: '年上の、上級の' },
    { word: 'sensitive', meaning: '敏感な' },
    { word: 'sequence', meaning: '順序' },
    { word: 'settle', meaning: '解決する、定住する' },
    { word: 'settlement', meaning: '解決、定住' },
    { word: 'several', meaning: 'いくつかの' },
    { word: 'severe', meaning: '厳しい' },
    { word: 'share', meaning: '共有する、株' },
    { word: 'sharp', meaning: '鋭い' },
    { word: 'shooting', meaning: '射撃' },
    { word: 'shortage', meaning: '不足' },
    { word: 'shortly', meaning: 'すぐに' },
    { word: 'show off', meaning: '見せびらかす' },
    { word: 'shrug', meaning: '肩をすくめる' },
    { word: 'sigh', meaning: 'ため息をつく' },
    { word: 'sight', meaning: '視力、光景' },
    { word: 'sign', meaning: '標識、合図' },
    { word: 'significance', meaning: '重要性' },
    { word: 'silence', meaning: '沈黙' },
    { word: 'silly', meaning: 'ばかな' },
    { word: 'similar', meaning: '似ている' },
    { word: 'since then', meaning: 'それ以来' },
    { word: 'sink', meaning: '沈む' },
    { word: 'slide', meaning: 'すべる' },
    { word: 'slight', meaning: 'わずかな' },
    { word: 'slightly', meaning: 'わずかに' },
    { word: 'slip', meaning: '滑る、すり抜ける' },
    { word: 'smell', meaning: 'におい、においがする' },
    { word: 'social', meaning: '社会的な' },
    { word: 'society', meaning: '社会' },
    { word: 'solid', meaning: '固体の、しっかりした' },
    { word: 'somehow', meaning: 'どういうわけか' },
    { word: 'somewhat', meaning: 'ある程度' },
    { word: 'sort', meaning: '種類、分類する' },
    { word: 'spectator', meaning: '観客' },
    { word: 'spend', meaning: '費やす' },
    { word: 'spill', meaning: 'こぼす' },
    { word: 'split', meaning: '分ける' },
    { word: 'squeeze', meaning: '絞る、押し込む' },
    { word: 'stake', meaning: '賭け、支柱' },
    { word: 'stare', meaning: 'じっと見る' },
    { word: 'state', meaning: '状態、州、述べる' },
    { word: 'stay away from', meaning: '〜から離れている' },
    { word: 'steel', meaning: '鋼鉄' },
    { word: 'stir', meaning: 'かき混ぜる、刺激する' },
    { word: 'stock', meaning: '株、在庫' },
    { word: 'stomach', meaning: '胃、腹部' },
    { word: 'storage', meaning: '貯蔵' },
    { word: 'straight on', meaning: 'まっすぐに' },
    { word: 'strain', meaning: '緊張、酷使する' },
    { word: 'strange', meaning: '奇妙な' },
    { word: 'strangely', meaning: '奇妙に' },
    { word: 'stranger', meaning: '見知らぬ人' },
    { word: 'stream', meaning: '流れ、小川' },
    { word: 'strike', meaning: '打つ、ストライキ' },
    { word: 'string', meaning: '糸、連続' },
    { word: 'stroke', meaning: '一打、脳卒中' },
    { word: 'strongly', meaning: '強く' },
    { word: 'stupid', meaning: '愚かな' },
    { word: 'submit', meaning: '提出する' },
    { word: 'sudden', meaning: '突然の' },
    { word: 'suffer', meaning: '苦しむ' },
    { word: 'suffering', meaning: '苦しみ' },
    { word: 'sufficient', meaning: '十分な' },
    { word: 'suicide', meaning: '自殺' },
    { word: 'suit', meaning: '合う、スーツ' },
    { word: 'sum', meaning: '合計' },
    { word: 'summit', meaning: '頂上、首脳会議' },
    { word: 'superior', meaning: '優れた、上司' },
    { word: 'surely', meaning: '確かに' },
    { word: 'surgery', meaning: '手術' },
    { word: 'surround', meaning: '取り囲む' },
    { word: 'survival', meaning: '生存' },
    { word: 'suspect', meaning: '疑う、容疑者' },
    { word: 'swear', meaning: '誓う' },
    { word: 'symmetry', meaning: '対称性' },
    { word: 'symptom', meaning: '症状' },
    { word: 'tail', meaning: '尾' },
    { word: 'talented', meaning: '才能のある' },
    { word: 'taste', meaning: '味、好み' },
    { word: 'tear', meaning: '涙、引き裂く' },
    { word: 'teenager', meaning: '十代の人' },
    { word: 'temper', meaning: '気性、怒り' },
    { word: 'temperature', meaning: '温度' },
    { word: 'temple', meaning: '寺院、こめかみ' },
    { word: 'temporarily', meaning: '一時的に' },
    { word: 'temporary', meaning: '一時的な' },
    { word: 'terminal', meaning: '終末の、ターミナル' },
    { word: 'terror', meaning: '恐怖' },
    { word: 'the other', meaning: '他方' },
    { word: 'therapy', meaning: '療法' },
    { word: 'thick', meaning: '厚い' },
    { word: 'thought', meaning: '考え、思想' },
    { word: 'threat', meaning: '脅威' },
    { word: 'throat', meaning: 'のど' },
    { word: 'tight', meaning: 'きつい、ぴったりの' },
    { word: 'till', meaning: '〜まで' },
    { word: 'tiny', meaning: '非常に小さな' },
    { word: 'tissue', meaning: '組織、ティッシュ' },
    { word: 'toe', meaning: 'つま先' },
    { word: 'tongue', meaning: '舌、言語' },
    { word: 'totally', meaning: '完全に' },
    { word: 'towards', meaning: '〜の方へ' },
    { word: 'trading', meaning: '取引' },
    { word: 'tribe', meaning: '部族' },
    { word: 'truly', meaning: '本当に' },
    { word: 'truth', meaning: '真実' },
    { word: 'turn A into B', meaning: 'AをBに変える' },
    { word: 'unable', meaning: '〜できない' },
    { word: 'unbelievable', meaning: '信じられない' },
    { word: 'unfortunately', meaning: '残念ながら' },
    { word: 'union', meaning: '組合、連合' },
    { word: 'unit', meaning: '単位' },
    { word: 'universe', meaning: '宇宙' },
    { word: 'university', meaning: '大学' },
    { word: 'unknown', meaning: '未知の' },
    { word: 'until', meaning: '〜まで' },
    { word: 'up to', meaning: '〜まで、〜次第' },
    { word: 'upset', meaning: '動揺させる' },
    { word: 'urgent', meaning: '緊急の' },
    { word: 'useful', meaning: '役に立つ' },
    { word: 'useless', meaning: '役に立たない' },
    { word: 'vague', meaning: '漠然とした' },
    { word: 'variation', meaning: '変化、変形' },
    { word: 'vehicle', meaning: '乗り物' },
    { word: 'venture', meaning: '冒険する' },
    { word: 'via', meaning: '〜経由で' },
    { word: 'viewer', meaning: '視聴者' },
    { word: 'virtually', meaning: '事実上' },
    { word: 'virus', meaning: 'ウイルス' },
    { word: 'visible', meaning: '目に見える' },
    { word: 'vision', meaning: '視力、ビジョン' },
    { word: 'vote', meaning: '投票する' },
    { word: 'voter', meaning: '有権者' },
    { word: 'war', meaning: '戦争' },
    { word: 'weather', meaning: '天気' },
    { word: 'weight', meaning: '重さ' },
    { word: 'well off', meaning: '裕福な' },
    { word: 'what is called', meaning: 'いわゆる' },
    { word: 'while', meaning: '〜する間' },
    { word: 'whisper', meaning: 'ささやく' },
    { word: 'whole', meaning: '全体の' },
    { word: 'whom', meaning: '誰を（目的格）' },
    { word: 'widely', meaning: '広く' },
    { word: 'wipe', meaning: '拭く' },
    { word: 'withdraw', meaning: '撤退する、引き出す' },
    { word: 'witness', meaning: '目撃する、証人' },
];


// ==============================
// 英検2級 (高校卒業程度)
// ==============================
const LEGACY_GRADE2_VOCAB = [
    { word: 'abandon', meaning: '見捨てる、断念する' },
    { word: 'abolish', meaning: '廃止する' },
    { word: 'abstract', meaning: '抽象的な' },
    { word: 'accelerate', meaning: '加速する' },
    { word: 'accommodate', meaning: '収容する、適応させる' },
    { word: 'accomplish', meaning: '成し遂げる' },
    { word: 'accumulate', meaning: '蓄積する' },
    { word: 'accurate', meaning: '正確な' },
    { word: 'accuse', meaning: '非難する、告訴する' },
    { word: 'adapt', meaning: '適応させる' },
    { word: 'adequate', meaning: '十分な、適切な' },
    { word: 'adjust', meaning: '調整する' },
    { word: 'admire', meaning: '賞賛する' },
    { word: 'adopt', meaning: '採用する、養子にする' },
    { word: 'advocate', meaning: '主唱者、主張する' },
    { word: 'affection', meaning: '愛情' },
    { word: 'agriculture', meaning: '農業' },
    { word: 'allocate', meaning: '割り当てる' },
    { word: 'alter', meaning: '変える' },
    { word: 'alternative', meaning: '代わりの、選択肢' },
    { word: 'ambitious', meaning: '野心的な' },
    { word: 'analyze', meaning: '分析する' },
    { word: 'ancestor', meaning: '祖先' },
    { word: 'anticipate', meaning: '予期する' },
    { word: 'anxiety', meaning: '不安' },
    { word: 'apologize', meaning: '謝罪する' },
    { word: 'apparent', meaning: '明らかな' },
    { word: 'appeal', meaning: '訴える' },
    { word: 'appreciate', meaning: '感謝する、真価を認める' },
    { word: 'approach', meaning: '接近する、方法' },
    { word: 'appropriate', meaning: '適切な' },
    { word: 'approve', meaning: '承認する' },
    { word: 'architecture', meaning: '建築' },
    { word: 'argue', meaning: '議論する、主張する' },
    { word: 'arise', meaning: '生じる' },
    { word: 'aspect', meaning: '側面' },
    { word: 'assess', meaning: '評価する' },
    { word: 'assign', meaning: '割り当てる' },
    { word: 'assist', meaning: '手伝う' },
    { word: 'associate', meaning: '関連づける' },
    { word: 'assume', meaning: '想定する、引き受ける' },
    { word: 'assure', meaning: '保証する' },
    { word: 'attach', meaning: '取り付ける、添付する' },
    { word: 'attempt', meaning: '試みる' },
    { word: 'attitude', meaning: '態度' },
    { word: 'attract', meaning: '引きつける' },
    { word: 'attribute', meaning: '結果であると考える、属性' },
    { word: 'authority', meaning: '権威、当局' },
    { word: 'available', meaning: '利用可能な' },
    { word: 'awkward', meaning: '気まずい、ぎこちない' },
    { word: 'ban', meaning: '禁止する' },
    { word: 'barely', meaning: 'かろうじて' },
    { word: 'beneficial', meaning: '有益な' },
    { word: 'betray', meaning: '裏切る' },
    { word: 'bias', meaning: '偏見' },
    { word: 'biography', meaning: '伝記' },
    { word: 'blame', meaning: '非難する、せいにする' },
    { word: 'bold', meaning: '大胆な' },
    { word: 'bother', meaning: '悩ます' },
    { word: 'bound', meaning: '縛られた、行く先である' },
    { word: 'brilliant', meaning: '素晴らしい、輝かしい' },
    { word: 'budget', meaning: '予算' },
    { word: 'calculate', meaning: '計算する' },
    { word: 'campaign', meaning: 'キャンペーン、運動' },
    { word: 'cancel', meaning: '取り消す' },
    { word: 'capable', meaning: '能力がある' },
    { word: 'capacity', meaning: '容量、能力' },
    { word: 'capture', meaning: '捕らえる' },
    { word: 'casual', meaning: '偶然の、何気ない' },
    { word: 'category', meaning: '範疇、部類' },
    { word: 'cease', meaning: 'やめる' },
    { word: 'celebrate', meaning: '祝う' },
    { word: 'ceremony', meaning: '儀式' },
    { word: 'characteristic', meaning: '特徴' },
    { word: 'charge', meaning: '請求する、告発する、充電する' },
    { word: 'chemical', meaning: '化学の' },
    { word: 'chief', meaning: '主な、長' },
    { word: 'circumstance', meaning: '状況' },
    { word: 'citizen', meaning: '市民' },
    { word: 'civil', meaning: '市民の' },
    { word: 'claim', meaning: '主張する、要求する' },
    { word: 'client', meaning: '依頼人、顧客' },
    { word: 'clue', meaning: '手がかり' },
    { word: 'collapse', meaning: '崩壊する' },
    { word: 'colleague', meaning: '同僚' },
    { word: 'command', meaning: '命令する、指揮' },
    { word: 'comment', meaning: '論評、コメント' },
    { word: 'commit', meaning: '犯す、委ねる、専念する' },
    { word: 'committee', meaning: '委員会' },
    { word: 'communicate', meaning: '伝える、意思疎通する' },
    { word: 'compare', meaning: '比較する' },
    { word: 'compete', meaning: '競争する' },
    { word: 'complain', meaning: '不満を言う' },
    { word: 'complex', meaning: '複雑な' },
    { word: 'compose', meaning: '構成する、作曲する' },
    { word: 'comprehend', meaning: '理解する' },
    { word: 'compromise', meaning: '妥協する' },
    { word: 'concentrate', meaning: '集中する' },
    { word: 'concept', meaning: '概念' },
    { word: 'concern', meaning: '関心事、心配させる' },
    { word: 'conclude', meaning: '結論づける' },
    { word: 'condition', meaning: '状態、条件' },
    { word: 'conduct', meaning: '行う、指揮する' },
    { word: 'confess', meaning: '白状する、告白する' },
    { word: 'confidence', meaning: '自信、信頼' },
    { word: 'confirm', meaning: '確認する' },
    { word: 'conflict', meaning: '闘争、衝突' },
    { word: 'confuse', meaning: '混同する' },
    { word: 'connect', meaning: 'つなぐ' },
    { word: 'conscious', meaning: '意識している' },
    { word: 'consequence', meaning: '結果' }
];

export const VOCAB_GRADE3 = Array.from(
    new Map(
        [...LEGACY_GRADE3_VOCAB, ...CUSTOM_VOCAB_GRADE3].map((entry) => [
            entry.word.toLowerCase(),
            entry
        ])
    ).values()
);

export const VOCAB_GRADE4 = Array.from(
    new Map(
        [...LEGACY_GRADE4_VOCAB, ...CUSTOM_VOCAB_GRADE4].map((entry) => [
            entry.word.toLowerCase(),
            entry
        ])
    ).values()
);

export const VOCAB_GRADE5 = Array.from(
    new Map(
        [...LEGACY_GRADE5_VOCAB, ...CUSTOM_VOCAB_GRADE5].map((entry) => [
            entry.word.toLowerCase(),
            entry
        ])
    ).values()
);

const GRADE2_WORD_LIST = `
Arctic
Buddhist
Close
How come
Jewish
Mexican
Muslim
No
Search
What is more
a bunch of
a couple of
a number of
a variety of
abandon
ability
abolish
abortion
abroad
abrupt
absence
absolute
absolutely
absorb
absorb in
abstract
academic
academically
accept
accidentally
accommodate
accommodation
accompany
accomplish
accomplishment
according
according to
account
account for
accumulate
accuracy
accurate
accuse
accustomed
achieve
achievement
acknowledge
acquaint
acquaintance
acquire
act on
active
activist
actual
actually
acute
ad
adapt
add
add to
addicted
addition
additionally
address
adequate
adjust
administration
admire
admission
admit
adolescent
adopt
advantage
advertise
advertisement
advertising
advice
advocate
affair
affect
affection
afford
afraid
after all
afterwards
agent
aggression
aggressive
agree with
agreement
agricultural
agriculture
aid
aim
aircraft
airline
aisle
alike
alive
all around the world
all the way
alliance
allow
ally
almost
along with
aloud
alter
alternative
although
altitude
altogether
ambiguous
ambition
ambulance
amendment
amount
amount to
amuse
analysis
analyze
ancestor
ancient
and so on
anger
angle
ankle
anniversary
annoy
annual
annually
answer for
anxiety
anxious
apart
apologize
apology
apparent
apparently
appeal
appear
appearance
appetite
applause
application
apply
apply for
apply to
appoint
appointment
appreciate
approach
appropriate
approval
approve
approximately
architect
architecture
argue
argument
arise
armed
arms
arrange
arrangement
arrest
arrival
arrogant
article
artificial
as a matter of fact
as a result
as far as I know
as follows
as if
as though
as to
as well
ashamed
asleep
aspect
assault
assemble
assembly
assess
assessment
asset
assign
assignment
assist
assistance
associate
associated with
association
assumption
assure
astonish
at a loss
at a time
at any cost
at best
at first
at last
at least
at most
at one time
at present
at that time
at the same time
at times
atmosphere
atomic
attach
attach to
attempt
attend
attitude
attorney
attract
attractive
attribute
audience
author
authority
automobile
available
avenue
avoid
awake
award
aware
awareness
awful
awkward
background
bake
ban
bang
bank account
bare
barely
basin
basis
battery
be accustomed to
be adjusted to
be affected by
be awake
be aware of
be beneficial to
be born with
be concerned about
be concerned with
be connected to
be considered to
be effective at
be engaged in
be familiar with
be filled with
be involved in
be known as
be known for
be likely to
be made from
be obliged to
be pleased with
be short of
be threatened to
be well of
be willing to
bear
beat
because of
before long
beg
behalf
behave
behavior
behind
belief
believe in
belong
bend
beneath
benefit
beside
bet
betray
between A and B
beverage
beyond
bill
billion
bind
biological
biology
bishop
bite
bitter
blame
blame for
blast
bleed
blink
block
blood
bloody
bloom
blow
bold
bond
border
bored
borrow
bother
bound for
boundary
bow
brain
bravely
break into
break out
breast
breath
breed
breeze
brick
brief
briefly
brightness
brilliant
bring
bring up
broad
broadcast
budget
bully
burden
bureau
burst
bury
buyer
by chance
by degrees
by heart
by means of
by nature
by the end of
calculate
call it a day
call off
calm
calm down
candidate
capable
capable of
capacity
capital
capture
carbon
carbon dioxide
carry out
cash
cast
catch up with
cause
cave
cease
ceiling
celebrate
celebration
cell
certain
certainly
chamber
chapter
characteristic
charge
charm
chase
check for
checkup
chemical
chemistry
chest
childhood
circuit
circumstance
citizen
civil
civilian
civilization
civilize
civilized
claim to do
classical
clerk
climate
climb
cling
clip
closely
clothing
clue
coal
coalition
coast
collaboration
collapse
colleague
collect
college
colony
combat
combine
come across
come into being
come out
come up with
comedy
comfort
comfortable
commander
commercial
commission
commissioner
commit
commitment
committee
commodity
common
communist
community
commute
companion
compare
comparison
compassion
compete
competitive
competitor
compile
complain
complain of
complete
completely
complex
complexity
complicated
compliment
compose
composer
composition
compound
comprehend
comprehensive
compromise
conceal
concentrate
concentrate on
concentration
concept
concern
conclude
conclusion
concrete
condition
conduct
conference
confess
confidence
confident
confine
confirm
conflict
conform
confront
confuse
confusion
congratulations on
congress
connect
conquer
conscious
consciously
consequence
consequently
conservation
consider
considerable
consideration
consist
consist of
consistent
constant
constantly
constitute
constitution
construct
construction
consume
consumer
consumption
contain
container
contemporary
content
context
continent
continue
contract
contrary
contrast
contribute
contribution
controversial
convenient
conventional
conversation
converse
convert
convey
convict
conviction
convince
cooperation
cop
cope
cope with
copyright
correct
corridor
cough
council
counter
county
courage
court
cover
crack
craft
create
creation
creative
creature
credit
crew
crime
criminal
crisis
critic
critical
criticism
criticize
critics
crop
crowd
crown
crucial
cruel
cruise
cultivate
culture
cure
curiosity
curious
currency
current
custom
customer
cut down
cut down on
dare
deadline
deaf
deal
deal with
dealer
debate
debt
decade
deceive
decent
decide
decision
declare
decline
decrease
dedicate
defeat
defend
defendant
deficit
definite
definitely
definition
degree
delay
delete
deliberately
delicate
delight
deliver
delivery
demand
democracy
democrat
democratic
demonstrate
dentist
deny
department
depend
depend on
dependent
depending
deposit
depress
depression
deputy
derive
descend
describe
description
desert
deserve
designate
desirable
desire
desperate
despite
destination
destroy
destruction
detail
detailed
detect
detective
determine
devastate
develop
development
device
devise
dialect
die
diet
differ
differ from
difference
dig
digest
dignity
diminish
dip
direction
directly
director
disadvantage
disagree
disappear
disappoint
disaster
discover
discovery
discrimination
discuss
discussion
disease
dislike
disorder
display
disposal
dispute
distance
distant
distinct
distinction
distinguish
distort
distract
distribution
distributor
district
disturb
divide
division
divorce
dizziness
dizzy
do away with
do well
document
documentary
domain
domestic
dominate
donate
donation
dormitory
doubt
doubtfully
dozen
drag
drain
dramatic
draw
drift
drop by
drop off
drought
drug
due
due to
dull
dump
during
dust
duty
each other
eager
earn
earnest
ease
echo
economic
economics
economy
edge
editor
educate
education
educational
effect
effective
effectively
efficiency
efficient
elaborate
elderly
election
electric
electrical
electricity
electronic
element
elementary
eliminate
embarrass
embarrassed
embrace
emergency
emotional
emotionally
emperor
emphasis
emphasize
empire
employ
employee
employer
employment
empty
encounter
encourage
end up
endanger
endow
endure
enforcement
engaged
enhance
enlarge
enormous
enrich
ensure
enter
enterprise
entertainment
enthusiasm
entire
entirely
entitle
entitle to
envelope
environment
environmental
environmentally
envy
equal
equality
equipment
equivalent
era
erosion
escape
especially
essay
essentially
establish
establishment
estate
estimate
etc
ethnic
evaluate
even if
even though
eventually
evidence
evident
evil
evoke
evolution
evolve
exact
exactly
exaggerate
examination
examine
except
except for
exception
exceptionally
excess
excessive
exclude
exclusive
excuse
executive
exert
exhaust
exhibit
exhibition
exist
existence
existing
expand
expansion
expect
expectation
expense
expensive
experiment
expire
expired
explain
explanation
explode
explore
explorer
explorers
explosion
export
expose
exposure
express
expression
extend
extension
extensive
extent
extinct
extinction
extra
extract
extraordinary
extreme
extremely
eyesight
fabric
face
facility
factor
factory
fail
failure
fair
fairly
faith
false
fame
familiar
famine
famous
fancy
far off
fare
fascinate
fat
fate
fatigue
fault
favor
favorite
fear
feature
federal
fee
feed
fellow
female
fertilizer
fiber
figure
fill out
finally
finance
financial
fingerprint
fire
firm
firmly
first of all
five senses
fix
flame
flavor
flee
flexibility
flood
flow
focus
focus on
fold
folk
for example
for fear of
for free
for instance
for some time
for sure
for the time being
force
forecast
foreign
forever
forget
formal
formation
former
formula
forward
fossil
fossil fuel
found
foundation
founder
fraction
fragile
fragment
freeze
frequent
frequently
friendly
frighten
frightened
from now on
from time to time
frown
fuel
fulfill
fully
fund
fundamental
funding
fur
furniture
furthermore
gain
garbage
gather
gay
gaze
gear
gene
generate
generation
generous
generously
genetically
genius
gentle
genuine
germ
get along
get along with
get away with
get by
get over
get rid of
get used to
girlfriend
give out
given
glance
global
globe
go after
goal
govern
government
governor
grace
gradually
graduate
grammar
grand
grasp
grass
grave
gravity
greet
grocery
guarantee
guess
guide
guilty
guilty of
habit
hand in
handle
handout
hang
hang up
happen
harbor
hardly
harm
harmful
harmony
harsh
harvest
hate
have an effect on
have effects on
headline
headquarters
health insurance
hear from
heart rate
heel
height
hell
hemisphere
heritage
hesitantly
hesitate
hesitation
hide
hierarchy
highlight
hire
historian
historic
historical
history
holy
honor
horror
hospitality
household
however
huge
humanity
humble
humid
humidity
hundreds of
hunger
ideal
identical
identify
identity
ignorance
ignore
ill
illegal
illness
illustrate
illustration
imagination
imitate
immediate
immediately
immigrant
immigrate
immigration
immune
impact
imperial
implement
implication
imply
import
impose
impossible
impress
impression
impressive
improve
improvement
impulse
in a row
in addition
in advance
in case
in charge of
in common
in contrast
in contrast to
in danger of
in demand
in detail
in effect
in exchange
in fact
in fashion
in general
in need of
in order to
in other words
in particular
in place
in practice
in reality
in response
in response to
in shape
in short
in some way
in spite of
in stock
in terms of
in the long run
in the meantime
in time
in touch
in tough
in trouble
in turn
in vain
incident
inclined
include
income
inconvenience
incorporate
increase
increasingly
incredible
indeed
independent
index
indicate
indigenous
individual
indoor
induce
industrial
industrialize
industry
inevitable
infant
inferior
inflation
influence
inform
infrastructure
ingredient
inhabitant
initial
initially
initiative
injection
injury
innocent
innocently
inquiry
insect
inside
insight
insist
insist on
inspector
inspire
install
instant
instead
instead of
instinct
institution
instruct
instruction
instrument
insult
insurance
integrate
intellectual
intelligence
intend
intend to
intense
intensive
intention
interfere
interior
internal
international
interpret
interpretation
interrupt
intervention
intimate
introduce
intuition
invade
invent
invention
invest
invest in
investigate
investigation
investigator
investment
investor
invisible
involve
involvement
irrelevant
irrigation
irritate
island
isolate
isolated
isolation
issue
it is common to hear
item
jail
jealously
joint
journey
joy
judge
jury
justify
keep up
keep up with
kindergarten
knee
knowledge
lab
labor
laboratory
lack
landscape
language
lap
laptop
large amount of
largely
lately
later
latest
latter
laugh at
laughter
launch
laundry
law
lawn
lawyer
layer
lazy
lead to
leak
lean
leap
leave out
leftover
legal
legend
legislation
leisure
leisurely
length
lessen
lesser
liberty
lie
likely
limb
liquid
literally
literary
literature
litter
live on
load
locate
location
log
logic
logical
look forward to
look into
look over
look through
look up to
lord
lose
lose face
low-income
luckily
lung
luxury
mad
made of
magnificent
mainly
maintain
maintenance
major
majority
make a difference
make fun of
make sense
make sure
make up
maker
male
mammal
manage
manager
manipulate
manner
manufacturer
market
mass
massive
master
masterpiece
match
mate
material
matter
mature
maximum
maybe
mayor
meal
mean
means
meanwhile
measure
medical
medicine
medieval
medium
melt
memory loss
mental
mention
merchant
mere
merely
mess
metal
method
migrate
mildly
military
million
mindful
mineral
minimum
minister
ministry
minority
mixture
modern
modest
modify
molecule
moment
moral
more and more
moreover
mortgage
mostly
motive
multiple
mummy
murder
muscle
mutual
mysterious
mystery
myth
naked
nap
narrow
nation
national
natural
nature
navy
nearby
neat
necessarily
necessity
needlessly
negative
neglect
negotiate
negotiation
neighbor
neighborhood
nerve
nervous
nevertheless
newly
no longer
nod
normally
not always
not yet
notice
notion
nowhere
nuclear
numerous
nursery school
nutrition
obey
object
objection
objective
objectively
obligation
obscure
observation
observe
observer
obsession
obstacle
obtain
obvious
obviously
occasion
occasionally
occupation
occupy
occur
odd
off duty
offensive
on account of
on average
on behalf of
on demand
on duty
on purpose
on schedule
on the contrary
on the other hand
on the run
once
one day
operate
operation
operator
opinion
opponent
opportunity
oppose
opposite
opposition
optimistic
orbit
order
ordinary
organ
organic
organization
organize
origin
originate
otherwise
out of breath
out of date
out of place
out of stock
out of use
outcome
output
outstanding
over time
overall
overcome
overlap
overtake
overwhelm
overwhelming
owe
own
oxygen
pain
painful
palm
pan
parallel
parking lot
parliament
participant
participate
participate in
particle
particular
particularly
partly
partnership
party
pass out
passage
passenger
passive
past
pastime
patch
path
patience
patient
payment
peaceful
peacefully
peak
peculiar
pedestrian
peel
peer
penetrate
pension
perceive
percentage
perception
period
permanent
permanently
permission
permit
persist in
personality
personally
perspective
persuade
persuasion
phase
phenomenon
physical
physician
physics
pile
pioneer
pit
pitch
plain
planet
plant
plastic bag
play a role in
pleasant
pleasure
plenty
plot
poet
poison
policy
polite
politely
politician
politics
poll
pollution
popular
popularity
population
portable
portion
portrait
pose
positive
possibility
possible
possibly
postpone
potential
potentially
pour
poverty
practical
practically
praise
pray
prayer
precede
precious
precise
precisely
predator
predict
prefer
preference
pregnant
prejudice
preparation
prescription
presence
present
preserve
preserved
president
pretend
pretty
prevent
prevent A from B
previous
previously
prey
price
primary
primitive
principal
prior
priority
prisoner
privilege
prize
probably
procedure
proceed
process
produce
product
production
profession
profit
profound
progress
prohibit
prolong
promote
promotion
prompt
pronunciation
proper
properly
property
proportion
proposal
propose
proposed
prosecution
prosecutor
prospect
protect
protein
protest
protocol
proud
prove
proverb
provide
provide A with B
provided that
province
provision
provoke
psychological
psychologist
psychology
public
publication
publicity
publish
publisher
pull away
pull down
pull off
punctual
punish
punishment
pupil
purchase
purpose
pursue
pursuit
put away
put off
put together
put up with
qualify
quality
quantity
quarrel
quarter
quit
quite
racial
radical
raise
range
rapid
rapidly
rare
rarely
rather
rather than
rating
rational
raw
ray
reach
reach out
react
react to
reaction
realize
rear
reasonable
rebel
recall
receive
recent
recently
recession
recognition
recognize
recommend
recommendation
recover
recovery
reduce
reduction
refer
refer to
reference
reflection
refrain from
refuge
refugee
refund
refuse
regarding
regardless
regime
region
regional
regret
regulation
reinforce
reject
related to
relation
relative
relatively
release
relevant
relevant to
reliable
relief
relieve
religion
rely
rely on
remain
remaining
remarkable
remember
remind
remind of
remote
remove
renew
rent
repair
replace
replacement
reply
represent
representation
representative
republic
reputation
require
research
researcher
reservation
reserve
resident
resign
resist
resistance
resolution
resolve
resource
respect
respond
responsibility
responsible
restore
restrain
restrict
restriction
result in
retail
retain
retire
retirement
retrieve
reuse
reveal
revenge
revenue
reverse
revise
revolution
reward
rid
ridiculous
right
rise
ritual
roast
role
roll
rough
rub
rude
rug
ruin
rule out
rumor
run away
run out of
rural
sacrifice
salary
salty
sanitation
satellite
satisfaction
satisfactory
satisfy
savage
scar
scarce
scatter
scheme
scholar
scholarship
science
scientific
scientist
sculpture
seat
secondhand
secretary
see in
seed
seek
seem
seize
seldom
select
senate
senior
sensitive
separation
sequence
servant
settle
settle down
settlement
several
severe
sewage
shame
share
sharp
shed
shit
shooting
shortage
shortly
show up
shrink
shrug
sigh
sight
sign
significance
significant
significantly
silly
similar
similar to
similarity
similarly
since then
sincere
sincerely
sink
sit up
site
slavery
slide
slight
slightly
smart
smell
snap
sneeze
so-called
soak
soar
social
socially
society
sole
solid
solution
solve
somehow
sophisticated
sorrow
sort
source
souvenir
sparkle
speaking of
specialize in
species
specific
spectator
spend
sphere
spill
spiritual
spiritually
split
spoil
spouse
spread
spur
squeeze
stable
stake
stand out
stand still
stand up
stare
stare at
starve
state
statistics
status
stay up
steadily
steady
steam
steel
stem
stern
stiff
stimulate
stir
stock
storage
straight on
strain
strange
strangely
stranger
strategy
stream
strengthen
stretch
strict
strike
stroke
strongly
structure
struggle
struggle with
stubborn
stupid
subject
submit
subsequent
substance
substitute
subtle
suburb
succeed
success
such as
sudden
sue
suffer
suffer from
suffering
sufficient
suggest
suggestion
suicide
suit
suitable
sum
summit
summon
superior
supervisor
supplement
supporter
suppose
suppress
supreme
sure
surface
surgery
surround
survey
survival
survive
suspect
suspend
suspicious
sustain
sustainable
swallow
swear
sweep
symmetry
sympathy
symptom
tail
take A for granted
take after
take care
take down
take over
take part in
tale
talent
tame
tap
task
taste
tax
tear
technical
teenager
telescope
temper
temperature
temple
temporarily
temporary
term
terminal
terrible
terribly
terror
thanks to
the other
theory
therapy
therefore
thermometer
thick
think over
thorough
though
thought
threat
throat
throughout
throw away
thrust
tide
tidy
tight
till
tiny
tip
tissue
to some extent
to start with
toe
tolerate
toll
tongue
totally
tough
tourism
toward
towards
toxic
tradition
traditional
traffic
traffic jam
tragedy
trait
transaction
transfer
transform
transition
translate
translation
transport
transportation
treasure
treat
treatment
tremble
tremendous
tribe
trigger
trivial
troop
tropical
truly
trust
truth
try on
try out
tuition
tumor
turn A into B
turn in
turn into
twin
twist
typical
typically
ugly
ultimate
unable
unbelievable
uncomfortable
under way
undergo
undertake
unexpected
unfortunately
union
unique
unit
universal
universe
university
unknown
unless
unlike
unlikely
unpleasant
until
unusual
unusually
up to
upset
urban
urge
urgent
use up
useful
useless
utilize
utter
vaccine
vague
vain
valuable
vanish
variation
various
vehicle
vending machine
venture
verbal
vessel
vice
victim
viewer
violate
violence
virtually
virtue
virus
visible
visually
vital
vivid
vocabulary
voluntarily
vote
vote for
voter
vow
voyage
vulnerable
wage
wait for
wan
war
warm
warn
waste
watch out
wealthy
wear
weather
weigh
weight
welcome
welfare
well off
well-known
what is called
what is worse
whatever
whenever
whereas
wherever
whether
whisper
whistle
whole
widely
wildlife
willing
wipe
wisdom
wise
with luck
withdraw
within
within reach
withstand
witness
work out
worry
worth
worthy of
wrap
wrong
yell
yield
`
    .trim()
    .split('\n')
    .map((word) => word.trim())
    .filter(Boolean);

// ==============================
// 英検準1級 (大学中級程度)
// ==============================
const LEGACY_GRADE_PRE1_VOCAB = [
    { word: 'abdicate', meaning: '退位する、放棄する' },
    { word: 'absorb', meaning: '吸収する、夢中にさせる' },
    { word: 'absurd', meaning: 'ばかげた' },
    { word: 'accelerate', meaning: '加速する、促進する' },
    { word: 'accidental', meaning: '偶然の' },
    { word: 'accomplishment', meaning: '成果、業績' },
    { word: 'accumulate', meaning: '蓄積する' },
    { word: 'acknowledge', meaning: '認める' },
    { word: 'acquaintance', meaning: '知人' },
    { word: 'acquire', meaning: '習得する、獲得する' },
    { word: 'activate', meaning: '活性化する' },
    { word: 'adaptable', meaning: '適応できる' },
    { word: 'additional', meaning: '追加の' },
    { word: 'address', meaning: '取り組む、演説する、宛名を書く' },
    { word: 'adequate', meaning: '十分な、適切な' },
    { word: 'adjust', meaning: '調節する、適合させる' },
    { word: 'administration', meaning: '管理、行政、政権' },
    { word: 'adolescent', meaning: '思春期の、若者' },
    { word: 'adversary', meaning: '敵、対戦相手' },
    { word: 'advocate', meaning: '提唱する、擁護者' },
    { word: 'affectionate', meaning: '愛情深い' },
    { word: 'aggravate', meaning: '悪化させる' },
    { word: 'alienate', meaning: '疎外する' },
    { word: 'alleviate', meaning: '軽減する' },
    { word: 'allocate', meaning: '割り当てる、配分する' },
    { word: 'alternative', meaning: '代わりの、選択肢' },
    { word: 'altitude', meaning: '高度、海抜' },
    { word: 'amateur', meaning: 'アマチュアの' },
    { word: 'ambiguous', meaning: '曖昧な' },
    { word: 'amend', meaning: '修正する' },
    { word: 'amuse', meaning: '楽しませる' },
    { word: 'analyze', meaning: '分析する' },
    { word: 'ancestor', meaning: '祖先' },
    { word: 'anecdote', meaning: '逸話' },
    { word: 'anguish', meaning: '苦悩' },
    { word: 'animate', meaning: '活気づける、命を吹き込む' },
    { word: 'anticipate', meaning: '予期する' },
    { word: 'anxiety', meaning: '心配、不安' },
    { word: 'apologize', meaning: '謝罪する' },
    { word: 'apparatus', meaning: '装置、器具' },
    { word: 'apparent', meaning: '明白な、見かけの' },
    { word: 'appeal', meaning: '訴え、魅力' },
    { word: 'applaud', meaning: '拍手喝采する' },
    { word: 'appraise', meaning: '評価する' },
    { word: 'appreciable', meaning: '評価できる、かなりの' },
    { word: 'apprehend', meaning: '逮捕する、理解する' },
    { word: 'appropriate', meaning: '適切な、適当な' },
    { word: 'approximate', meaning: 'おおよその' },
    { word: 'aptitude', meaning: '適性、才能' },
    { word: 'arbitrary', meaning: '独断的な、任意の' },
    { word: 'architecture', meaning: '建築、構造' },
    { word: 'aristocracy', meaning: '貴族政治、貴族階級' },
    { word: 'arouse', meaning: '目覚めさせる、喚起する' },
    { word: 'arrogant', meaning: '謙虚でない、傲慢な' },
    { word: 'articulate', meaning: 'はっきりと発音する、明瞭な' },
    { word: 'artificial', meaning: '人工の、不自然な' },
    { word: 'ascertain', meaning: '確かめる' },
    { word: 'aspect', meaning: '局面、観点' },
    { word: 'assault', meaning: '襲撃、暴行' },
    { word: 'assemble', meaning: '集める、組み立てる' },
    { word: 'assert', meaning: '断言する、主張する' },
    { word: 'assess', meaning: '評価する、査定する' },
    { word: 'assign', meaning: '割り当てる、命じる' },
    { word: 'assimilate', meaning: '同化する、吸収する' },
    { word: 'assist', meaning: '手伝う、援助する' },
    { word: 'associate', meaning: '関連づける、交際する' },
    { word: 'assume', meaning: '仮定する、引き受ける' },
    { word: 'assure', meaning: '保証する、確信させる' },
    { word: 'astonish', meaning: '驚かせる' },
    { word: 'astronomy', meaning: '天文学' },
    { word: 'athlete', meaning: '運動選手' },
    { word: 'atmosphere', meaning: '大気、雰囲気' },
    { word: 'attach', meaning: 'くっつける、添付する' },
    { word: 'attain', meaning: '達成する、手に入れる' },
    { word: 'attempt', meaning: '試みる' },
    { word: 'attend', meaning: '出席する、世話をする、注意を払う' },
    { word: 'attitude', meaning: '態度、考え方' },
    { word: 'attract', meaning: '引きつける' },
    { word: 'attribute', meaning: '結果であると考える、特質' },
    { word: 'authentic', meaning: '本物の、信頼できる' },
    { word: 'authoritarian', meaning: '権威主義的な' },
    { word: 'autonomous', meaning: '自治の、自主的な' },
    { word: 'available', meaning: '利用できる、手が空いている' },
    { word: 'avalanche', meaning: '雪崩、殺到' },
    { word: 'avenue', meaning: '大通り、手段' },
    { word: 'avert', meaning: 'そらす、避ける' },
    { word: 'awkward', meaning: 'ぎこちない、気まずい' },
    { word: 'bachelor', meaning: '独身男性、学士' },
    { word: 'bacterium', meaning: 'バクテリア、細菌' },
    { word: 'baffle', meaning: '困惑させる' },
    { word: 'balcony', meaning: 'バルコニー' },
    { word: 'balk', meaning: 'ためらう' },
    { word: 'ballot', meaning: '投票、投票用紙' },
    { word: 'ban', meaning: '禁止する' },
    { word: 'banish', meaning: '追放する' },
    { word: 'bankrupt', meaning: '破産した' },
    { word: 'bare', meaning: 'むき出しの、ありのままの' },
    { word: 'bargain', meaning: 'お買い得品、交渉する' },
    { word: 'barren', meaning: '不毛の' },
    { word: 'barrier', meaning: '障害、防壁' }
];

export const VOCAB_GRADE_PRE2 = Array.from(
    new Map(
        [...LEGACY_GRADE_PRE2_VOCAB, ...CUSTOM_VOCAB_GRADE_PRE2].map((entry) => [
            normalizeVocabKey(entry.word),
            entry
        ])
    ).values()
);

export const VOCAB_GRADE_PRE1 = Array.from(
    new Map(
        [
            ...LEGACY_GRADE_PRE1_VOCAB,
            ...CUSTOM_VOCAB_GRADE_PRE1
        ].map(({ word, meaning }) => [
            normalizeVocabKey(word),
            { word, meaning }
        ])
    ).values()
);

// ==============================
// 英検1級 (大学上級程度)
// ==============================
const LEGACY_GRADE1_VOCAB = [
    { word: 'abate', meaning: '和らぐ、減らす' },
    { word: 'aberration', meaning: '異常、常軌を逸すること' },
    { word: 'abhor', meaning: 'ひどく嫌う、憎悪する' },
    { word: 'abject', meaning: '悲惨な、卑劣な' },
    { word: 'abound', meaning: '豊富にある' },
    { word: 'absolve', meaning: '無罪とする、赦免する' },
    { word: 'abstain', meaning: '控える、棄権する' },
    { word: 'abstruse', meaning: '難解な' },
    { word: 'accede', meaning: '同意する、応じる' },
    { word: 'acclimate', meaning: '順応させる' },
    { word: 'accolade', meaning: '称賛、栄誉' },
    { word: 'accost', meaning: '声をかける、近寄る' },
    { word: 'accumulate', meaning: '蓄積する' },
    { word: 'adage', meaning: '金言、格言' },
    { word: 'adamant', meaning: '断固とした、譲らない' },
    { word: 'adept', meaning: '熟達した、達人' },
    { word: 'administer', meaning: '管理する、投与する' },
    { word: 'admonish', meaning: '忠告する、たしなめる' },
    { word: 'adverse', meaning: '不利な、逆の' },
    { word: 'advocate', meaning: '主唱者、提唱する' },
    { word: 'affluent', meaning: '裕福な、豊富な' },
    { word: 'aggravate', meaning: '悪化させる、怒らせる' },
    { word: 'aggregate', meaning: '総計の、集める' },
    { word: 'alacrity', meaning: '敏捷性、熱意' },
    { word: 'alienate', meaning: '疎外する' },
    { word: 'allay', meaning: '和らげる、静める' },
    { word: 'allege', meaning: '断言する、主張する' },
    { word: 'alleviate', meaning: '軽減する、緩和する' },
    { word: 'allocate', meaning: '割り当てる' },
    { word: 'ambiguous', meaning: '曖昧な' },
    { word: 'ameliorate', meaning: '改善する、向上させる' },
    { word: 'amenable', meaning: '従順な、快く受け入れる' },
    { word: 'amiable', meaning: '愛想の良い、好意的な' },
    { word: 'amplify', meaning: '拡大する、詳細に説明する' },
    { word: 'anachronism', meaning: '時代錯誤' },
    { word: 'anatomy', meaning: '解剖学、詳細な分析' },
    { word: 'anomaly', meaning: '例外、変則' },
    { word: 'antagonize', meaning: '敵に回す、反感を買う' },
    { word: 'apprehensive', meaning: '懸念して、理解の早い' },
    { word: 'arbitrary', meaning: '恣意的な、独断的な' },
    { word: 'arcane', meaning: '秘密の、難解な' },
    { word: 'archaic', meaning: '古風な、廃れた' },
    { word: 'arduous', meaning: '困難な、骨の折れる' },
    { word: 'articulate', meaning: 'はっきりと発音する、明瞭な' },
    { word: 'ascertain', meaning: '突き止める、確かめる' },
    { word: 'assimilate', meaning: '同化する、吸収する' },
    { word: 'assuage', meaning: '和らげる、静める' },
    { word: 'astute', meaning: '機敏な、抜け目のない' },
    { word: 'atrocity', meaning: '残虐行為' },
    { word: 'audacious', meaning: '大胆な、無礼な' },
    { word: 'augment', meaning: '増加させる、補う' },
    { word: 'avow', meaning: '公言する、認める' },
    { word: 'baffle', meaning: '困惑させる' },
    { word: 'banal', meaning: '陳腐な、平凡な' },
    { word: 'belligerent', meaning: '好戦的な' },
    { word: 'blatant', meaning: '露骨な、見え透いた' },
    { word: 'bolster', meaning: '支持する、補強する' },
    { word: 'bombastic', meaning: '大げさな、誇張した' },
    { word: 'breach', meaning: '違反、突破口' },
    { word: 'bustle', meaning: 'せわしく動く、喧騒' },
    { word: 'cache', meaning: '隠し場所、貯蔵物' },
    { word: 'candid', meaning: '率直な、公平な' },
    { word: 'capricious', meaning: '気まぐれな' },
    { word: 'castigate', meaning: '厳しく非難する' },
    { word: 'catalyst', meaning: '触媒、促進のきっかけ' },
    { word: 'categorical', meaning: '絶対的な、断言的な' },
    { word: 'caveat', meaning: '警告、注意書き' },
    { word: 'censure', meaning: '非難する、酷評' },
    { word: 'chronic', meaning: '慢性の、常習的な' },
    { word: 'circuitous', meaning: '回りくどい、遠回りの' },
    { word: 'circumvent', meaning: '回避する、出し抜く' },
    { word: 'clandestine', meaning: '秘密の、内密の' },
    { word: 'coerce', meaning: '強要する' },
    { word: 'cogent', meaning: '説得力のある' },
    { word: 'cognizant', meaning: '認識している' },
    { word: 'coherent', meaning: '筋の通った、首尾一貫した' },
    { word: 'collude', meaning: '共謀する' },
    { word: 'commensurate', meaning: '相応の、釣り合った' },
    { word: 'compile', meaning: '編集する、まとめる' },
    { word: 'complacent', meaning: '自己満足的な' },
    { word: 'comply', meaning: '従う、応じる' },
    { word: 'concede', meaning: '認める、譲歩する' },
    { word: 'concise', meaning: '簡潔な' },
    { word: 'concur', meaning: '同意する、同時に起こる' },
    { word: 'condone', meaning: '大目に見る、許す' },
    { word: 'conducive', meaning: '資する、貢献する' },
    { word: 'congenial', meaning: '気心の知れた、性に合った' },
    { word: 'conjecture', meaning: '推測する、憶測' },
    { word: 'consolidate', meaning: '統合する、強化する' },
    { word: 'conspicuous', meaning: '目立つ、顕著な' }
];

function normalizeVocabKey(value) {
    return String(value ?? '').trim().toLowerCase();
}

function normalizeText(value) {
    return String(value ?? '').trim();
}

const GRADE2_ADDITIONAL_MEANINGS = new Map([
    ['arctic', '北極の'],
    ['buddhist', '仏教徒、仏教の'],
    ['how come', 'なぜ、どうして'],
    ['jewish', 'ユダヤ人の、ユダヤ教の'],
    ['mexican', 'メキシコ人の、メキシコの'],
    ['muslim', 'イスラム教徒、イスラム教の'],
    ['no', 'いいえ、ない'],
    ['what is more', 'その上、さらに'],
    ['a bunch of', 'たくさんの、一束の'],
    ['a couple of', '2つの、2人の、いくつかの'],
    ['abortion', '妊娠中絶'],
    ['abrupt', '突然の、不意の'],
    ['absence', '不在、欠席'],
    ['absolute', '絶対的な'],
    ['absorb in', '〜に夢中にさせる'],
    ['academically', '学問的に'],
    ['accommodation', '宿泊設備、住居'],
    ['according', '従って'],
    ['account for', '説明する、占める'],
    ['accuracy', '正確さ'],
    ['accustomed', '慣れた'],
    ['acquaint', '知らせる、知り合いにさせる'],
    ['act on', '〜に基づいて行動する、作用する'],
    ['acute', '鋭い、深刻な'],
    ['ad', '広告'],
    ['add to', '付け加える、増やす'],
    ['addicted', '中毒になって、夢中で'],
    ['advertisement', '広告'],
    ['afterwards', 'その後で'],
    ['aggression', '攻撃、侵略'],
    ['aggressive', '攻撃的な'],
    ['agricultural', '農業の'],
    ['aisle', '通路'],
    ['alive', '生きている'],
    ['all around the world', '世界中で'],
    ['almost', 'ほとんど'],
    ['along with', '〜と一緒に'],
    ['aloud', '声に出して'],
    ['altogether', '完全に、全部で'],
    ['ambition', '野心、志'],
    ['ambulance', '救急車'],
    ['amount to', '合計で〜になる、〜に等しい'],
    ['anger', '怒り'],
    ['angle', '角度、視点'],
    ['annual', '毎年の、年1回の'],
    ['appetite', '食欲'],
    ['applause', '拍手'],
    ['application', '申し込み、応募、適用'],
    ['apply for', '申し込む、応募する'],
    ['approximately', 'およそ、約'],
    ['as a matter of fact', '実際のところ'],
    ['as far as i know', '私の知る限りでは'],
    ['as follows', '次のとおり'],
    ['as if', 'まるで〜のように'],
    ['as though', 'あたかも〜であるかのように'],
    ['ashamed', '恥ずかしく思って'],
    ['assembly', '集会、組み立て'],
    ['associated with', '〜と関係がある'],
    ['at a loss', '途方に暮れて'],
    ['at best', 'せいぜい、多くても'],
    ['at least', '少なくとも'],
    ['at times', '時々'],
    ['atomic', '原子の'],
    ['attach to', '〜に付ける、添付する'],
    ['automobile', '自動車'],
    ['bake', '焼く'],
    ['bang', 'ドンと音を立てる、強打する'],
    ['bank account', '銀行口座'],
    ['basin', '盆地、洗面器'],
    ['be accustomed to', '〜に慣れている'],
    ['be adjusted to', '〜に順応している'],
    ['be awake', '目が覚めている'],
    ['be aware of', '〜に気づいている'],
    ['be born with', '生まれつき〜を持っている'],
    ['be concerned about', '〜を心配している'],
    ['be connected to', '〜につながっている'],
    ['be considered to', '〜だと考えられている'],
    ['be effective at', '〜に効果がある、得意である'],
    ['be engaged in', '〜に従事している'],
    ['be familiar with', '〜に精通している'],
    ['be involved in', '〜に関わっている'],
    ['be known for', '〜で知られている'],
    ['be made from', '〜から作られる'],
    ['be obliged to', '〜する義務がある'],
    ['be pleased with', '〜に満足している'],
    ['be short of', '〜が不足している'],
    ['be threatened to', '〜すると脅される'],
    ['be well of', '裕福である'],
    ['be willing to', '喜んで〜する'],
    ['beat', '打ち負かす、たたく'],
    ['before long', 'まもなく'],
    ['beg', '懇願する、物ごいをする'],
    ['behalf', '利益、立場'],
    ['behind', '後ろに、遅れて'],
    ['believe in', '〜の存在を信じる、信用する'],
    ['beneath', '〜の下に'],
    ['beside', '〜のそばに'],
    ['between a and b', 'AとBの間に'],
    ['beverage', '飲み物'],
    ['bill', '請求書、法案'],
    ['billion', '10億'],
    ['bind', '縛る、結びつける'],
    ['biology', '生物学'],
    ['bishop', '司教'],
    ['blame for', '〜のことで責める'],
    ['blast', '爆発、突風'],
    ['bleed', '出血する'],
    ['blink', 'まばたきする'],
    ['bloom', '咲く、開花'],
    ['border', '国境、境界'],
    ['bound for', '〜行きの'],
    ['bow', 'おじぎする、弓'],
    ['break out', '突然始まる、逃げ出す'],
    ['breed', '繁殖する、品種'],
    ['breeze', 'そよ風'],
    ['briefly', '簡潔に、短時間'],
    ['brightness', '明るさ'],
    ['bring up', '育てる、話題に出す'],
    ['bully', 'いじめっ子、いじめる'],
    ['burden', '重荷、負担'],
    ['bureau', '局、事務局'],
    ['burst', '破裂する、突然〜し始める'],
    ['bury', '埋める、埋葬する'],
    ['buyer', '買い手'],
    ['by degrees', '徐々に'],
    ['by heart', '暗記して'],
    ['by means of', '〜によって'],
    ['by nature', '生まれつき、本来'],
    ['by the end of', '〜の終わりまでに'],
    ['calm', '落ち着いた、落ち着かせる'],
    ['calm down', '落ち着く、落ち着かせる'],
    ['candidate', '候補者'],
    ['carbon dioxide', '二酸化炭素'],
    ['carry out', '実行する'],
    ['cash', '現金'],
    ['cave', '洞窟'],
    ['charm', '魅力、お守り'],
    ['checkup', '健康診断'],
    ['chemistry', '化学'],
    ['circuit', '回路、一周'],
    ['civilize', '文明化する'],
    ['civilized', '文明化された'],
    ['classical', '古典的な'],
    ['cling', 'しがみつく'],
    ['clip', '留め金で留める、切り抜き'],
    ['colony', '植民地'],
    ['come across', '偶然出会う'],
    ['come into being', '生じる、誕生する'],
    ['come out', '出てくる、明らかになる'],
    ['commissioner', '委員、長官'],
    ['commodity', '商品'],
    ['common', '共通の、普通の'],
    ['communist', '共産主義者、共産主義の'],
    ['commute', '通勤する'],
    ['companion', '仲間、連れ'],
    ['comparison', '比較'],
    ['compassion', '思いやり、同情'],
    ['competitor', '競争相手'],
    ['complain of', '〜を訴える、不満を言う'],
    ['complete', '完全な、完了する'],
    ['completely', '完全に'],
    ['complexity', '複雑さ'],
    ['compliment', 'ほめ言葉、ほめる'],
    ['composition', '作文、構成'],
    ['conceal', '隠す'],
    ['concrete', '具体的な、コンクリート'],
    ['conference', '会議'],
    ['confident', '自信がある'],
    ['confine', '制限する、閉じ込める'],
    ['conform', '従う、一致する'],
    ['confront', '立ち向かう'],
    ['confusion', '混乱'],
    ['congratulations on', '〜おめでとう'],
    ['conquer', '征服する、克服する'],
    ['consciously', '意識して'],
    ['consequently', 'その結果'],
    ['conservation', '保護、保存'],
    ['consist of', '〜から成る'],
    ['constant', '絶え間ない、不変の'],
    ['constantly', '絶えず'],
    ['constitute', '構成する'],
    ['constitution', '憲法、体質'],
    ['construction', '建設、構造'],
    ['container', '容器'],
    ['content', '内容、中身'],
    ['continent', '大陸'],
    ['contract', '契約'],
    ['convenient', '便利な'],
    ['conversation', '会話'],
    ['converse', '会話する、逆の'],
    ['convict', '有罪とする、受刑者'],
    ['cop', '警官'],
    ['cope with', '〜に対処する'],
    ['cough', 'せき、せきをする'],
    ['counter', '反論する、カウンター'],
    ['creative', '創造的な'],
    ['crew', '乗組員、スタッフ'],
    ['critic', '批評家'],
    ['criticize', '批判する'],
    ['critics', '批評家たち'],
    ['crown', '王冠'],
    ['cruise', '巡航する、クルーズ'],
    ['cultivate', '耕作する、育む'],
    ['cure', '治療する、治療法'],
    ['cut down', '切り倒す、削減する'],
    ['dare', 'あえて〜する'],
    ['deaf', '耳の聞こえない'],
    ['deal with', '対処する'],
    ['decent', 'きちんとした、かなり良い'],
    ['dedicate', 'ささげる、専念する'],
    ['defend', '守る、防御する'],
    ['deficit', '赤字、不足'],
    ['definite', '明確な、確かな'],
    ['definition', '定義'],
    ['deliberately', '故意に、慎重に'],
    ['delicate', '繊細な、壊れやすい'],
    ['democrat', '民主主義者、民主党員'],
    ['democratic', '民主的な'],
    ['dentist', '歯科医'],
    ['department', '部門、売り場'],
    ['depress', '憂うつにさせる'],
    ['descend', '降りる、由来する'],
    ['description', '描写、説明'],
    ['designate', '指定する'],
    ['desirable', '望ましい'],
    ['desperate', '絶望的な、必死の'],
    ['destination', '目的地'],
    ['devastate', '壊滅させる'],
    ['devise', '考案する'],
    ['dialect', '方言'],
    ['differ', '異なる'],
    ['digest', '消化する、要約'],
    ['dignity', '尊厳'],
    ['diminish', '減少する、減らす'],
    ['dip', '少し下がる、浸す'],
    ['disadvantage', '不利、不利益'],
    ['disagree', '意見が合わない'],
    ['discrimination', '差別'],
    ['dislike', '嫌う'],
    ['display', '展示する、表示'],
    ['dispute', '論争'],
    ['distant', '遠い'],
    ['distinct', 'はっきり異なる'],
    ['distinguish', '区別する'],
    ['distort', 'ゆがめる'],
    ['distract', '注意をそらす'],
    ['distribution', '分配、流通'],
    ['distributor', '販売業者、配給会社'],
    ['division', '分割、部門'],
    ['divorce', '離婚する、離婚'],
    ['dizziness', 'めまい'],
    ['dizzy', 'めまいがする'],
    ['do away with', '廃止する、なくす'],
    ['document', '文書、記録する'],
    ['documentary', '記録映画、事実に基づく'],
    ['domain', '領域、ドメイン'],
    ['dominate', '支配する'],
    ['donate', '寄付する'],
    ['donation', '寄付'],
    ['dormitory', '寮'],
    ['doubtfully', '疑わしげに'],
    ['drag', '引きずる'],
    ['drought', '干ばつ'],
    ['drug', '薬物、医薬品'],
    ['due to', '〜のために'],
    ['during', '〜の間に'],
    ['earnest', '真剣な'],
    ['economics', '経済学'],
    ['editor', '編集者'],
    ['educational', '教育の'],
    ['effectively', '効果的に'],
    ['elaborate', '精巧な、詳しく述べる'],
    ['electrical', '電気の'],
    ['elementary', '初歩の、基本の'],
    ['eliminate', '排除する'],
    ['embarrassed', '恥ずかしい、困惑した'],
    ['emperor', '皇帝'],
    ['empire', '帝国'],
    ['employer', '雇い主'],
    ['empty', '空の'],
    ['endanger', '危険にさらす'],
    ['endow', '授ける、寄付する'],
    ['enrich', '豊かにする'],
    ['ensure', '確実にする'],
    ['enterprise', '事業、企業'],
    ['enthusiasm', '熱意'],
    ['entitle to', '〜する権利を与える'],
    ['envy', 'うらやむ、ねたみ'],
    ['equality', '平等'],
    ['equipment', '設備、用具'],
    ['equivalent', '同等の、同等物'],
    ['era', '時代'],
    ['erosion', '浸食'],
    ['essentially', '本質的に'],
    ['etc', 'など'],
    ['even if', 'たとえ〜でも'],
    ['evident', '明らかな'],
    ['evoke', '呼び起こす'],
    ['evolve', '進化する、発展する'],
    ['exact', '正確な、まさにその'],
    ['exaggerate', '誇張する'],
    ['except for', '〜を除いて'],
    ['excess', '過剰'],
    ['excessive', '過度の'],
    ['exclusive', '排他的な、高級な'],
    ['executive', '経営幹部、重役'],
    ['exert', '及ぼす、行使する'],
    ['exhaust', '疲れ果てさせる、使い果たす'],
    ['exhibit', '展示する、展示品'],
    ['expire', '期限が切れる'],
    ['expired', '期限切れの'],
    ['explode', '爆発する'],
    ['explorers', '探検家たち'],
    ['explosion', '爆発'],
    ['extinct', '絶滅した'],
    ['extinction', '絶滅'],
    ['extract', '取り出す、抜粋'],
    ['eyesight', '視力'],
    ['facility', '施設、能力'],
    ['fame', '名声'],
    ['familiar', 'よく知られた、親しい'],
    ['famine', '飢饉'],
    ['fancy', '派手な、好む'],
    ['fare', '運賃'],
    ['fascinate', '魅了する'],
    ['fatigue', '疲労'],
    ['favorite', 'お気に入りの'],
    ['figure', '数字、人物、図'],
    ['finally', 'ついに、最後に'],
    ['fingerprint', '指紋'],
    ['firmly', 'しっかりと'],
    ['first of all', 'まず第一に'],
    ['flame', '炎'],
    ['focus on', '〜に集中する'],
    ['fold', '折る、折りたたむ'],
    ['for example', '例えば'],
    ['for free', '無料で'],
    ['for some time', 'しばらくの間'],
    ['for sure', '確かに'],
    ['for the time being', '当分の間'],
    ['forecast', '予報、予測する'],
    ['formula', '公式、方式'],
    ['fossil', '化石'],
    ['found', '設立する'],
    ['fraction', '一部、分数'],
    ['fragile', '壊れやすい'],
    ['fragment', '断片'],
    ['friendly', '親しみやすい'],
    ['from now on', 'これからは'],
    ['frown', 'しかめ面をする'],
    ['fulfill', '果たす'],
    ['fur', '毛皮'],
    ['gay', '陽気な、同性愛の'],
    ['gaze', 'じっと見つめる'],
    ['gear', '歯車、用具'],
    ['gene', '遺伝子'],
    ['generate', '生み出す、発生させる'],
    ['generation', '世代'],
    ['genetically', '遺伝学的に'],
    ['genuine', '本物の'],
    ['germ', '細菌'],
    ['get away with', '〜をうまくやり逃れる'],
    ['get by', '何とかやっていく'],
    ['get over', '乗り越える、回復する'],
    ['get used to', '〜に慣れる'],
    ['girlfriend', 'ガールフレンド'],
    ['give out', '配る、尽きる'],
    ['globe', '地球、球体'],
    ['go after', '追いかける、狙う'],
    ['goal', '目標、ゴール'],
    ['grace', '優雅さ、恩恵'],
    ['grand', '壮大な'],
    ['grasp', 'つかむ、理解する'],
    ['grass', '草'],
    ['grave', '墓、重大な'],
    ['grocery', '食料品'],
    ['guilty', '有罪の、後ろめたい'],
    ['hand in', '提出する'],
    ['handout', '配布物、施し'],
    ['hang up', '電話を切る、つるす'],
    ['harmony', '調和'],
    ['harsh', '厳しい'],
    ['health insurance', '健康保険'],
    ['hemisphere', '半球'],
    ['hesitantly', 'ためらいながら'],
    ['hesitation', 'ためらい'],
    ['hierarchy', '階層、序列'],
    ['historian', '歴史家'],
    ['holy', '神聖な'],
    ['honor', '名誉、敬意'],
    ['hospitality', 'もてなし'],
    ['humble', '謙虚な'],
    ['humid', '湿気の多い'],
    ['humidity', '湿度'],
    ['hunger', '飢え'],
    ['identical', '同一の'],
    ['ignorance', '無知'],
    ['ill', '病気の'],
    ['illustrate', '説明する、挿絵を入れる'],
    ['illustration', '挿絵、説明'],
    ['immigration', '移民、入国'],
    ['impact', '影響、衝撃'],
    ['imperial', '帝国の'],
    ['impose', '課す、押しつける'],
    ['impossible', '不可能な'],
    ['impulse', '衝動'],
    ['in a row', '連続して'],
    ['in charge of', '〜を担当して'],
    ['in contrast to', '〜とは対照的に'],
    ['in danger of', '〜の危険があって'],
    ['in demand', '需要がある'],
    ['in effect', '事実上、効力があって'],
    ['in exchange', '交換に'],
    ['in fact', '実際には'],
    ['in fashion', '流行して'],
    ['in general', '一般に'],
    ['in need of', '〜を必要として'],
    ['in other words', '言い換えれば'],
    ['in place', '適切な場所に、用意されて'],
    ['in practice', '実際には'],
    ['in response', '応えて、反応して'],
    ['in shape', '体調が良くて'],
    ['in short', '要するに'],
    ['in some way', '何らかの形で'],
    ['in stock', '在庫があって'],
    ['in terms of', '〜の点で'],
    ['in the meantime', 'その間に'],
    ['in time', '間に合って'],
    ['in touch', '連絡を取り合って'],
    ['in tough', '連絡を取り合って'],
    ['in trouble', '困って、面倒に巻き込まれて'],
    ['in turn', '順番に、その結果'],
    ['in vain', 'むだに'],
    ['incident', '出来事、事件'],
    ['inclined', '傾いている、〜する傾向がある'],
    ['inconvenience', '不便、不都合'],
    ['increasingly', 'ますます'],
    ['incredible', '信じられない'],
    ['indigenous', '先住の、固有の'],
    ['indoor', '屋内の'],
    ['induce', '引き起こす、説得してさせる'],
    ['industrialize', '工業化する'],
    ['inevitable', '避けられない'],
    ['infant', '乳児'],
    ['inferior', '劣った'],
    ['infrastructure', '社会基盤'],
    ['inhabitant', '住民'],
    ['initial', '最初の、頭文字'],
    ['injection', '注射'],
    ['innocently', '無邪気に、無実に'],
    ['insect', '昆虫'],
    ['inside', '内側に、内部'],
    ['insight', '洞察'],
    ['insist', '強く主張する'],
    ['inspire', '鼓舞する、ひらめきを与える'],
    ['instant', '即座の、瞬間'],
    ['institution', '制度、機関'],
    ['instruct', '指示する、教える'],
    ['insurance', '保険'],
    ['integrate', '統合する'],
    ['intelligence', '知能、知性'],
    ['intensive', '集中的な'],
    ['interfere', '干渉する、妨げる'],
    ['interrupt', '中断する'],
    ['intimate', '親密な'],
    ['intuition', '直感'],
    ['invade', '侵略する'],
    ['invent', '発明する'],
    ['invention', '発明'],
    ['investigate', '調査する'],
    ['investigator', '調査員'],
    ['investment', '投資'],
    ['invisible', '目に見えない'],
    ['irrelevant', '無関係な'],
    ['irrigation', '灌漑'],
    ['irritate', 'いら立たせる'],
    ['isolation', '孤立'],
    ['jealously', '嫉妬して'],
    ['justify', '正当化する'],
    ['keep up', '維持する、遅れない'],
    ['kindergarten', '幼稚園'],
    ['knee', 'ひざ'],
    ['laptop', 'ノートパソコン'],
    ['large amount of', '大量の'],
    ['lately', '最近'],
    ['latest', '最新の'],
    ['laundry', '洗濯、洗濯物'],
    ['lawyer', '弁護士'],
    ['layer', '層'],
    ['lazy', '怠けた'],
    ['leak', '漏れる、漏れ'],
    ['leap', '跳ぶ'],
    ['legal', '法律の、合法の'],
    ['leisurely', 'のんびりした'],
    ['lessen', '減らす'],
    ['liberty', '自由'],
    ['limb', '手足'],
    ['liquid', '液体'],
    ['literally', '文字どおりに'],
    ['litter', 'ごみを捨てる、ごみ'],
    ['live on', '〜で暮らす、食べて生きる'],
    ['load', '積み荷、積む'],
    ['location', '場所、位置'],
    ['log', '丸太、記録'],
    ['logic', '論理'],
    ['logical', '論理的な'],
    ['look forward to', '〜を楽しみに待つ'],
    ['look into', '調べる'],
    ['look over', 'ざっと目を通す'],
    ['look through', '目を通す、見抜く'],
    ['look up to', '尊敬する'],
    ['lord', '君主、主'],
    ['low-income', '低所得の'],
    ['lung', '肺'],
    ['magnificent', '壮大な、見事な'],
    ['major', '主要な、専攻'],
    ['make fun of', '〜をからかう'],
    ['make sense', '意味をなす'],
    ['make up', '作り上げる、仲直りする'],
    ['maker', '製造者'],
    ['mammal', '哺乳類'],
    ['manipulate', '操作する'],
    ['market', '市場'],
    ['massive', '巨大な'],
    ['master', '主人、習得する'],
    ['masterpiece', '傑作'],
    ['mature', '成熟した'],
    ['means', '手段'],
    ['medical', '医学の、医療の'],
    ['medieval', '中世の'],
    ['memory loss', '記憶喪失'],
    ['migrate', '移住する'],
    ['mildly', '穏やかに、軽く'],
    ['mindful', '注意して、意識して'],
    ['mineral', '鉱物'],
    ['minimum', '最小限'],
    ['ministry', '省、聖職'],
    ['minority', '少数派'],
    ['modest', '控えめな'],
    ['molecule', '分子'],
    ['motive', '動機'],
    ['mummy', 'ミイラ'],
    ['mutual', '相互の'],
    ['mystery', '謎'],
    ['myth', '神話'],
    ['nap', 'うたた寝する、昼寝'],
    ['navy', '海軍'],
    ['neat', 'きちんとした、すっきりした'],
    ['needlessly', '不必要に'],
    ['neglect', '無視する、怠る'],
    ['neighbor', '隣人'],
    ['nerve', '神経、度胸'],
    ['nervous', '緊張した、不安な'],
    ['newly', '新たに、最近'],
    ['no longer', 'もはや〜ない'],
    ['nod', 'うなずく'],
    ['numerous', '多数の'],
    ['nursery school', '保育園'],
    ['nutrition', '栄養'],
    ['obey', '従う'],
    ['objection', '反対、異議'],
    ['objectively', '客観的に'],
    ['obligation', '義務'],
    ['obscure', '不明瞭な、無名の'],
    ['observer', '観察者'],
    ['obsession', '取りつかれた考え、執着'],
    ['obstacle', '障害'],
    ['occasion', '場合、機会'],
    ['odd', '奇妙な、奇数の'],
    ['off duty', '勤務時間外で'],
    ['offensive', '攻撃的な、不快な'],
    ['on demand', '要求があれば、需要に応じて'],
    ['on duty', '勤務中で'],
    ['on schedule', '予定どおりに'],
    ['on the run', '逃亡中で'],
    ['once', '一度、かつて'],
    ['opposite', '反対の、向かい側'],
    ['optimistic', '楽観的な'],
    ['organ', '臓器、器官、オルガン'],
    ['organic', '有機の'],
    ['originate', '始まる、起こる'],
    ['out of breath', '息を切らして'],
    ['out of date', '時代遅れの'],
    ['out of place', '場違いの'],
    ['out of stock', '在庫切れで'],
    ['out of use', '使われていない'],
    ['output', '生産高、出力'],
    ['outstanding', '傑出した、未払いの'],
    ['overwhelm', '圧倒する'],
    ['overwhelming', '圧倒的な'],
    ['owe', '借りている、恩義がある'],
    ['oxygen', '酸素'],
    ['painful', '苦痛な、痛い'],
    ['parallel', '平行な'],
    ['parliament', '議会'],
    ['participant', '参加者'],
    ['participate', '参加する'],
    ['particle', '粒子'],
    ['partnership', '提携、共同関係'],
    ['party', '政党、会、当事者'],
    ['pass out', '気絶する、配る'],
    ['passive', '受け身の、消極的な'],
    ['pastime', '娯楽、気晴らし'],
    ['patience', '忍耐'],
    ['payment', '支払い'],
    ['peaceful', '平和な、穏やかな'],
    ['peacefully', '平和に、穏やかに'],
    ['peculiar', '奇妙な、独特の'],
    ['pedestrian', '歩行者'],
    ['peel', '皮をむく、皮'],
    ['penetrate', '貫く、浸透する'],
    ['perception', '認識、知覚'],
    ['permanent', '永久の'],
    ['permanently', '永久に'],
    ['persist in', '〜をやり続ける'],
    ['perspective', '見方、観点'],
    ['persuasion', '説得'],
    ['pile', '積み重ねる、山'],
    ['pioneer', '先駆者'],
    ['pit', '穴、くぼみ'],
    ['plain', '明白な、質素な'],
    ['plant', '植物、工場'],
    ['play a role in', '〜に役割を果たす'],
    ['plot', '筋書き、陰謀'],
    ['poison', '毒'],
    ['popularity', '人気'],
    ['portion', '部分、一人前'],
    ['pose', '提起する、姿勢'],
    ['positive', '前向きな、肯定的な'],
    ['postpone', '延期する'],
    ['practically', '実際には、ほとんど'],
    ['pray', '祈る'],
    ['precede', '先行する'],
    ['precious', '貴重な'],
    ['precise', '正確な'],
    ['precisely', '正確に、まさに'],
    ['predator', '捕食者'],
    ['preference', '好み、優先'],
    ['prejudice', '偏見'],
    ['preserved', '保存された'],
    ['prey', '獲物'],
    ['price', '価格'],
    ['principal', '主要な、校長'],
    ['privilege', '特権'],
    ['prize', '賞'],
    ['proceed', '進む、続ける'],
    ['product', '製品'],
    ['profession', '職業、専門職'],
    ['profound', '深い、重大な'],
    ['prohibit', '禁止する'],
    ['prolong', '長引かせる'],
    ['pronunciation', '発音'],
    ['properly', '適切に'],
    ['protein', 'たんぱく質'],
    ['protest', '抗議する、抗議'],
    ['protocol', '規約、儀礼'],
    ['provided that', '〜という条件で'],
    ['provoke', '引き起こす、怒らせる'],
    ['psychology', '心理学'],
    ['publicity', '宣伝、世間の注目'],
    ['publisher', '出版社、出版者'],
    ['pull down', '引き下ろす、取り壊す'],
    ['pull off', 'やり遂げる、引き離す'],
    ['punishment', '罰'],
    ['pupil', '生徒、瞳'],
    ['pursuit', '追求'],
    ['put away', '片づける、しまう'],
    ['put off', '延期する'],
    ['put together', '組み立てる'],
    ['put up with', '〜を我慢する'],
    ['quantity', '量'],
    ['quarrel', '口論する、口論'],
    ['racial', '人種の'],
    ['rating', '評価、格付け'],
    ['raw', '生の、未加工の'],
    ['ray', '光線'],
    ['react to', '〜に反応する'],
    ['rear', '後部、育てる'],
    ['reasonable', '妥当な、分別のある'],
    ['recognition', '認識、評価'],
    ['refer to', '〜を指す、参照する'],
    ['reference', '言及、参考'],
    ['refrain from', '〜を控える'],
    ['refuge', '避難所'],
    ['refund', '払い戻しする、払い戻し'],
    ['regardless', 'それにもかかわらず'],
    ['regime', '政権、体制'],
    ['regional', '地域の'],
    ['reinforce', '強化する'],
    ['relative', '親族、相対的な'],
    ['relatively', '比較的'],
    ['relevant to', '〜に関連した'],
    ['reliable', '信頼できる'],
    ['relief', '安心、救援'],
    ['relieve', '和らげる'],
    ['rely', '頼る'],
    ['remote', '遠く離れた'],
    ['renew', '更新する'],
    ['republic', '共和国'],
    ['researcher', '研究者'],
    ['reservation', '予約、留保'],
    ['resign', '辞職する'],
    ['resolve', '解決する、決意する'],
    ['restrain', '抑える'],
    ['result in', '〜という結果になる'],
    ['retail', '小売り'],
    ['retain', '保持する'],
    ['retrieve', '取り戻す'],
    ['reuse', '再利用する'],
    ['reveal', '明らかにする'],
    ['revenge', '復讐'],
    ['revise', '改訂する、見直す'],
    ['rid', '取り除く'],
    ['ridiculous', 'ばかげた'],
    ['ritual', '儀式'],
    ['roast', '焼く、焼いた'],
    ['rude', '失礼な'],
    ['rug', '敷物'],
    ['rule out', '除外する'],
    ['rumor', 'うわさ'],
    ['run away', '逃げる'],
    ['sacrifice', '犠牲、犠牲にする'],
    ['salty', '塩辛い'],
    ['sanitation', '衛生'],
    ['satisfactory', '満足のいく'],
    ['savage', '野蛮な'],
    ['scar', '傷跡'],
    ['scarce', '乏しい'],
    ['scatter', 'まき散らす'],
    ['scholar', '学者'],
    ['scholarship', '奨学金、学識'],
    ['scientist', '科学者'],
    ['seat', '席、座らせる'],
    ['secondhand', '中古の、又聞きの'],
    ['see in', '見送る、迎え入れる'],
    ['seed', '種'],
    ['select', '選ぶ、えり抜きの'],
    ['senate', '上院、元老院'],
    ['separation', '分離、別れ'],
    ['servant', '使用人'],
    ['settle down', '落ち着く、定住する'],
    ['sewage', '下水'],
    ['shame', '恥'],
    ['shed', '流す、脱ぎ捨てる'],
    ['shit', 'くそ、ひどいもの'],
    ['show up', '現れる'],
    ['shrink', '縮む'],
    ['similarity', '類似点'],
    ['sincere', '誠実な'],
    ['sincerely', '心から、敬具'],
    ['sit up', '起き上がる'],
    ['site', '場所、用地'],
    ['slavery', '奴隷制度'],
    ['smart', '賢い、しゃれた'],
    ['snap', 'ぽきっと折る、ぱちんと音'],
    ['sneeze', 'くしゃみをする'],
    ['soak', '浸す、ずぶぬれにする'],
    ['soar', '急上昇する、舞い上がる'],
    ['socially', '社会的に'],
    ['sole', '唯一の、足の裏'],
    ['sorrow', '悲しみ'],
    ['souvenir', 'みやげ'],
    ['sparkle', 'きらめく'],
    ['speaking of', '〜と言えば'],
    ['specialize in', '〜を専門にする'],
    ['species', '種、種類'],
    ['sphere', '球体、領域'],
    ['spiritual', '精神的な、宗教的な'],
    ['spiritually', '精神的に'],
    ['spoil', '台無しにする、甘やかす'],
    ['spouse', '配偶者'],
    ['spur', '拍車をかける、刺激する'],
    ['stand still', 'じっと立っている'],
    ['stand up', '立ち上がる'],
    ['stare at', '〜をじっと見つめる'],
    ['starve', '飢える'],
    ['stay up', '起きている'],
    ['steadily', '着実に'],
    ['steady', '安定した'],
    ['stem', '茎、幹'],
    ['stern', '厳格な'],
    ['stiff', '硬い、堅苦しい'],
    ['strengthen', '強化する'],
    ['stretch', '伸ばす、広がる'],
    ['strict', '厳しい'],
    ['struggle', 'もがく、奮闘する'],
    ['struggle with', '〜と格闘する'],
    ['stubborn', '頑固な'],
    ['subsequent', 'その後の'],
    ['substitute', '代わりのもの、代える'],
    ['subtle', '微妙な'],
    ['suburb', '郊外'],
    ['succeed', '成功する、継承する'],
    ['success', '成功'],
    ['sue', '訴える'],
    ['suggestion', '提案'],
    ['summon', '呼び出す'],
    ['supervisor', '監督者'],
    ['supplement', '補う、補足'],
    ['supporter', '支持者'],
    ['suppress', '抑える、鎮圧する'],
    ['supreme', '最高の'],
    ['sure', '確かな、もちろん'],
    ['survive', '生き残る'],
    ['suspend', '中断する、つるす'],
    ['suspicious', '疑わしい、怪しい'],
    ['swallow', '飲み込む'],
    ['sweep', '掃く'],
    ['take a for granted', 'Aを当然だと思う'],
    ['take care', '気をつける、世話をする'],
    ['take down', '取り外す、書き留める'],
    ['tale', '物語'],
    ['talent', '才能'],
    ['tame', '飼いならされた、飼いならす'],
    ['tap', '軽くたたく、蛇口'],
    ['technical', '技術の、専門的な'],
    ['telescope', '望遠鏡'],
    ['terribly', 'ひどく、とても'],
    ['thermometer', '温度計'],
    ['think over', 'よく考える'],
    ['thorough', '徹底的な'],
    ['though', '〜だけれども'],
    ['thrust', '押し込む、突き'],
    ['tide', '潮'],
    ['tidy', 'きちんとした、片づける'],
    ['tip', '先端、助言、チップ'],
    ['to start with', 'まず第一に'],
    ['toll', '通行料、被害数'],
    ['tough', 'たくましい、難しい'],
    ['tourism', '観光'],
    ['toxic', '有毒な'],
    ['traffic', '交通'],
    ['traffic jam', '交通渋滞'],
    ['tragedy', '悲劇'],
    ['trait', '特徴、特性'],
    ['transaction', '取引'],
    ['translation', '翻訳'],
    ['transport', '輸送する、輸送'],
    ['transportation', '輸送、交通機関'],
    ['treasure', '宝物'],
    ['tremble', '震える'],
    ['tremendous', 'とてつもない、すばらしい'],
    ['trivial', 'ささいな'],
    ['troop', '軍隊、部隊'],
    ['tropical', '熱帯の'],
    ['tuition', '授業料'],
    ['tumor', '腫瘍'],
    ['turn in', '提出する、寝る'],
    ['twin', '双子の一人'],
    ['twist', 'ねじる、ひねり'],
    ['ugly', '醜い'],
    ['ultimate', '究極の、最終の'],
    ['uncomfortable', '居心地の悪い、不快な'],
    ['under way', '進行中で'],
    ['undergo', '経験する、受ける'],
    ['undertake', '引き受ける'],
    ['unexpected', '予想外の'],
    ['unlikely', 'ありそうにない'],
    ['unpleasant', '不快な'],
    ['unusual', '普通でない'],
    ['unusually', '異常に'],
    ['urge', '強く促す、衝動'],
    ['use up', '使い果たす'],
    ['utilize', '利用する'],
    ['utter', '発する、まったくの'],
    ['vaccine', 'ワクチン'],
    ['vain', 'むだな、うぬぼれた'],
    ['vanish', '消える'],
    ['vending machine', '自動販売機'],
    ['verbal', '言葉の、口頭の'],
    ['vessel', '船、容器'],
    ['vice', '悪徳、副〜'],
    ['virtue', '美徳'],
    ['visually', '視覚的に'],
    ['vivid', '鮮やかな、生き生きした'],
    ['vocabulary', '語彙'],
    ['voluntarily', '自発的に'],
    ['vow', '誓う、誓い'],
    ['voyage', '航海'],
    ['wage', '賃金'],
    ['wait for', '〜を待つ'],
    ['wan', '青白い'],
    ['warm', '暖かい、暖める'],
    ['watch out', '気をつける'],
    ['weigh', '重さを量る'],
    ['welcome', '歓迎する、歓迎'],
    ['welfare', '福祉'],
    ['what is worse', 'さらに悪いことに'],
    ['whereas', '一方で、〜だが'],
    ['wherever', '〜するところならどこでも'],
    ['whistle', '口笛を吹く、笛'],
    ['willing', '進んでする気がある'],
    ['with luck', '運がよければ'],
    ['within reach', '手の届く範囲に'],
    ['withstand', '耐える'],
    ['worry', '心配する、心配'],
    ['worthy of', '〜に値する'],
    ['wrap', '包む'],
    ['wrong', '間違った、悪い'],
    ['yell', '叫ぶ']
]);

export const VOCAB_GRADE1 = Array.from(
    new Map(
        [...LEGACY_GRADE1_VOCAB, ...CUSTOM_VOCAB_GRADE1].map((entry) => [
            normalizeVocabKey(entry.word),
            entry
        ])
    ).values()
);

const GRADE2_MEANING_LOOKUP = new Map(
    [
        ...GRADE2_ADDITIONAL_MEANINGS.entries(),
        ...VOCAB_GRADE5,
        ...VOCAB_GRADE4,
        ...VOCAB_GRADE3,
        ...VOCAB_GRADE_PRE2,
        ...VOCAB_GRADE_PRE1,
        ...VOCAB_GRADE1,
        ...CUSTOM_VOCAB_GRADE2,
        ...LEGACY_GRADE2_VOCAB
    ].map((entry) => {
        if (Array.isArray(entry)) {
            const [word, meaning] = entry;
            return [normalizeVocabKey(word), meaning];
        }

        const { word, meaning } = entry;
        return [normalizeVocabKey(word), meaning];
    })
);

const GRADE2_CUSTOM_WORDS = CUSTOM_VOCAB_GRADE2.map(({ word }) => word);
const GRADE2_WORDS_WITH_CUSTOM = Array.from(
    new Set([
        ...GRADE2_WORD_LIST,
        ...GRADE2_CUSTOM_WORDS
    ].map((word) => normalizeText(word)).filter(Boolean))
);

// 既存データに意味がない語は、一覧を先に使えるよう暫定表示を入れる。
export const VOCAB_GRADE2 = GRADE2_WORDS_WITH_CUSTOM.map((word) => ({
    word,
    meaning: GRADE2_MEANING_LOOKUP.get(normalizeVocabKey(word)) || `${word}（意味未設定）`
}));

// ==============================
// レベル別ルックアップ
// ==============================
export const VOCAB_BY_LEVEL = {
    'grade5': VOCAB_GRADE5,
    'grade4': VOCAB_GRADE4,
    'grade3': VOCAB_GRADE3,
    'grade_pre2': VOCAB_GRADE_PRE2,
    'grade2': VOCAB_GRADE2,
    'grade_pre1': VOCAB_GRADE_PRE1,
    'grade1': VOCAB_GRADE1
};

/**
 * 指定レベルの単語プールを取得
 * @param {string} level - 'grade5' | 'grade4' | 'grade3' | 'grade_pre2' | 'grade2' | 'grade_pre1' | 'grade1'
 * @returns {Array} 単語配列
 */
export const getVocabByLevel = (level) => {
    return VOCAB_BY_LEVEL[level] || VOCAB_GRADE5;
};

/**
 * 全レベルの全単語を結合して返す（meaning選択肢の幅を広げるため）
 */
export const getAllVocab = () => {
    return [
        ...VOCAB_GRADE5,
        ...VOCAB_GRADE4,
        ...VOCAB_GRADE3,
        ...VOCAB_GRADE_PRE2,
        ...VOCAB_GRADE2,
        ...VOCAB_GRADE_PRE1,
        ...VOCAB_GRADE1
    ];
};
