import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

// Import local images directly
import imgSleepy from '../../assets/images/loading/loading_sleepy.png';
import imgSnack from '../../assets/images/loading/loading_snack.png';
import imgPanic from '../../assets/images/loading/loading_panic.png';
import imgOverload from '../../assets/images/loading/loading_overload.png';

const IMAGES = [
    { src: imgSleepy, alt: "ねむい..." },
    { src: imgSnack, alt: "おやつタイム" },
    { src: imgPanic, alt: "やばい！" },
    { src: imgOverload, alt: "知恵熱" }
];

const LoadingScreen = () => {
    const [currentImage, setCurrentImage] = useState(null);

    useEffect(() => {
        // Randomly select an image on mount
        const randomIndex = Math.floor(Math.random() * IMAGES.length);
        setCurrentImage(IMAGES[randomIndex]);
    }, []);

    if (!currentImage) return null;

    return (
        <div className="loading-screen-overlay">
            <div className="loading-content">
                <div className="loading-image-container">
                    <img
                        src={currentImage.src}
                        alt={currentImage.alt}
                        className="loading-comic-img"
                    />
                </div>

                <div className="loading-text">
                    <div className="spinner"></div>
                    <span>Loading...</span>
                </div>

                <div className="loading-tip">
                    Tips: 勉強は休憩も大事だよ！
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
