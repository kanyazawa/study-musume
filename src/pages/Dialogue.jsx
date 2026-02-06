
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import './Dialogue.css';
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

// Emotional Variations
import NoaHappy from '../assets/images/noah_happy.png';
import NoaNormal from '../assets/images/noah_normal.png';
import NoaAngry from '../assets/images/noah_angry.png';

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

    // Google Sheet CSV URL (Published or Export)
    const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/16TRO_hL1xFsnQK5j2MW0gmZFG1xckdPue9NsllsV6jA/export?format=csv`;

    // --- CSV Parser ---
    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        if (lines.length === 0) return [];
        let headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Normalize headers
        headers = headers.map(h => {
            if (h === 'id') return 'order'; // Map 'id' to 'order'
            if (h === 'next_id') return 'next'; // Map 'next_id' to 'next'
            return h;
        });

        const data = [];
        let lastScene = "";

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

    // Load Scenario
    useEffect(() => {
        const loadScenario = async () => {
            setLoading(true);
            try {
                let data = [];
                let source = "none";

                // Helpher to check if topic exists in data
                const hasTopic = (d, t) => {
                    if (!d || d.length === 0) return false;
                    // Check if 't' is strictly in 'scene' column
                    return d.some(row => row.scene === t);
                };

                // 1. Try fetching from GAS Web App (JSON)
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
                            option3: d.option3 || ""
                        }));

                        // Check if this data actually has the requested topic
                        if (hasTopic(gasData, topic)) {
                            data = gasData;
                            source = "GAS";
                            setDataSource("GAS");
                            console.log("Loaded topic from GAS Web App");
                        } else {
                            console.warn(`GAS Web App loaded but topic '${topic}' not found. Trying local fallback...`);
                            throw new Error("Topic not found in GAS");
                        }
                    } else {
                        throw new Error("GAS App fetch failed");
                    }
                } catch (e) {
                    console.warn("Falling back to local file:", e.message);
                    // 2. Fallback to local file (CSV)
                    try {
                        const resLocal = await fetch('/scenarios/scenario.csv');
                        if (!resLocal.ok) throw new Error('Failed to load local scenario file');
                        const text = await resLocal.text();
                        data = parseCSV(text);
                        source = "Local";
                        setDataSource("Local");
                        console.log("Loaded topic from Local CSV");
                    } catch (localErr) {
                        console.error("Local load failed:", localErr);
                        // If GAS had loaded but was missing topic, maybe we should still use it?
                        // For now, leave data empty or if we had cached GAS data, logical to use it but we didn't save it.
                    }
                }

                // Post-Processing
                const processedData = [];
                let lastScene = "";

                // Sort by sheet/row index is tricky if mixed sources, but usually fine.
                data.forEach((row, i) => {
                    // 1. Fill 'scene'
                    if (!row.scene && lastScene) {
                        row.scene = lastScene;
                    } else if (row.scene) {
                        lastScene = row.scene;
                    }

                    // 2. Fill 'order' (id)
                    if (!row.order) {
                        if (processedData.length > 0 && processedData[processedData.length - 1].scene === row.scene) {
                            const prevOrder = parseInt(processedData[processedData.length - 1].order);
                            if (!isNaN(prevOrder)) {
                                row.order = (prevOrder + 1).toString();
                            } else {
                                row.order = (processedData.length + 1).toString();
                            }
                        } else {
                            row.order = "1";
                        }
                    }

                    // Safety: Ensure next is string (for local or other sources)
                    if (row.next) row.next = String(row.next);
                    if (row.answer) row.answer = String(row.answer);

                    processedData.push(row);
                });

                setScenarioData(processedData);

                // Determine start scene based on topic
                const uniqueScenes = [...new Set(processedData.map(d => d.scene))];
                let startSceneId = uniqueScenes.includes(topic) ? topic : null;

                if (!startSceneId) {
                    // Fallback strategies for start scene
                    if (topic === 'start' && uniqueScenes.includes('start')) {
                        startSceneId = 'start';
                    } else if (uniqueScenes.length > 0) {
                        startSceneId = uniqueScenes[0]; // If specific topic not found, play first available
                        if (source === "GAS" || source === "Local") {
                            // Only notify mismatch if we successfully loaded *something*
                            setLine({ speaker: 'System', text: `Scene '${topic}' not found. Playing '${startSceneId}' instead.`, emotion: 'normal' });
                            // Don't return, let it play
                        }
                    }
                }

                if (startSceneId) {
                    playScene(processedData, startSceneId);
                } else {
                    console.error("No valid scene found for topic:", topic);
                    setLine({ speaker: 'System', text: `Scene '${topic}' not found in any sheet.`, emotion: 'normal' });
                }
            } catch (err) {
                console.error(err);
                setLine({ speaker: 'System', text: "Error loading scenario: " + err.message, emotion: 'normal' });
            } finally {
                setLoading(false);
            }
        };
        loadScenario();
    }, [topic]);

    // Preload common phrases for faster playback
    useEffect(() => {
        preloadCommonPhrases(VOICEVOX_SPEAKERS.METAN);
    }, []);

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
        navigate('/');
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
            addWrongQuestion({
                subject: subjectInfo.subject,
                questionId: line.order || `${topic}-${currentIndex}`,
                questionText: line.text,
                correctAnswer: line[`option${line.answer}`] || '不明',
                userAnswer: line[`option${optionIndex}`] || '不明'
            });

            // Use VOICEVOX for quiz feedback
            speak("もう一度頑張って。", VOICEVOX_SPEAKERS.METAN);

            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 1000);
        }
    };

    if (loading) return <div className="dialogue-screen"><div className="dialogue-box"><div className="dialogue-text">読み込み中...</div></div></div>;
    if (!line) return <div className="dialogue-screen"><div className="dialogue-box"><div className="dialogue-text">データがありません</div></div></div>;

    const isQuiz = line.speaker === 'Quiz';

    return (
        <div className="dialogue-screen" onClick={handleNext}>
            <div className="room-background"></div>

            {/* Visual Feedback Overlay */}
            {feedback && (
                <div className={`feedback-overlay ${feedback}`}>
                    {feedback === 'correct' ? '⭕ Perfect!' : '❌ Try again...'}
                </div>
            )}

            <div className="character-figure">
                <img
                    src={CHARACTER_IMAGES[line.image] || CHARACTER_IMAGES[line.emotion] || CHARACTER_IMAGES['default']}
                    alt="Character"
                    className="char-image-dialogue"
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
