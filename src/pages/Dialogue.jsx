import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import './Dialogue.css';
import VrmViewer from '../components/VrmViewer';
import { estimateSpeechDuration } from '../utils/lipSync';
import LoadingScreen from '../components/UI/LoadingScreen';
import { speak, speakWithVoicevox, prefetchVoicevox, isVoicevoxAvailable, VOICEVOX_SPEAKERS, preloadCommonPhrases } from '../utils/voicevoxUtils';
import { saveStudySession } from '../utils/studyHistoryUtils';
import { STUDY_TOPICS } from '../data/studyTopics';
import { updateMissionsOnStudy } from '../utils/missionUtils';
import { updateStatsOnStudy, checkForNewAchievements } from '../utils/achievementUtils';
import { addWrongQuestion } from '../utils/reviewUtils';
import { saveStudyCompletion } from '../firebase/sync';
import { getCurrentUser } from '../firebase/auth';

// Images
import CharacterMain from '../assets/images/character_main.png';
import CharacterNew from '../assets/images/character_new.png';
import CharacterTsundere from '../assets/images/character_tsundere.png';
import CharacterUser from '../assets/images/character_user.png';
import CharacterRen from '../assets/images/character_ren.png'; // Ren Image
import BgClassroom from '../assets/images/bg_classroom.png';

// Emotional Variations
import NoaHappy from '../assets/images/noah_happy.png';
import NoaNormal from '../assets/images/noah_normal.png';
import NoaAngry from '../assets/images/noah_angry.png';
import { useSound } from '../contexts/SoundContext';
import functionPlot from 'function-plot';

const CHARACTER_IMAGES = {
    'main': CharacterMain,
    'new': CharacterNew,
    'tsundere': CharacterTsundere,
    'user': CharacterUser,
    'default': NoaNormal,
    // Emotion mapping
    'happy': NoaHappy,
    'normal': NoaNormal,
    'angry': NoaAngry,
    'serious': NoaNormal, // Fallback for serious
    'smile': NoaHappy     // Fallback for smile
};

const REN_IMAGES = {
    'default': CharacterRen,
    'main': CharacterRen,
    'new': CharacterRen,
    // Map all emotions to the Ren image for now
    'happy': CharacterRen,
    'normal': CharacterRen,
    'angry': CharacterRen,
    'serious': CharacterRen,
    'smile': CharacterRen
};

