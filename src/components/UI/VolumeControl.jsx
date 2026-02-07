import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../../contexts/SoundContext';

const VolumeControl = () => {
    const { isMuted, volume, toggleMute, changeVolume } = useSound();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="volume-control-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '8px',
                borderRadius: '30px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Slider (Visible on hover) */}
            <div
                style={{
                    width: isHovered ? '80px' : '0px',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: isHovered ? '10px' : '0'
                }}
            >
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    style={{
                        width: '100%',
                        cursor: 'pointer',
                        accentColor: '#ff80ab'
                    }}
                />
            </div>

            {/* Icon Button */}
            <button
                onClick={toggleMute}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff80ab',
                    padding: 0
                }}
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted || volume === 0 ? (
                    <VolumeX size={24} />
                ) : (
                    <Volume2 size={24} />
                )}
            </button>
        </div>
    );
};

export default VolumeControl;
