/**
 * =================================================================
 * Study Musume - AIシーン生成スクリプト (ノア＋レン対応版 v4)
 * =================================================================
 * 変更点:
 * - text_ren カラムにレン（クール/男性口調）のセリフを同時生成
 * - 英語シートで穴埋め・並び替えクイズに対応 (intent: quiz_fill / quiz_order)
 * - 英語文法の解説をより分かりやすく（対比・パターン提示）
 * =================================================================
 */

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("AIノベル")
        .addItem("★シーンを一発作成(トピック指定)", "showGenerateSceneDialog")
        .addSeparator()
        .addItem("空欄をまとめて生成(既存行用)", "generateAllEmptyRowsBatch")
        .addItem("新しい行を追加", "appendNewRows")
        .addItem("メタデータを埋める", "fillMetadataColumns")
        .addToUi();
}

function showGenerateSceneDialog() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.prompt(
        "シーン一括生成",
        "トピックと行数をカンマ区切りで入力してください。\n例: ドップラー効果, 15",
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() !== ui.Button.OK) return;

    const text = result.getResponseText();
    const parts = text.split(",").map(s => s.trim());
    const topic = parts[0];
    const count = parts.length > 1 ? parseInt(parts[1]) : 12;

    if (!topic) {
        Browser.msgBox("トピックを入力してください。");
        return;
    }
    generateSceneFromScratch(topic, count);
}

/**
 * =================================================================
 * シーン生成メインロジック
 * =================================================================
 */
