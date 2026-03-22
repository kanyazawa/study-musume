import React, { useState } from 'react';
import { loadStats, saveStats } from '../utils/saveUtils';
import './CharacterSelect.css'; // We will create this CSS

// Images
import NoahImg from '../assets/images/noah_normal.png'; // Noah Normal
import RenImg from '../assets/images/character_ren.png'; // Ren

const CharacterSelect = ({ onComplete }) => {
    const [selectedId, setSelectedId] = useState(null);

    const handleSelect = (id) => {
        setSelectedId(id);
    };

    const handleConfirm = () => {
        if (!selectedId) return;

        // Start updates object
        const updates = {
            hasSelectedCharacter: true,
            equippedSkin: 'default',
            characterId: selectedId,
        };

        const currentStats = loadStats();
        const newStats = { ...currentStats, ...updates };
        saveStats(newStats);
        onComplete(newStats);
    };

    return (
        <div className="char-select-screen">
            <h2 className="char-select-title">パートナーを選択してください</h2>
            <div className="char-select-container">
                {/* Noah (2D) */}
                <div
                    className={`char-card ${selectedId === 'noah' ? 'selected' : ''}`}
                    onClick={() => handleSelect('noah')}
                >
                    <div className="char-image-container">
                        <img src={NoahImg} alt="Noah" className="char-img" />
                    </div>
                    <div className="char-info">
                        <h3>ノア</h3>
                        <p className="char-desc">
                            勉強熱心で少しツンデレな女の子。<br />
                            いちばん軽い標準表示で使えます。
                        </p>
                    </div>
                </div>

                {/* Ren */}
                <div
                    className={`char-card ${selectedId === 'ren' ? 'selected' : ''}`}
                    onClick={() => handleSelect('ren')}
                >
                    <div className="char-image-container">
                        <img src={RenImg} alt="Ren" className="char-img" />
                    </div>
                    <div className="char-info">
                        <h3>レン</h3>
                        <p className="char-desc">
                            クールで知的な男の子。<br />
                            冷静に学習のアドバイスをくれます。
                        </p>
                    </div>
                </div>
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