const Dialogue = ({ stats, updateStats }) => {
    const [searchParams] = useSearchParams();
    const topic = searchParams.get('topic') || 'start';
    const navigate = useNavigate();
    const { playSE, playVoice } = useSound();

    // Character Selection Logic
    const characterId = stats?.characterId || 'noah';
    const isRen = characterId === 'ren';
    const characterName = isRen ? 'レン' : 'ノア';
    const currentImages = isRen ? REN_IMAGES : CHARACTER_IMAGES;

    const [line, setLine] = useState(null);
    const [scenarioData, setScenarioData] = useState([]);
    const [currentScene, setCurrentScene] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState("init");
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
    const [isSpeaking, setIsSpeaking] = useState(false); // Loading state for TTS
    const [vrmSpeaking, setVrmSpeaking] = useState(false); // Lip sync state for VRM
    const [vrmText, setVrmText] = useState(''); // Current text for lip sync
    const vrmSpeakTimerRef = useRef(null);
    const voicevoxAvailableRef = useRef(false); // VOICEVOX利用可否（起動時に1回だけチェック）
    const [use3D, setUse3D] = useState(() => {
        const saved = localStorage.getItem('characterMode');
        return saved === '3d';
    });

    const toggleCharacterMode = useCallback((e) => {
        e.stopPropagation();
        setUse3D(prev => {
            const next = !prev;
            localStorage.setItem('characterMode', next ? '3d' : '2d');
            return next;
        });
    }, []);

    // Study session tracking
    const [sessionStartTime] = useState(Date.now());
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);

    // 起動時に1回VOICEVOXの利用可否をチェック
    useEffect(() => {
        isVoicevoxAvailable().then(available => {
            voicevoxAvailableRef.current = available;
            console.log('VOICEVOX available:', available);
        });
    }, []);

    // Study Cost and Reward
    const TP_COST = 20;
    const INTELLECT_REWARD = 50;

    // Google Sheet CSV URL
    const SPREADSHEET_ID = '16TRO_hL1xFsnQK5j2MW0gmZFG1xckdPue9NsllsV6jA';

    // topicから教科を特定してsheetGidを取得
    const getSubjectGid = (topicName) => {
        for (const subject of STUDY_TOPICS) {
            // Check subject level first to get fallback
            const subjectGid = subject.sheetGid || '0';

            for (const category of subject.categories) {
                // Check category level
                const categoryGid = category.sheetGid || subjectGid;

                for (const unit of category.units) {
                    // Check unit level
                    const unitGid = unit.sheetGid || categoryGid;

                    if (unit.topic === topicName || unit.id === topicName) {
                        return { gid: unitGid, subjectId: subject.id };
                    }
                    // chapters/sections内も検索
                    if (unit.chapters) {
                        for (const chapter of unit.chapters) {
                            if (chapter.topic === topicName || chapter.id === topicName) {
                                return { gid: unit.sheetGid || category.sheetGid || subject.sheetGid || '0', subjectId: subject.id };
                            }
                            if (chapter.sections) {
                                for (const section of chapter.sections) {
                                    if (section.topic === topicName || section.id === topicName) {
                                        return { gid: unit.sheetGid || category.sheetGid || subject.sheetGid || '0', subjectId: subject.id };
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return { gid: '0', subjectId: 'default' };
    };

    const { gid: sheetGid, subjectId: currentSubjectId } = getSubjectGid(topic);
    const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${sheetGid}`;

    // --- CSV Parser ---
    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        if (lines.length === 0) return [];
        let headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Normalize headers
        headers = headers.map(h => {
            if (h === 'id') return 'order'; // Map 'id' to 'order'
            if (h === 'next_id') return 'next'; // Map 'next_id' to 'next'
            if (h === 'emotion') return 'expression'; // Map 'emotion' to 'expression' if needed
            if (h === 'image') return 'study_image'; // Map 'image' to 'study_image' if generic 'image' is used for this
            return h;
        });

        const data = [];
        let lastScene = "";
        let lastBackground = "";

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            // Handle basic comma splitting (note: this breaks on commas inside quotes)
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};

            headers.forEach((h, idx) => {
                row[h] = values[idx] || "";
            });

            // --- Auto-fill logic ---
            // 1. Fill 'scene' from previous row if empty
            if (!row.scene && lastScene) {
                row.scene = lastScene;
            } else if (row.scene) {
                lastScene = row.scene;
            }

            // Fill 'background' from previous row if empty (persistence)
            if (!row.background && lastBackground) {
                row.background = lastBackground;
            } else if (row.background) {
                lastBackground = row.background;
            }

            // 2. Fill 'order' (id) if empty
            if (!row.order) {
                // Same scene as previous?
                if (data.length > 0 && data[data.length - 1].scene === row.scene) {
                    const prevOrder = parseInt(data[data.length - 1].order);
                    if (!isNaN(prevOrder)) {
                        row.order = (prevOrder + 1).toString();
                    } else {
                        // Fallback (e.g. prev order was NaN)
                        row.order = (data.length + 1).toString();
                    }
                } else {
                    // New scene start -> ID 1
                    row.order = "1";
                }
            }
            // -----------------------

            // Safety: Ensure fields are strings
            if (row.next) row.next = String(row.next);
            if (row.answer) row.answer = String(row.answer);

            data.push(row);
        }
        return data;
    };

    // GAS Web App URL (JSON)
    const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzWh_YokG87cgf4SDSG8exubfe4__GMQUNIQcLa5TdqAn3xdH6-UJGcONJ-5DLveiBR/exec";

    // Load Scenario with Caching
    useEffect(() => {
        const loadScenario = async () => {
            setLoading(true);
            const CACHE_KEY = `study_scenario_${currentSubjectId}_v3`; // 教科別キャッシュ
            const CACHE_DURATION = 60 * 60 * 1000; // 60分

            let finalData = null;
            let usedSource = "none";

            // 1. Try Cache
            try {
                const cachedStr = localStorage.getItem(CACHE_KEY);
                if (cachedStr) {
                    const cached = JSON.parse(cachedStr);
                    const age = Date.now() - cached.timestamp;

                    // Check if cache is fresh and contains the requested topic
                    if (age < CACHE_DURATION) {
                        const hasTopic = cached.data.some(d => d.scene === topic);
                        if (hasTopic || topic === 'start') {
                            console.log(`Using cached data (Age: ${Math.floor(age / 1000)}s)`);
                            finalData = cached.data;
                            usedSource = "Cache";
                        }
                    }
                }
            } catch (e) {
                console.warn("Cache read failed:", e);
                localStorage.removeItem(CACHE_KEY);
            }

            // 2. Fetch from Network if no cache
            if (!finalData) {
                try {
                    let rawData = [];
                    // Helper to check topic
                    const hasTopic = (d, t) => d && d.some(row => row.scene === t);

                    // A. Try GAS
                    try {
                        const res = await fetch(GAS_WEB_APP_URL);
                        if (res.ok) {
                            const jsonData = await res.json();
                            const gasData = jsonData.map(d => ({
                                ...d,
                                order: d.order ? String(d.order) : "",
                                next: d.next ? String(d.next) : "",
                                answer: d.answer ? String(d.answer) : "",
                                option1: d.option1 || "",
                                option2: d.option2 || "",
                                option3: d.option3 || "",
                                background: d.background || "",
                                effect: d.effect || "",
                                voice: d.voice || "",
                                se: d.se || "",
                                expression: d.expression || d.emotion || "",
                                graph: d.graph || "",
                                study_image: d.study_image || d.image || ""
                            }));

                            if (hasTopic(gasData, topic)) {
                                rawData = gasData;
                                usedSource = "GAS";
                                console.log("Loaded from GAS");
                            } else {
                                throw new Error("Topic not found in GAS");
                            }
                        } else {
                            throw new Error("GAS fetch failed");
                        }
                    } catch (gasErr) {
                        console.warn("Falling back to local:", gasErr.message);
                        // B. Try Local CSV
                        const resLocal = await fetch('/scenarios/scenario.csv');
                        if (!resLocal.ok) throw new Error('Failed to load local scenario');
                        const text = await resLocal.text();
                        rawData = parseCSV(text);
                        usedSource = "Local";
                        console.log("Loaded from Local CSV");
                    }

                    // Process Data (Fill empty fields, etc.)
                    const processedData = [];
                    let lastScene = "";
                    let lastBackground = "";

                    rawData.forEach(row => {
                        // 1. Fill 'scene'
                        if (!row.scene && lastScene) {
                            row.scene = lastScene;
                        } else if (row.scene) {
                            lastScene = row.scene;
                        }

                        // Fill background persistence
                        if (!row.background && lastBackground) {
                            row.background = lastBackground;
                        } else if (row.background) {
                            lastBackground = row.background;
                        }

                        // 2. Fill 'order'
                        if (!row.order) {
                            if (processedData.length > 0 && processedData[processedData.length - 1].scene === row.scene) {
                                const prevOrder = parseInt(processedData[processedData.length - 1].order);
                                row.order = !isNaN(prevOrder) ? (prevOrder + 1).toString() : (processedData.length + 1).toString();
                            } else {
                                row.order = "1";
                            }
                        }

                        // Safety
                        if (row.next) row.next = String(row.next);
                        if (row.answer) row.answer = String(row.answer);

                        processedData.push(row);
                    });

                    finalData = processedData;

                    // Save to Cache
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify({
                            timestamp: Date.now(),
                            data: finalData
                        }));
                    } catch (e) {
                        console.warn("Failed to save cache:", e);
                    }

                } catch (err) {
                    console.error("All fetch methods failed:", err);
                    setLine({ speaker: 'System', text: "Error loading scenario: " + err.message, emotion: 'normal' });
                }
            }

            // 3. Start Scene
            if (finalData) {
                setScenarioData(finalData);
                setDataSource(usedSource);

                const uniqueScenes = [...new Set(finalData.map(d => d.scene))];
                let startSceneId = uniqueScenes.includes(topic) ? topic : null;

                if (!startSceneId) {
                    if (topic === 'start' && uniqueScenes.includes('start')) startSceneId = 'start';
                    else if (uniqueScenes.length > 0) {
                        startSceneId = uniqueScenes[0];
                        setLine({ speaker: 'System', text: `Scene '${topic}' not found. Playing '${startSceneId}' instead.`, emotion: 'normal' });
                    }
                }

                if (startSceneId) {
                    playScene(finalData, startSceneId);
                } else {
                    setLine({ speaker: 'System', text: `Scene '${topic}' not found.`, emotion: 'normal' });
                }
            }

            setLoading(false);
        };
        loadScenario();
    }, [topic]);

    // Preload common phrases for faster playback
    useEffect(() => {
        preloadCommonPhrases(VOICEVOX_SPEAKERS.METAN);
    }, []);

    // Play Audio/Voice when line changes
    useEffect(() => {
        if (!line) return;

        // 1. Play SE if exists
        if (line.se) {
            playSE(line.se);
        }

        // 2. Play Voice or TTS
        if (line.voice) {
            playVoice(line.voice);
        } else if (line.text && line.speaker !== "System") {
            // Optional: Auto-speak logic? For now, we keep manual TTS button, 
            // but if you want auto-speak for specific lines, logic goes here.
            // Currently keeping manual based on original code, but 'voice' column overrides.
        }

        // 3. Render Graph if exists
        if (line.graph) {
            // Function to render graph
            const renderGraph = () => {
                const container = document.getElementById('graph-container');
                if (!container) return;

                try {
                    // Get available width from blackboard frame (parent of container)
                    // If container is hidden or 0, fallback to window width logic
                    const rect = container.getBoundingClientRect();
                    const availableWidth = rect.width > 0 ? rect.width : (window.innerWidth < 600 ? window.innerWidth * 0.85 : 400);

                    // Fixed aspect ratio or height based on mobile
                    const isMobile = window.innerWidth < 600;
                    const height = isMobile ? availableWidth * 0.8 : 300;

                    functionPlot({
                        target: '#graph-container',
                        width: availableWidth,
                        height: height,
                        yAxis: { domain: [-10, 10] },
                        xAxis: { domain: [-10, 10] },
                        grid: true,
                        data: [{
                            fn: line.graph,
                            color: '#ffffff' // Chalk white
                        }],
                        theme: {
                            axis: {
                                domainColor: '#ffffff',
                                ticksColor: '#ffffff',
                                tickLabelColor: '#ffffff'
                            },
                        }
                    });
                } catch (e) {
                    console.error("Graph render failed:", e);
                }
            };

            // Initial render with slight delay to ensure DOM readiness
            setTimeout(renderGraph, 100);

            // Responsive updates
            const handleResize = () => {
                requestAnimationFrame(renderGraph);
            };

            window.addEventListener('resize', handleResize);

            // Cleanup
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [line]);

    const playScene = (allData, id) => {
        const sceneLines = allData.filter(d => d.scene === id);
        sceneLines.sort((a, b) => parseInt(a.order) - parseInt(b.order));

        if (sceneLines.length === 0) {
            console.warn("Scene empty:", id);
            return;
        }

        setCurrentScene(sceneLines);
        setCurrentIndex(0);
        setLine(sceneLines[0]);

        // Trigger VRM lip sync for first line
        if (sceneLines[0] && sceneLines[0].text) {
            triggerVrmLipSync(sceneLines[0].text);
        }
    };

    // Get subject info from topic
    const getSubjectInfo = (topic) => {
        for (const subject of STUDY_TOPICS) {
            for (const category of subject.categories) {
                // Check units
                for (const unit of category.units) {
                    if (unit.topic === topic || unit.id === topic) {
                        return { subject: subject.name, category: category.name, unit: unit.name };
                    }
                    // Check chapters
                    if (unit.chapters) {
                        for (const chapter of unit.chapters) {
                            if (chapter.topic === topic || chapter.id === topic) {
                                return { subject: subject.name, category: category.name, unit: unit.name };
                            }
                            // Check sections
                            if (chapter.sections) {
                                for (const section of chapter.sections) {
                                    if (section.topic === topic || section.id === topic) {
                                        return { subject: subject.name, category: category.name, unit: unit.name };
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return { subject: '不明', category: '', unit: topic };
    };

    const handleNext = () => {
        if (!currentScene) return;

        // Disable Next button click (background click) if it's a Quiz
        if (line && line.speaker === 'Quiz') return;

        const nextIdx = currentIndex + 1;

        if (nextIdx >= currentScene.length) {
            // Check transition
            const currentLine = currentScene[currentIndex];
            const nextSceneId = currentLine.next;

            // Check if user specified a "Next Scene Name"
            if (nextSceneId && nextSceneId.toLowerCase() !== 'end' && nextSceneId.trim() !== '') {
                // Verify strict existence to avoid getting stuck on numeric IDs
                const targetSceneExists = scenarioData.some(d => d.scene === nextSceneId);

                if (targetSceneExists) {
                    playScene(scenarioData, nextSceneId);
                } else {
                    // Assuming it's the end of study if next scene not found (or it was just an ID)
                    console.log(`Transition target '${nextSceneId}' not found as a scene. Finishing study.`);
                    finishStudy();
                }
            } else {
                finishStudy();
            }
        } else {
            setCurrentIndex(nextIdx);
            const nextLine = currentScene[nextIdx];
            setLine(nextLine);

            // Trigger VRM lip sync for new line
            if (nextLine && nextLine.text) {
                triggerVrmLipSync(nextLine.text);
            }
        }
    };

    const finishStudy = async () => {
        // Calculate session duration
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000); // seconds
        const sessionDurationMinutes = Math.floor(sessionDuration / 60); // minutes

        // Find subject/category/unit from topic
        let subjectInfo = { subject: '不明', category: '', unit: topic };

        for (const subject of STUDY_TOPICS) {
            for (const category of subject.categories) {
                // Check units
                for (const unit of category.units) {
                    if (unit.topic === topic || unit.id === topic) {
                        subjectInfo = { subject: subject.name, category: category.name, unit: unit.name };
                        break;
                    }
                    // Check chapters
                    if (unit.chapters) {
                        for (const chapter of unit.chapters) {
                            if (chapter.topic === topic || chapter.id === topic) {
                                subjectInfo = { subject: subject.name, category: category.name, unit: unit.name }; // Using Unit name as main grouping
                                break;
                            }
                            // Check sections
                            if (chapter.sections) {
                                for (const section of chapter.sections) {
                                    if (section.topic === topic || section.id === topic) {
                                        subjectInfo = { subject: subject.name, category: category.name, unit: unit.name };
                                        break;
                                    }
                                }
                            }
                            if (subjectInfo.subject !== '不明') break;
                        }
                    }
                    if (subjectInfo.subject !== '不明') break;
                }
                if (subjectInfo.subject !== '不明') break;
            }
            if (subjectInfo.subject !== '不明') break;
        }

        // Update missions
        updateMissionsOnStudy({
            subject: subjectInfo.subject,
            duration: sessionDurationMinutes,
            score: correctAnswers,
            totalQuestions: questionsAnswered
        });

        // Update achievements
        const isPerfect = questionsAnswered > 0 && correctAnswers === questionsAnswered;
        updateStatsOnStudy({
            subject: subjectInfo.subject,
            duration: sessionDurationMinutes,
            isPerfect: isPerfect
        });

        // Save study session
        saveStudySession({
            subject: subjectInfo.subject,
            category: subjectInfo.category,
            unit: subjectInfo.unit,
            duration: sessionDuration,
            questionsAnswered: questionsAnswered,
            correctAnswers: correctAnswers
        });

        let updatedStats = { ...stats };

        if (updateStats) {
            const currentTp = stats?.tp || 0;
            const newTp = Math.max(0, currentTp - TP_COST);
            const currentIntellect = stats?.intellect || 0;

            updatedStats = {
                ...stats,
                tp: newTp,
                intellect: currentIntellect + INTELLECT_REWARD,
                totalStudyTime: (stats?.totalStudyTime || 0) + sessionDurationMinutes, // Fix cumulative
                totalSessions: (stats?.totalSessions || 0) + 1
            };

            updateStats({
                tp: newTp,
                lastTpUpdateTime: Date.now(),
                intellect: currentIntellect + INTELLECT_REWARD,
                totalStudyTime: updatedStats.totalStudyTime,
                totalSessions: updatedStats.totalSessions
            });

            // Sync to Firestore (if logged in)
            const currentUser = getCurrentUser();
            if (currentUser) {
                await saveStudyCompletion(
                    currentUser.uid,
                    {
                        subject: subjectInfo.subject,
                        duration: sessionDurationMinutes,
                        date: new Date().toISOString().split('T')[0]
                    },
                    updatedStats
                );
            }

            // Check for new achievements
            const newAchievements = checkForNewAchievements(stats);

            let message = `勉強完了！\nTP -${TP_COST}\n学力 +${INTELLECT_REWARD}`;
            if (newAchievements.length > 0) {
                message += `\n\n🏆 新しい実績を達成しました！\n${newAchievements.map(a => `・${a.name}`).join('\n')}`;
            }

            alert(message);
        }
        navigate('/home');
    };

    // Trigger VRM lip sync animation
    const triggerVrmLipSync = useCallback((text) => {
        // Clear previous timer
        if (vrmSpeakTimerRef.current) {
            clearTimeout(vrmSpeakTimerRef.current);
        }

        setVrmText(text);
        setVrmSpeaking(true);

        // Auto-stop after estimated duration
        const duration = estimateSpeechDuration(text);
        vrmSpeakTimerRef.current = setTimeout(() => {
            setVrmSpeaking(false);
        }, duration * 1000 + 200); // +200ms buffer
    }, []);

    const handleSpeak = async (e) => {
        e.stopPropagation(); // Prevent advancing dialogue
        if (!line || !line.text || isSpeaking) return;

        setIsSpeaking(true);
        // Trigger lip sync
        triggerVrmLipSync(line.text);
        // Use VOICEVOX with Metan voice
        await speak(line.text, VOICEVOX_SPEAKERS.METAN);
        setIsSpeaking(false);
    };

    // Helper to get display name
    const getDisplayName = (speaker) => {
        if (speaker === 'ノア') return characterName;
        return speaker;
    };

    // Auto-speak: VOICEVOXが使えるならそちら、そうでなければブラウザTTSで即再生
    useEffect(() => {
        if (!line || !line.text) return;
        if (line.speaker === 'Quiz') return;

        // 前の読み上げをキャンセル
        window.speechSynthesis.cancel();

        // VRM lip sync 連動
        triggerVrmLipSync(line.text);

        const speakerId = VOICEVOX_SPEAKERS.METAN;

        // VOICEVOXが使える場合のみ試す（スマホではスキップ→即ブラウザTTS）
        const autoSpeak = async () => {
            if (voicevoxAvailableRef.current) {
                const success = await speakWithVoicevox(line.text, speakerId);
                if (success) return;
            }

            // フォールバック: ブラウザTTS（スマホでも動作）
            const utterance = new SpeechSynthesisUtterance(line.text);
            utterance.lang = 'ja-JP';

            // Ren(Male) logic for Pitch/Rate
            if (isRen) {
                utterance.pitch = 0.8; // Lower pitch for male
                utterance.rate = 1.0;
            } else {
                utterance.pitch = 1.3; // Higher pitch for female (Noah)
                utterance.rate = 1.0;
            }

            const voices = window.speechSynthesis.getVoices();
            const jaVoices = voices.filter(v => v.lang.startsWith('ja'));

            let voice = null;
            if (isRen) {
                // Try to find a male voice
                voice = jaVoices.find(v =>
                    v.name.includes('Male') || v.name.includes('Man') || v.name.includes('男性') ||
                    v.name.includes('Ichiro') // Google Japanese Male?
                );
            } else {
                voice = jaVoices.find(v =>
                    v.name.includes('Female') || v.name.includes('女性') ||
                    v.name.includes('Kyoko') || v.name.includes('Google 日本語')
                ) || jaVoices[0];
            }
            // If no specific voice found, fall back to default jaVoice
            if (voice) utterance.voice = voice;
            else if (jaVoices.length > 0) utterance.voice = jaVoices[0];

            window.speechSynthesis.speak(utterance);
        };

        autoSpeak();

        // VOICEVOXが使える場合のみ先読みキャッシュ
        if (voicevoxAvailableRef.current && currentScene && currentIndex >= 0) {
            const prefetchLines = currentScene.slice(currentIndex + 1, currentIndex + 4);
            prefetchLines.forEach(async (nextLine) => {
                if (!nextLine?.text || nextLine.speaker === 'Quiz') return;
                try {
                    await prefetchVoicevox(nextLine.text, speakerId);
                } catch (e) { /* ignore */ }
            });
        }

        return () => {
            window.speechSynthesis.cancel();
        };
    }, [line]);

    // Quiz Selection Handler
    const handleQuizOption = (optionIndex, e) => {
        e.stopPropagation();
        if (!line) return;

        // Check answer
        // answer is usually "1", "2", or "3".
        const isCorrect = String(line.answer) === String(optionIndex);

        // Track quiz stats
        setQuestionsAnswered(prev => prev + 1);
        if (isCorrect) {
            setCorrectAnswers(prev => prev + 1);
        }

        if (isCorrect) {
            // Increment Stats (Affection & Intellect)
            if (updateStats) {
                updateStats({
                    affection: (stats?.affection || 0) + 5,
                    intellect: (stats?.intellect || 0) + 10
                });
            }

            // Show Feedback Overlay
            setFeedback('correct');

            // 1.5秒後にwin_textを表示
            setTimeout(() => {
                setFeedback(null);

                const winText = line.win_text || 'ふーん、意外とわかってるじゃない。';

                setLine({
                    speaker: 'ノア',
                    text: winText,
                    emotion: 'happy',
                    background: line.background || '',
                    se: 'se_correct',
                    effect: '',
                });

                // 現在のindexはそのまま（次のクリックでhandleNextが呼ばれて進む）
            }, 1500);

        } else {
            // 間違えた問題を復習リストに追加
            const subjectInfo = getSubjectInfo(topic);

            // 選択肢を配列として保存
            const options = [];
            for (let i = 1; i <= 3; i++) {
                if (line[`option${i}`]) {
                    options.push(line[`option${i}`]);
                }
            }

            addWrongQuestion({
                subject: subjectInfo.subject,
                questionId: line.order || `${topic}-${currentIndex}`,
                questionText: line.text,
                correctAnswer: line[`option${line.answer}`] || '不明',
                userAnswer: line[`option${optionIndex}`] || '不明',
                options: options.length > 0 ? options : null
            });

            // フィードバック表示
            setFeedback('incorrect');

            // 1.5秒後にlose_textを表示してから次に進む
            setTimeout(() => {
                setFeedback(null);

                // lose_textがあればノアのセリフとして表示
                const loseText = line.lose_text || `正解は「${line[`option${line.answer}`] || '?'}」よ。しっかり覚えなさい！`;

                setLine({
                    speaker: 'ノア',
                    text: loseText,
                    emotion: 'serious',
                    background: line.background || '',
                    se: '',
                    effect: '',
                });

                // 現在のindexはそのまま（次のクリックでhandleNextが呼ばれて進む）
            }, 1500);
        }
    };



    // ... (existing imports)

    // ... (existing code)

    if (loading) return <LoadingScreen />;
    if (!line) return <div className="dialogue-screen"><div className="dialogue-box"><div className="dialogue-text">データがありません</div></div></div>;

    const isQuiz = line.speaker === 'Quiz';

    // Background Logic
    const getBackgroundImage = (bgId) => {
        if (!bgId) return `url(${BgClassroom})`;
        if (bgId === 'bg_classroom') return `url(${BgClassroom})`;
        // For other backgrounds, assume they are in public/images/ or assets mapping
        // Since we can't dynamically import easily without a map, we try public path first
        return `url(/images/${bgId}.png), url(${BgClassroom})`;
    };

    const bgStyle = {
        backgroundImage: getBackgroundImage(line.background)
    };

    return (
        <div className="dialogue-screen" onClick={handleNext}>
            <div className="room-background" style={bgStyle}></div>

            {/* Visual Feedback Overlay */}
            {feedback && (
                <div className={`feedback-overlay ${feedback}`}>
                    {feedback === 'correct' ? '⭕ Perfect!' : '❌ Try again...'}
                </div>
            )}

            {/* Blackboard Graph/Image Overlay */}
            {(line.graph || line.study_image) && (
                <div className="blackboard-container">
                    <div className="blackboard-frame">
                        <div className="blackboard-title">Smart Blackboard</div>
                        {line.graph ? (
                            <div id="graph-container"></div>
                        ) : (
                            <div className="study-image-container">
                                <img
                                    src={line.study_image.startsWith('http') ? line.study_image : `/images/${line.study_image}`}
                                    alt="Study Material"
                                    className="study-image-content"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        console.warn("Failed to load study image:", line.study_image);
                                    }}
                                />
                            </div>
                        )}
                        <div className="blackboard-chalk-dust"></div>
                    </div>
                </div>
            )}

            {/* 2D/3D Toggle Button */}
            <button
                className="char-mode-toggle"
                onClick={toggleCharacterMode}
                title={use3D ? '2Dモードに切替' : '3Dモードに切替'}
            >
                {use3D ? '3D' : '2D'}
            </button>

            <div
                className="character-figure"
            >
                {use3D ? (
                    <VrmViewer
                        emotion={line.expression || line.emotion || 'normal'}
                        text={vrmText}
                        isSpeaking={vrmSpeaking}
                        className={`vrm-dialogue ${(line.graph || line.study_image) ? 'with-board' : ''}`}
                    />
                ) : (
                    <img
                        src={
                            line?.expression && currentImages[line.expression]
                                ? currentImages[line.expression]
                                : line?.emotion && currentImages[line.emotion]
                                    ? currentImages[line.emotion]
                                    : currentImages['normal']
                        }
                        alt="Character"
                        className={`char-image-dialogue ${line.effect === 'shake' ? 'effect-shake' : ''} ${(line.graph || line.study_image) ? 'with-board' : ''}`}
                    />
                )}
            </div>

            <div className="dialogue-box">
                <div className="name-tag">{isQuiz ? 'Question' : getDisplayName(line.speaker)}</div>
                <div className="dialogue-text">
                    {line.text}
                </div>

                {/* TTS Button */}
                <button
                    className="tts-btn"
                    onClick={handleSpeak}
                    title="読み上げ"
                >
                    <Volume2 size={24} color="var(--uma-green)" />
                </button>

                {/* Conditional Rendering: Quiz Options vs Next Indicator */}
                {isQuiz ? (
                    <div className="quiz-options-container">
                        {line.option1 && (
                            <button className="quiz-btn" onClick={(e) => handleQuizOption(1, e)}>
                                1. {line.option1}
                            </button>
                        )}
                        {line.option2 && (
                            <button className="quiz-btn" onClick={(e) => handleQuizOption(2, e)}>
                                2. {line.option2}
                            </button>
                        )}
                        {line.option3 && (
                            <button className="quiz-btn" onClick={(e) => handleQuizOption(3, e)}>
                                3. {line.option3}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="next-indicator">▼</div>
                )}
            </div>

            {/* Character Selection Overlay Removed */}
        </div>
    );
};

export default Dialogue;
