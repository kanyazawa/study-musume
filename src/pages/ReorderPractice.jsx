import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewQuiz from '../components/ReviewQuiz';
import { applyCharacterEvaluationResult } from '../utils/characterEvaluationUtils';
import { buildReorderPracticeQuestions } from '../data/reorderPracticeQuestions';
import { buildDailyLoopPhasePatch } from '../utils/dailyLoopUtils';
import { applyRelationshipActivity, getRelationshipActivityAffectionDelta } from '../utils/relationshipEventUtils';

const ReorderPractice = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const questions = useMemo(() => buildReorderPracticeQuestions(), []);

    return (
        <div className="review-page review-page-quiz">
            <ReviewQuiz
                questions={questions}
                stats={stats}
                updateStats={updateStats}
                dailyChallenge={null}
                exitLabel="学習メニューへ戻る"
                uiDensity="minimal"
                manualAdvanceOnReorderIncorrect
                onComplete={({ results = [], completed = false } = {}) => {
                    if (completed && results.length > 0 && typeof updateStats === 'function') {
                        updateStats((currentStats) => {
                            const patch = buildDailyLoopPhasePatch(currentStats, 'practice');
                            const dailyLoopStats = patch
                                ? { ...currentStats, ...patch }
                                : currentStats;
                            const correctCount = results.filter((result) => result.isCorrect).length;
                            const relationshipStats = applyRelationshipActivity(dailyLoopStats, {
                                type: 'study',
                                summary: '並べ替え問題を一緒に解いた',
                                detail: correctCount === results.length
                                    ? 'テンポよく組み立てられて、かなり息の合う演習になった。'
                                    : '文を組み立てる時間が、そのまま理解と信頼の積み重ねになっている。',
                                affectionDelta: getRelationshipActivityAffectionDelta(dailyLoopStats, 'study') + (correctCount === results.length ? 4 : 0),
                            }).nextStats;

                            return applyCharacterEvaluationResult(relationshipStats, {
                                activityType: 'practice',
                                answeredCount: results.length,
                                correctCount,
                                accuracy: results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0,
                                completed: true,
                                perfect: correctCount === results.length,
                            }).nextStats;
                        });
                    }

                    navigate('/study');
                }}
            />
        </div>
    );
};

export default ReorderPractice;
