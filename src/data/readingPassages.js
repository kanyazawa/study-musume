export const READING_PASSAGES = [
    {
        id: 'grade3-community-garden',
        level: 'grade3',
        label: '英検3級',
        title: 'A Small Garden in Town',
        estimatedMinutes: 4,
        topic: '地域と環境',
        passage: `Mika lives in a town with many tall buildings. There was an empty place near her school. People threw away old bikes and boxes there, so nobody wanted to walk by it.

One day, Mika's science teacher said, "This place can become a community garden." At first, Mika did not think it was possible. The ground was hard, and there was a lot of trash. However, her classmates, teachers, and some neighbors worked together every Saturday morning.

They cleaned the place, brought good soil, and planted vegetables and flowers. The work was not easy, but Mika enjoyed talking with people she did not know before. An elderly man taught her how to water tomatoes. A small child helped put labels beside the plants.

After two months, the empty place looked completely different. Students used the garden in science class, and neighbors visited it after work. Mika learned that a small action can change how people feel about their town.`,
        questions: [
            {
                question: 'Why did people not want to walk by the empty place at first?',
                options: [
                    'It was too far from the school.',
                    'There was trash such as old bikes and boxes.',
                    'The flowers smelled bad.',
                    'Many children played loudly there.',
                ],
                answerIndex: 1,
                explanation: '第1段落で、古い自転車や箱が捨てられていたため誰も通りたがらなかったとあります。',
            },
            {
                question: 'Who helped make the community garden?',
                options: [
                    'Only Mika and her science teacher.',
                    'Mika, her classmates, teachers, and neighbors.',
                    'Some workers from another city.',
                    'Only elderly people in the town.',
                ],
                answerIndex: 1,
                explanation: '第2段落で classmates, teachers, and some neighbors が一緒に作業したと説明されています。',
            },
            {
                question: 'What did Mika learn from the experience?',
                options: [
                    'Science class is always difficult.',
                    'Tall buildings are bad for towns.',
                    'Small actions can change a town.',
                    'Tomatoes grow only in summer.',
                ],
                answerIndex: 2,
                explanation: '最終文の a small action can change how people feel about their town が答えです。',
            },
        ],
    },
    {
        id: 'pre2-library-robot',
        level: 'grade_pre2',
        label: '英検準2級',
        title: 'The Library Robot',
        estimatedMinutes: 5,
        topic: '技術と学習',
        passage: `A city library started using a small robot to help visitors find books. The robot can understand simple questions, move to the correct shelf, and show the location of a book on its screen. Many children enjoy following it around the library.

Some people worried that the robot would make librarians less important. In fact, the opposite happened. Because the robot answered easy questions, librarians had more time to help visitors choose books, plan events, and support students who needed research advice.

The library also found an unexpected benefit. Older visitors who were nervous about using computers became interested in the robot. Librarians used this chance to teach them how to search for books online. The robot did not replace human help; it created more opportunities for people to ask for help.

The library director said that technology works best when it makes human communication easier. The robot was useful not because it was perfect, but because it encouraged more people to use the library with confidence.`,
        questions: [
            {
                question: 'What can the robot do?',
                options: [
                    'Write book reports for students.',
                    'Move to shelves and show book locations.',
                    'Repair old computers.',
                    'Plan events without librarians.',
                ],
                answerIndex: 1,
                explanation: '第1段落で、正しい棚へ移動し本の場所を画面に表示できるとあります。',
            },
            {
                question: 'What happened after the robot answered easy questions?',
                options: [
                    'Librarians had more time for deeper support.',
                    'Children stopped visiting the library.',
                    'Visitors could not find books anymore.',
                    'The library closed many events.',
                ],
                answerIndex: 0,
                explanation: '第2段落で、司書が本選び・イベント・調査相談に時間を使えるようになったと説明されています。',
            },
            {
                question: 'What is the main message of the passage?',
                options: [
                    'Robots should replace people in public places.',
                    'Libraries should stop using online searches.',
                    'Technology is useful when it supports human communication.',
                    'Older visitors do not like learning new things.',
                ],
                answerIndex: 2,
                explanation: '最終段落の technology works best when it makes human communication easier が中心内容です。',
            },
        ],
    },
    {
        id: 'grade2-sleep-learning',
        level: 'grade2',
        label: '英検2級',
        title: 'Sleep and Better Learning',
        estimatedMinutes: 6,
        topic: '健康と学習',
        passage: `Many students believe that studying late at night is the fastest way to improve their grades. Before an important test, they may stay awake for several extra hours, hoping to remember more information. However, research suggests that this strategy often has the opposite effect.

Sleep is not simply a time when the brain stops working. While people sleep, the brain organizes information, connects new knowledge with old memories, and removes details that are not useful. This process helps learners use what they studied instead of only recognizing it for a short time.

Lack of sleep also affects attention. A tired student may read the same sentence again and again without understanding it. Even if the student spends many hours at a desk, the quality of study becomes lower. In contrast, a shorter study session after enough sleep can be more effective.

This does not mean students should study less. It means they should plan earlier and protect their sleep before important days. Learning is not only about adding more hours. It is also about giving the brain the conditions it needs to work well.`,
        questions: [
            {
                question: 'What does research suggest about studying very late at night?',
                options: [
                    'It always improves grades quickly.',
                    'It can often have the opposite effect.',
                    'It is useful only for science tests.',
                    'It helps students remove old memories.',
                ],
                answerIndex: 1,
                explanation: '第1段落の research suggests that this strategy often has the opposite effect が根拠です。',
            },
            {
                question: 'According to the passage, what does the brain do during sleep?',
                options: [
                    'It stops all activity until morning.',
                    'It organizes information and connects memories.',
                    'It forgets everything studied that day.',
                    'It reads sentences faster.',
                ],
                answerIndex: 1,
                explanation: '第2段落で、睡眠中に情報を整理し、新しい知識と古い記憶を結びつけるとあります。',
            },
            {
                question: 'What advice does the passage give students?',
                options: [
                    'Plan earlier and protect sleep before important days.',
                    'Never study for more than one hour.',
                    'Study only after midnight.',
                    'Avoid reviewing old knowledge.',
                ],
                answerIndex: 0,
                explanation: '最終段落で、早めに計画して大事な日の前は睡眠を守るべきだと述べています。',
            },
        ],
    },
];

export const getReadingPassageById = (passageId) => (
    READING_PASSAGES.find((passage) => passage.id === passageId) || READING_PASSAGES[0]
);

export const getReadingPassagesByLevel = (level) => (
    level ? READING_PASSAGES.filter((passage) => passage.level === level) : READING_PASSAGES
);
