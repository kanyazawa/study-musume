import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// BGM Imports
import bgmTrack from '../assets/audio/after_school_sunbeams.mp3';

const SoundContext = createContext();

export const useSound = () => useContext(SoundContext);

export const SoundProvider = ({ children }) => {
    // State
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.3); // Default volume 30%
    const [seVolume, setSeVolume] = useState(0.3); // SE volume defaults to same as BGM
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
    const bgmRef = useRef(null);

    // Initialize Audio
    useEffect(() => {
        bgmRef.current = new Audio(bgmTrack);
        bgmRef.current.loop = true;
        bgmRef.current.volume = volume;

        return () => {
            if (bgmRef.current) {
                bgmRef.current.pause();
                bgmRef.current = null;
            }
        };
    }, []);

    // バックグラウンド時にBGMを停止、フォアグラウンド復帰時に再開
    const wasPlayingRef = useRef(false);
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // バックグラウンドに移行 → BGM一時停止
                if (bgmRef.current && isPlaying) {
                    bgmRef.current.pause();
                    wasPlayingRef.current = true;
                }
            } else {
                // フォアグラウンドに復帰 → BGM再開
                if (bgmRef.current && wasPlayingRef.current) {
                    bgmRef.current.play().catch(() => { });
                    wasPlayingRef.current = false;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPlaying]);

    // Handle Volume/Mute changes
    useEffect(() => {
        if (bgmRef.current) {
            bgmRef.current.volume = isMuted ? 0 : volume;
        }
    }, [isMuted, volume]);

    const playBGM = () => {
        if (bgmRef.current) {
            // Promise handling for browsers requiring user interaction
            bgmRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.log("Audio play blocked (waiting for interaction):", e));
        }
    };

    const stopBGM = () => {
        if (bgmRef.current) {
            bgmRef.current.pause();
            bgmRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    const pauseBGM = () => {
        if (bgmRef.current) {
            bgmRef.current.pause();
            setIsPlaying(false);
        }
    };

    // Play Sound Effect (from public/audio)
    const playSE = (filename) => {
        if (!filename || isMuted) return;

        // Add extension if missing
        const path = filename.includes('.') ? `/audio/${filename}` : `/audio/${filename}.mp3`;

        const audio = new Audio(path);
        audio.volume = seVolume;
        audio.play().catch(e => console.warn(`Failed to play SE: ${filename}`, e));
    };

    // Play Voice (from public/audio)
    const playVoice = (filename) => {
        if (!filename || isMuted) return;

        // Add extension if missing
        const path = filename.includes('.') ? `/audio/${filename}` : `/audio/${filename}.mp3`;

        const audio = new Audio(path);
        audio.volume = messageVolume || volume; // Use message volume if available
        audio.play().catch(e => console.warn(`Failed to play Voice: ${filename}`, e));
    };

    const toggleMute = () => setIsMuted(prev => !prev);

    const changeVolume = (val) => {
        const newVol = Math.max(0, Math.min(1, val));
        setVolume(newVol);
        setSeVolume(newVol); // Link SE volume to Master volume for now
        if (newVol > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const value = {
        isMuted,
        volume,
        isPlaying,
        playBGM,
        stopBGM,
        pauseBGM,
        playSE,
        playVoice,
        toggleMute,
        changeVolume
    };

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
};
