import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { isFirebaseConfigured, storage } from '../firebase/config';
import { loadSoundSettings, saveSoundSettings } from '../utils/soundSettings';
import { getVoiceFallbackCandidates, toLocalAudioPath } from '../utils/voicePathUtils';

// BGM Imports
import bgmTrack from '../assets/audio/after_school_sunbeams.mp3';

const SoundContext = createContext();
const BGM_DUCK_MULTIPLIER = 0.42;
const BGM_FADE_MS = 260;
const clampMediaVolume = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return 0;
    }
    return Math.max(0, Math.min(1, numericValue));
};

export const useSound = () => useContext(SoundContext);

const audioPathCache = new Map();

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);
const isAutoplayBlockedError = (error) => (
    error?.name === 'NotAllowedError'
    || /didn['’]t interact with the document first/i.test(String(error?.message || ''))
);

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

    const localPath = toLocalAudioPath(normalized, { defaultExtension });
    audioPathCache.set(normalized, localPath);
    return localPath;
};

export const SoundProvider = ({ children }) => {
    const [initialSettings] = useState(() => loadSoundSettings());
    const [isMuted, setIsMuted] = useState(initialSettings.isMuted);
    const [bgmVolume, setBgmVolume] = useState(initialSettings.bgmVolume);
    const [seVolume, setSeVolume] = useState(initialSettings.seVolume);
    const [voiceVolume, setVoiceVolume] = useState(initialSettings.voiceVolume);
    const [isPlaying, setIsPlaying] = useState(false);

    const bgmRef = useRef(null);
    const activeVoicesRef = useRef(new Map());
    const wasPlayingRef = useRef(false);
    const voiceFocusCountRef = useRef(0);
    const bgmFadeFrameRef = useRef(null);
    const bgmPauseTimeoutRef = useRef(null);
    const hasUserInteractedRef = useRef(false);

    const getTargetBgmVolume = useCallback(() => {
        if (isMuted) return 0;
        const duckMultiplier = voiceFocusCountRef.current > 0 ? BGM_DUCK_MULTIPLIER : 1;
        return clampMediaVolume(bgmVolume * duckMultiplier);
    }, [bgmVolume, isMuted]);

    const cancelBgmFade = useCallback(() => {
        if (bgmFadeFrameRef.current) {
            cancelAnimationFrame(bgmFadeFrameRef.current);
            bgmFadeFrameRef.current = null;
        }

        if (bgmPauseTimeoutRef.current) {
            clearTimeout(bgmPauseTimeoutRef.current);
            bgmPauseTimeoutRef.current = null;
        }
    }, []);

    const animateBgmVolume = useCallback((nextVolume, durationMs = BGM_FADE_MS) => {
        const bgm = bgmRef.current;
        if (!bgm) return;

        cancelBgmFade();

        const safeTargetVolume = clampMediaVolume(nextVolume);
        const startVolume = clampMediaVolume(bgm.volume);

        if (durationMs <= 0 || Math.abs(startVolume - safeTargetVolume) < 0.001) {
            bgm.volume = safeTargetVolume;
            return;
        }

        const startTime = performance.now();
        const step = (now) => {
            const progress = Math.min(1, (now - startTime) / durationMs);
            const interpolatedVolume = startVolume + ((safeTargetVolume - startVolume) * progress);
            bgm.volume = clampMediaVolume(interpolatedVolume);

            if (progress < 1) {
                bgmFadeFrameRef.current = requestAnimationFrame(step);
            } else {
                bgmFadeFrameRef.current = null;
            }
        };

        bgmFadeFrameRef.current = requestAnimationFrame(step);
    }, [cancelBgmFade]);

    const syncBgmVolume = useCallback((durationMs = BGM_FADE_MS) => {
        animateBgmVolume(getTargetBgmVolume(), durationMs);
    }, [animateBgmVolume, getTargetBgmVolume]);

    const acquireVoiceFocus = useCallback(() => {
        voiceFocusCountRef.current += 1;
        syncBgmVolume();

        let released = false;
        return () => {
            if (released) return;
            released = true;
            voiceFocusCountRef.current = Math.max(0, voiceFocusCountRef.current - 1);
            syncBgmVolume();
        };
    }, [syncBgmVolume]);

    const ensureBgm = useCallback(() => {
        if (!bgmRef.current) {
            bgmRef.current = new Audio(bgmTrack);
            bgmRef.current.loop = true;
            bgmRef.current.preload = 'auto';
            bgmRef.current.volume = getTargetBgmVolume();
        }

        return bgmRef.current;
    }, [getTargetBgmVolume]);

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
    }, [cancelBgmFade]);

    useEffect(() => {
        const markUserInteraction = () => {
            hasUserInteractedRef.current = true;
        };

        window.addEventListener('pointerdown', markUserInteraction, { passive: true });
        window.addEventListener('keydown', markUserInteraction);
        window.addEventListener('touchstart', markUserInteraction, { passive: true });

        return () => {
            window.removeEventListener('pointerdown', markUserInteraction);
            window.removeEventListener('keydown', markUserInteraction);
            window.removeEventListener('touchstart', markUserInteraction);
        };
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
    }, [isPlaying, syncBgmVolume]);

    useEffect(() => {
        syncBgmVolume();
        activeVoicesRef.current.forEach((audio) => {
            audio.volume = clampMediaVolume(isMuted ? 0 : voiceVolume);
        });
    }, [bgmVolume, isMuted, syncBgmVolume, voiceVolume]);

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
                audio.volume = clampMediaVolume(seVolume);
                return audio.play();
            })
            .catch((e) => console.warn(`Failed to play SE: ${filename}`, e));
    };

    const playVoice = async (filename, options = {}) => {
        const {
            onStart,
            onEnd,
            channel = 'default',
            requiresUserInteraction = false,
            suppressBlockedError = false,
        } = options;
        if (!filename || isMuted) return Promise.resolve(false);
        if (requiresUserInteraction && !hasUserInteractedRef.current) return Promise.resolve(false);
        const voiceCandidates = getVoiceFallbackCandidates(filename);
        if (voiceCandidates.length === 0) {
            return Promise.resolve(false);
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

            let settled = false;
            let started = false;
            const releaseVoiceFocus = acquireVoiceFocus();
            let activeAudio = null;

            const handleStart = () => {
                if (activeAudio?.__voiceDisposed) return;
                if (started) return;
                started = true;
                onStart?.();
            };

            const handleEnd = () => {
                releaseVoiceFocus();
                if (activeAudio?.__voiceDisposed) {
                    if (activeVoicesRef.current.get(channel) === activeAudio) {
                        activeVoicesRef.current.delete(channel);
                    }
                    return;
                }
                if (activeVoicesRef.current.get(channel) === activeAudio) {
                    activeVoicesRef.current.delete(channel);
                }
                onEnd?.();
            };

            const finish = (played) => {
                if (settled) return;
                settled = true;
                resolve(played);
            };

            const cleanupAttempt = (audio) => {
                if (!audio) return;
                audio.__voiceDisposed = true;
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
                if (activeVoicesRef.current.get(channel) === audio) {
                    activeVoicesRef.current.delete(channel);
                }
            };

            const attemptPlayback = async (candidateIndex = 0) => {
                const candidate = voiceCandidates[candidateIndex];
                if (!candidate) {
                    releaseVoiceFocus();
                    finish(false);
                    return;
                }

                let path = '';
                try {
                    path = await resolveAudioSource(candidate);
                } catch (error) {
                    console.warn(`Failed to resolve Voice: ${candidate}`, error);
                    void attemptPlayback(candidateIndex + 1);
                    return;
                }

                const audio = new Audio(path);
                activeAudio = audio;
                audio.preload = 'none';
                audio.volume = clampMediaVolume(isMuted ? 0 : voiceVolume);
                audio.__releaseVoiceFocus = releaseVoiceFocus;
                activeVoicesRef.current.set(channel, audio);
                audio.addEventListener('play', handleStart, { once: true });
                audio.addEventListener('ended', handleEnd, { once: true });
                audio.addEventListener('error', () => {
                    console.warn(`Failed to load Voice: ${candidate}`);
                    cleanupAttempt(audio);
                    void attemptPlayback(candidateIndex + 1);
                }, { once: true });

                audio.play()
                    .then(() => {
                        handleStart();
                        finish(true);
                    })
                    .catch((e) => {
                        console.warn(`Failed to play Voice: ${candidate}`, e);
                        cleanupAttempt(audio);
                        void attemptPlayback(candidateIndex + 1);
                    });
            };

            void attemptPlayback();
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