function generateSceneFromScratch(topic, lineCount) {
    const sheet = SpreadsheetApp.getActiveSheet();
    const sheetName = sheet.getName();
    const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");

    if (!apiKey) {
        Browser.msgBox("エラー: スクリプトプロパティに GEMINI_API_KEY を設定してください。");
        return;
    }

    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => h.toString().toLowerCase().trim());
    const colMap = {};
    headers.forEach((h, i) => { if (h) colMap[h] = i; });

    const lastRow = sheet.getLastRow();
    let startId = 1;
    if (lastRow >= 2 && colMap["id"] !== undefined) {
        const lastIdVal = sheet.getRange(lastRow, colMap["id"] + 1).getValue();
        if (!isNaN(parseInt(lastIdVal))) startId = parseInt(lastIdVal) + 1;
    }

    let modelName = "models/gemini-2.0-flash";
    try {
        const listRes = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listJson = JSON.parse(listRes.getContentText());
        const targetModel = listJson.models.find(m => m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent"));
        if (targetModel) modelName = targetModel.name;
    } catch (e) { console.warn("モデル検出失敗"); }

    const subjectInstructions = getSubjectInstructions(sheetName);

    const promptText = `
あなたは世界一教え方が上手いティーチング・ライターです。
現在のシートは「${sheetName}」教科です。

【テーマ】: ${topic} について、約 ${lineCount} 行の学習シナリオを生成してください。

【キャラクター設定】
■ ノア（唯一の登場キャラ）
  - 天才少女。授業中は「真剣な先生モード」で、論理的・丁寧に教える。
  - ツンデレ要素は控えめに。授業の説明中はほぼ出さない。
  - ツンデレが出るのは以下の場面のみ：
    ① クイズの正解/不正解リアクション（win_text / lose_text）
    ② 授業の最初と最後の一言
    ③ 特に驚いた・感心した瞬間
  - 授業中の口調（メイン）：
    「この現象にはちゃんと理由があるの。順番に説明するわ。」
    「ここ、重要よ。しっかり聞いて。」
    「例えばこう考えてみて。〜〜〜。わかった？」
    「この公式、丸暗記じゃなくて意味を理解して。」
  - ツンデレリアクション例（クイズ時のみ）：
    「ふーん、意外とわかってるじゃない。」（正解）
    「はぁ？もう一回よく考えなさい。」（不正解）
  - speaker名: "ノア" のみ使用

※ speaker は "ノア" または "Quiz" のみ。
※ プレイヤーを「あんた」と呼ぶ。

【教育方針】
1. 難しい用語を避け、「身近な例え話（食べ物、乗り物、ゲームなど）」で解説。
2. 「〜って知ってる？」「ここ重要よ」等でプレイヤーに語りかける。
3. 必ず2〜3問のクイズ（speaker: "Quiz"）を含める。
4. クイズ前にノアが「じゃあ確認テストよ！」と予告すること。
5. クイズ後に結果に応じたリアクション（win_text/lose_text）をすること。
   ※ win_text/lose_textは「どちらのキャラが言っても違和感のない無難なセリフ」にすること。
   ※ ツンデレ要素は入れない。シンプルに「正解/不正解の確認＋補足解説」のみ。
   例 win_text: 「正解。ちゃんと理解できてるわね。」
   例 lose_text: 「惜しいわ。ポイントは〜〜〜よ。もう一度確認して。」

${subjectInstructions}

【演出指示】
- background: 理科・実験系なら "bg_lab"、それ以外は空欄（教室がデフォルト）
- se: 正解時や褒める場面では "se_correct"
- effect: 衝撃的な事実や驚きの場面では "shake"
- voice: 基本は空欄

【JSON出力仕様】
- speaker: "ノア" | "Quiz"  ※この2つのみ
- text: ノアのセリフ（授業中は真剣モード。ツンデレは控えめに）
- emotion: "happy" | "normal" | "angry" | "serious" | "smile"
- background: 背景ID（必要な時だけ）
- se: 効果音（必要な時だけ）
- effect: エフェクト（必要な時だけ）
- voice: 空欄
- graph: 数式グラフ（数学で必要な時だけ。例: "x^2"）
- intent: クイズなら "quiz"、穴埋めなら "quiz_fill"、並び替えなら "quiz_order"、それ以外は空欄
- option1, option2, option3: クイズの選択肢（Quizの時のみ）
- answer: 正解番号 1〜3（Quizの時のみ）
- win_text: 正解時のセリフ（Quizの時のみ。ノア・レン共用。ツンデレ不要。シンプルに正解確認＋一言）
- lose_text: 不正解時の補足解説（Quizの時のみ。ノア・レン共用。ツンデレ不要。なぜ間違いか＋正解の解説）

出力はJSON配列のみ。Markdownは不要です。
`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: "application/json" }
        };

        const response = UrlFetchApp.fetch(url, {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        const resJson = JSON.parse(response.getContentText());
        if (resJson.error) throw new Error(resJson.error.message);

        const contentText = resJson.candidates[0].content.parts[0].text;
        const jsonMatch = contentText.match(/\[[\s\S]*\]/);
        const generatedData = JSON.parse(jsonMatch ? jsonMatch[0] : contentText);

        const newRows = generatedData.map((item, index) => {
            const row = new Array(lastCol).fill("");

            if (colMap["id"] !== undefined) row[colMap["id"]] = startId + index;
            if (colMap["scene"] !== undefined) row[colMap["scene"]] = topic;
            if (colMap["speaker"] !== undefined) row[colMap["speaker"]] = item.speaker || "";
            if (colMap["text"] !== undefined) row[colMap["text"]] = item.text || "";
            if (colMap["emotion"] !== undefined) row[colMap["emotion"]] = item.emotion || "normal";
            if (colMap["background"] !== undefined) row[colMap["background"]] = item.background || "";
            if (colMap["se"] !== undefined) row[colMap["se"]] = item.se || "";
            if (colMap["effect"] !== undefined) row[colMap["effect"]] = item.effect || "";
            if (colMap["voice"] !== undefined) row[colMap["voice"]] = item.voice || "";
            if (colMap["pose"] !== undefined) row[colMap["pose"]] = item.pose || "";
            if (colMap["image"] !== undefined) row[colMap["image"]] = item.image || "";
            if (colMap["graph"] !== undefined) row[colMap["graph"]] = item.graph || "";
            if (colMap["intent"] !== undefined) row[colMap["intent"]] = item.intent || "";
            if (colMap["option1"] !== undefined) row[colMap["option1"]] = item.option1 || "";
            if (colMap["option2"] !== undefined) row[colMap["option2"]] = item.option2 || "";
            if (colMap["option3"] !== undefined) row[colMap["option3"]] = item.option3 || "";
            if (colMap["answer"] !== undefined) row[colMap["answer"]] = item.answer || "";
            if (colMap["win_text"] !== undefined) row[colMap["win_text"]] = item.win_text || "";
            if (colMap["lose_text"] !== undefined) row[colMap["lose_text"]] = item.lose_text || "";

            if (colMap["next_id"] !== undefined) {
                row[colMap["next_id"]] = (index === generatedData.length - 1) ? "end" : startId + index + 1;
            }

            return row;
        });

        if (newRows.length > 0) {
            sheet.getRange(lastRow + 1, 1, newRows.length, lastCol).setValues(newRows);
            Browser.msgBox(`✅ ${topic} のシーンを ${newRows.length} 行生成しました！\n（教科: ${sheetName}）`);
        }
    } catch (e) {
        Browser.msgBox("エラーが発生しました: " + e.message);
    }
}

