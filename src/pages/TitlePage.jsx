import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TitlePage.css';
import { useSound } from '../contexts/SoundContext';
import { getGameLoopSnapshot } from '../utils/gameLoopUtils';

const TitlePage = ({ stats }) => {
    const navigate = useNavigate();
    const { playBGM } = useSound();
    const gameLoopSnapshot = getGameLoopSnapshot(stats);

    const handleStart = () => {
        playBGM();
        navigate(
            stats?.tutorialCompleted
                ? (stats?.needsFirstPlayIntro ? '/opening' : '/home')
                : '/tutorial',
        );
    };

    return (
        <div className="title-screen" onClick={handleStart}>
            <div className="room-background"></div>

            <div className="title-content fade-in">
                <div className="title-logo-container">
                    <h1 className="main-title">先輩<br />ここがわかりません</h1>
                    <div className="sub-title">試験攻略 x 弱点回収 x 単語バトル</div>
                    <div className="title-loop-summary">
                        <span>学習で強くなる</span>
                        <span>復習で定着する</span>
                        <span>対戦で試す</span>
                    </div>
                    <p className="title-status-line">
                        {gameLoopSnapshot.examProgress.hasExamDate
                            ? `${gameLoopSnapshot.examProgress.title} / 復習負債 ${gameLoopSnapshot.reviewLoad.due}件 / ${gameLoopSnapshot.battleProgress.summary}`
                            : `復習負債 ${gameLoopSnapshot.reviewLoad.due}件 / ${gameLoopSnapshot.battleProgress.summary}`}
                    </p>
                </div>

                <div className="start-prompt">
                    <span className="blink-text">画面をタップしてはじめる</span>
                </div>

                <div className="copyright">
                    &copy; 2026 Study Musume Project
                </div>
            </div>
        </div>
    );
};

export default TitlePage;
