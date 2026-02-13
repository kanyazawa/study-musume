/**
 * VrmViewer.jsx
 * React Three Fiber キャンバスでVRMキャラクターを表示するラッパーコンポーネント
 * Dialogue画面で使用される
 */
import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import VrmCharacter from './VrmCharacter';
import * as THREE from 'three';

// Camera controller to look at the right position
const CameraSetup = () => {
    const { camera } = useThree();

    useEffect(() => {
        // Look at the character's upper chest/neck area
        camera.lookAt(new THREE.Vector3(0, 1.15, 0));
        camera.updateProjectionMatrix();
    }, [camera]);

    return null;
};

const VrmViewer = ({ emotion = 'normal', text = '', isSpeaking = false, className = '' }) => {
    return (
        <div className={`vrm-viewer-container ${className}`}>
            <Canvas
                camera={{
                    position: [0, 1.2, 2.2],
                    fov: 25,
                    near: 0.1,
                    far: 100,
                }}
                gl={{
                    alpha: true,
                    antialias: true,
                    preserveDrawingBuffer: true,
                }}
                style={{ background: 'transparent' }}
                onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, 0);
                }}
            >
                <CameraSetup />

                {/* Lighting */}
                <ambientLight intensity={1.2} />
                <directionalLight
                    position={[1, 2, 1]}
                    intensity={1.5}
                    castShadow={false}
                />
                <directionalLight
                    position={[-1, 1, -1]}
                    intensity={0.5}
                />
                {/* Front fill light for face */}
                <pointLight position={[0, 1.5, 1]} intensity={0.8} />

                {/* VRM Character */}
                <Suspense fallback={null}>
                    <VrmCharacter
                        emotion={emotion}
                        text={text}
                        isSpeaking={isSpeaking}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default VrmViewer;
