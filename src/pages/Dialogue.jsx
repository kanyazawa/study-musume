
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import './Dialogue.css';
import LoadingScreen from '../components/UI/LoadingScreen';
import { speak, VOICEVOX_SPEAKERS, preloadCommonPhrases } from '../utils/voicevoxUtils';
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

const Dialogue = ({ stats, updateStats }) => {
    const [searchParams] = useSearchParams();
    const topic = searchParams.get('topic') || 'start';
    const navigate = useNavigate();
    const { playSE, playVoice } = useSound();

    const [line, setLine] = useState(null);
    const [scenarioData, setScenarioData] = useState([]);
    const [currentScene, setCurrentScene] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState("init");
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
    const [isSpeaking, setIsSpeaking] = useState(false); // Loading state for TTS

    // Study session tracking
    const [sessionStartTime] = useState(Date.now());
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);

    // Study Cost and Reward
    const TP_COST = 20;
    const INTELLECT_REWARD = 50;

    // Google Sheet CSV URL
    const SPREADSHEET_ID = '16TRO_hL1xFsnQK5j2MW0gmZFG1xckdPue9NsllsV6jA';

    // topicから教科を特定してsheetGidを取得
    const getSubjectGid = (topicName) => {
        for (const subject of STUDY_TOPICS) {
            for (const category of subject.categories) {
                for (const unit of category.units) {
                    if (unit.topic === topicName || unit.id === topicName) {
                        return { gid: subject.sheetGid || '0', subjectId: subject.id };
                    }
                    // chapters/sections内も検索
                    if (unit.chapters) {
                        for (const chapter of unit.chapters) {
                            if (chapter.topic === topicName) {
                                return { gid: subject.sheetGid || '0', subjectId: subject.id };
                            }
                            if (chapter.sections) {
                                for (const section of chapter.sections) {
                                    if (section.topic === topicName) {
                                        return { gid: subject.sheetGid || '0', subjectId: subject.id };
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
    };

    // Get subject info from topic
    const getSubjectInfo = (topic) => {
        for (const subject of STUDY_TOPICS) {
            for (const category of subject.categories) {
                const unit = category.units.find(u => u.topic === topic);
                if (unit) {
                    return {
                        subject: subject.name,
                        category: category.name,
                        unit: unit.name
                    };
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
            setLine(currentScene[nextIdx]);
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
                const unit = category.units.find(u => u.topic === topic);
                if (unit) {
                    subjectInfo = {
                        subject: subject.name,
                        category: category.name,
                        unit: unit.name
                    };
                    break;
                }
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
                totalStudyTime: (stats?.totalStudyTime || 0) + sessionDurationMinutes,
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

    const handleSpeak = async (e) => {
        e.stopPropagation(); // Prevent advancing dialogue
        if (!line || !line.text || isSpeaking) return;

        setIsSpeaking(true);
        // Use VOICEVOX with Metan voice
        await speak(line.text, VOICEVOX_SPEAKERS.METAN);
        setIsSpeaking(false);
    };

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
            // Use VOICEVOX for quiz feedback
            speak("正解！", VOICEVOX_SPEAKERS.METAN);

            // Increment Stats (Affection & Intellect)
            if (updateStats) {
                updateStats({
                    affection: (stats?.affection || 0) + 5,
                    intellect: (stats?.intellect || 0) + 10
                });
            }

            // Show Feedback Overlay
            setFeedback('correct');

            // Auto-advance after 1.5 seconds
            setTimeout(() => {
                setFeedback(null);

                const nextIdx = currentIndex + 1;
                if (nextIdx >= currentScene.length) {
                    // Same logic as handleNext end
                    const currentLine = currentScene[currentIndex];
                    const nextSceneId = currentLine.next;
                    if (nextSceneId && nextSceneId.toLowerCase() !== 'end' && nextSceneId.trim() !== '') {
                        const targetSceneExists = scenarioData.some(d => d.scene === nextSceneId);
                        if (targetSceneExists) playScene(scenarioData, nextSceneId);
                        else finishStudy();
                    } else {
                        finishStudy();
                    }
                } else {
                    setCurrentIndex(nextIdx);
                    setLine(currentScene[nextIdx]);
                }
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
                options: options.length > 0 ? options : null // 選択肢がある場合のみ保存
            });

            // Use VOICEVOX for quiz feedback
            speak("もう一度頑張って。", VOICEVOX_SPEAKERS.METAN);

            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 1000);
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

            <div className="character-figure">
                <img
                    src={CHARACTER_IMAGES[line.expression] || CHARACTER_IMAGES[line.image] || CHARACTER_IMAGES[line.emotion] || CHARACTER_IMAGES['default']}
                    alt="Character"
                    className={`char-image-dialogue ${line.effect === 'shake' ? 'effect-shake' : ''} ${(line.graph || line.study_image) ? 'with-board' : ''}`}
                />
            </div>

            <div className="dialogue-box">
                <div className="name-tag">{isQuiz ? 'Question' : line.speaker}</div>
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
        </div>
    );
};

export default Dialogue;
