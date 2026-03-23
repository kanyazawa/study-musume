import React, { useState } from 'react';
import './LoadingScreen.css';

// Import local images directly
import imgSleepy from '../../assets/images/loading/loading_sleepy.webp';
import imgSnack from '../../assets/images/loading/loading_snack.webp';
import imgPanic from '../../assets/images/loading/loading_panic.webp';
import imgOverload from '../../assets/images/loading/loading_overload.webp';

const IMAGES = [
    { src: imgSleepy, alt: "ねむい..." },
    { src: imgSnack, alt: "おやつタイム" },
    { src: imgPanic, alt: "やばい！" },
    { src: imgOverload, alt: "知恵熱" }
];

const LoadingScreen = () => {
    const [currentImage] = useState(() => IMAGES[Math.floor(Math.random() * IMAGES.length)]);

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
