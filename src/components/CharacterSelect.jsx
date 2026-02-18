import React, { useState } from 'react';
import { saveStats } from '../utils/saveUtils';
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
            equippedSkin: 'default'
        };

        // Determine characterId and characterMode
        if (selectedId === 'noah_3d') {
            updates.characterId = 'noah';
            localStorage.setItem('characterMode', '3d');
        } else {
            updates.characterId = selectedId;
            localStorage.setItem('characterMode', '2d');
        }

        // Save stats
        import('../utils/saveUtils').then(({ loadStats, saveStats }) => {
            const currentStats = loadStats();
            const newStats = { ...currentStats, ...updates };
            saveStats(newStats);
            onComplete(newStats);
        });
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
                        <h3>ノア (2D)</h3>
                        <p className="char-desc">
                            勉強熱心で少しツンデレな女の子。<br />
                            通常のかわいい2Dイラストモードです。
                        </p>
                    </div>
                </div>

                {/* Noah (3D) */}
                <div
                    className={`char-card ${selectedId === 'noah_3d' ? 'selected' : ''}`}
                    onClick={() => handleSelect('noah_3d')}
                >
                    <div className="char-image-container" style={{ position: 'relative' }}>
                        <img src={NoahImg} alt="Noah 3D" className="char-img" style={{ filter: 'hue-rotate(15deg) contrast(1.1)' }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '5px',
                            right: '5px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}>3D</div>
                    </div>
                    <div className="char-info">
                        <h3>ノア (3D)</h3>
                        <p className="char-desc">
                            動く3Dモデルのノア。<br />
                            リップシンクや表情変化を楽しめます。
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
