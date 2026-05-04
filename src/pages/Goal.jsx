import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Check, Save } from 'lucide-react';
import './Goal.css';
import { getGameLoopSnapshot } from '../utils/gameLoopUtils';
import {
    loadGoalTodos,
    loadMainGoal,
    saveGoalTodos,
    saveMainGoal,
} from '../utils/goalUtils';

const Goal = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [mainGoal, setMainGoal] = useState('');
    const [todoInput, setTodoInput] = useState('');
    const [todos, setTodos] = useState([]);
    const [examDate, setExamDate] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const gameLoopSnapshot = getGameLoopSnapshot(stats, {
        goalData: {
            mainGoal,
            todos,
            totalTodoCount: todos.length,
            completedTodoCount: todos.filter((todo) => todo.completed).length,
            todoCompletionPercent: todos.length > 0
                ? Math.round((todos.filter((todo) => todo.completed).length / todos.length) * 100)
                : 0,
        },
    });

    // Load from Local Storage on mount
    useEffect(() => {
        setMainGoal(loadMainGoal());
        setTodos(loadGoalTodos());
    }, []);

    useEffect(() => {
        setExamDate(stats?.examDate || '');
    }, [stats?.examDate]);

    // Save to Local Storage whenever data changes
    const saveGoal = () => {
        try {
            const saved = saveMainGoal(mainGoal);
            if (!saved) {
                throw new Error('failed to save main goal');
            }
            if (updateStats) {
                updateStats((currentStats) => ({ ...currentStats }));
            }
            setErrorMessage('');
            alert('目標を保存しました！');
        } catch (error) {
            console.error('Failed to save goal:', error);
            setErrorMessage('目標の保存に失敗しました。');
        }
    };

    const saveTodos = (newTodos) => {
        try {
            const result = saveGoalTodos(newTodos);
            if (!result.ok) {
                throw new Error('failed to save todos');
            }
            setTodos(result.todos);
            if (updateStats) {
                updateStats((currentStats) => ({ ...currentStats }));
            }
            setErrorMessage('');
            return true;
        } catch (error) {
            console.error('Failed to save todos:', error);
            setErrorMessage('タスクの保存に失敗しました。');
            return false;
        }
    };

    const saveExamDate = () => {
        if (!updateStats) return;
        try {
            updateStats({ examDate });
            setErrorMessage('');
            alert('入試日を保存しました！');
        } catch (error) {
            console.error('Failed to save exam date:', error);
            setErrorMessage('入試日の保存に失敗しました。');
        }
    };

    const addTodo = () => {
        const trimmedInput = todoInput.trim();
        if (!trimmedInput) return;

        const newTodo = {
            id: Date.now(),
            text: trimmedInput,
            completed: false
        };
        const saved = saveTodos([...todos, newTodo]);
        if (saved) {
            setTodoInput('');
        }
    };

    const toggleTodo = (id) => {
        const newTodos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos(newTodos);
    };

    const deleteTodo = (id) => {
        const newTodos = todos.filter(todo => todo.id !== id);
        saveTodos(newTodos);
    };

    return (
        <div className="goal-screen">
            <div className="goal-header">
                <button className="back-btn" onClick={() => navigate('/home')}>
                    <ChevronLeft color="white" />
                </button>
                <h2>目標設定</h2>
            </div>

            <div className="goal-content">
                {errorMessage && <p className="empty-msg">{errorMessage}</p>}

                <div className="goal-progress-panel">
                    <div className="goal-progress-copy">
                        <span className="goal-progress-kicker">試験攻略ループ</span>
                        <h3>{gameLoopSnapshot.examProgress.title}</h3>
                        <p>{gameLoopSnapshot.examProgress.summary}</p>
                    </div>
                    <div className="goal-progress-metrics">
                        <div className="goal-progress-card">
                            <span>準備率</span>
                            <strong>{gameLoopSnapshot.examProgress.readinessPercent}%</strong>
                        </div>
                        <div className="goal-progress-card">
                            <span>ToDo達成</span>
                            <strong>{gameLoopSnapshot.examProgress.todoCompletionPercent}%</strong>
                        </div>
                        <div className="goal-progress-card">
                            <span>復習負債</span>
                            <strong>{gameLoopSnapshot.reviewLoad.due}件</strong>
                        </div>
                    </div>
                </div>

                {/* Main Goal Section */}
                <div className="section-card main-goal-section">
                    <h3>🏆 最終目標</h3>
                    <div className="input-group">
                        <textarea
                            className="main-goal-input"
                            value={mainGoal}
                            onChange={(e) => setMainGoal(e.target.value)}
                            placeholder="ここに最終目標を入力（例：東大合格！、TOEIC 800点！）"
                            rows={3}
                        />
                        <button className="save-btn" onClick={saveGoal}>
                            <Save size={18} /> 保存
                        </button>
                    </div>
                </div>

                <div className="section-card main-goal-section">
                    <h3>📅 入試日</h3>
                    <div className="input-group">
                        <input
                            className="main-goal-input"
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                        />
                        <button className="save-btn" onClick={saveExamDate}>
                            <Save size={18} /> 保存
                        </button>
                    </div>
                </div>

                {/* ToDo List Section */}
                <div className="section-card todo-section">
                    <h3>📝 ToDoリスト</h3>

                    <div className="todo-input-area">
                        <input
                            type="text"
                            value={todoInput}
                            onChange={(e) => setTodoInput(e.target.value)}
                            placeholder="新しいタスクを追加..."
                            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                        />
                        <button className="add-btn" onClick={addTodo}>
                            <Plus size={20} />
                        </button>
                    </div>

                    <ul className="todo-list">
                        {todos.length === 0 && <li className="empty-msg">タスクはまだありません。</li>}
                        {todos.map(todo => (
                            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                                <div className="todo-checkbox" onClick={() => toggleTodo(todo.id)}>
                                    {todo.completed && <Check size={14} color="white" />}
                                </div>
                                <span className="todo-text">{todo.text}</span>
                                <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Home Button mimicking the UI */}
            {/* Footer removed */}
        </div>
    );
};

export default Goal;
