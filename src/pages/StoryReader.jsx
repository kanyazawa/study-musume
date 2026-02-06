import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StoryReader.css';

import { getEpisodeById } from '../data/storyData';
import CharacterMain from '../assets/images/character_new.png';

const StoryReader = ({ stats }) => {
    const { episodeId } = useParams();
    const navigate = useNavigate();
    const episode = getEpisodeById(episodeId);

    const [currentScene, setCurrentScene] = useState(0);

    if (!episode) {
        return (
            <div className="story-reader">
                <div className="error-message">
                    <p>エピソードが見つかりません</p>
                    <button onClick={() => navigate('/story')}>戻る</button>
                </div>
            </div>
        );
    }

    const handleNext = () => {
        if (currentScene < episode.scenes.length - 1) {
            setCurrentScene(currentScene + 1);
        } else {
            // ストーリー終了
            navigate('/story');
        }
    };

    const handleSkip = () => {
        navigate('/story');
    };

    const scene = episode.scenes[currentScene];
    const isLastScene = currentScene === episode.scenes.length - 1;

    return (
        <div className="story-reader" onClick={handleNext}>
            {/* 背景 */}
            <div className="story-background">
                {/* 背景画像をここに追加可能 */}
            </div>

            {/* キャラクター画像 */}
            {scene.speaker === 'ノア' && (
                <div className="story-character">
                    <img src={CharacterMain} alt="ノア" className="character-image" />
                </div>
            )}

            {/* テキストボックス */}
            <div className="story-textbox">
                <div className="speaker-name">{scene.speaker}</div>
                <div className="story-text">{scene.text}</div>
            </div>

            {/* コントロール */}
            <div className="story-controls">
                <button className="skip-btn" onClick={(e) => { e.stopPropagation(); handleSkip(); }}>
                    スキップ
                </button>
                <div className="scene-indicator">
                    {currentScene + 1} / {episode.scenes.length}
                </div>
            </div>

            {/* タップヒント */}
            {!isLastScene && (
                <div className="tap-hint">▼ タップして続きを読む</div>
            )}
            {isLastScene && (
                <div className="tap-hint">▼ タップしてストーリー選択に戻る</div>
            )}
        </div>
    );
};

export default StoryReader;
