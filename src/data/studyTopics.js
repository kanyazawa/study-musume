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
                    {
                        id: 'mechanics',
                        name: '力学',
                        topic: '力学',
                        chapters: [
                            {
                                id: 'mechanics_ch1',
                                name: '第1章：最速の称号',
                                topic: '速度・等加速度運動',
                                sections: [
                                    { id: 'ch1_sec1', name: '平均の速度 vs 瞬間の速度', topic: '平均の速度' },
                                    { id: 'ch1_sec2', name: '等加速度直線運動の3公式', topic: '等加速度直線運動' },
                                    { id: 'ch1_sec3', name: '自由落下・投げ上げ', topic: '自由落下' }
                                ]
                            },
                            {
                                id: 'mechanics_ch2',
                                name: '第2章：世界のルール',
                                topic: '運動の3法則',
                                sections: [
                                    { id: 'ch2_sec1', name: '慣性の法則', topic: '慣性の法則' },
                                    { id: 'ch2_sec2', name: '運動方程式', topic: '運動方程式' },
                                    { id: 'ch2_sec3', name: '作用・反作用の法則', topic: '作用・反作用の法則' }
                                ]
                            },
                            {
                                id: 'mechanics_ch3',
                                name: '第3章：見えない力',
                                topic: '摩擦・弾性・浮力',
                                sections: [
                                    { id: 'ch3_sec1', name: '静止摩擦力と動摩擦力', topic: '摩擦力' },
                                    { id: 'ch3_sec2', name: 'バネの力（フックの法則）', topic: '弾性力' },
                                    { id: 'ch3_sec3', name: '浮力の原理', topic: '浮力' }
                                ]
                            },
                            {
                                id: 'mechanics_ch4',
                                name: '第4章：エネルギーの守護者',
                                topic: '仕事とエネルギー',
                                sections: [
                                    { id: 'ch4_sec1', name: '仕事の定義', topic: '仕事' },
                                    { id: 'ch4_sec2', name: '運動エネルギーと位置エネルギー', topic: '力学的エネルギー' },
                                    { id: 'ch4_sec3', name: '力学的エネルギー保存の法則', topic: 'エネルギー保存則' }
                                ]
                            },
                            {
                                id: 'mechanics_ch5',
                                name: '第5章：一瞬の衝撃',
                                topic: '運動量と力積',
                                sections: [
                                    { id: 'ch5_sec1', name: '運動量の保存', topic: '運動量保存則' },
                                    { id: 'ch5_sec2', name: '力積と運動量の関係', topic: '力積' },
                                    { id: 'ch5_sec3', name: 'はね返り係数', topic: 'はね返り係数' }
                                ]
                            },
                            {
                                id: 'mechanics_ch6',
                                name: '第6章：円舞と振動',
                                topic: '円運動・単振動・万有引力',
                                sections: [
                                    { id: 'ch6_sec1', name: '等速円運動', topic: '等速円運動' },
                                    { id: 'ch6_sec2', name: '単振動', topic: '単振動' },
                                    { id: 'ch6_sec3', name: '万有引力の法則', topic: '万有引力' }
                                ]
                            },
                        ]
                    },
                    { id: 'electricity', name: '電気', topic: '電気' },
                ]
            },
            {
                id: 'chemistry',
                name: '化学',
                units: [
                    {
                        id: 'chemistry_master',
                        name: '化学マスター',
                        topic: '化学',
                        chapters: [
                            {
                                id: 'chem_ch1',
                                name: '第1章：微粒子の世界',
                                topic: '原子・結合',
                                sections: [
                                    { id: 'chem_ch1_sec1', name: '原子の構造とイオン', topic: '原子・イオン' },
                                    { id: 'chem_ch1_sec2', name: '周期表と元素の性質', topic: '周期表' },
                                    { id: 'chem_ch1_sec3', name: '化学結合（共有・イオン・金属）', topic: '化学結合' }
                                ]
                            },
                            {
                                id: 'chem_ch2',
                                name: '第2章：物質量の探求',
                                topic: '物質量・化学反応式',
                                sections: [
                                    { id: 'chem_ch2_sec1', name: '原子量・分子量と物質量(mol)', topic: '物質量' },
                                    { id: 'chem_ch2_sec2', name: '化学反応式の計算', topic: '化学反応式' },
                                    { id: 'chem_ch2_sec3', name: '濃度調整', topic: '溶液濃度' }
                                ]
                            },
                            {
                                id: 'chem_ch3',
                                name: '第3章：変化の法則',
                                topic: '酸塩基・酸化還元',
                                sections: [
                                    { id: 'chem_ch3_sec1', name: '酸と塩基・pH', topic: '酸と塩基' },
                                    { id: 'chem_ch3_sec2', name: '中和滴定', topic: '中和滴定' },
                                    { id: 'chem_ch3_sec3', name: '酸化還元反応と電池', topic: '酸化還元' }
                                ]
                            },
                            {
                                id: 'chem_ch4',
                                name: '第4章：状態の魔法',
                                topic: '気体・溶液の性質',
                                sections: [
                                    { id: 'chem_ch4_sec1', name: '物質の三態と状態変化', topic: '物質の三態' },
                                    { id: 'chem_ch4_sec2', name: '気体の法則（ボイル・シャルル）', topic: '気体の法則' },
                                    { id: 'chem_ch4_sec3', name: '気体の状態方程式', topic: '状態方程式' }
                                ]
                            },
                            {
                                id: 'chem_ch5',
                                name: '第5章：反応の速度と平衡',
                                topic: '反応速度・化学平衡',
                                sections: [
                                    { id: 'chem_ch5_sec1', name: '反応速度と触媒', topic: '反応速度' },
                                    { id: 'chem_ch5_sec2', name: '化学平衡', topic: '化学平衡' },
                                    { id: 'chem_ch5_sec3', name: '電離平衡', topic: '電離平衡' }
                                ]
                            },
                            {
                                id: 'chem_ch6',
                                name: '第6章：有機の迷宮',
                                topic: '有機化学',
                                sections: [
                                    { id: 'chem_ch6_sec1', name: '有機化合物の特徴と分類', topic: '有機化合物' },
                                    { id: 'chem_ch6_sec2', name: '脂肪族炭化水素', topic: '脂肪族炭化水素' },
                                    { id: 'chem_ch6_sec3', name: '芳香族化合物', topic: '芳香族化合物' }
                                ]
                            },
                        ]
                    }
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
