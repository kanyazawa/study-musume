import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StoryReader.css';

import { getEpisodeById } from '../data/storyData';
import VrmViewer from '../components/VrmViewer';
import { getSkinFilter } from '../utils/cosmeticUtils';

// Images
import CharacterMain from '../assets/images/character_new.png';
import CharacterCasual from '../assets/images/character_casual_v9.png';
import CharacterCasualFall from '../assets/images/noa_casual_fall.png';
import CharacterGym from '../assets/images/character_gym.jpg';
import CharacterCasualGray from '../assets/images/character_casual_gray_hoodie.jpg';
import CharacterCasualBlack from '../assets/images/character_casual_hoodie.png';
import CharacterRen from '../assets/images/character_ren.png';

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

    // --- キャラクター表示ロジック ---
    const characterId = stats?.characterId || 'noah';
    const isRen = characterId === 'ren';

    const noahImages = {
        'default': CharacterMain,
        'skin_casual': CharacterCasual,
        'skin_casual_fall': CharacterCasualFall,
        'skin_gym': CharacterGym,
        'skin_casual_gray_hoodie': CharacterCasualGray,
        'skin_casual_hoodie': CharacterCasualBlack
    };
    const renImages = {
        'default': CharacterRen,
        'skin_casual': CharacterRen,
        'skin_casual_fall': CharacterRen
    };
    
    const skinImages = isRen ? renImages : noahImages;
    const currentSkinImage = skinImages[stats?.equippedSkin] || skinImages['default'];
    const currentSkinFilter = getSkinFilter(stats?.equippedSkin);
    const use3D = localStorage.getItem('characterMode') === '3d';

    // スピーカーの名前を置き換え（レンを選んでいる場合）
    const displaySpeaker = (scene.speaker === 'ノア' && isRen) ? 'レン' : scene.speaker;
    const isCharacterSpeaking = displaySpeaker === 'ノア' || displaySpeaker === 'レン' || displaySpeaker === 'あなた';

    return (
        <div className="story-reader" onClick={handleNext}>
            {/* 背景 */}
            <div className="story-background">
                {/* 背景画像をここに追加可能 */}
            </div>

            {/* キャラクター画像 */}
            {isCharacterSpeaking && (
                <div className="story-character">
                    {use3D && characterId === 'noah' ? (
                        <VrmViewer emotion="normal" className="vrm-story" />
                    ) : (
                        <img 
                            src={isRen ? CharacterRen : currentSkinImage} 
                            alt={displaySpeaker} 
                            className="character-image" 
                            style={{ filter: currentSkinFilter }}
                        />
                    )}
                </div>
            )}

            {/* テキストボックス */}
            <div className="story-textbox">
                <div className="speaker-name">{displaySpeaker}</div>
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
