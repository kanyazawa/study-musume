import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { isFirebaseConfigured, storage } from '../firebase/config';

// BGM Imports
import bgmTrack from '../assets/audio/after_school_sunbeams.mp3';

const SoundContext = createContext();
const INITIAL_VOLUME = 0.3;

export const useSound = () => useContext(SoundContext);

const audioPathCache = new Map();

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

const resolveAudioSource = async (filename, { defaultExtension = '.mp3' } = {}) => {
    const normalized = String(filename || '').trim();
    if (!normalized) return '';

    if (audioPathCache.has(normalized)) {
        return audioPathCache.get(normalized);
    }

    if (isAbsoluteUrl(normalized)) {
        audioPathCache.set(normalized, normalized);
        return normalized;
    }

    if (normalized.startsWith('gs://')) {
        if (!isFirebaseConfigured || !storage) {
            throw new Error('Firebase Storage is not configured');
        }
        const url = await getDownloadURL(storageRef(storage, normalized));
        audioPathCache.set(normalized, url);
        return url;
    }

    if (normalized.startsWith('storage:')) {
        if (!isFirebaseConfigured || !storage) {
            throw new Error('Firebase Storage is not configured');
        }
        const storagePath = normalized.slice('storage:'.length).replace(/^\/+/, '');
        const url = await getDownloadURL(storageRef(storage, storagePath));
        audioPathCache.set(normalized, url);
        return url;
    }

    const localPath = normalized.includes('.') ? `/audio/${normalized}` : `/audio/${normalized}${defaultExtension}`;
    audioPathCache.set(normalized, localPath);
    return localPath;
};

export const SoundProvider = ({ children }) => {
    // State
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(INITIAL_VOLUME);
    const [seVolume, setSeVolume] = useState(INITIAL_VOLUME);
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
    const bgmRef = useRef(null);

    const ensureBgm = () => {
        if (!bgmRef.current) {
            bgmRef.current = new Audio(bgmTrack);
            bgmRef.current.loop = true;
            bgmRef.current.preload = 'none';
            bgmRef.current.volume = isMuted ? 0 : volume;
        }

        return bgmRef.current;
    };

    useEffect(() => () => {
        if (bgmRef.current) {
            bgmRef.current.pause();
            bgmRef.current = null;
        }
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
        const bgm = ensureBgm();
        bgm.load();
        bgm.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.log("Audio play blocked (waiting for interaction):", e));
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

        resolveAudioSource(filename)
            .then((path) => {
                const audio = new Audio(path);
                audio.volume = seVolume;
                return audio.play();
            })
            .catch(e => console.warn(`Failed to play SE: ${filename}`, e));
    };

    // Play Voice (from public/audio)
    const playVoice = async (filename, options = {}) => {
        const { onStart, onEnd } = options;
        if (!filename || isMuted) return Promise.resolve(false);

        let path = '';
        try {
            path = await resolveAudioSource(filename);
        } catch (error) {
            console.warn(`Failed to resolve Voice: ${filename}`, error);
            return false;
        }

        return new Promise((resolve) => {
            const audio = new Audio(path);
            let settled = false;
            let started = false;

            const handleStart = () => {
                if (started) return;
                started = true;
                onStart?.();
            };

            const handleEnd = () => {
                onEnd?.();
            };

            const finish = (played) => {
                if (settled) return;
                settled = true;
                resolve(played);
            };

            audio.preload = 'none';
            audio.volume = seVolume || volume;
            audio.addEventListener('play', handleStart, { once: true });
            audio.addEventListener('ended', handleEnd, { once: true });
            audio.addEventListener('error', () => {
                console.warn(`Failed to load Voice: ${filename}`);
                handleEnd();
                finish(false);
            }, { once: true });

            audio.play()
                .then(() => {
                    handleStart();
                    finish(true);
                })
                .catch((e) => {
                    console.warn(`Failed to play Voice: ${filename}`, e);
                    handleEnd();
                    finish(false);
                });
        });
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
