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
        sheetGid: '72508121', // デフォルト数学シートのgid
        categories: [
            {
                id: 'jh_1',
                name: '中学1年',
                // sheetGid: 'xxxx', // 中学1年用のシートGIDがあればここに記述（優先されます）
                units: [
                    {
                        id: 'jh1_numbers',
                        name: '数と式',
                        topic: '数と式',
                        chapters: [
                            {
                                id: 'jh1_pos_neg', name: '正の数・負の数', topic: '正の数・負の数',
                                sections: [
                                    { id: 'jh1_pos_neg_add', name: '正負の数の加減', topic: '正負の数の加減' },
                                    { id: 'jh1_pos_neg_mul', name: '正負の数の乗除', topic: '正負の数の乗除' }
                                ]
                            },
                            {
                                id: 'jh1_alg_expr', name: '文字を用いた式', topic: '文字を用いた式',
                                sections: [
                                    { id: 'jh1_alg_repr', name: '文字式の表し方', topic: '文字式の表し方' },
                                    { id: 'jh1_alg_calc', name: '文字式の計算', topic: '文字式の計算' }
                                ]
                            },
                            {
                                id: 'jh1_eq', name: '一元一次方程式', topic: '一元一次方程式',
                                sections: [
                                    { id: 'jh1_eq_solve', name: '方程式の解き方', topic: '方程式の解き方' },
                                    { id: 'jh1_eq_app', name: '方程式の利用', topic: '方程式の利用' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh1_geometry',
                        name: '図形',
                        topic: '図形',
                        chapters: [
                            {
                                id: 'jh1_plane', name: '平面図形', topic: '平面図形',
                                sections: [
                                    { id: 'jh1_plane_move', name: '図形の移動', topic: '図形の移動' },
                                    { id: 'jh1_plane_construct', name: '基本の作図', topic: '基本の作図' },
                                    { id: 'jh1_plane_circle', name: 'おうぎ形', topic: 'おうぎ形' }
                                ]
                            },
                            {
                                id: 'jh1_spatial', name: '空間図形', topic: '空間図形',
                                sections: [
                                    { id: 'jh1_spatial_types', name: '立体の種類と見取図', topic: '立体の種類と見取図' },
                                    { id: 'jh1_spatial_vol', name: '表面積と体積', topic: '表面積と体積' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh1_functions',
                        name: '関数',
                        topic: '関数',
                        chapters: [
                            {
                                id: 'jh1_prop', name: '比例・反比例', topic: '比例・反比例',
                                sections: [
                                    { id: 'jh1_prop_direct', name: '比例', topic: '比例' },
                                    { id: 'jh1_prop_inverse', name: '反比例', topic: '反比例' },
                                    { id: 'jh1_prop_graph', name: '比例・反比例のグラフ', topic: '比例・反比例のグラフ' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh1_data',
                        name: '資料の活用',
                        topic: '資料の活用',
                        chapters: [
                            {
                                id: 'jh1_data_dist', name: '資料の散らばりと代表値', topic: '資料の散らばりと代表値',
                                sections: [
                                    { id: 'jh1_data_hist', name: '度数分布とヒストグラム', topic: '度数分布とヒストグラム' },
                                    { id: 'jh1_data_repr', name: '代表値（平均値・中央値・最頻値）', topic: '代表値' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'jh_2',
                name: '中学2年',
                units: [
                    {
                        id: 'jh2_numbers',
                        name: '数と式',
                        topic: '式の計算',
                        chapters: [
                            {
                                id: 'jh2_calc', name: '文字式を用いた式の四則計算', topic: '文字式を用いた式の四則計算',
                                sections: [
                                    { id: 'jh2_calc_poly', name: '多項式の計算', topic: '多項式の計算' },
                                    { id: 'jh2_calc_proof', name: '文字式の利用', topic: '文字式の利用' }
                                ]
                            },
                            {
                                id: 'jh2_simultaneous', name: '連立二元一次方程式', topic: '連立二元一次方程式',
                                sections: [
                                    { id: 'jh2_simul_solve', name: '連立方程式の解き方', topic: '連立方程式の解き方' },
                                    { id: 'jh2_simul_app', name: '連立方程式の利用', topic: '連立方程式の利用' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh2_geometry',
                        name: '図形',
                        topic: '図形',
                        chapters: [
                            {
                                id: 'jh2_parallel', name: '平面図形と平行線の性質', topic: '平面図形と平行線の性質',
                                sections: [
                                    { id: 'jh2_angle', name: '角度（対頂角・同位角・錯角）', topic: '角度の性質' },
                                    { id: 'jh2_triangle', name: '三角形の内角と外角', topic: '三角形の内角と外角' },
                                    { id: 'jh2_polygon', name: '多角形の内角の和', topic: '多角形の内角の和' }
                                ]
                            },
                            {
                                id: 'jh2_congruence', name: '図形の合同', topic: '図形の合同',
                                sections: [
                                    { id: 'jh2_cong_cond', name: '三角形の合同条件', topic: '三角形の合同条件' },
                                    { id: 'jh2_proof', name: '証明', topic: '図形の証明' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh2_functions',
                        name: '関数',
                        topic: '一次関数',
                        chapters: [
                            {
                                id: 'jh2_linear', name: '一次関数', topic: '一次関数',
                                sections: [
                                    { id: 'jh2_linear_graph', name: '一次関数のグラフ', topic: '一次関数のグラフ' },
                                    { id: 'jh2_linear_eq', name: '一次関数と方程式', topic: '一次関数と方程式' },
                                    { id: 'jh2_linear_app', name: '一次関数の利用', topic: '一次関数の利用' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh2_data',
                        name: '資料の活用',
                        topic: '確率',
                        chapters: [
                            {
                                id: 'jh2_prob', name: '確率', topic: '確率',
                                sections: [
                                    { id: 'jh2_prob_meaning', name: '確率の意味', topic: '確率の意味' },
                                    { id: 'jh2_prob_calc', name: '確率の求め方', topic: '確率の求め方' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'jh_3',
                name: '中学3年',
                units: [
                    {
                        id: 'jh3_numbers',
                        name: '数と式',
                        topic: '数と式',
                        chapters: [
                            {
                                id: 'jh3_roots', name: '平方根', topic: '平方根',
                                sections: [
                                    { id: 'jh3_roots_meaning', name: '平方根の意味', topic: '平方根の意味' },
                                    { id: 'jh3_roots_calc', name: '根号を含む式の計算', topic: '根号を含む式の計算' }
                                ]
                            },
                            {
                                id: 'jh3_expansion', name: '式の展開と因数分解', topic: '式の展開と因数分解',
                                sections: [
                                    { id: 'jh3_expand', name: '式の展開', topic: '式の展開' },
                                    { id: 'jh3_factor', name: '因数分解', topic: '因数分解' }
                                ]
                            },
                            {
                                id: 'jh3_quad_eq', name: '二次方程式', topic: '二次方程式',
                                sections: [
                                    { id: 'jh3_quad_solve', name: '二次方程式の解き方', topic: '二次方程式の解き方' },
                                    { id: 'jh3_quad_app', name: '二次方程式の利用', topic: '二次方程式の利用' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh3_geometry',
                        name: '図形',
                        topic: '図形',
                        chapters: [
                            {
                                id: 'jh3_similarity', name: '図形の相似', topic: '図形の相似',
                                sections: [
                                    { id: 'jh3_sim_cond', name: '相似条件', topic: '相似条件' },
                                    { id: 'jh3_sim_ratio', name: '相似比と面積比・体積比', topic: '相似比と面積比' }
                                ]
                            },
                            {
                                id: 'jh3_circle', name: '円周角と中心角', topic: '円周角と中心角',
                                sections: [
                                    { id: 'jh3_circle_thm', name: '円周角の定理', topic: '円周角の定理' },
                                    { id: 'jh3_circle_app', name: '円周角の定理の利用', topic: '円周角の定理の利用' }
                                ]
                            },
                            {
                                id: 'jh3_pythagoras', name: '三平方の定理', topic: '三平方の定理',
                                sections: [
                                    { id: 'jh3_pyth_proof', name: '三平方の定理の証明', topic: '三平方の定理の証明' },
                                    { id: 'jh3_pyth_app', name: '三平方の定理の利用', topic: '三平方の定理の利用' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh3_functions',
                        name: '関数',
                        topic: '関数',
                        chapters: [
                            {
                                id: 'jh3_y_ax2', name: '関数 y=ax²', topic: '関数 y=ax²',
                                sections: [
                                    { id: 'jh3_y_ax2_graph', name: 'y=ax²のグラフ', topic: 'y=ax²のグラフ' },
                                    { id: 'jh3_y_ax2_change', name: 'y=ax²の変化の割合', topic: 'y=ax²の変化の割合' },
                                    { id: 'jh3_y_ax2_app', name: '関数y=ax²の利用', topic: '関数y=ax²の利用' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'jh3_data',
                        name: '資料の活用',
                        topic: '標本調査',
                        chapters: [
                            {
                                id: 'jh3_sampling', name: '標本調査', topic: '標本調査',
                                sections: [
                                    { id: 'jh3_sampling_meaning', name: '全数調査と標本調査', topic: '全数調査と標本調査' },
                                    { id: 'jh3_sampling_method', name: '標本調査の方法', topic: '標本調査の方法' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'math_1',
                name: '数学I',
                units: [
                    {
                        id: 'm1_numbers',
                        name: '数と式',
                        topic: '数と式',
                        chapters: [
                            {
                                id: 'm1_sets', name: '数と集合', topic: '数と集合',
                                sections: [
                                    { id: 'm1_real', name: '実数', topic: '実数' },
                                    { id: 'm1_set', name: '集合', topic: '集合' }
                                ]
                            },
                            {
                                id: 'm1_expr', name: '式', topic: '式',
                                sections: [
                                    { id: 'm1_expand_factor', name: '式の展開と因数分解', topic: '式の展開と因数分解（数学I）' },
                                    { id: 'm1_linear_ineq', name: '一次不等式', topic: '一次不等式' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm1_geometry',
                        name: '図形と計量',
                        topic: '図形と計量',
                        chapters: [
                            {
                                id: 'm1_trig_ratio', name: '三角比', topic: '三角比',
                                sections: [
                                    { id: 'm1_trig_def', name: '三角比の定義', topic: '三角比の定義' },
                                    { id: 'm1_trig_ext', name: '三角比の拡張', topic: '三角比の拡張' },
                                    { id: 'm1_trig_formula', name: '正弦定理・余弦定理', topic: '正弦定理・余弦定理' }
                                ]
                            },
                            {
                                id: 'm1_metric', name: '図形の計量', topic: '図形の計量',
                                sections: [
                                    { id: 'm1_area', name: '三角形の面積', topic: '三角形の面積' },
                                    { id: 'm1_spatial_metric', name: '空間図形の計量', topic: '空間図形の計量' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm1_quad_func',
                        name: '二次関数',
                        topic: '二次関数',
                        chapters: [
                            {
                                id: 'm1_quad_graph', name: '二次関数とそのグラフ', topic: '二次関数とそのグラフ',
                                sections: [
                                    { id: 'm1_quad_standard', name: '二次関数のグラフと平行移動', topic: '二次関数のグラフと平行移動' },
                                    { id: 'm1_quad_max_min', name: '二次関数の最大・最小', topic: '二次関数の最大・最小' }
                                ]
                            },
                            {
                                id: 'm1_quad_change', name: '二次関数の値の変化', topic: '二次関数の値の変化',
                                sections: [
                                    { id: 'm1_quad_eq2', name: '二次方程式と二次関数', topic: '二次方程式と二次関数' },
                                    { id: 'm1_quad_ineq2', name: '二次不等式と二次関数', topic: '二次不等式と二次関数' }
                                ]
                            },
                            {
                                id: 'm1_quad_ineq', name: '二次不等式', topic: '二次不等式',
                                sections: [
                                    { id: 'm1_ineq_solve', name: '二次不等式の解法', topic: '二次不等式の解法' },
                                    { id: 'm1_ineq_app', name: '二次不等式の応用', topic: '二次不等式の応用' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm1_data',
                        name: 'データの分析',
                        topic: 'データの分析',
                        chapters: [
                            {
                                id: 'm1_data_disp', name: 'データの散らばり', topic: 'データの散らばり',
                                sections: [
                                    { id: 'm1_data_variance', name: '分散と標準偏差', topic: '分散と標準偏差' },
                                    { id: 'm1_data_box', name: '四分位数と箱ひげ図', topic: '四分位数と箱ひげ図' }
                                ]
                            },
                            {
                                id: 'm1_data_corr', name: 'データの相関', topic: 'データの相関',
                                sections: [
                                    { id: 'm1_scatter', name: '散布図と相関係数', topic: '散布図と相関係数' },
                                    { id: 'm1_regression', name: '回帰直線', topic: '回帰直線' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'math_2',
                name: '数学II',
                units: [
                    {
                        id: 'm2_various_expr',
                        name: 'いろいろな式',
                        topic: 'いろいろな式',
                        chapters: [
                            {
                                id: 'm2_expr_proof', name: '式と証明', topic: '式と証明',
                                sections: [
                                    { id: 'm2_binom', name: '二項定理', topic: '二項定理' },
                                    { id: 'm2_proof_method', name: '等式・不等式の証明', topic: '等式・不等式の証明' }
                                ]
                            },
                            {
                                id: 'm2_high_eq', name: '高次方程式', topic: '高次方程式',
                                sections: [
                                    { id: 'm2_complex', name: '複素数と方程式', topic: '複素数と方程式' },
                                    { id: 'm2_factor_thm', name: '因数定理・剰余の定理', topic: '因数定理・剰余の定理' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm2_fig_eq',
                        name: '図形と方程式',
                        topic: '図形と方程式',
                        chapters: [
                            {
                                id: 'm2_line_circle', name: '直線と円', topic: '直線と円',
                                sections: [
                                    { id: 'm2_point_line', name: '点と直線', topic: '点と直線' },
                                    { id: 'm2_circle_eq', name: '円の方程式', topic: '円の方程式' }
                                ]
                            },
                            {
                                id: 'm2_locus', name: '軌跡と領域', topic: '軌跡と領域',
                                sections: [
                                    { id: 'm2_locus_def', name: '軌跡', topic: '軌跡' },
                                    { id: 'm2_region', name: '不等式の表す領域', topic: '不等式の表す領域' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm2_exp_log',
                        name: '指数関数・対数関数',
                        topic: '指数関数・対数関数',
                        chapters: [
                            {
                                id: 'm2_exp', name: '指数関数', topic: '指数関数',
                                sections: [
                                    { id: 'm2_exp_law', name: '指数の拡張', topic: '指数の拡張' },
                                    { id: 'm2_exp_graph', name: '指数関数のグラフ', topic: '指数関数のグラフ' }
                                ]
                            },
                            {
                                id: 'm2_log', name: '対数関数', topic: '対数関数',
                                sections: [
                                    { id: 'm2_log_def', name: '対数の定義と性質', topic: '対数の定義と性質' },
                                    { id: 'm2_log_graph', name: '対数関数のグラフ', topic: '対数関数のグラフ' },
                                    { id: 'm2_common_log', name: '常用対数', topic: '常用対数' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm2_trig',
                        name: '三角関数',
                        topic: '三角関数',
                        chapters: [
                            {
                                id: 'm2_angle', name: '角の拡張', topic: '角の拡張',
                                sections: [
                                    { id: 'm2_radian', name: '弧度法', topic: '弧度法' },
                                    { id: 'm2_general_angle', name: '一般角', topic: '一般角' }
                                ]
                            },
                            {
                                id: 'm2_trig_func', name: '三角関数', topic: '三角関数',
                                sections: [
                                    { id: 'm2_trig_graph', name: '三角関数のグラフ', topic: '三角関数のグラフ' },
                                    { id: 'm2_trig_prop', name: '三角関数の性質', topic: '三角関数の性質' }
                                ]
                            },
                            {
                                id: 'm2_trig_add', name: '三角関数の加法定理', topic: '三角関数の加法定理',
                                sections: [
                                    { id: 'm2_add_thm', name: '加法定理', topic: '加法定理' },
                                    { id: 'm2_double_half', name: '2倍角・半角の公式', topic: '2倍角・半角の公式' },
                                    { id: 'm2_trig_synth', name: '三角関数の合成', topic: '三角関数の合成' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm2_calculus',
                        name: '微分・積分の考え',
                        topic: '微分・積分の考え',
                        chapters: [
                            {
                                id: 'm2_diff', name: '微分の考え', topic: '微分の考え',
                                sections: [
                                    { id: 'm2_limit', name: '極限値と微分係数', topic: '極限値と微分係数' },
                                    { id: 'm2_deriv', name: '導関数', topic: '導関数（数学II）' },
                                    { id: 'm2_tangent', name: '接線の方程式', topic: '接線の方程式' },
                                    { id: 'm2_increase', name: '関数の増減と極値', topic: '関数の増減と極値' }
                                ]
                            },
                            {
                                id: 'm2_integ', name: '積分の考え', topic: '積分の考え',
                                sections: [
                                    { id: 'm2_indef', name: '不定積分', topic: '不定積分（数学II）' },
                                    { id: 'm2_defin', name: '定積分', topic: '定積分（数学II）' },
                                    { id: 'm2_area_calc', name: '面積', topic: '定積分と面積' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'math_3',
                name: '数学III',
                units: [
                    {
                        id: 'm3_plane_complex',
                        name: '平面上の曲線と複素数平面',
                        topic: '平面上の曲線と複素数平面',
                        chapters: [
                            {
                                id: 'm3_plane_curves', name: '平面上の曲線', topic: '平面上の曲線',
                                sections: [
                                    { id: 'm3_conic', name: '二次曲線（楕円・双曲線・放物線）', topic: '二次曲線' },
                                    { id: 'm3_parametric', name: '媒介変数表示と極座標', topic: '媒介変数表示と極座標' }
                                ]
                            },
                            {
                                id: 'm3_complex_plane', name: '複素数平面', topic: '複素数平面',
                                sections: [
                                    { id: 'm3_complex_calc', name: '複素数の演算と極形式', topic: '複素数の極形式' },
                                    { id: 'm3_de_moivre', name: 'ド・モアブルの定理', topic: 'ド・モアブルの定理' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm3_limits',
                        name: '極限',
                        topic: '極限',
                        chapters: [
                            {
                                id: 'm3_seq_limit', name: '数列とその極限', topic: '数列とその極限',
                                sections: [
                                    { id: 'm3_seq_conv', name: '数列の収束・発散', topic: '数列の収束・発散' },
                                    { id: 'm3_infinite_series', name: '無限級数', topic: '無限級数' }
                                ]
                            },
                            {
                                id: 'm3_func_limit', name: '関数とその極限', topic: '関数とその極限',
                                sections: [
                                    { id: 'm3_func_cont', name: '関数の連続性', topic: '関数の連続性' },
                                    { id: 'm3_func_lim_calc', name: '関数の極限の計算', topic: '関数の極限の計算' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm3_diff',
                        name: '微分法',
                        topic: '微分法',
                        chapters: [
                            {
                                id: 'm3_diff_calc', name: '導関数', topic: '導関数',
                                sections: [
                                    { id: 'm3_diff_various', name: 'いろいろな関数の導関数', topic: 'いろいろな関数の導関数' },
                                    { id: 'm3_diff_composite', name: '合成関数・逆関数の微分', topic: '合成関数の微分' }
                                ]
                            },
                            {
                                id: 'm3_diff_app', name: '導関数の応用', topic: '導関数の応用',
                                sections: [
                                    { id: 'm3_tangent_normal', name: '接線・法線', topic: '接線と法線' },
                                    { id: 'm3_max_min', name: '関数の極値と最大最小', topic: '関数の極値と最大最小' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'm3_integ',
                        name: '積分法',
                        topic: '積分法',
                        chapters: [
                            {
                                id: 'm3_integ_calc', name: '不定積分と定積分', topic: '不定積分と定積分',
                                sections: [
                                    { id: 'm3_subst', name: '置換積分法', topic: '置換積分法' },
                                    { id: 'm3_partial', name: '部分積分法', topic: '部分積分法' }
                                ]
                            },
                            {
                                id: 'm3_integ_app', name: '積分の応用', topic: '積分の応用',
                                sections: [
                                    { id: 'm3_area3', name: '面積', topic: '面積（数学III）' },
                                    { id: 'm3_volume', name: '体積', topic: '体積（数学III）' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'math_a',
                name: '数学A',
                units: [
                    {
                        id: 'ma_cases_prob',
                        name: '場合の数と確率',
                        topic: '場合の数と確率',
                        chapters: [
                            {
                                id: 'ma_cases', name: '場合の数', topic: '場合の数',
                                sections: [
                                    { id: 'ma_perm', name: '順列', topic: '順列' },
                                    { id: 'ma_comb', name: '組合せ', topic: '組合せ' }
                                ]
                            },
                            {
                                id: 'ma_prob', name: '確率', topic: '確率',
                                sections: [
                                    { id: 'ma_prob_basic', name: '確率の基本性質', topic: '確率の基本性質' },
                                    { id: 'ma_prob_indep', name: '独立な試行と確率', topic: '独立な試行と確率' },
                                    { id: 'ma_prob_cond', name: '条件付き確率', topic: '条件付き確率' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ma_geometry',
                        name: '図形の性質',
                        topic: '図形の性質',
                        chapters: [
                            {
                                id: 'ma_plane_prop', name: '平面図形', topic: '平面図形',
                                sections: [
                                    { id: 'ma_triangle_prop', name: '三角形の性質', topic: '三角形の性質' },
                                    { id: 'ma_circle_prop', name: '円の性質', topic: '円の性質' }
                                ]
                            },
                            {
                                id: 'ma_spatial_prop', name: '空間図形', topic: '空間図形',
                                sections: [
                                    { id: 'ma_spatial_pos', name: '空間における位置関係', topic: '空間における位置関係' },
                                    { id: 'ma_polyhedron', name: '多面体', topic: '多面体' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ma_integers',
                        name: '整数の性質',
                        topic: '整数の性質',
                        chapters: [
                            {
                                id: 'ma_div_mult', name: '約数と倍数', topic: '約数と倍数',
                                sections: [
                                    { id: 'ma_divisor', name: '約数と倍数の性質', topic: '約数と倍数の性質' },
                                    { id: 'ma_gcd_lcm', name: '最大公約数と最小公倍数', topic: '最大公約数と最小公倍数' },
                                    { id: 'ma_euclidean', name: 'ユークリッドの互除法', topic: 'ユークリッドの互除法' }
                                ]
                            },
                            {
                                id: 'ma_int_app', name: '整数の性質の応用', topic: '整数の性質の応用',
                                sections: [
                                    { id: 'ma_modular', name: '合同式', topic: '合同式' },
                                    { id: 'ma_numeral', name: 'n進法', topic: 'n進法' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'math_b',
                name: '数学B',
                units: [
                    {
                        id: 'mb_stats',
                        name: '確率分布と統計的な推測',
                        topic: '確率分布と統計的な推測',
                        chapters: [
                            {
                                id: 'mb_prob_dist', name: '確率分布', topic: '確率分布',
                                sections: [
                                    { id: 'mb_discrete', name: '確率変数と確率分布', topic: '確率変数と確率分布' },
                                    { id: 'mb_binomial', name: '二項分布', topic: '二項分布' },
                                    { id: 'mb_normal', name: '正規分布', topic: '正規分布' }
                                ]
                            },
                            {
                                id: 'mb_stat_inf', name: '統計的な推測', topic: '統計的な推測',
                                sections: [
                                    { id: 'mb_estimation', name: '母集団と標本・推定', topic: '母集団と標本・推定' },
                                    { id: 'mb_hypothesis', name: '仮説検定', topic: '仮説検定' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'mb_sequence',
                        name: '数列',
                        topic: '数列',
                        chapters: [
                            {
                                id: 'mb_seq_sum', name: '数列とその和', topic: '数列とその和',
                                sections: [
                                    { id: 'mb_arith', name: '等差数列', topic: '等差数列' },
                                    { id: 'mb_geom', name: '等比数列', topic: '等比数列' },
                                    { id: 'mb_sigma', name: 'Σの計算', topic: 'Σの計算' }
                                ]
                            },
                            {
                                id: 'mb_recurrence', name: '漸化式と数学的帰納法', topic: '漸化式と数学的帰納法',
                                sections: [
                                    { id: 'mb_recur', name: '漸化式', topic: '漸化式' },
                                    { id: 'mb_induction', name: '数学的帰納法', topic: '数学的帰納法' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'mb_vectors',
                        name: 'ベクトル',
                        topic: 'ベクトル',
                        chapters: [
                            {
                                id: 'mb_plane_vec', name: '平面上のベクトル', topic: '平面上のベクトル',
                                sections: [
                                    { id: 'mb_vec_ops', name: 'ベクトルの演算', topic: 'ベクトルの演算' },
                                    { id: 'mb_vec_comp', name: 'ベクトルの成分', topic: 'ベクトルの成分' },
                                    { id: 'mb_inner_prod', name: 'ベクトルの内積', topic: 'ベクトルの内積' }
                                ]
                            },
                            {
                                id: 'mb_space_vec', name: '空間座標とベクトル', topic: '空間座標とベクトル',
                                sections: [
                                    { id: 'mb_space_coord', name: '空間座標', topic: '空間座標' },
                                    { id: 'mb_space_inner', name: '空間ベクトルの内積', topic: '空間ベクトルの内積' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'math_app',
                name: '数学活用',
                units: [
                    {
                        id: 'mapp_activity',
                        name: '数学と人間の活動',
                        topic: '数学と人間の活動',
                        chapters: [
                            { id: 'mapp_history', name: '数や図形と人間の活動', topic: '数や図形と人間の活動' },
                            { id: 'mapp_game', name: '遊びの中の数学', topic: '遊びの中の数学' }
                        ]
                    },
                    {
                        id: 'mapp_society',
                        name: '社会生活における数理的な考察',
                        topic: '社会生活における数理的な考察',
                        chapters: [
                            { id: 'mapp_life', name: '社会生活と数学', topic: '社会生活と数学' },
                            { id: 'mapp_design', name: '数学的な表現の工夫', topic: '数学的な表現の工夫' },
                            { id: 'mapp_data', name: 'データの分析', topic: 'データの分析' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'english',
        name: '英語',
        icon: Languages,
        color: '#4a90e2',
        sheetGid: '552880676', // 英語シートのgid
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
        sheetGid: '207668141', // 国語シートのgid
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
        sheetGid: '1543626185', // 理科シートのgid
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
        sheetGid: '1074900660', // 社会シートのgid
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