/**
 * =================================================================
 * 教科別の追加指示
 * =================================================================
 */
function getSubjectInstructions(sheetName) {
    const instructions = {
        "数学": `
【数学特有の指示】
- 数式がある場合は graph に JavaScript形式で入れる（例: "x^2", "sin(x)"）
- 計算過程をステップで説明すること
- 公式は「なぜそうなるか」の理由も添えること`,

        "英語": `
【英語特有の指示】
■ 解説方法
- 文法ルールは「型（パターン）」で提示すること
  例: 「S + V + O」「主語 + be動詞 + 形容詞」
- 正しい例文と間違い例文を対比して見せること
  例: ✅ She goes to school. / ❌ She go to school.
- 英文には必ず日本語訳を添えること
- 日本語との語順の違いを明示すること
  例: 「日本語は『私は学校に行く』だけど、英語は『I go to school』で語順が違うわ」
- 文法用語は最小限に。「三単現のs」より「主語がhe/she/itの時のs」と説明する

■ クイズ方式（英語は以下の3種類を使い分けること）
1. 通常3択 (intent: "quiz")
   - 文法知識を問う問題
   - 例: 「次のうち正しい文はどれ？」

2. 穴埋め問題 (intent: "quiz_fill")
   - 文中の空欄に入る語を選ぶ
   - text に「She ___ to school every day.」形式で出題
   - 選択肢は単語または短いフレーズ
   - 例: option1: "go", option2: "goes", option3: "going"

3. 並び替え問題 (intent: "quiz_order")
   - バラバラの単語を正しい順に並べる
   - text に「[ like / I / cats ] を並び替えて」形式で出題
   - 選択肢は完成した文章
   - 例: option1: "I like cats", option2: "cats I like", option3: "like cats I"

※ 3種類のクイズをバランスよく使うこと（各1問以上）`,

        "国語": `
【国語特有の指示】
- 古文の場合は現代語訳を必ず添えること
- 文法問題では品詞の識別を重視すること
- 読解問題では根拠を示す習慣をつけさせること`,

        "理科": `
【理科特有の指示】
- 実験や観察の話題では background を "bg_lab" にすること
- 物理で数式があれば graph に入れる（例: "9.8*x"）
- 現象の「なぜ？」を重視すること`,

        "社会": `
【社会特有の指示】
- 年号や人名は覚えやすいゴロ合わせを添えること
- 因果関係（なぜ起きたか）を重視すること
- 地理は地域の特徴を具体的に説明すること`
    };

    return instructions[sheetName] || "";
}
