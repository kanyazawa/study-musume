import React, { useState } from 'react';
import { updateReviewResult } from '../utils/reviewUtils';
import CharacterReview from '../assets/images/character_review_noah.png';
import BgClassroom from '../assets/images/bg_classroom.png';
import './ReviewQuiz.css';

/**
 * ReviewQuiz Component
 * 復習用のクイズコンポーネント
 */
const ReviewQuiz = ({ questions, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
    const [results, setResults] = useState([]); // { questionId, isCorrect }
    const [isCompleted, setIsCompleted] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [showNextButton, setShowNextButton] = useState(false);

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    const handleNextQuestion = () => {
        if (currentIndex + 1 < questions.length) {
            // Next question
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setFeedback(null);
            setInputValue('');
            setShowNextButton(false);
        } else {
            // Quiz complete
            setTimeout(() => {
                // Show completion screen
                setIsCompleted(true);
            }, 500);
        }
    };

    const handleAnswerSelect = (answer) => {
        if (feedback) return; // Already answered

        setSelectedAnswer(answer);
        const isCorrect = answer === currentQuestion.correctAnswer;

        // Update review result
        updateReviewResult(currentQuestion.id, isCorrect);

        // Track result
        setResults(prev => [...prev, {
            questionId: currentQuestion.id,
            isCorrect
        }]);

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        // If it's a simple review (no options), show next button instead of auto-advance for incorrect answers
        // so user can see the correct answer
        if (!currentQuestion.options && !isCorrect) {
            setShowNextButton(true);
        } else {
            // Auto-advance after delay
            setTimeout(() => {
                handleNextQuestion();
            }, 1500);
        }
    };

    const handleInputSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Simple normalization for answer check
        const normalizedInput = inputValue.trim().toLowerCase();
        const normalizedCorrect = currentQuestion.correctAnswer.toLowerCase();

        const isCorrect = normalizedInput === normalizedCorrect;

        // If correct, pass the input. If wrong, pass 'wrong' to differentiate but logic handles boolean
        // Actually handleAnswerSelect expects 'answer' string, but logic uses it to compare.
        // We can just pass the input value and let the logic decide based on comparison result we calculate here?
        // No, let's reuse handleAnswerSelect logic but we need to pass the answer that matches/mismatches properly?
        // Wait, handleAnswerSelect compares `answer === currentQuestion.correctAnswer`.

        // If user input matches, call with correctAnswer. If not, call with input value.
        handleAnswerSelect(isCorrect ? currentQuestion.correctAnswer : inputValue);
    };

    const correctCount = results.filter(r => r.isCorrect).length;

    if (isCompleted) {
        return (
            <div className="review-quiz completion-screen">
                <div className="completion-content">
                    <div className="completion-icon">🎉</div>
                    <h2>復習完了！</h2>
                    <div className="completion-stats">
                        <div className="stat-circle">
                            <span className="stat-value">{correctCount}</span>
                            <span className="stat-label">正解</span>
                        </div>
                        <div className="stat-divider">/</div>
                        <div className="stat-total">
                            <span className="total-value">{results.length}</span>
                            <span className="total-label">問</span>
                        </div>
                    </div>
                    <p className="completion-message">
                        {correctCount === results.length ? '完璧です！素晴らしい！' :
                            correctCount >= results.length / 2 ? 'よく頑張りました！' :
                                '次はもっと頑張りましょう！'}
                    </p>
                    <button className="finish-btn" onClick={() => onComplete(results)}>
                        復習リストに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="review-quiz-scene">
            {/* Background */}
            <div
                className="room-background"
                style={{ backgroundImage: `url(${BgClassroom})` }}
            ></div>

            {/* Character */}
            <div className="character-figure">
                <img
                    src={CharacterReview}
                    alt="Character"
                    className="char-image-dialogue"
                />
            </div>

            {/* Feedback Overlay */}
            {feedback && (
                <div className={`feedback-overlay ${feedback}`}>
                    {feedback === 'correct' ? '⭕ 正解！' : '❌ 残念...'}
                </div>
            )}

            {/* Dialogue Box (Quiz Area) */}
            <div className="dialogue-box review-box">
                <div className="name-tag">
                    Review Quiz ({currentIndex + 1} / {questions.length})
                </div>

                <div className="dialogue-content-area">
                    <div className="quiz-subject-tag">{currentQuestion.subject}</div>
                    <div className="quiz-question-text">
                        {currentQuestion.questionText}
                    </div>

                    {/* Answer Area */}
                    <div className="quiz-options-container">
                        {currentQuestion.options ? (
                            /* Option Buttons */
                            currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    className={`quiz-btn ${selectedAnswer === option ? 'selected' : ''
                                        } ${feedback && option === currentQuestion.correctAnswer
                                            ? 'correct-answer'
                                            : ''
                                        } ${feedback && selectedAnswer === option && !feedback.includes('correct')
                                            ? 'wrong-answer'
                                            : ''
                                        }`}
                                    onClick={() => handleAnswerSelect(option)}
                                    disabled={feedback !== null}
                                >
                                    {index + 1}. {option}
                                </button>
                            ))
                        ) : (
                            /* Input Form for No Options */
                            <div className="review-answer-input-container">
                                {!feedback ? (
                                    <form onSubmit={handleInputSubmit} className="quiz-input-form">
                                        <input
                                            type="text"
                                            className="quiz-input-field"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="答えを入力してね"
                                            autoFocus
                                        />
                                        <button type="submit" className="quiz-submit-btn" disabled={!inputValue.trim()}>
                                            回答する
                                        </button>
                                    </form>
                                ) : (
                                    <div className="review-answer-result">
                                        <div className="answer-reveal">
                                            <span className="label">正解:</span> {currentQuestion.correctAnswer}
                                        </div>
                                        <div className="user-answer-display">
                                            <span className="label">あなたの回答:</span> {selectedAnswer}
                                        </div>
                                        {showNextButton && (
                                            <button
                                                className="quiz-next-btn"
                                                onClick={handleNextQuestion}
                                            >
                                                次へ進む ➡
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar (Integrated into box or top?) Let's put it at top of box */}
            <div className="box-progress-bar">
                <div
                    className="box-progress-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>

    );
};

export default ReviewQuiz;
