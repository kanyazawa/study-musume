const HOME_REACTION_STYLE_MAP = {
    emma: {
        happy: 'まお / ふつー',
        smile: 'まお / おちつき',
        relaxed: 'まお / おちつき',
        shy: 'まお / せつなめ',
        serious: 'まお / おちつき',
        angry: 'まお / せつなめ',
        normal: 'まお / ふつー',
        default: 'まお / ふつー',
    },
    noah: {
        happy: 'まお / あまあま',
        smile: 'まお / からかい',
        relaxed: 'まお / あまあま',
        shy: 'まお / あまあま',
        serious: 'まお / おちつき',
        angry: 'まお / からかい',
        normal: 'まお / ノーマル',
        default: 'まお / ノーマル',
    },
    ren: {
        happy: 'まお / ノーマル',
        smile: 'まお / ふつー',
        relaxed: 'まお / おちつき',
        shy: 'まお / せつなめ',
        serious: 'まお / おちつき',
        angry: 'まお / せつなめ',
        normal: 'まお / おちつき',
        default: 'まお / おちつき',
    },
};

const buildHomeReactionVoicePath = (characterId, id) => `/audio/tts-generated/home-reactions/${characterId}/${id}.mp3`;

const withHomeReactionMeta = (characterId, bucket, items) => items.map((item, index) => {
    const id = item.id || `${characterId}-${bucket}-${String(index + 1).padStart(2, '0')}`;
    const styleMap = HOME_REACTION_STYLE_MAP[characterId] || HOME_REACTION_STYLE_MAP.noah;
    const emotionKey = item.emotion || 'default';

    return {
        ...item,
        id,
        voice: Object.prototype.hasOwnProperty.call(item, 'voice') && item.voice !== ''
            ? item.voice
            : buildHomeReactionVoicePath(characterId, id),
        ttsSpeaker: item.ttsSpeaker || styleMap[emotionKey] || styleMap.default,
    };
});

