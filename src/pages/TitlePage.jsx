import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TitlePage.css';
import { useSound } from '../contexts/SoundContext'; // 追加

const TitlePage = () => {
    const navigate = useNavigate();
    const { playBGM } = useSound(); // 追加
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleStart = () => {
        playBGM(); // ここで再生開始
        navigate('/home');
    };

    return (
        <div className="title-screen" onClick={handleStart}>
            <div className="room-background"></div>

            <div className={`title-content ${isVisible ? 'fade-in' : ''}`}>
                <div className="title-logo-container">
                    <h1 className="main-title">先輩<br />ここがわかりません</h1>
                    <div className="sub-title">Study Musume</div>
                </div>

                <div className="start-prompt">
                    <span className="blink-text">TAP TO START</span>
                </div>

                <div className="copyright">
                    &copy; 2026 Study Musume Project
                </div>
            </div>
        </div>
    );
};

export default TitlePage;
