/**
 * VrmCharacter.jsx
 * VRMモデルの制御コンポーネント（R3F内で使用）
 * - VRMモデルの読み込み
 * - 自動まばたき
 * - リップシンク（口パク）
 * - 表情変化
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { generateLipSyncTimeline, getCurrentVowel, estimateSpeechDuration } from '../utils/lipSync';

const VrmCharacter = ({ emotion = 'normal', text = '', isSpeaking = false }) => {
    const { scene } = useThree();
    const vrmRef = useRef(null);
    const mixerRef = useRef(null);
    const clockRef = useRef(new THREE.Clock());

    // Blink state
    const blinkTimerRef = useRef(0);
    const nextBlinkRef = useRef(Math.random() * 3 + 2);
    const isBlinkingRef = useRef(false);
    const blinkPhaseRef = useRef(0);

    // Lip sync state
    const lipSyncTimelineRef = useRef([]);
    const lipSyncStartRef = useRef(0);
    const lipSyncActiveRef = useRef(false);
    const prevVowelRef = useRef(null);

    // Current emotion
    const currentEmotionRef = useRef('neutral');

    // VRM Expression names (VRM 1.0 standard)
    const EXPRESSION_NAMES = {
        blink: 'blink',
        happy: 'happy',
        angry: 'angry',
        sad: 'sad',
        relaxed: 'relaxed',
        surprised: 'surprised',
        aa: 'aa',
        ih: 'ih',
        ou: 'ou',
        ee: 'ee',
        oh: 'oh',
    };

    // Load VRM model
    useEffect(() => {
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(
            '/assets/VRoid.vrm',
            (gltf) => {
                const vrm = gltf.userData.vrm;
                if (!vrm) {
                    console.error('VRM data not found in GLTF');
                    return;
                }

                // Cleanup previous model
                if (vrmRef.current) {
                    scene.remove(vrmRef.current.scene);
                    VRMUtils.deepDispose(vrmRef.current.scene);
                }

                // VRMUtils for optimization
                VRMUtils.removeUnnecessaryVertices(gltf.scene);
                VRMUtils.removeUnnecessaryJoints(gltf.scene);

                // Rotate to face camera (VRM default is -Z)
                vrm.scene.rotation.y = Math.PI;

                scene.add(vrm.scene);
                vrmRef.current = vrm;

                // Setup animation mixer
                mixerRef.current = new THREE.AnimationMixer(vrm.scene);

                // Set natural rest pose (fix T-pose)
                const humanoid = vrm.humanoid;
                if (humanoid) {
                    // Rotate upper arms down (~65°)
                    const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
                    const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
                    if (leftUpperArm) {
                        leftUpperArm.rotation.z = 1.15; // ~65° down
                    }
                    if (rightUpperArm) {
                        rightUpperArm.rotation.z = -1.15;
                    }

                    // Slightly bend lower arms inward
                    const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
                    const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');
                    if (leftLowerArm) {
                        leftLowerArm.rotation.z = 0.2;
                    }
                    if (rightLowerArm) {
                        rightLowerArm.rotation.z = -0.2;
                    }
                }

                console.log('VRM model loaded successfully');

                // Log available expressions
                if (vrm.expressionManager) {
                    const expNames = vrm.expressionManager.expressions.map(e => e.expressionName);
                    console.log('Available expressions:', expNames);
                }
            },
            (progress) => {
                // Loading progress
            },
            (error) => {
                console.error('Error loading VRM:', error);
            }
        );

        return () => {
            if (vrmRef.current) {
                scene.remove(vrmRef.current.scene);
                VRMUtils.deepDispose(vrmRef.current.scene);
            }
        };
    }, [scene]);

    // Update lip sync when text changes
    useEffect(() => {
        if (isSpeaking && text) {
            const duration = estimateSpeechDuration(text);
            lipSyncTimelineRef.current = generateLipSyncTimeline(text, duration);
            lipSyncStartRef.current = clockRef.current.getElapsedTime();
            lipSyncActiveRef.current = true;
        } else {
            lipSyncActiveRef.current = false;
            lipSyncTimelineRef.current = [];
        }
    }, [text, isSpeaking]);

    // Update emotion
    useEffect(() => {
        currentEmotionRef.current = emotion;
    }, [emotion]);

    // Set expression value safely
    const setExpression = useCallback((name, value) => {
        const vrm = vrmRef.current;
        if (!vrm || !vrm.expressionManager) return;

        try {
            vrm.expressionManager.setValue(name, value);
        } catch (e) {
            // Expression not found, silently ignore
        }
    }, []);

    // Reset all mouth shapes
    const resetMouthShapes = useCallback(() => {
        setExpression('aa', 0);
        setExpression('ih', 0);
        setExpression('ou', 0);
        setExpression('ee', 0);
        setExpression('oh', 0);
    }, [setExpression]);

    // Animation loop
    useFrame((state, delta) => {
        const vrm = vrmRef.current;
        if (!vrm) return;

        // Update VRM
        vrm.update(delta);

        // --- Auto Blink ---
        blinkTimerRef.current += delta;

        if (!isBlinkingRef.current && blinkTimerRef.current >= nextBlinkRef.current) {
            isBlinkingRef.current = true;
            blinkPhaseRef.current = 0;
            blinkTimerRef.current = 0;
            nextBlinkRef.current = Math.random() * 4 + 2; // 2-6 seconds
        }

        if (isBlinkingRef.current) {
            blinkPhaseRef.current += delta;
            const blinkDuration = 0.15; // Total blink duration

            if (blinkPhaseRef.current < blinkDuration / 2) {
                // Closing
                const t = blinkPhaseRef.current / (blinkDuration / 2);
                setExpression('blink', t);
            } else if (blinkPhaseRef.current < blinkDuration) {
                // Opening
                const t = 1 - (blinkPhaseRef.current - blinkDuration / 2) / (blinkDuration / 2);
                setExpression('blink', t);
            } else {
                setExpression('blink', 0);
                isBlinkingRef.current = false;
            }
        }

        // --- Lip Sync ---
        if (lipSyncActiveRef.current && lipSyncTimelineRef.current.length > 0) {
            const elapsed = clockRef.current.getElapsedTime() - lipSyncStartRef.current;
            const lastEntry = lipSyncTimelineRef.current[lipSyncTimelineRef.current.length - 1];
            const totalDuration = lastEntry.time + lastEntry.duration;

            if (elapsed > totalDuration) {
                // Lip sync finished
                lipSyncActiveRef.current = false;
                resetMouthShapes();
                prevVowelRef.current = null;
            } else {
                const vowel = getCurrentVowel(lipSyncTimelineRef.current, elapsed);

                if (vowel !== prevVowelRef.current) {
                    // Reset previous mouth shape
                    resetMouthShapes();

                    // Set new mouth shape
                    if (vowel) {
                        setExpression(vowel, 0.8);
                    }
                    prevVowelRef.current = vowel;
                }
            }
        }

        // --- Emotion Expression ---
        const emotionMap = {
            'happy': 'happy',
            'smile': 'happy',
            'angry': 'angry',
            'serious': 'angry',
            'sad': 'sad',
            'surprised': 'surprised',
            'relaxed': 'relaxed',
            'normal': null,
        };

        const currentEmotion = currentEmotionRef.current;
        const targetExpression = emotionMap[currentEmotion] || null;

        // Reset emotion expressions (but not mouth/blink)
        ['happy', 'angry', 'sad', 'surprised', 'relaxed'].forEach(exp => {
            if (exp !== targetExpression) {
                setExpression(exp, 0);
            }
        });

        if (targetExpression) {
            setExpression(targetExpression, 0.7);
        }

        // Update mixer
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    return null; // VRM is added directly to the scene
};

export default VrmCharacter;
