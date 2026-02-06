import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Check, Save } from 'lucide-react';
import './Goal.css';

const Goal = () => {
    const navigate = useNavigate();
    const [mainGoal, setMainGoal] = useState('');
    const [todoInput, setTodoInput] = useState('');
    const [todos, setTodos] = useState([]);

    // Load from Local Storage on mount
    useEffect(() => {
        const savedMainGoal = localStorage.getItem('uma_main_goal');
        const savedTodos = JSON.parse(localStorage.getItem('uma_todos') || '[]');

        if (savedMainGoal) setMainGoal(savedMainGoal);
        if (savedTodos) setTodos(savedTodos);
    }, []);

    // Save to Local Storage whenever data changes
    const saveGoal = () => {
        localStorage.setItem('uma_main_goal', mainGoal);
        alert('目標を保存しました！');
    };

    const saveTodos = (newTodos) => {
        setTodos(newTodos);
        localStorage.setItem('uma_todos', JSON.stringify(newTodos));
    };

    const addTodo = () => {
        if (!todoInput.trim()) return;
        const newTodo = {
            id: Date.now(),
            text: todoInput,
            completed: false
        };
        saveTodos([...todos, newTodo]);
        setTodoInput('');
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
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ChevronLeft color="white" />
                </button>
                <h2>目標設定</h2>
            </div>

            <div className="goal-content">
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
                        {todos.length === 0 && <p className="empty-msg">タスクはまだありません。</p>}
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
