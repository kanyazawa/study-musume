import React from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterSelect from '../components/CharacterSelect';

const CharacterSelectPage = ({ updateStats, stats }) => {
    const navigate = useNavigate();
    const showIntroOnComplete = !stats?.hasSelectedCharacter;

    return (
        <CharacterSelect onComplete={(newStats) => {
            if (updateStats) {
                updateStats(newStats);
            }
            navigate(showIntroOnComplete ? '/opening' : '/home');
        }} showIntroOnComplete={showIntroOnComplete} />
    );
};

export default CharacterSelectPage;
