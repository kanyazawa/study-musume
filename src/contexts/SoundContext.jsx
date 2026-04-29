import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { isFirebaseConfigured, storage } from '../firebase/config';
import { loadSoundSettings, saveSoundSettings } from '../utils/soundSettings';

// BGM Imports
import bgmTrack from '../assets/audio/after_school_sunbeams.mp3';

const SoundContext = createContext();
const BGM_DUCK_MULTIPLIER = 0.42;
const BGM_FADE_MS = 260;

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
    const initialSettingsRef = useRef(loadSoundSettings());
    const [isMuted, setIsMuted] = useState(initialSettingsRef.current.isMuted);
    const [bgmVolume, setBgmVolume] = useState(initialSettingsRef.current.bgmVolume);
    const [seVolume, setSeVolume] = useState(initialSettingsRef.current.seVolume);
    const [voiceVolume, setVoiceVolume] = useState(initialSettingsRef.current.voiceVolume);
    const [isPlaying, setIsPlaying] = useState(false);

    const bgmRef = useRef(null);
    const activeVoicesRef = useRef(new Map());
    const wasPlayingRef = useRef(false);
    const voiceFocusCountRef = useRef(0);
    const bgmFadeFrameRef = useRef(null);
    const bgmPauseTimeoutRef = useRef(null);

    const getTargetBgmVolume = () => {
        if (isMuted) return 0;
        const duckMultiplier = voiceFocusCountRef.current > 0 ? BGM_DUCK_MULTIPLIER : 1;
        return Math.max(0, Math.min(1, bgmVolume * duckMultiplier));
    };

    const cancelBgmFade = () => {
        if (bgmFadeFrameRef.current) {
            cancelAnimationFrame(bgmFadeFrameRef.current);
            bgmFadeFrameRef.current = null;
        }

        if (bgmPauseTimeoutRef.current) {
            clearTimeout(bgmPauseTimeoutRef.current);
            bgmPauseTimeoutRef.current = null;
        }
    };

    const animateBgmVolume = (nextVolume, durationMs = BGM_FADE_MS) => {
        const bgm = bgmRef.current;
        if (!bgm) return;

        cancelBgmFade();

        const safeTargetVolume = Math.max(0, Math.min(1, nextVolume));
        const startVolume = Number.isFinite(bgm.volume) ? bgm.volume : 0;

        if (durationMs <= 0 || Math.abs(startVolume - safeTargetVolume) < 0.001) {
            bgm.volume = safeTargetVolume;
            return;
        }

        const startTime = performance.now();
        const step = (now) => {
            const progress = Math.min(1, (now - startTime) / durationMs);
            bgm.volume = startVolume + ((safeTargetVolume - startVolume) * progress);

            if (progress < 1) {
                bgmFadeFrameRef.current = requestAnimationFrame(step);
            } else {
                bgmFadeFrameRef.current = null;
            }
        };

        bgmFadeFrameRef.current = requestAnimationFrame(step);
    };

    const syncBgmVolume = (durationMs = BGM_FADE_MS) => {
        animateBgmVolume(getTargetBgmVolume(), durationMs);
    };

    const acquireVoiceFocus = () => {
        voiceFocusCountRef.current += 1;
        syncBgmVolume();

        let released = false;
        return () => {
            if (released) return;
            released = true;
            voiceFocusCountRef.current = Math.max(0, voiceFocusCountRef.current - 1);
            syncBgmVolume();
        };
    };

    const ensureBgm = () => {
        if (!bgmRef.current) {
            bgmRef.current = new Audio(bgmTrack);
            bgmRef.current.loop = true;
            bgmRef.current.preload = 'auto';
            bgmRef.current.volume = getTargetBgmVolume();
        }

        return bgmRef.current;
    };

    useEffect(() => {
        saveSoundSettings({
            isMuted,
            bgmVolume,
            seVolume,
            voiceVolume,
        });
    }, [bgmVolume, isMuted, seVolume, voiceVolume]);

    useEffect(() => () => {
        cancelBgmFade();
        if (bgmRef.current) {
            bgmRef.current.pause();
            bgmRef.current = null;
        }
        activeVoicesRef.current.forEach((audio) => {
            audio.__voiceDisposed = true;
            audio.__releaseVoiceFocus?.();
            audio.pause();
            audio.src = '';
        });
        activeVoicesRef.current.clear();
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (bgmRef.current && isPlaying) {
                    bgmRef.current.pause();
                    wasPlayingRef.current = true;
                }
            } else {
                if (bgmRef.current && wasPlayingRef.current) {
                    bgmRef.current.play().then(() => {
                        syncBgmVolume(120);
                    }).catch(() => { });
                    wasPlayingRef.current = false;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPlaying]);

    useEffect(() => {
        syncBgmVolume();
        activeVoicesRef.current.forEach((audio) => {
            audio.volume = isMuted ? 0 : voiceVolume;
        });
    }, [bgmVolume, isMuted, voiceVolume]);

    const playBGM = () => {
        const bgm = ensureBgm();
        if (!bgm.paused) {
            syncBgmVolume(120);
            return Promise.resolve(true);
        }

        cancelBgmFade();
        bgm.volume = 0;
        return bgm.play()
            .then(() => {
                setIsPlaying(true);
                syncBgmVolume(520);
                return true;
            })
            .catch((e) => {
                console.log('Audio play blocked (waiting for interaction):', e);
                return false;
            });
    };

    const stopBGM = () => {
        if (bgmRef.current) {
            setIsPlaying(false);
            animateBgmVolume(0, 180);
            bgmPauseTimeoutRef.current = window.setTimeout(() => {
                if (!bgmRef.current) return;
                bgmRef.current.pause();
                bgmRef.current.currentTime = 0;
                bgmPauseTimeoutRef.current = null;
            }, 190);
        }
    };

    const pauseBGM = () => {
        if (bgmRef.current) {
            setIsPlaying(false);
            animateBgmVolume(0, 180);
            bgmPauseTimeoutRef.current = window.setTimeout(() => {
                if (!bgmRef.current) return;
                bgmRef.current.pause();
                bgmPauseTimeoutRef.current = null;
            }, 190);
        }
    };

    const playSE = (filename) => {
        if (!filename || isMuted) return;

        resolveAudioSource(filename)
            .then((path) => {
                const audio = new Audio(path);
                audio.volume = seVolume;
                return audio.play();
            })
            .catch((e) => console.warn(`Failed to play SE: ${filename}`, e));
    };

    const playVoice = async (filename, options = {}) => {
        const { onStart, onEnd, channel = 'default' } = options;
        if (!filename || isMuted) return Promise.resolve(false);

        let path = '';
        try {
            path = await resolveAudioSource(filename);
        } catch (error) {
            console.warn(`Failed to resolve Voice: ${filename}`, error);
            return false;
        }

        return new Promise((resolve) => {
            const previousAudio = activeVoicesRef.current.get(channel);
            if (previousAudio) {
                previousAudio.__voiceDisposed = true;
                previousAudio.__releaseVoiceFocus?.();
                previousAudio.pause();
                previousAudio.currentTime = 0;
                previousAudio.src = '';
                activeVoicesRef.current.delete(channel);
            }

            const audio = new Audio(path);
            let settled = false;
            let started = false;
            const releaseVoiceFocus = acquireVoiceFocus();

            const handleStart = () => {
                if (audio.__voiceDisposed) return;
                if (started) return;
                started = true;
                onStart?.();
            };

            const handleEnd = () => {
                releaseVoiceFocus();
                if (audio.__voiceDisposed) {
                    if (activeVoicesRef.current.get(channel) === audio) {
                        activeVoicesRef.current.delete(channel);
                    }
                    return;
                }
                if (activeVoicesRef.current.get(channel) === audio) {
                    activeVoicesRef.current.delete(channel);
                }
                onEnd?.();
            };

            const finish = (played) => {
                if (settled) return;
                settled = true;
                resolve(played);
            };

            audio.preload = 'none';
            audio.volume = isMuted ? 0 : voiceVolume;
            audio.__releaseVoiceFocus = releaseVoiceFocus;
            activeVoicesRef.current.set(channel, audio);
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

    const stopVoice = (channel = 'default') => {
        const audio = activeVoicesRef.current.get(channel);
        if (!audio) return;

        audio.__voiceDisposed = true;
        audio.__releaseVoiceFocus?.();
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        activeVoicesRef.current.delete(channel);
    };

    const toggleMute = () => setIsMuted(prev => !prev);

    const normalizeSliderValue = (val) => Math.max(0, Math.min(1, val));

    const changeBgmVolume = (val) => {
        const newVol = Math.max(0, Math.min(1, val));
        setBgmVolume(newVol);
        if (newVol > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const changeSeVolume = (val) => {
        const newVol = normalizeSliderValue(val);
        setSeVolume(newVol);
        if (newVol > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const changeVoiceVolume = (val) => {
        const newVol = normalizeSliderValue(val);
        setVoiceVolume(newVol);
        if (newVol > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const value = {
        isMuted,
        volume: bgmVolume,
        bgmVolume,
        seVolume,
        voiceVolume,
        isPlaying,
        playBGM,
        stopBGM,
        pauseBGM,
        playSE,
        playVoice,
        stopVoice,
        toggleMute,
        changeVolume: changeBgmVolume,
        changeBgmVolume,
        changeSeVolume,
        changeVoiceVolume,
        acquireVoiceFocus,
    };

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
};
