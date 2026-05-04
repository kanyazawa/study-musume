const normalizeStepConfig = (config, fallbackEmotion = 'normal') => {
    if (typeof config === 'string') {
        return { emotion: config };
    }

    if (config && typeof config === 'object') {
        return {
            emotion: config.emotion || fallbackEmotion,
            expression: config.expression || '',
            effect: config.effect || '',
            tts: config.tts || '',
            tts_speaker: config.tts_speaker || '',
            voice: config.voice || '',
            se: config.se || '',
        };
    }

    return { emotion: fallbackEmotion };
};

const talk = (text, config = 'normal') => {
    const meta = normalizeStepConfig(config);

    return {
    kind: 'talk',
    speaker: 'ノア',
    text,
    emotion: meta.emotion,
    expression: meta.expression,
    effect: meta.effect,
    tts: meta.tts,
    tts_speaker: meta.tts_speaker,
    voice: meta.voice,
    se: meta.se,
};
};

const quiz = ({
    kind = 'choice',
    text,
    options,
    answer,
    explanation,
    emotion = 'normal',
    expression = '',
    effect = '',
    tts = '',
    tts_speaker = '',
    voice = '',
    se = '',
}) => ({
    kind,
    speaker: 'Quiz',
    text,
    emotion,
    expression,
    effect,
    options,
    answer: String(answer),
    explanation,
    tts,
    tts_speaker,
    voice,
    se,
});

const reorder = ({
    text,
    answer,
    explanation,
    emotion = 'normal',
    expression = '',
    effect = '',
    tts = '',
    tts_speaker = '',
    voice = '',
    se = '',
    tokens,
}) => ({
    kind: 'reorder',
    speaker: 'Quiz',
    text,
    emotion,
    expression,
    effect,
    answer_text: answer,
    tokens: Array.isArray(tokens)
        ? tokens
        : String(answer || '').trim().split(/\s+/).filter(Boolean),
    explanation,
    tts,
    tts_speaker,
    voice,
    se,
});

const cloneStep = (step, role) => ({
    ...step,
    _lessonRole: role,
});

const applyRolePresentationDefaults = (step, stepIndex, totalSteps) => {
    const role = step?._lessonRole || '';
    const hasExpression = Boolean(String(step?.expression || '').trim());
    const hasEffect = Boolean(String(step?.effect || '').trim());

    let nextExpression = step?.expression || '';
    let nextEffect = step?.effect || '';

    if (!hasExpression) {
        if (role === 'explain') {
            nextExpression = 'serious';
        } else if (role === 'example') {
            nextExpression = 'smile';
        } else if (role === 'intro') {
            nextExpression = stepIndex === 0 ? 'happy' : 'normal';
        } else if (role === 'reorderIntro') {
            nextExpression = 'happy';
        } else if (role === 'summary') {
            nextExpression = stepIndex === totalSteps - 1 ? 'smile' : 'happy';
        } else if (step?.kind === 'talk') {
            nextExpression = step?.emotion || 'normal';
        } else if (step?.kind === 'reorder') {
            nextExpression = 'serious';
        } else {
            nextExpression = step?.emotion || 'normal';
        }
    }

    if (!hasEffect) {
        if (role === 'intro' && stepIndex === 0) {
            nextEffect = 'glow';
        } else if (role === 'summary' && stepIndex >= totalSteps - 2) {
            nextEffect = 'glow';
        }
    }

    return {
        ...step,
        expression: nextExpression,
        effect: nextEffect,
    };
};

const buildLessonRows = (spec) => {
    const steps = [];

    if (Array.isArray(spec.intro)) {
        steps.push(...spec.intro.map((step) => cloneStep(step, 'intro')));
    }

    if (Array.isArray(spec.blocks)) {
        spec.blocks.forEach((block) => {
            steps.push(cloneStep(block.explain, 'explain'));
            steps.push(cloneStep(block.example, 'example'));
            steps.push(cloneStep(block.quiz, 'quiz'));
        });
    }

    if (spec.reorderIntro) {
        steps.push(cloneStep(spec.reorderIntro, 'reorderIntro'));
    }

    if (Array.isArray(spec.reorders)) {
        steps.push(...spec.reorders.map((step) => cloneStep(step, 'reorder')));
    }

    if (Array.isArray(spec.summary)) {
        steps.push(...spec.summary.map((step) => cloneStep(step, 'summary')));
    }

    return steps.map((rawStep, index) => {
        const step = applyRolePresentationDefaults(rawStep, index, steps.length);
        const next = index === steps.length - 1 ? 'end' : String(index + 2);
        const baseRow = {
            scene: spec.topic,
            order: String(index + 1),
            background: 'bg_classroom',
            next,
            kind: step.kind,
            speaker: step.speaker,
            text: step.text,
            emotion: step.emotion,
            expression: step.expression || '',
            effect: step.effect || '',
            tts: step.tts || '',
            tts_speaker: step.tts_speaker || '',
            voice: step.voice || '',
            se: step.se || '',
        };

        if (step.kind === 'reorder') {
            return {
                ...baseRow,
                answer_text: step.answer_text,
                tokens: step.tokens,
                explanation: step.explanation,
            };
        }

        if (step.kind !== 'talk') {
            return {
                ...baseRow,
                option1: step.options?.[0] || '',
                option2: step.options?.[1] || '',
                option3: step.options?.[2] || '',
                answer: step.answer,
                explanation: step.explanation,
            };
        }

        return baseRow;
    });
};

