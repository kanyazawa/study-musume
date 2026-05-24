import React, { useState } from 'react';
import { loadStats, saveStats } from '../utils/saveUtils';
import { CHARACTER_SELECT_OPTIONS } from '../data/characterData';
import './CharacterSelect.css'; // We will create this CSS

const CharacterSelect = ({ onComplete, showIntroOnComplete = true }) => {
    const [selectedId, setSelectedId] = useState(null);

    const handleSelect = (id) => {
        setSelectedId(id);
    };

    const handleConfirm = () => {
        if (!selectedId) return;

        const currentStats = loadStats();

        // Start updates object
        const updates = {
            hasSelectedCharacter: true,
            needsFirstPlayIntro: showIntroOnComplete,
            hasCompletedFirstPlayIntro: showIntroOnComplete
                ? false
                : (currentStats?.hasCompletedFirstPlayIntro ?? true),
            equippedSkin: 'default',
            characterId: selectedId,
            selectedHeroineId: selectedId,
            favoriteCharacter: selectedId,
            tutorialHomeVariant: selectedId === 'emma'
                ? (currentStats?.tutorialHomeVariant || 'emma-mvp')
                : null,
        };

        const newStats = { ...currentStats, ...updates };
        saveStats(newStats);
        window.history.replaceState(null, '', showIntroOnComplete ? '/opening' : '/home');
        onComplete(newStats);
    };

    return (
        <div className="char-select-screen">
            <h2 className="char-select-title">パートナーを選択してください</h2>
            <div className="char-select-container">
                {CHARACTER_SELECT_OPTIONS.map((character) => (
                    <div
                        key={character.id}
                        className={`char-card ${selectedId === character.id ? 'selected' : ''}`}
                        onClick={() => handleSelect(character.id)}
                    >
                        <div className="char-image-container">
                            <img src={character.image} alt={character.name} className="char-img" />
                        </div>
                        <div className="char-info">
                            <h3>{character.name}</h3>
                            <p className="char-desc">{character.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className={`confirm-btn ${!selectedId ? 'disabled' : ''}`}
                onClick={handleConfirm}
                disabled={!selectedId}
            >
                決定して始める
            </button>
        </div>
    );
};

export default CharacterSelect;
