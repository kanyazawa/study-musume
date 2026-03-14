import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TitlePage.css';
import { useSound } from '../contexts/SoundContext';

const TitlePage = () => {
    const navigate = useNavigate();
    const { playBGM } = useSound();

    const handleStart = () => {
        playBGM();
        navigate('/home');
    };

    return (
        <div className="title-screen" onClick={handleStart}>
            <div className="room-background"></div>

            <div className="title-content fade-in">
                <div className="title-logo-container">
                    <h1 className="main-title">先輩<br />ここがわかりません</h1>
                    <div className="sub-title">先輩、ここがわかりません</div>
                </div>

                <div className="start-prompt">
                    <span className="blink-text">TAP TO START</span>
                </div>

                <div className="copyright">
                    &copy; 2026 先輩、ここがわかりません Project
                </div>
            </div>
        </div>
    );
};

export default TitlePage;