export const HOME_REACTIONS = {
    emma: {
        lowTp: withHomeReactionMeta('emma', 'lowTp', [
            { emotion: 'serious', text: '今日は詰め込みすぎないで。頭が散ってる時は、量より整え方のほうが大事。', voice: '' },
            { emotion: 'normal', text: '疲れてるなら一問だけでもいいよ。そこで止めても、今日はちゃんと前進だから。', voice: '' },
            { emotion: 'serious', text: '無理して続けると雑になる。休みながら進める日のほうが、あとで効くこともある。', voice: '' },
        ]),
        highStreak: withHomeReactionMeta('emma', 'highStreak', [
            { emotion: 'happy', text: '続いてるね。派手じゃなくても、その積み上げ方はかなり強いと思う。', voice: '' },
            { emotion: 'smile', text: '最近の流れ、いい感じ。今日も崩さないで一個だけ進めよう。', voice: '' },
            { emotion: 'relaxed', text: '毎日ちゃんと来てるの、えらいよ。そういう人は後半で伸びるから。', voice: '' },
        ]),
        reviewFocus: withHomeReactionMeta('emma', 'reviewFocus', [
            { emotion: 'serious', text: '今日は復習優先かな。曖昧なまま先へ行くより、ここで揃えたほうが早い。', voice: '' },
            { emotion: 'normal', text: '弱点ノートが残ってるね。先にそこを軽くすると、次の授業がかなり楽になるよ。', voice: '' },
            { emotion: 'happy', text: '前に迷ったところ、今なら取れそう。短くでも一回だけ回してみよ。', voice: '' },
        ]),
        examSoon: withHomeReactionMeta('emma', 'examSoon', [
            { emotion: 'serious', text: '本番が近い時ほど、雑に広げないで。取るところを確実に取る形にしよ。', voice: '' },
            { emotion: 'normal', text: '焦るより、再現できる形に整えるほうが大事。今日はその確認に使いたい。', voice: '' },
            { emotion: 'relaxed', text: 'ここまで積んできた分は消えないよ。今日は落ち着いて、取れる問題を増やそ。', voice: '' },
        ]),
        highAffection: withHomeReactionMeta('emma', 'highAffection', [
            { emotion: 'relaxed', text: '来てくれると少し安心する。今日はどこから一緒に見ようか。', voice: '' },
            { emotion: 'smile', text: '最近は、同じ机で進めるのが前より自然になってきた気がする。', voice: '' },
            { emotion: 'happy', text: '少し話してから始める？ そのほうが今日はうまく乗れそう。', voice: '' },
        ]),
        default: withHomeReactionMeta('emma', 'default', [
            { emotion: 'normal', text: '今日は長くやらなくていい。まず一個だけ、一緒に見よ。', voice: '' },
            { emotion: 'serious', text: '迷って止まるより、軽いところから入ったほうが早いよ。最初の一問、決めよ。', voice: '' },
            { emotion: 'smile', text: '何からやるか決めたら、あとは進めるだけ。今日はその最初だけでも取ろ。', voice: '' },
            { emotion: 'happy', text: '来たなら、少しだけでも前に進も。短く終えても意味はちゃんとあるから。', voice: '' },
        ]),
    },
    noah: {
        lowTp: withHomeReactionMeta('noah', 'lowTp', [
            { emotion: 'serious', text: '無理しすぎないでよ。少し休んでからでも遅くないんだから。' },
            { emotion: 'serious', text: '顔色、あんまり良くないわよ。今日は深呼吸してからにしなさい。' },
            { emotion: 'serious', text: '今のあんた、頑張るより整えるほうが先。お茶でも飲んで落ち着きなさい。' },
            { emotion: 'angry', text: 'べ、別に心配してるわけじゃないけど……今日は少しゆっくりでもいいのよ。' },
            { emotion: 'serious', text: 'TPが減ってる時に雑に進めても頭に入らないわ。休むのも作戦よ。' },
            { emotion: 'normal', text: '少し疲れてるでしょ。まずは一問だけにして、感覚を戻していきなさい。' },
        ]),
        highStreak: withHomeReactionMeta('noah', 'highStreak', [
            { emotion: 'happy', text: '連続で頑張れてるじゃない。べ、別にちょっと感心しただけよ。' },
            { emotion: 'smile', text: 'その調子で積み上げなさいよ。今日はかなりいい感じなんだから。' },
            { emotion: 'happy', text: 'ちゃんと継続できてるの、えらいじゃない。勢いがあるうちにもう一歩行く？' },
            { emotion: 'smile', text: '最近のあんた、前よりずっと安定してるわ。見てて退屈しないもの。' },
            { emotion: 'happy', text: '続けられてるってことは、本気で変わろうとしてるってことでしょ。いいじゃない。' },
            { emotion: 'relaxed', text: '積み上がってるわね。この流れ、今日は手放さないでいきなさい。' },
        ]),
        reviewFocus: withHomeReactionMeta('noah', 'reviewFocus', [
            { emotion: 'serious', text: '復習が溜まってるわ。新しいことに行く前に、抜けた穴を埋めておきなさい。' },
            { emotion: 'normal', text: '今日のおすすめは復習よ。ここで取りこぼしを減らせば、かなり楽になるわ。' },
            { emotion: 'happy', text: '前に間違えたところ、今なら取り返せそうね。一緒に片づけてしまいましょ。' },
            { emotion: 'smile', text: '復習って地味だけど、効くのよ。ちゃんと回してる人が最後に強いんだから。' },
            { emotion: 'serious', text: '曖昧なまま積むのは危ないわ。今日は復習優先で固めるのが正解ね。' },
        ]),
        examSoon: withHomeReactionMeta('noah', 'examSoon', [
            { emotion: 'serious', text: '入試まで近いんだから、今は一問の重みが違うわ。丁寧に行きなさい。' },
            { emotion: 'serious', text: '焦る気持ちは分かるけど、雑になるのはだめ。最後まで精度を上げるわよ。' },
            { emotion: 'normal', text: 'ここからは勢いより再現性よ。解ける問題を確実に取れる形にしなさい。' },
            { emotion: 'angry', text: '大丈夫、今まで積んできたものは消えないわ。今日は落ち着いて確認しましょ。' },
            { emotion: 'serious', text: '直前期は欲張りすぎない。取るべきところを取る、それだけでいいの。' },
        ]),
        highAffection: withHomeReactionMeta('noah', 'highAffection', [
            { emotion: 'relaxed', text: '来てくれると安心するの。今日は何を一緒にやる？' },
            { emotion: 'angry', text: 'あんたと話すと落ち着くのよね。少しだけ、ここにいて。' },
            { emotion: 'happy', text: '今日はちょっと機嫌いいかも。あんたが来たからってわけじゃ……なくもないわ。' },
            { emotion: 'smile', text: '最近は顔を見るだけで、ちゃんと頑張ってるのが分かるわ。悪くないじゃない。' },
            { emotion: 'relaxed', text: 'こうして同じ場所で積み重ねてると、なんだか頼もしく見えてくるわね。' },
            { emotion: 'angry', text: '少し話してから始める？ そのほうが、今日はうまく乗れそうだもの。' },
        ]),
        default: withHomeReactionMeta('noah', 'default', [
            { emotion: 'normal', text: '今日はどこから進めるの？ちゃんと付き合ってあげるわ。' },
            { emotion: 'angry', text: 'ぼーっとしてないで、やること決めなさいよ。' },
            { emotion: 'happy', text: '来たのね。少しだけなら、話してあげてもいいわ。' },
            { emotion: 'normal', text: '始めるなら早いほうがいいわよ。テンポよく一つ目に触りなさい。' },
            { emotion: 'smile', text: '今日のあんた、どれくらいやれるのか見せてもらおうじゃない。' },
            { emotion: 'normal', text: '小さくでも前に進めばいいの。まずは一個、終わらせてみなさい。' },
            { emotion: 'happy', text: '調子を上げたいなら、簡単なところから入るのもありね。案内してあげる。' },
            { emotion: 'angry', text: '迷って止まるのがいちばんもったいないわ。決めたらすぐ動く。いい？' },
        ]),
    },
    ren: {
        lowTp: withHomeReactionMeta('ren', 'lowTp', [
            { emotion: 'serious', text: '疲れているだろ。無理に詰め込まず、少し整えてから進もう。' },
            { emotion: 'normal', text: '集中が切れている時は休憩も必要だ。焦るな。' },
            { emotion: 'serious', text: '今日は頑張り方を間違えないほうがいい。まずは呼吸を整えよう。' },
            { emotion: 'relaxed', text: '力を出し切るだけが正解じゃない。回復しながら進む日も必要だ。' },
            { emotion: 'serious', text: '消耗した状態で雑にやると崩れる。今は丁寧さを優先しよう。' },
            { emotion: 'normal', text: '一気に取り返そうとしなくていい。今日は短く、でも確実にいこう。' },
        ]),
        highStreak: withHomeReactionMeta('ren', 'highStreak', [
            { emotion: 'happy', text: '継続できているな。その積み重ねは確実に力になる。' },
            { emotion: 'smile', text: '今日も続けられている。お前の努力、俺はちゃんと見てる。' },
            { emotion: 'happy', text: '最近の流れはいい。派手じゃなくても、こういう前進がいちばん強い。' },
            { emotion: 'relaxed', text: '続いている時の感覚を覚えておけ。あとで必ず支えになる。' },
            { emotion: 'happy', text: '継続は才能より頼れる。今のお前は、かなりいい位置にいる。' },
            { emotion: 'smile', text: 'ここまで来たなら、今日も一本通していこう。いい仕上がりになりそうだ。' },
        ]),
        reviewFocus: withHomeReactionMeta('ren', 'reviewFocus', [
            { emotion: 'serious', text: '復習が優先だな。抜けを一つずつ埋めれば、土台がかなり強くなる。' },
            { emotion: 'normal', text: '新しい範囲も大事だが、今日は戻って整える価値が高い。' },
            { emotion: 'happy', text: '前に落とした問題も、今なら拾えるはずだ。確認していこう。' },
            { emotion: 'serious', text: '理解したつもりの場所を見直す日も必要だ。そこから精度が変わる。' },
            { emotion: 'relaxed', text: '復習は遠回りに見えて近道だ。今日はそれでいい。' },
        ]),
        examSoon: withHomeReactionMeta('ren', 'examSoon', [
            { emotion: 'serious', text: '本番が近い。ここからは量より、確実に取る感覚を優先しよう。' },
            { emotion: 'normal', text: '焦らなくていい。今まで積んだものを、使える形に揃えていこう。' },
            { emotion: 'serious', text: '直前期は崩さないことが大事だ。今日も淡々と、必要なことをやる。' },
            { emotion: 'relaxed', text: '不安はあって当然だ。でも、お前はちゃんと準備してきた。忘れるな。' },
            { emotion: 'serious', text: 'ここから先は一問の精度が効く。雑に終わらせず、確実にいこう。' },
        ]),
        highAffection: withHomeReactionMeta('ren', 'highAffection', [
            { emotion: 'relaxed', text: 'お前が来ると少し空気が変わるな。悪くない。' },
            { emotion: 'smile', text: '一緒にいると落ち着く。今日は何から始める？' },
            { emotion: 'happy', text: '来てくれて助かる。こうして顔を見ると、自然と切り替わるんだ。' },
            { emotion: 'relaxed', text: '最近は同じ場所で頑張る時間が、少し楽しみになってきた。' },
            { emotion: 'smile', text: '無理に気負わなくていい。お前のペースは、ちゃんと前に進んでいる。' },
            { emotion: 'angry', text: '少し話してから始めるか。そういう時間も、案外大事だからな。' },
        ]),
        default: withHomeReactionMeta('ren', 'default', [
            { emotion: 'normal', text: '来たか。今日も一つずつ片付けていこう。' },
            { emotion: 'serious', text: '始めるなら集中していこう。俺も付き合う。' },
            { emotion: 'happy', text: '少し話すくらいならいい。で、何をやる？' },
            { emotion: 'normal', text: '迷っているなら、まず一番軽いところから入ればいい。流れはそこから作れる。' },
            { emotion: 'smile', text: '今日はどこを進める？ 方向さえ決まれば、あとは一緒にやれる。' },
            { emotion: 'normal', text: '完璧じゃなくていい。昨日より少し前に出られれば十分だ。' },
            { emotion: 'happy', text: '手をつけるまでが重いなら、最初の一問は俺が隣で見ているつもりでやれ。' },
            { emotion: 'serious', text: '立ち止まるより、少しでも動いたほうが整う。今のうちに始めよう。' },
        ]),
    },
};

export const getAllHomeReactionVoiceLines = () => Object.entries(HOME_REACTIONS).flatMap(([characterId, reactionGroups]) =>
    Object.entries(reactionGroups).flatMap(([bucket, items]) =>
        items.map((item) => ({
            characterId,
            bucket,
            ...item,
        }))
    )
);
