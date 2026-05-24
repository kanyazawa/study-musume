import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TUTORIAL_CHARACTERS, TUTORIAL_HOME_LINE } from '../data/tutorialData';
import './TutorialHome.css';

const TutorialHome = ({ stats }) => {
    const navigate = useNavigate();
    const gems = Number(stats?.diamonds || 0);
    const affection = Number(stats?.affection || 0);

    const selectedCharacter = useMemo(
        () => TUTORIAL_CHARACTERS[0],
        [],
    );

    return (
        <div className="tutorial-home-screen">
            <div className="tutorial-home-shell">
                <header className="tutorial-home-header">
                    <div className="tutorial-home-stat">
                        <span>ジェム</span>
                        <strong>{gems}</strong>
                    </div>
                    <div className="tutorial-home-stat">
                        <span>好感度</span>
                        <strong>{affection}</strong>
                    </div>
                </header>

                <main className="tutorial-home-card">
                    <p className="tutorial-home-kicker">Home</p>
                    <div className="tutorial-home-character-frame">
                        <img src={selectedCharacter.image} alt={selectedCharacter.name} className="tutorial-home-character-image" />
                    </div>
                    <div className="tutorial-home-copy">
                        <strong>{selectedCharacter.name}</strong>
                        <span>放課後の学習パートナー: {selectedCharacter.archetype}</span>
                        <p>「{TUTORIAL_HOME_LINE}」</p>
                    </div>
                </main>

                <nav className="tutorial-home-nav" aria-label="ホームメニュー">
                    <button type="button" className="tutorial-home-btn" onClick={() => navigate('/study')}>
                        文法
                    </button>
                    <button type="button" className="tutorial-home-btn" onClick={() => navigate('/writing')}>
                        添削
                    </button>
                    <button type="button" className="tutorial-home-btn" onClick={() => navigate('/story')}>
                        約束
                    </button>
                </nav>
            </div>
        </div>
    );
};

export default TutorialHome;
