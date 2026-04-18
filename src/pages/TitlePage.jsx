import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TitlePage.css';
import { useSound } from '../contexts/SoundContext';

const TitlePage = ({ stats }) => {
    const navigate = useNavigate();
    const { playBGM } = useSound();

    const handleStart = () => {
        playBGM();
        navigate(stats?.needsFirstPlayIntro ? '/opening' : '/home');
    };

    return (
        <div className="title-screen" onClick={handleStart}>
            <div className="room-background"></div>

            <div className="title-content fade-in">
                <div className="title-logo-container">
                    <h1 className="main-title">先輩<br />ここがわかりません</h1>
                    <div className="sub-title">放課後補習ラブコメ x 学習トレーニング</div>
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
