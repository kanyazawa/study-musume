import { BookType, Calculator, Languages, FlaskConical, Globe } from 'lucide-react';

/**
 * 3階層の学習トピックデータ構造
 * 科目 → 分野 → 単元
 */

export const STUDY_TOPICS = [
    {
        id: 'math',
        name: '数学',
        icon: Calculator,
        color: '#bd10e0',
        categories: [
            {
                id: 'algebra',
                name: '代数',
                units: [
                    { id: 'factorization', name: '因数分解', topic: '因数分解' },
                    { id: 'equations', name: '方程式', topic: '方程式' },
                    { id: 'inequalities', name: '不等式', topic: '不等式' },
                    { id: 'functions', name: '関数', topic: '関数' },
                ]
            },
            {
                id: 'geometry',
                name: '幾何',
                units: [
                    { id: 'triangles', name: '三角形', topic: '三角形' },
                    { id: 'circles', name: '円', topic: '円' },
                    { id: 'pythagorean', name: '三平方の定理', topic: '三平方の定理' },
                ]
            },
            {
                id: 'calculus',
                name: '解析（微積分）',
                units: [
                    { id: 'limits', name: '極限', topic: '極限' },
                    { id: 'derivatives', name: '微分', topic: '微分' },
                    { id: 'integrals', name: '積分', topic: '積分' },
                ]
            },
            {
                id: 'statistics',
                name: '統計・確率',
                units: [
                    { id: 'probability', name: '確率', topic: '確率' },
                    { id: 'stats', name: '統計', topic: '統計' },
                ]
            }
        ]
    },
    {
        id: 'english',
        name: '英語',
        icon: Languages,
        color: '#4a90e2',
        categories: [
            {
                id: 'grammar',
                name: '文法',
                units: [
                    { id: 'be-verb', name: 'be動詞', topic: 'be動詞' },
                    { id: 'general-verb', name: '一般動詞', topic: '一般動詞' },
                    { id: 'plural', name: '複数形', topic: '複数形' },
                    { id: 'pronoun', name: '代名詞', topic: '代名詞' },
                    { id: 'third-person', name: '三単現のs', topic: '三単現のｓ' },
                ]
            },
            {
                id: 'reading',
                name: '読解',
                units: [
                    { id: 'comprehension', name: '長文読解', topic: '長文読解' },
                ]
            },
            {
                id: 'vocabulary',
                name: '語彙',
                units: [
                    { id: 'basic-words', name: '基本単語', topic: '基本単語' },
                ]
            }
        ]
    },
    {
        id: 'japanese',
        name: '国語',
        icon: BookType,
        color: '#f5a623',
        categories: [
            {
                id: 'reading',
                name: '読解',
                units: [
                    { id: 'modern-text', name: '現代文', topic: '現代文' },
                    { id: 'classical', name: '古文', topic: '古文' },
                ]
            },
            {
                id: 'grammar',
                name: '文法',
                units: [
                    { id: 'particles', name: '助詞', topic: '助詞' },
                    { id: 'verbs', name: '動詞', topic: '動詞' },
                ]
            }
        ]
    },
    {
        id: 'science',
        name: '理科',
        icon: FlaskConical,
        color: '#50e3c2',
        categories: [
            {
                id: 'physics',
                name: '物理',
                units: [
                    { id: 'mechanics', name: '力学', topic: '力学' },
                    { id: 'electricity', name: '電気', topic: '電気' },
                ]
            },
            {
                id: 'chemistry',
                name: '化学',
                units: [
                    { id: 'atoms', name: '原子・分子', topic: '原子・分子' },
                    { id: 'reactions', name: '化学反応', topic: '化学反応' },
                ]
            },
            {
                id: 'biology',
                name: '生物',
                units: [
                    { id: 'cells', name: '細胞', topic: '細胞' },
                    { id: 'heredity', name: '遺伝', topic: '遺伝' },
                ]
            }
        ]
    },
    {
        id: 'social',
        name: '社会',
        icon: Globe,
        color: '#e05d44',
        categories: [
            {
                id: 'history',
                name: '歴史',
                units: [
                    { id: 'ancient', name: '古代史', topic: '古代史' },
                    { id: 'medieval', name: '中世史', topic: '中世史' },
                    { id: 'modern', name: '近現代史', topic: '近現代史' },
                ]
            },
            {
                id: 'geography',
                name: '地理',
                units: [
                    { id: 'world-geo', name: '世界地理', topic: '世界地理' },
                    { id: 'japan-geo', name: '日本地理', topic: '日本地理' },
                ]
            },
            {
                id: 'civics',
                name: '公民',
                units: [
                    { id: 'politics', name: '政治', topic: '政治' },
                    { id: 'economics', name: '経済', topic: '経済' },
                ]
            }
        ]
    }
];

// ヘルパー関数：科目を取得
export const getSubjectById = (id) => {
    return STUDY_TOPICS.find(subject => subject.id === id);
};

// ヘルパー関数：カテゴリーを取得
export const getCategoryById = (subjectId, categoryId) => {
    const subject = getSubjectById(subjectId);
    return subject?.categories.find(cat => cat.id === categoryId);
};

// ヘルパー関数：全単元を検索
export const searchUnits = (query) => {
    if (!query) return [];

    const results = [];
    const lowerQuery = query.toLowerCase();

    STUDY_TOPICS.forEach(subject => {
        subject.categories.forEach(category => {
            category.units.forEach(unit => {
                if (unit.name.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        ...unit,
                        subjectName: subject.name,
                        categoryName: category.name,
                        subjectId: subject.id,
                        categoryId: category.id
                    });
                }
            });
        });
    });

    return results;
};
