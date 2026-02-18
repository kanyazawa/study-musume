import React from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterSelect from '../components/CharacterSelect';

const CharacterSelectPage = ({ updateStats }) => {
    const navigate = useNavigate();

    return (
        <CharacterSelect onComplete={(newStats) => {
            if (updateStats) {
                updateStats(newStats);
            }
            navigate('/home');
        }} />
    );
};

export default CharacterSelectPage;