const LESSON_SPECS = [
    {
        topic: '0.1 文の要素と品詞',
        intro: [
            talk('今日は文の要素と品詞をやるよ。英語の文を読む土台になるところだね。', 'happy'),
            talk('まずは文の中で何が主語で、何が動詞かを見つけられるようにしよう。'),
        ],
        blocks: [
            {
                explain: talk('文の要素では、主語は「だれが・なにが」、動詞は「どうする」を表すよ。', 'explain'),
                example: talk('Birds sing in the tree. なら、Birds が主語で sing が動詞だね。'),
                quiz: quiz({
                    text: 'Birds sing in the tree. の動詞はどれかな？',
                    options: ['Birds', 'sing', 'tree'],
                    answer: 2,
                    explanation: 'sing が「歌う」という動きを表す動詞だよ。',
                }),
            },
            {
                explain: talk('品詞は単語の役割だよ。名詞、動詞、形容詞、副詞をまず押さえよう。', 'explain'),
                example: talk('a beautiful flower では、flower が名詞で beautiful が形容詞だよ。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'a ___ flower の空欄に入りやすい品詞はどれかな？',
                    options: ['形容詞', '動詞', '副詞'],
                    answer: 1,
                    explanation: '名詞 flower を説明しているので、形容詞が入るよ。',
                }),
            },
        ],
        reorderIntro: talk('ここからは短い文を並び替えて、主語と動詞を意識してみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私の弟はサッカーをします」を英語に並び替えよう。',
                answer: 'My brother plays soccer.',
                explanation: 'My brother が主語、plays が動詞だよ。',
            }),
            reorder({
                text: '「その花はとてもきれいです」を英語に並び替えよう。',
                answer: 'The flower is very beautiful.',
                explanation: 'flower が名詞で、beautiful がその説明をしているよ。',
            }),
        ],
        summary: [
            talk('主語と動詞を見つけること、それから単語の役割を考えることが文法の入口だよ。', 'happy'),
            talk('迷ったら「この単語は何の役目をしているかな？」って考えてみてね。', 'smile'),
        ],
    },
    {
        topic: '0.2 5文型',
        intro: [
            talk('今日は5文型だよ。英語の文がどういう骨組みでできているかを見る考え方だね。', 'happy'),
            talk('SV、SVC、SVO、SVOO、SVOC の順にざっくりつかもう。'),
        ],
        blocks: [
            {
                explain: talk('SV は「主語 + 動詞」だけの形、SVO は「主語 + 動詞 + 目的語」まである形だよ。', 'explain'),
                example: talk('She runs. は SV、She reads books. は SVO だね。'),
                quiz: quiz({
                    text: 'She reads books. はどの文型かな？',
                    options: ['SV', 'SVO', 'SVC'],
                    answer: 2,
                    explanation: 'reads のあとに目的語 books があるので SVO だよ。',
                }),
            },
            {
                explain: talk('SVC は補語が主語を説明して、SVOO は目的語が2つある形だよ。', 'explain'),
                example: talk('He is kind. は SVC、My father gave me a bike. は SVOO になるよ。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: 'My father gave me a bike. の文型として正しいのはどれかな？',
                    options: ['SVC', 'SVOO', 'SVOC'],
                    answer: 2,
                    explanation: 'me と a bike の2つの目的語があるので SVOO だよ。',
                }),
            },
        ],
        reorderIntro: talk('文型は骨組みを見るのがポイントだよ。並び替えでも意識してみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「彼は親切です」を英語に並び替えよう。',
                answer: 'He is kind.',
                explanation: 'kind は主語 He を説明する補語なので SVC だよ。',
            }),
            reorder({
                text: '「母は私に昼食を作ってくれた」を英語に並び替えよう。',
                answer: 'My mother made me lunch.',
                explanation: 'me と lunch の2つの目的語がある形だよ。',
            }),
        ],
        summary: [
            talk('5文型は訳すためよりも、文の骨組みを見抜くために使うと便利だよ。', 'happy'),
            talk('動詞のあとに何が必要かを見る癖をつけると、かなり読みやすくなるよ。', 'smile'),
        ],
    },
    {
        topic: '1.1 名詞と冠詞',
        intro: [
            talk('今日は名詞と冠詞をやるよ。a、an、the の使い分けで迷いやすいところだね。', 'happy'),
            talk('まずは数えられる名詞かどうかを意識すると整理しやすいよ。'),
        ],
        blocks: [
            {
                explain: talk('countable noun は数えられる名詞で、1つなら a や an をつけることが多いよ。', 'explain'),
                example: talk('I bought a book. では、book は数えられる名詞だから a がついているね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'I bought ___ book. の空欄に入るのはどれかな？',
                    options: ['a', 'an', 'the'],
                    answer: 1,
                    explanation: 'book は数えられる名詞で、ここでは初めて出る1冊なので a が自然だよ。',
                }),
            },
            {
                explain: talk('the は「その」と分かるものにつけるよ。すでに話題に出た名詞にもよく使うんだ。', 'explain'),
                example: talk('I saw a dog. The dog was cute. の the dog は、さっき出た犬のことだね。'),
                quiz: quiz({
                    text: 'I saw a dog. ___ dog was cute. の空欄に入るのはどれかな？',
                    options: ['A', 'The', 'An'],
                    answer: 2,
                    explanation: '2回目に出る同じ犬なので the を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('冠詞は小さいけれど意味に関わるよ。並び替えで形を確認しよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は公園で犬を見ました」を英語に並び替えよう。',
                answer: 'I saw a dog in the park.',
                explanation: '初めて出る犬なので a dog だよ。',
            }),
            reorder({
                text: '「その犬はとても大きかった」を英語に並び替えよう。',
                answer: 'The dog was very big.',
                explanation: '前に出た犬を指しているので the dog になるよ。',
            }),
        ],
        summary: [
            talk('a/an は初めて出る1つのもの、the は話し手も聞き手も分かるもの、という感覚を大事にしよう。', 'happy'),
            talk('名詞を見るときは、数えられるかどうかも一緒に考えると安定するよ。', 'smile'),
        ],
    },
    {
        topic: '1.2 代名詞',
        intro: [
            talk('今日は代名詞だよ。名詞の代わりに使う語で、主語なのか目的語なのかで形が変わるんだ。', 'happy'),
            talk('I と me、she と her みたいな組み合わせを見ていこう。'),
        ],
        blocks: [
            {
                explain: talk('主語になる形は I、you、he、she、they みたいな形だよ。', 'explain'),
                example: talk('She plays tennis. では、She が主語として使われているね。'),
                quiz: quiz({
                    text: '次のうち、主語にしやすい形はどれかな？',
                    options: ['her', 'she', 'him'],
                    answer: 2,
                    explanation: 'she は主語の形、her と him は目的語の形だよ。',
                }),
            },
            {
                explain: talk('目的語になる形は me、him、her、us みたいな形だよ。前置詞のあとにもよく来るんだ。', 'explain'),
                example: talk('My teacher helped me. では、me は helped の目的語だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'My teacher helped ___. の空欄に入るのはどれかな？',
                    options: ['I', 'my', 'me'],
                    answer: 3,
                    explanation: 'helped の目的語なので me を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('代名詞は位置で形が変わるよ。並び替えで確認しよう。', 'happy'),
        reorders: [
            reorder({
                text: '「彼女は私を知っています」を英語に並び替えよう。',
                answer: 'She knows me.',
                explanation: 'She は主語、me は目的語の形だよ。',
            }),
            reorder({
                text: '「私たちは彼を手伝いました」を英語に並び替えよう。',
                answer: 'We helped him.',
                explanation: 'him は helped の目的語になっているよ。',
            }),
        ],
        summary: [
            talk('代名詞は「文のどこに置かれているか」で形を選ぶのがコツだよ。', 'happy'),
            talk('主語なら主格、目的語なら目的格、という形で見分けていこう。', 'smile'),
        ],
    },
    {
        topic: '2.1 基本の時制',
        intro: [
            talk('今日は基本の時制だよ。現在、過去、未来の3つをまずはしっかり押さえよう。', 'happy'),
            talk('動詞の形が変わるだけで、いつの話かが分かるようになるんだ。'),
        ],
        blocks: [
            {
                explain: talk('現在形は習慣や事実を表すことが多いよ。毎日のことや普段のことと相性がいいんだ。', 'explain'),
                example: talk('I play tennis every Sunday. は、毎週する習慣を表しているね。'),
                quiz: quiz({
                    text: 'I play tennis every Sunday. の時制はどれかな？',
                    options: ['現在形', '過去形', '未来形'],
                    answer: 1,
                    explanation: 'every Sunday があるので、習慣を表す現在形だよ。',
                }),
            },
            {
                explain: talk('過去形は終わったこと、未来表現 will はこれからのことを表すよ。', 'explain'),
                example: talk('I visited Kyoto last year. と I will visit Kyoto next year. を比べると分かりやすいね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'I ___ visit Kyoto next year. の空欄に入るのはどれかな？',
                    options: ['will', 'did', 'was'],
                    answer: 1,
                    explanation: 'next year は未来なので will を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('時制は時間語と一緒に見ると分かりやすいよ。並び替えで確認しよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は昨日その映画を見ました」を英語に並び替えよう。',
                answer: 'I watched the movie yesterday.',
                explanation: 'yesterday があるので watched と過去形になるよ。',
            }),
            reorder({
                text: '「私は明日彼に電話するつもりです」を英語に並び替えよう。',
                answer: 'I will call him tomorrow.',
                explanation: 'tomorrow があるので will call と未来を表すよ。',
            }),
        ],
        summary: [
            talk('現在は習慣や事実、過去は終わったこと、未来はこれからのことだったね。', 'happy'),
            talk('時間を表す語と動詞の形をセットで見ると、時制はかなり安定するよ。', 'smile'),
        ],
    },
    {
        topic: '2.2 進行形',
        intro: [
            talk('今日は進行形だよ。be動詞 + 動詞ing の形で、「今しているところ」を表すことが多いんだ。', 'happy'),
            talk('普通の現在形との違いも一緒に見ていこう。'),
        ],
        blocks: [
            {
                explain: talk('進行形は、その瞬間に進んでいる動作を表すときによく使うよ。', 'explain'),
                example: talk('She is studying now. なら、「彼女は今勉強しているところ」だね。'),
                quiz: quiz({
                    text: 'She is studying now. に近い意味はどれかな？',
                    options: ['彼女はふだん勉強する', '彼女は今勉強している', '彼女は昨日勉強した'],
                    answer: 2,
                    explanation: 'is studying now なので、今進んでいる動作を表しているよ。',
                }),
            },
            {
                explain: talk('進行形は近い未来の予定を表すこともあるよ。特に go や meet みたいな動詞でよく使うんだ。', 'explain'),
                example: talk('I am meeting Tom tomorrow. は、「私は明日トムに会う予定です」という意味になるよ。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: '次の文の形として自然なのはどれかな？ I am meeting Tom tomorrow.',
                    options: ['近い未来の予定を表せる', '絶対に過去の意味になる', '文としてまちがい'],
                    answer: 1,
                    explanation: '進行形は近い未来の予定にも使えるよ。',
                }),
            },
        ],
        reorderIntro: talk('be動詞と ing の組み合わせを崩さないように並び替えてみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「彼らは今サッカーをしています」を英語に並び替えよう。',
                answer: 'They are playing soccer now.',
                explanation: 'are + playing で進行形になるよ。',
            }),
            reorder({
                text: '「私は明日彼女に会う予定です」を英語に並び替えよう。',
                answer: 'I am seeing her tomorrow.',
                explanation: '進行形で近い未来の予定を表しているよ。',
            }),
        ],
        summary: [
            talk('進行形は「今していること」が中心だけど、近い未来の予定にも使えるんだったね。', 'happy'),
            talk('be動詞を忘れずに、動詞を ing 形にするところをまず固めよう。', 'smile'),
        ],
    },
    {
        topic: '2.3 完了形',
        intro: [
            talk('今日は完了形だよ。have + 過去分詞の形で、経験・継続・完了を表せるんだ。', 'happy'),
            talk('日本語にぴったり1つで訳しにくいけれど、時間のつながりを見ると分かりやすいよ。'),
        ],
        blocks: [
            {
                explain: talk('経験の完了形は、「〜したことがある」という意味で使うよ。', 'explain'),
                example: talk('I have visited Kyoto twice. なら、「私は京都に2回行ったことがある」だね。'),
                quiz: quiz({
                    text: 'I have visited Kyoto twice. に近い意味はどれかな？',
                    options: ['今京都にいる', '京都に行ったことがある', '昨日京都に行った'],
                    answer: 2,
                    explanation: 'twice があるので、経験としての完了形だよ。',
                }),
            },
            {
                explain: talk('継続の完了形は、「ずっと〜している」という意味になることが多いよ。for や since と一緒に出やすいんだ。', 'explain'),
                example: talk('She has lived here for ten years. は、「彼女は10年間ここに住んでいる」になるよ。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'She has lived here ___ ten years. の空欄に入るのはどれかな？',
                    options: ['for', 'ago', 'during'],
                    answer: 1,
                    explanation: '期間を表すので for を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('have と過去分詞のセットを意識して並び替えてみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私はその本を3回読んだことがあります」を英語に並び替えよう。',
                answer: 'I have read the book three times.',
                explanation: '経験を表す完了形だよ。',
            }),
            reorder({
                text: '「彼は5年間ここで働いています」を英語に並び替えよう。',
                answer: 'He has worked here for five years.',
                explanation: 'for five years があるので継続の完了形だよ。',
            }),
        ],
        summary: [
            talk('完了形は「過去から今までのつながり」を意識すると読みやすいよ。', 'happy'),
            talk('experience、continuation、completion のどれに近いかを考えてみてね。', 'smile'),
        ],
    },
    {
        topic: '3.1 基本助動詞',
        intro: [
            talk('今日は基本助動詞だよ。can、must、may、should みたいに、意味を少し足す言葉だね。', 'happy'),
            talk('助動詞のあとには動詞の原形が来る、という形も一緒に覚えよう。'),
        ],
        blocks: [
            {
                explain: talk('can は「できる」、must は「しなければならない」を表すことが多いよ。', 'explain'),
                example: talk('I can swim. と You must study. を比べると役割の違いが見やすいね。'),
                quiz: quiz({
                    text: 'You must study. に近い意味はどれかな？',
                    options: ['勉強してもいい', '勉強できる', '勉強しなければならない'],
                    answer: 3,
                    explanation: 'must は強い必要を表すことが多いよ。',
                }),
            },
            {
                explain: talk('should は「〜したほうがいい」、may は「〜してもよい・〜かもしれない」と使うよ。', 'explain'),
                example: talk('You should go to bed early. は「早く寝たほうがいい」になるね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'You ___ go to bed early. の空欄に入るのはどれかな？',
                    options: ['should', 'must not', 'can not'],
                    answer: 1,
                    explanation: '助言なので should が合うよ。',
                }),
            },
        ],
        reorderIntro: talk('助動詞のあとに原形が来るところを崩さずに並び替えよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私はピアノを弾くことができます」を英語に並び替えよう。',
                answer: 'I can play the piano.',
                explanation: 'can のあとには play と原形が来るよ。',
            }),
            reorder({
                text: '「あなたはもっと注意すべきです」を英語に並び替えよう。',
                answer: 'You should be more careful.',
                explanation: 'should のあとに be が原形で続いているよ。',
            }),
        ],
        summary: [
            talk('助動詞は意味を足す言葉で、そのあとには動詞の原形が来るんだったね。', 'happy'),
            talk('意味だけでなく、形のセットでも覚えていこう。', 'smile'),
        ],
    },
    {
        topic: '3.2 推量と過去',
        intro: [
            talk('今日は助動詞の推量と過去だよ。must have + 過去分詞 や should have + 過去分詞 がよく出るね。', 'happy'),
            talk('「今のこと」ではなく、「過去のことを今どう考えるか」がポイントだよ。'),
        ],
        blocks: [
            {
                explain: talk('must have + 過去分詞 は、「〜したにちがいない」と過去を強く推量するときに使うよ。', 'explain'),
                example: talk('He must have been tired. は、「彼は疲れていたにちがいない」だね。'),
                quiz: quiz({
                    text: 'He must have been tired. に近い意味はどれかな？',
                    options: ['彼は疲れている', '彼は疲れていたにちがいない', '彼は疲れてはいけない'],
                    answer: 2,
                    explanation: 'must have + p.p. は過去についての強い推量だよ。',
                }),
            },
            {
                explain: talk('should have + 過去分詞 は、「〜すべきだった」と過去への後悔や反省を表すことが多いよ。', 'explain'),
                example: talk('I should have studied harder. は、「もっと勉強すべきだった」になるよ。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: 'I should have studied harder. の意味として正しいのはどれかな？',
                    options: ['これから勉強する予定だ', 'もっと勉強すべきだった', '勉強してもよい'],
                    answer: 2,
                    explanation: 'should have + p.p. は過去への後悔を表しているよ。',
                }),
            },
        ],
        reorderIntro: talk('have + 過去分詞まで含めて1セットで見てみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「彼女はその知らせを聞いたにちがいない」を英語に並び替えよう。',
                answer: 'She must have heard the news.',
                explanation: 'must have heard で過去への強い推量だよ。',
            }),
            reorder({
                text: '「私はもっと早く出発すべきだった」を英語に並び替えよう。',
                answer: 'I should have left earlier.',
                explanation: 'should have left で「出発すべきだった」になるよ。',
            }),
        ],
        summary: [
            talk('推量や後悔の助動詞は、過去の出来事を今どう見るかを表していたね。', 'happy'),
            talk('助動詞 + have + 過去分詞の形をひとかたまりで覚えよう。', 'smile'),
        ],
    },
    {
        topic: '4.1 基本の受動態',
        intro: [
            talk('今日は受動態だよ。be動詞 + 過去分詞で、「〜される」という受け身を表すんだ。', 'happy'),
            talk('動作をする人より、される側を主語にしたいときに使うよ。'),
        ],
        blocks: [
            {
                explain: talk('能動態の The boy broke the window. を受動態にすると、The window was broken. みたいになるよ。', 'explain'),
                example: talk('The window was broken by the boy. では、窓が主語になっているね。'),
                quiz: quiz({
                    text: 'The window was broken by the boy. に近い意味はどれかな？',
                    options: ['少年が窓を割った', '窓が少年を割った', '少年が窓を直した'],
                    answer: 1,
                    explanation: '受動態でも意味は「少年が窓を割った」だよ。',
                }),
            },
            {
                explain: talk('受動態でも時制は変えられるよ。is cleaned、was cleaned、will be cleaned みたいに be 動詞の部分が変わるんだ。', 'explain'),
                example: talk('This room is cleaned every day. なら、「この部屋は毎日掃除される」だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'This room ___ cleaned every day. の空欄に入るのはどれかな？',
                    options: ['is', 'does', 'has'],
                    answer: 1,
                    explanation: '受動態なので be動詞 + cleaned の形にするよ。',
                }),
            },
        ],
        reorderIntro: talk('be動詞と過去分詞のセットを崩さないように並び替えよう。', 'happy'),
        reorders: [
            reorder({
                text: '「この歌は多くの人に愛されています」を英語に並び替えよう。',
                answer: 'This song is loved by many people.',
                explanation: 'is loved が受動態の中心だよ。',
            }),
            reorder({
                text: '「そのドアは昨日開けられました」を英語に並び替えよう。',
                answer: 'The door was opened yesterday.',
                explanation: '昨日のことなので was opened になるよ。',
            }),
        ],
        summary: [
            talk('受動態は「される側」を主語にした文だったね。', 'happy'),
            talk('be動詞 + 過去分詞の形をまず確実に作れるようにしよう。', 'smile'),
        ],
    },
    {
        topic: '4.2 複雑な受動態',
        intro: [
            talk('今日は少し応用の受動態だよ。目的語が2つある文や、進行形の受動態も見てみよう。', 'happy'),
            talk('基本の形が分かっていれば、あとはどこを主語にするかを落ち着いて見れば大丈夫だよ。'),
        ],
        blocks: [
            {
                explain: talk('SVOO の文は、間接目的語を主語にして受動態にすることがあるよ。', 'explain'),
                example: talk('My uncle gave me a watch. は、I was given a watch by my uncle. にできるね。'),
                quiz: quiz({
                    text: 'I was given a watch by my uncle. に近い能動態はどれかな？',
                    options: ['I gave my uncle a watch.', 'My uncle gave me a watch.', 'My uncle watched me.'],
                    answer: 2,
                    explanation: 'me が主語になった受動態なので、元は My uncle gave me a watch. だよ。',
                }),
            },
            {
                explain: talk('進行形の受動態は be being + 過去分詞 になるよ。形は少し長いけれど、考え方は同じなんだ。', 'explain'),
                example: talk('The room is being cleaned now. は、「その部屋は今掃除されているところ」です。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: '次のうち、進行形の受動態として自然なのはどれかな？',
                    options: ['The room is being cleaned now.', 'The room being cleaned now.', 'The room is clean now by someone.'],
                    answer: 1,
                    explanation: '進行形の受動態は is being cleaned の形になるよ。',
                }),
            },
        ],
        reorderIntro: talk('少し長いけれど、形を分けて考えれば大丈夫。並び替えて確認しよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は父に時計をもらいました」を英語に並び替えよう。',
                answer: 'I was given a watch by my father.',
                explanation: 'I was given ... の形で受動態にしているよ。',
            }),
            reorder({
                text: '「その橋は今修理されています」を英語に並び替えよう。',
                answer: 'The bridge is being repaired now.',
                explanation: 'is being repaired が進行形の受動態だよ。',
            }),
        ],
        summary: [
            talk('複雑な受動態でも、「be動詞 + 過去分詞」が中心だということは変わらないよ。', 'happy'),
            talk('長く見えても、主語・be動詞・過去分詞に分けると整理しやすいよ。', 'smile'),
        ],
    },
    {
        topic: '5.1 基本3用法',
        intro: [
            talk('今日は不定詞の基本3用法をやるよ。to + 動詞の原形で作る形だね。', 'happy'),
            talk('名詞的用法、形容詞的用法、副詞的用法の3つを順に見ていこう。'),
        ],
        blocks: [
            {
                explain: talk('名詞的用法は「〜すること」という意味で、文の中で名詞のように働くよ。', 'explain'),
                example: talk('I like to read books. なら、to read books は「本を読むこと」に近い働きだね。'),
                quiz: quiz({
                    text: 'I like to read books. の to read books はどの用法かな？',
                    options: ['名詞的用法', '形容詞的用法', '副詞的用法'],
                    answer: 1,
                    explanation: 'like の目的語として「本を読むこと」が入っているので名詞的用法だよ。',
                }),
            },
            {
                explain: talk('形容詞的用法は名詞を後ろから説明して、「〜するための」「〜すべき」となることが多いよ。', 'explain'),
                example: talk('I have a lot of homework to do. では、to do が homework を説明しているね。'),
                quiz: quiz({
                    text: 'I have a lot of homework to do. の to do はどの用法かな？',
                    options: ['名詞的用法', '形容詞的用法', '副詞的用法'],
                    answer: 2,
                    explanation: 'homework という名詞を後ろから説明しているので形容詞的用法だよ。',
                }),
            },
            {
                explain: talk('副詞的用法は「〜するために」と目的を表すことが多いよ。', 'explain'),
                example: talk('I went to the library to study. では、to study が「勉強するために」という目的を表しているよ。'),
                quiz: quiz({
                    text: 'I went to the library to study. の to study はどの用法かな？',
                    options: ['名詞的用法', '形容詞的用法', '副詞的用法'],
                    answer: 3,
                    explanation: '図書館へ行った目的を表しているので副詞的用法だよ。',
                }),
            },
        ],
        reorderIntro: talk('ここからは並び替えで3用法を確認してみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は本を読むことが好きです」を英語に並び替えよう。',
                answer: 'I like to read books.',
                explanation: 'to read books が like の目的語になっているので名詞的用法だよ。',
            }),
            reorder({
                text: '「私にはやるべき宿題がたくさんあります」を英語に並び替えよう。',
                answer: 'I have a lot of homework to do.',
                explanation: 'to do が homework を説明しているので形容詞的用法だよ。',
            }),
            reorder({
                text: '「私は勉強するために図書館へ行った」を英語に並び替えよう。',
                answer: 'I went to the library to study.',
                explanation: 'to study が目的を表しているので副詞的用法だよ。',
            }),
        ],
        summary: [
            talk('3用法は、何を説明しているかを見ると見分けやすいよ。', 'happy'),
            talk('名詞っぽいか、名詞を説明しているか、目的を表しているかを意識してみてね。', 'smile'),
        ],
    },
    {
        topic: '5.2 応用表現',
        intro: [
            talk('今日は不定詞の応用表現をやるよ。基本3用法が分かったら、次はよく出る形を覚える番だね。', 'happy'),
            talk('疑問詞 + to do、too ... to do、enough to do を中心に見ていこう。'),
        ],
        blocks: [
            {
                explain: talk('疑問詞 + to do は、「何をすべきか」「どう使うか」みたいな意味のかたまりを作れるよ。', 'explain'),
                example: talk('I do not know what to say. なら、「私は何を言うべきか分からない」という意味になるよ。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'I do not know ___ to say. の空欄に入るのはどれかな？',
                    options: ['what', 'when', 'where'],
                    answer: 1,
                    explanation: 'what to say で「何を言うべきか」という意味になるよ。',
                }),
            },
            {
                explain: talk('too ... to do は「〜すぎて…できない」、enough to do は「…するのに十分〜だよ」という意味になるよ。', 'explain'),
                example: talk('This bag is too heavy to carry. と He is old enough to drive. を比べると分かりやすいね。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: '次の文のまちがいを直すならどれかな？ This bag is too heavy carry.',
                    options: ['This bag is too heavy carrying.', 'This bag is too heavy to carry.', 'This bag too heavy to carry.'],
                    answer: 2,
                    explanation: 'too + 形容詞 + to do の形なので、to carry が必要だよ。',
                }),
            },
        ],
        reorderIntro: talk('応用表現も、かたまりで意味を取れるとかなり読みやすくなるよ。並び替えで確認しよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は何を買うべきか知っています」を英語に並び替えよう。',
                answer: 'I know what to buy.',
                explanation: 'what to buy は「何を買うべきか」という意味のかたまりだよ。',
            }),
            reorder({
                text: '「彼は運転するのに十分な年齢です」を英語に並び替えよう。',
                answer: 'He is old enough to drive.',
                explanation: 'enough to do は「…するのに十分〜だ」という意味だよ。',
            }),
        ],
        summary: [
            talk('疑問詞 + to do は「何をするか」、too ... to は「〜すぎてできない」、enough to は「…するのに十分」だったね。', 'happy'),
            talk('文章の中でひとかたまりとして見えるようになると、一気に読めるようになるよ。', 'smile'),
        ],
    },
    {
        topic: '6.1 基本用法',
        intro: [
            talk('今日は動名詞の基本用法だよ。動詞に ing をつけて、名詞のように使う形だね。', 'happy'),
            talk('不定詞と少し似ているけれど、使える動詞が違うところがポイントだよ。'),
        ],
        blocks: [
            {
                explain: talk('動名詞は「〜すること」という意味で、文の中で名詞のように働くよ。', 'explain'),
                example: talk('Reading books is fun. では、Reading books が主語になっているね。'),
                quiz: quiz({
                    text: 'Reading books is fun. の Reading books の役割はどれかな？',
                    options: ['主語', '動詞', '前置詞'],
                    answer: 1,
                    explanation: '「本を読むこと」が主語になっているよ。',
                }),
            },
            {
                explain: talk('enjoy や finish などのあとには、to do ではなく動名詞が来ることが多いよ。', 'explain'),
                example: talk('I enjoy playing tennis. は、「私はテニスをすることを楽しむ」だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'I enjoy ___ tennis. の空欄に入るのはどれかな？',
                    options: ['play', 'playing', 'to play'],
                    answer: 2,
                    explanation: 'enjoy のあとには動名詞 playing がよく来るよ。',
                }),
            },
        ],
        reorderIntro: talk('動名詞は ing 形にするところを意識して並び替えよう。', 'happy'),
        reorders: [
            reorder({
                text: '「英語を勉強することは大切です」を英語に並び替えよう。',
                answer: 'Studying English is important.',
                explanation: 'Studying English が主語になっているよ。',
            }),
            reorder({
                text: '「私は音楽を聴くのを楽しみます」を英語に並び替えよう。',
                answer: 'I enjoy listening to music.',
                explanation: 'enjoy のあとに listening が来ているよ。',
            }),
        ],
        summary: [
            talk('動名詞は ing 形で、「〜すること」という意味の名詞として使えるんだったね。', 'happy'),
            talk('特に enjoy や finish のあとでは、to do ではなく動名詞を選べるようにしよう。', 'smile'),
        ],
    },
    {
        topic: '6.2 慣用表現',
        intro: [
            talk('今日は動名詞を使う慣用表現だよ。前置詞のあとや決まった表現でよく出るんだ。', 'happy'),
            talk('丸ごと覚えたほうが早いものも多いから、形ごと押さえよう。'),
        ],
        blocks: [
            {
                explain: talk('look forward to や be good at のあとには、動詞なら動名詞が来るよ。', 'explain'),
                example: talk('I am looking forward to seeing you. は、「あなたに会うのを楽しみにしている」だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'I am looking forward to ___ you. の空欄に入るのはどれかな？',
                    options: ['see', 'seeing', 'to see'],
                    answer: 2,
                    explanation: 'to は前置詞なので、seeing と動名詞にするよ。',
                }),
            },
            {
                explain: talk('How about ...ing? や spend time ...ing もよく出るよ。', 'explain'),
                example: talk('How about going shopping? は、「買い物に行くのはどう？」という意味だね。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: '次のうち自然なのはどれかな？',
                    options: ['How about to go shopping?', 'How about going shopping?', 'How about go shopping?'],
                    answer: 2,
                    explanation: 'How about のあとは動名詞 going を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('動名詞を使う決まり文句は、そのまま口になじませていこう。', 'happy'),
        reorders: [
            reorder({
                text: '「私はあなたに会うのを楽しみにしています」を英語に並び替えよう。',
                answer: 'I am looking forward to seeing you.',
                explanation: 'to は前置詞なので seeing になるよ。',
            }),
            reorder({
                text: '「散歩に行くのはどうですか」を英語に並び替えよう。',
                answer: 'How about going for a walk?',
                explanation: 'How about のあとは going の形にするよ。',
            }),
        ],
        summary: [
            talk('慣用表現では「前置詞のあとなら動名詞」がかなり大事な合図になるよ。', 'happy'),
            talk('意味と形をセットで覚えると使いやすくなるよ。', 'smile'),
        ],
    },
    {
        topic: '7.1 分詞の限定用法',
        intro: [
            talk('今日は分詞の限定用法だよ。名詞を説明する形で、形容詞のように使うんだ。', 'happy'),
            talk('現在分詞と過去分詞で意味が変わるところが大事だよ。'),
        ],
        blocks: [
            {
                explain: talk('現在分詞は「〜している」「〜させるような」という意味で、名詞を説明するよ。', 'explain'),
                example: talk('a sleeping baby は、「眠っている赤ちゃん」だね。'),
                quiz: quiz({
                    text: 'a sleeping baby に近い意味はどれかな？',
                    options: ['眠らせる赤ちゃん', '眠っている赤ちゃん', '眠った赤ちゃん'],
                    answer: 2,
                    explanation: 'sleeping は baby の今の様子を表しているよ。',
                }),
            },
            {
                explain: talk('過去分詞は「〜された」「〜してしまった」という受け身っぽい意味で使うことが多いよ。', 'explain'),
                example: talk('a broken window は、「割られた窓」だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'a ___ window の空欄に入るのはどれかな？',
                    options: ['breaking', 'broken', 'broke'],
                    answer: 2,
                    explanation: '受け身っぽい意味なので broken を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('現在分詞と過去分詞の意味の違いを意識して並び替えよう。', 'happy'),
        reorders: [
            reorder({
                text: '「あそこで走っている少年」を英語に並び替えよう。',
                answer: 'the boy running there',
                explanation: 'running が boy を説明しているよ。',
            }),
            reorder({
                text: '「その壊れたドア」を英語に並び替えよう。',
                answer: 'the broken door',
                explanation: 'broken が door を受け身っぽく説明しているよ。',
            }),
        ],
        summary: [
            talk('現在分詞は能動的、過去分詞は受け身っぽい意味になりやすいんだったね。', 'happy'),
            talk('名詞の前後でどんな意味を足しているかを見ると分かりやすいよ。', 'smile'),
        ],
    },
    {
        topic: '7.2 分詞構文',
        intro: [
            talk('今日は分詞構文だよ。接続詞や主語をコンパクトにして、文をすっきりつなぐ形だね。', 'happy'),
            talk('少し長く見えるけれど、まずは「理由」や「同時」を表す型から覚えよう。'),
        ],
        blocks: [
            {
                explain: talk('分詞構文は、主節と同じ主語を持つ節を短くしたものだよ。理由を表すことが多いんだ。', 'explain'),
                example: talk('Being tired, I went to bed early. なら、「疲れていたので、私は早く寝た」になるよ。'),
                quiz: quiz({
                    text: 'Being tired, I went to bed early. に近い意味はどれかな？',
                    options: ['疲れていたので早く寝た', '疲れているけれど起きていた', '疲れるために寝た'],
                    answer: 1,
                    explanation: '理由を表す分詞構文として使われているよ。',
                }),
            },
            {
                explain: talk('Seen from the hill, the town looked beautiful. のように、受け身っぽい意味では過去分詞で始めることもあるよ。', 'explain'),
                example: talk('Seen from the hill は、「丘から見ると」という意味のまとまりだね。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: '次のうち自然なのはどれかな？',
                    options: ['Seeing from the hill, the town looked beautiful.', 'Seen from the hill, the town looked beautiful.', 'See from the hill, the town looked beautiful.'],
                    answer: 2,
                    explanation: '受け身っぽい意味なので Seen from ... が合うよ。',
                }),
            },
        ],
        reorderIntro: talk('分詞構文は最初のかたまりと主節を分けて考えると見やすいよ。', 'happy'),
        reorders: [
            reorder({
                text: '「忙しかったので、彼はタクシーを使った」を英語に並び替えよう。',
                answer: 'Being busy, he took a taxi.',
                explanation: 'Being busy が理由を表しているよ。',
            }),
            reorder({
                text: '「駅から見ると、その建物は新しく見えた」を英語に並び替えよう。',
                answer: 'Seen from the station, the building looked new.',
                explanation: 'Seen from ... が受け身っぽい分詞構文だよ。',
            }),
        ],
        summary: [
            talk('分詞構文は長く見えても、接続詞を省いたまとまりだと考えると整理しやすいよ。', 'happy'),
            talk('まずは理由や受け身っぽい型から慣れていこう。', 'smile'),
        ],
    },
    {
        topic: '8.1 等位・従属接続詞',
        intro: [
            talk('今日は接続詞だよ。文と文をつなぐ言葉で、等位接続詞と従属接続詞に分けて考えられるんだ。', 'happy'),
            talk('and、but、or と because、if、when の違いを押さえよう。'),
        ],
        blocks: [
            {
                explain: talk('等位接続詞は、同じくらいの強さの語や文をつなぐよ。and、but、or が代表だね。', 'explain'),
                example: talk('I was tired, but I finished my homework. は、2つの文を but でつないでいるよ。'),
                quiz: quiz({
                    text: 'I was tired, but I finished my homework. の but の働きはどれかな？',
                    options: ['理由', '逆接', '条件'],
                    answer: 2,
                    explanation: '「疲れていたが」のように逆の流れをつないでいるよ。',
                }),
            },
            {
                explain: talk('従属接続詞は、一方の節をもう一方に従わせるよ。because は理由、if は条件、when は時を表すんだ。', 'explain'),
                example: talk('If it rains, we will stay home. なら、「もし雨が降れば」という条件になるね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: '___ it rains, we will stay home. の空欄に入るのはどれかな？',
                    options: ['Because', 'If', 'And'],
                    answer: 2,
                    explanation: '条件を表しているので If が合うよ。',
                }),
            },
        ],
        reorderIntro: talk('接続詞は文と文の関係を見るのがポイントだよ。並び替えで確認しよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は疲れていたが、勉強を続けた」を英語に並び替えよう。',
                answer: 'I was tired, but I kept studying.',
                explanation: 'but で逆の流れをつないでいるよ。',
            }),
            reorder({
                text: '「もし時間があれば、私はあなたを手伝います」を英語に並び替えよう。',
                answer: 'If I have time, I will help you.',
                explanation: 'If が条件を表しているよ。',
            }),
        ],
        summary: [
            talk('接続詞は「何と何を、どんな関係でつないでいるか」を見ると分かりやすいよ。', 'happy'),
            talk('逆接、理由、条件、時などの役割を意識して読んでみてね。', 'smile'),
        ],
    },
    {
        topic: '9.1 基本の前置詞',
        intro: [
            talk('今日は基本の前置詞だよ。in、on、at は特に時間と場所の両方でよく出るんだ。', 'happy'),
            talk('日本語にぴったり1つで対応しないことも多いから、イメージで押さえよう。'),
        ],
        blocks: [
            {
                explain: talk('時間では、at は点、on は日、in は月・年・広い期間に使うことが多いよ。', 'explain'),
                example: talk('at seven、on Monday、in April をセットで覚えるといいね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: '___ Monday の空欄に入るのはどれかな？',
                    options: ['at', 'on', 'in'],
                    answer: 2,
                    explanation: '曜日の前には on を使うよ。',
                }),
            },
            {
                explain: talk('場所では、at は点、on は接している面、in は中に入っているイメージだよ。', 'explain'),
                example: talk('at the station、on the wall、in the box を比べると分かりやすいね。'),
                quiz: quiz({
                    text: 'The picture is ___ the wall. の空欄に入るのはどれかな？',
                    options: ['on', 'in', 'at'],
                    answer: 1,
                    explanation: '壁の表面に接しているので on を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('前置詞はイメージで選ぶと強いよ。並び替えで確認しよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は月曜日に彼に会いました」を英語に並び替えよう。',
                answer: 'I met him on Monday.',
                explanation: '曜日の前には on を使うよ。',
            }),
            reorder({
                text: '「その猫は箱の中にいます」を英語に並び替えよう。',
                answer: 'The cat is in the box.',
                explanation: '箱の中なので in を使うよ。',
            }),
        ],
        summary: [
            talk('前置詞は和訳だけでなく、位置や時間のイメージで考えるとかなり分かりやすいよ。', 'happy'),
            talk('at、on、in はセットで何度も見て慣れていこう。', 'smile'),
        ],
    },
    {
        topic: '9.2 重要な前置詞',
        intro: [
            talk('今日は少し応用の前置詞だよ。for、since、by、until みたいによく出るものを見ていこう。', 'happy'),
            talk('似ている語でも使う場面が違うから、時間の向きに注目すると分かりやすいよ。'),
        ],
        blocks: [
            {
                explain: talk('for は期間、since は起点を表すよ。完了形と一緒に出ることが多いんだ。', 'explain'),
                example: talk('I have lived here for ten years. と I have lived here since 2015. を比べてみよう。'),
                quiz: quiz({
                    text: 'I have lived here ___ 2015. の空欄に入るのはどれかな？',
                    options: ['for', 'since', 'during'],
                    answer: 2,
                    explanation: '2015 は起点なので since を使うよ。',
                }),
            },
            {
                explain: talk('by は「〜までに」、until は「〜までずっと」と考えると違いが見やすいよ。', 'explain'),
                example: talk('Finish your homework by five. と Stay here until five. は意味が違うんだ。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: 'Stay here ___ five. の空欄に入るのはどれかな？',
                    options: ['by', 'until', 'for'],
                    answer: 2,
                    explanation: '5時までずっといるので until を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('似た前置詞は時間の意味の違いを意識して並び替えてみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は2018年からここに住んでいます」を英語に並び替えよう。',
                answer: 'I have lived here since 2018.',
                explanation: '2018 は始まりの時点なので since を使うよ。',
            }),
            reorder({
                text: '「5時までここで待っていてください」を英語に並び替えよう。',
                answer: 'Please wait here until five.',
                explanation: '5時までずっと、なので until だよ。',
            }),
        ],
        summary: [
            talk('前置詞は似ているようでも、期間か起点か、期限か継続かで使い分けるよ。', 'happy'),
            talk('時間の流れをイメージしながら選べるようになると強いよ。', 'smile'),
        ],
    },
    {
        topic: '10.1 関係代名詞',
        intro: [
            talk('今日は関係代名詞だよ。2つの文をつないで、名詞を後ろから説明する形だね。', 'happy'),
            talk('who、which、that を中心に見ていこう。'),
        ],
        blocks: [
            {
                explain: talk('先行詞が人なら who、ものなら which を使うことが多いよ。that も広く使えるんだ。', 'explain'),
                example: talk('The boy who is running is my brother. では、who 以下が boy を説明しているね。'),
                quiz: quiz({
                    text: 'The boy ___ is running is my brother. の空欄に入るのはどれかな？',
                    options: ['who', 'which', 'where'],
                    answer: 1,
                    explanation: '先行詞が人なので who が自然だよ。',
                }),
            },
            {
                explain: talk('関係代名詞は、後ろに続く節の中で主語や目的語の役割をしているよ。', 'explain'),
                example: talk('The book that I bought yesterday is interesting. では、that は bought の目的語の役目だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'The book ___ I bought yesterday is interesting. の空欄に入るのはどれかな？',
                    options: ['that', 'when', 'why'],
                    answer: 1,
                    explanation: '先行詞がものなので that が使えるよ。',
                }),
            },
        ],
        reorderIntro: talk('関係代名詞の後ろが名詞を説明するまとまりになると考えて並び替えよう。', 'happy'),
        reorders: [
            reorder({
                text: '「そこで走っている少年は私の弟です」を英語に並び替えよう。',
                answer: 'The boy who is running there is my brother.',
                explanation: 'who is running there が boy を説明しているよ。',
            }),
            reorder({
                text: '「私が昨日買った本は高かった」を英語に並び替えよう。',
                answer: 'The book that I bought yesterday was expensive.',
                explanation: 'that I bought yesterday が book を説明しているよ。',
            }),
        ],
        summary: [
            talk('関係代名詞は、名詞を後ろから詳しく説明するためのつなぎ役だったね。', 'happy'),
            talk('先行詞が人か物か、後ろの節でどんな役目かを見て選ぼう。', 'smile'),
        ],
    },
    {
        topic: '10.2 関係副詞',
        intro: [
            talk('今日は関係副詞だよ。where、when、why などで、場所や時、理由を表しながら文をつなぐんだ。', 'happy'),
            talk('関係代名詞と似ているけれど、後ろの節で前置詞がいらないところが特徴だよ。'),
        ],
        blocks: [
            {
                explain: talk('where は場所、when は時を表す名詞を説明するときに使うよ。', 'explain'),
                example: talk('This is the park where I play tennis. では、where 以下が park を説明しているね。'),
                quiz: quiz({
                    text: 'This is the park ___ I play tennis. の空欄に入るのはどれかな？',
                    options: ['where', 'when', 'who'],
                    answer: 1,
                    explanation: 'park は場所なので where を使うよ。',
                }),
            },
            {
                explain: talk('why は the reason と相性がいいよ。the reason why ... で「〜する理由」になるんだ。', 'explain'),
                example: talk('Do you know the reason why he was late? は、「彼が遅れた理由を知っていますか」だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'Do you know the reason ___ he was late? の空欄に入るのはどれかな？',
                    options: ['where', 'why', 'which'],
                    answer: 2,
                    explanation: 'reason なので why が合うよ。',
                }),
            },
        ],
        reorderIntro: talk('関係副詞は場所・時・理由のどれを説明しているか意識して並び替えよう。', 'happy'),
        reorders: [
            reorder({
                text: '「これは私が生まれた町です」を英語に並び替えよう。',
                answer: 'This is the town where I was born.',
                explanation: 'where I was born が town を説明しているよ。',
            }),
            reorder({
                text: '「それが彼が泣いた理由です」を英語に並び替えよう。',
                answer: 'That is the reason why he cried.',
                explanation: 'why he cried が reason を説明しているよ。',
            }),
        ],
        summary: [
            talk('関係副詞は、場所・時・理由を表す名詞を説明するときに便利だよ。', 'happy'),
            talk('where、when、why のどれが自然か、先行詞を見て判断しよう。', 'smile'),
        ],
    },
    {
        topic: '11.1 基本3態',
        intro: [
            talk('今日は比較の基本3態だよ。原級、比較級、最上級の3つを押さえよう。', 'happy'),
            talk('「同じくらい」「より〜」「いちばん〜」の3パターンで考えると整理しやすいよ。'),
        ],
        blocks: [
            {
                explain: talk('比較級は「より〜」、最上級は「いちばん〜」を表すよ。短い語は -er、-est がつきやすいね。', 'explain'),
                example: talk('Tom is taller than Ken. と Tom is the tallest in his class. を比べてみよう。'),
                quiz: quiz({
                    text: 'Tom is taller than Ken. に近い意味はどれかな？',
                    options: ['トムはケンと同じくらい背が高い', 'トムはケンより背が高い', 'トムはいちばん背が高い'],
                    answer: 2,
                    explanation: 'taller than で「〜より高い」になるよ。',
                }),
            },
            {
                explain: talk('原級では as ... as を使って、「〜と同じくらい...」を表すよ。', 'explain'),
                example: talk('This bag is as heavy as that one. は、「このかばんはあれと同じくらい重い」だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'This bag is ___ heavy as that one. の空欄に入るのはどれかな？',
                    options: ['so', 'as', 'more'],
                    answer: 2,
                    explanation: '同じくらいを表すので as ... as の形にするよ。',
                }),
            },
        ],
        reorderIntro: talk('比較は than や as ... as を目印にすると見やすいよ。', 'happy'),
        reorders: [
            reorder({
                text: '「この本はあの本より面白いです」を英語に並び替えよう。',
                answer: 'This book is more interesting than that one.',
                explanation: 'more interesting than で比較級だよ。',
            }),
            reorder({
                text: '「彼は私と同じくらい速く走ります」を英語に並び替えよう。',
                answer: 'He runs as fast as I do.',
                explanation: 'as fast as で原級比較になっているよ。',
            }),
        ],
        summary: [
            talk('比較級、最上級、原級の3つを使い分けられると、説明の幅がかなり広がるよ。', 'happy'),
            talk('than と as ... as の形をまず確実に作れるようにしよう。', 'smile'),
        ],
    },
    {
        topic: '11.2 重要表現',
        intro: [
            talk('今日は比較の重要表現だよ。the 比較級, the 比較級 や much を使う強調などを見ていこう。', 'happy'),
            talk('基本3態に慣れたら、よく出る形ごと覚えると使いやすいよ。'),
        ],
        blocks: [
            {
                explain: talk('the 比較級, the 比較級 は、「〜すればするほど...」という意味になるよ。', 'explain'),
                example: talk('The more you practice, the better you become. は、「練習すればするほど、上手になる」だね。'),
                quiz: quiz({
                    text: 'The more you practice, the better you become. に近い意味はどれかな？',
                    options: ['練習すると下手になる', '練習すればするほど上手になる', '練習しないほうがいい'],
                    answer: 2,
                    explanation: 'the 比較級, the 比較級 の定番表現だよ。',
                }),
            },
            {
                explain: talk('much や far は比較級を強めることがあるよ。much better で「ずっとよい」みたいな感じだね。', 'explain'),
                example: talk('This plan is much better than the old one. は、「この案は前の案よりずっと良い」だよ。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'This plan is ___ better than the old one. の空欄に入るのはどれかな？',
                    options: ['very', 'much', 'so'],
                    answer: 2,
                    explanation: '比較級 better を強めるので much を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('重要表現は形ごと覚えるのが近道だよ。並び替えで確認しよう。', 'happy'),
        reorders: [
            reorder({
                text: '「読めば読むほど、私はそれが好きになる」を英語に並び替えよう。',
                answer: 'The more I read it, the more I like it.',
                explanation: 'the 比較級, the 比較級 の形だよ。',
            }),
            reorder({
                text: '「この方法はあの方法よりずっと簡単です」を英語に並び替えよう。',
                answer: 'This way is much easier than that one.',
                explanation: 'much easier than で強い比較を表しているよ。',
            }),
        ],
        summary: [
            talk('比較の重要表現は、意味を考えるよりもまず形ごと覚えると強いよ。', 'happy'),
            talk('the 比較級, the 比較級 と much + 比較級 は特によく出るから慣れておこう。', 'smile'),
        ],
    },
    {
        topic: '12.1 基本の仮定法',
        intro: [
            talk('今日は仮定法の基本だよ。現実とはちがうことを「もし〜なら」と考える形なんだ。', 'happy'),
            talk('If + 過去形, would + 動詞 の形をまず押さえよう。'),
        ],
        blocks: [
            {
                explain: talk('仮定法過去は、今の事実と反対のことを想像するときに使うよ。', 'explain'),
                example: talk('If I were you, I would study harder. は、「もし私があなただったら、もっと勉強するのに」だね。'),
                quiz: quiz({
                    text: 'If I were you, I would study harder. に近い意味はどれかな？',
                    options: ['私はあなたです', '私はあなたではないが、そうなら勉強する', '私はあなたを勉強させる'],
                    answer: 2,
                    explanation: '現実とは違う今の仮定を表しているよ。',
                }),
            },
            {
                explain: talk('be動詞は仮定法で were を使うことが多いよ。I were や he were も出てくるんだ。', 'explain'),
                example: talk('If he were here, he would help us. なら、「もし彼がここにいたら、助けてくれるのに」だね。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'If he ___ here, he would help us. の空欄に入るのはどれかな？',
                    options: ['is', 'were', 'was'],
                    answer: 2,
                    explanation: '仮定法なので were を使うよ。',
                }),
            },
        ],
        reorderIntro: talk('If 節と would の節をセットで見て、順番を整えてみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「もし私に時間があれば、あなたを手伝うのに」を英語に並び替えよう。',
                answer: 'If I had time, I would help you.',
                explanation: '今の事実と反対の仮定なので had, would help を使うよ。',
            }),
            reorder({
                text: '「もし私があなただったら、その本を買うのに」を英語に並び替えよう。',
                answer: 'If I were you, I would buy the book.',
                explanation: 'If I were you は仮定法の定番表現だよ。',
            }),
        ],
        summary: [
            talk('仮定法過去は、「今はそうではないけれど、もしそうなら」と考える形だったね。', 'happy'),
            talk('If + 過去形, would + 動詞 のセットをまずしっかり覚えよう。', 'smile'),
        ],
    },
    {
        topic: '12.2 応用仮定法',
        intro: [
            talk('今日は応用の仮定法だよ。I wish や without を使った表現まで広げてみよう。', 'happy'),
            talk('基本の考え方は同じで、現実とのズレをどう表すかを見るんだ。'),
        ],
        blocks: [
            {
                explain: talk('I wish + 過去形 は、「〜ならいいのに」と今の事実と違う願いを表すよ。', 'explain'),
                example: talk('I wish I were taller. は、「もっと背が高ければいいのに」だね。'),
                quiz: quiz({
                    text: 'I wish I were taller. に近い意味はどれかな？',
                    options: ['私は背が高い', '私はもっと背が高ければいいのにと思っている', '私は背が高くなる予定だ'],
                    answer: 2,
                    explanation: '今の事実と違う願いを表しているよ。',
                }),
            },
            {
                explain: talk('without や but for を使って、「もし〜がなければ」という仮定を表すこともあるよ。', 'explain'),
                example: talk('Without your help, I could not finish the work. は、「あなたの助けがなければ終えられなかった」だね。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: '次のうち自然なのはどれかな？',
                    options: ['Without your help, I could not finish the work.', 'Without your help, I cannot finish the work yesterday.', 'Without your help, I finished the work maybe.'],
                    answer: 1,
                    explanation: 'without を使った仮定表現として自然なのは1つ目だよ。',
                }),
            },
        ],
        reorderIntro: talk('現実とのズレを表しているところを意識して並び替えよう。', 'happy'),
        reorders: [
            reorder({
                text: '「もっと多くのお金があればいいのに」を英語に並び替えよう。',
                answer: 'I wish I had more money.',
                explanation: 'I wish + 過去形 で今の願いを表しているよ。',
            }),
            reorder({
                text: '「あなたの助けがなければ、私は成功できなかったでしょう」を英語に並び替えよう。',
                answer: 'Without your help, I could not have succeeded.',
                explanation: 'without を使った仮定の応用表現だよ。',
            }),
        ],
        summary: [
            talk('I wish や without も、結局は「現実とは違うこと」を表しているんだったね。', 'happy'),
            talk('基本の仮定法が分かれば、応用表現もかなり読みやすくなるよ。', 'smile'),
        ],
    },
    {
        topic: '13.1 否定・強調',
        intro: [
            talk('今日は否定と強調だよ。not の位置や do を使った強調で意味が変わるところを見ていこう。', 'happy'),
            talk('全部否定なのか、一部だけ否定なのかを見分けるのがポイントだよ。'),
        ],
        blocks: [
            {
                explain: talk('部分否定では、not always や not necessarily のように「全部がそうとは限らない」と表せるよ。', 'explain'),
                example: talk('English is not always easy. は、「英語がいつも簡単とは限らない」だね。'),
                quiz: quiz({
                    text: 'English is not always easy. に近い意味はどれかな？',
                    options: ['英語は絶対に簡単ではない', '英語はいつも簡単とは限らない', '英語はいつも簡単だ'],
                    answer: 2,
                    explanation: 'not always は全部否定ではなく部分否定だよ。',
                }),
            },
            {
                explain: talk('do を強く読むと、「本当に〜する」と強調できるよ。', 'explain'),
                example: talk('I do like this song. は、「私は本当にこの歌が好きだ」になるよ。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'I ___ like this song. の空欄に入るのはどれかな？',
                    options: ['do', 'does', 'did not'],
                    answer: 1,
                    explanation: '主語が I なので do を使って強調しているよ。',
                }),
            },
        ],
        reorderIntro: talk('否定の位置と強調の助動詞を意識して並び替えよう。', 'happy'),
        reorders: [
            reorder({
                text: '「彼はいつも正しいわけではありません」を英語に並び替えよう。',
                answer: 'He is not always right.',
                explanation: 'not always で部分否定を表しているよ。',
            }),
            reorder({
                text: '「私は本当にその映画が好きです」を英語に並び替えよう。',
                answer: 'I do like the movie.',
                explanation: 'do を入れて強調しているよ。',
            }),
        ],
        summary: [
            talk('否定では not がどこを打ち消しているか、強調では do が何を強めているかを見るといいよ。', 'happy'),
            talk('部分否定と全部否定の違いには特に気をつけよう。', 'smile'),
        ],
    },
    {
        topic: '13.2 倒置・挿入',
        intro: [
            talk('今日は倒置と挿入だよ。語順が少し変わるので難しく見えるけれど、パターンが分かれば大丈夫だよ。', 'happy'),
            talk('only で始まる倒置と、文の途中に入る挿入表現を見ていこう。'),
        ],
        blocks: [
            {
                explain: talk('only then や only after ... で文を始めると、主語と助動詞がひっくり返ることがあるよ。', 'explain'),
                example: talk('Only then did I understand the problem. は、「そのとき初めて問題が分かった」だね。'),
                quiz: quiz({
                    text: 'Only then did I understand the problem. で倒置している部分はどれかな？',
                    options: ['Only then', 'did I understand', 'the problem'],
                    answer: 2,
                    explanation: 'did I understand と助動詞が前に出ているよ。',
                }),
            },
            {
                explain: talk('挿入は、I think や of course みたいな語句を文の途中に入れて、話し手の気持ちを足す形だよ。', 'explain'),
                example: talk('My brother, I think, is kind. なら、I think が挿入されているね。'),
                quiz: quiz({
                    kind: 'error_fix',
                    text: '次のうち、挿入として自然なのはどれかな？',
                    options: ['My brother, I think, is kind.', 'My brother I think is kind maybe comma wrong.', 'My brother is kind only then.'],
                    answer: 1,
                    explanation: 'I think をカンマで挟んで挿入しているよ。',
                }),
            },
        ],
        reorderIntro: talk('語順の変化に慣れるために、短い文で並び替えてみよう。', 'happy'),
        reorders: [
            reorder({
                text: '「そのとき初めて私は答えを知りました」を英語に並び替えよう。',
                answer: 'Only then did I know the answer.',
                explanation: 'Only then で始まるので did I know と倒置するよ。',
            }),
            reorder({
                text: '「その映画は、私は思うに、とても面白いです」を英語に並び替えよう。',
                answer: 'The movie, I think, is very interesting.',
                explanation: 'I think が挿入されているよ。',
            }),
        ],
        summary: [
            talk('倒置は語順が変わるだけで、意味の中心は同じだよ。', 'happy'),
            talk('挿入は話し手の考えを足す表現として、まとまりで見られるようにしよう。', 'smile'),
        ],
    },
    {
        topic: '14.1 句動詞・熟語',
        intro: [
            talk('今日は句動詞と熟語だよ。動詞と前置詞や副詞が合わさって、まとまった意味を作るんだ。', 'happy'),
            talk('1語ずつ訳すより、かたまりで覚えるほうがずっと使いやすいよ。'),
        ],
        blocks: [
            {
                explain: talk('句動詞では、get up、look for、turn on みたいに、組み合わせで意味が決まるよ。', 'explain'),
                example: talk('I get up at six and look for my bag. なら、get up は「起きる」、look for は「探す」だね。'),
                quiz: quiz({
                    text: 'look for に近い意味はどれかな？',
                    options: ['見る', '探す', '待つ'],
                    answer: 2,
                    explanation: 'look for は「〜を探す」という句動詞だよ。',
                }),
            },
            {
                explain: talk('熟語では、take care of や be interested in みたいに、前置詞まで含めて覚えるといいよ。', 'explain'),
                example: talk('She takes care of her little brother. は、「彼女は弟の世話をする」になるよ。'),
                quiz: quiz({
                    kind: 'fill_blank',
                    text: 'She takes care ___ her little brother. の空欄に入るのはどれかな？',
                    options: ['of', 'for', 'to'],
                    answer: 1,
                    explanation: 'take care of で1つの熟語だよ。',
                }),
            },
        ],
        reorderIntro: talk('句動詞や熟語はかたまりでそのまま並べられるようにしよう。', 'happy'),
        reorders: [
            reorder({
                text: '「私は毎朝6時に起きます」を英語に並び替えよう。',
                answer: 'I get up at six every morning.',
                explanation: 'get up が句動詞として1セットだよ。',
            }),
            reorder({
                text: '「彼女は弟の世話をします」を英語に並び替えよう。',
                answer: 'She takes care of her brother.',
                explanation: 'take care of をまとめて使っているよ。',
            }),
        ],
        summary: [
            talk('句動詞と熟語は、単語ごとに切らずにまとまりで覚えるのが一番大事だよ。', 'happy'),
            talk('よく出るものを何度も見て、自然に口から出る形にしていこう。', 'smile'),
        ],
    },
];

export const LOCAL_GRAMMAR_LESSONS = LESSON_SPECS.reduce((lessons, spec) => {
    lessons[spec.topic] = buildLessonRows(spec);
    return lessons;
}, {});

export const getLocalGrammarLesson = (topic) => {
    if (!topic) return null;

    return LOCAL_GRAMMAR_LESSONS[topic] || null;
};
