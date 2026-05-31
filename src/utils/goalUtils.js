import { touchCloudSaveData } from './saveUtils';

const MAIN_GOAL_STORAGE_KEY = 'uma_main_goal';
const TODO_STORAGE_KEY = 'uma_todos';

const safeReadStorage = (key, fallback = '') => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return fallback;
    }

    try {
        const value = window.localStorage.getItem(key);
        return value ?? fallback;
    } catch (error) {
        console.error(`Failed to read localStorage key "${key}":`, error);
        return fallback;
    }
};

const safeWriteStorage = (key, value) => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return false;
    }

    try {
        window.localStorage.setItem(key, value);
        touchCloudSaveData();
        return true;
    } catch (error) {
        console.error(`Failed to write localStorage key "${key}":`, error);
        return false;
    }
};

const safeRemoveStorage = (key) => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.error(`Failed to remove localStorage key "${key}":`, error);
    }
};

export const normalizeGoalTodos = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((todo) => todo && typeof todo === 'object')
        .map((todo, index) => ({
            id: todo.id ?? `todo-${index}`,
            text: typeof todo.text === 'string' ? todo.text.trim() : '',
            completed: Boolean(todo.completed),
        }))
        .filter((todo) => todo.text.length > 0);
};

export const loadMainGoal = () => String(safeReadStorage(MAIN_GOAL_STORAGE_KEY, '') || '').trim();

export const saveMainGoal = (goal) => safeWriteStorage(MAIN_GOAL_STORAGE_KEY, String(goal || '').trim());

export const loadGoalTodos = () => {
    try {
        const parsed = JSON.parse(safeReadStorage(TODO_STORAGE_KEY, '[]') || '[]');
        return normalizeGoalTodos(parsed);
    } catch (error) {
        console.error('Failed to parse stored goal todos:', error);
        safeRemoveStorage(TODO_STORAGE_KEY);
        return [];
    }
};

export const saveGoalTodos = (todos) => {
    const normalizedTodos = normalizeGoalTodos(todos);
    const saved = safeWriteStorage(TODO_STORAGE_KEY, JSON.stringify(normalizedTodos));
    return {
        ok: saved,
        todos: normalizedTodos,
    };
};

export const getStoredGoalData = () => {
    const mainGoal = loadMainGoal();
    const todos = loadGoalTodos();
    const completedTodoCount = todos.filter((todo) => todo.completed).length;
    const todoCompletionPercent = todos.length > 0
        ? Math.round((completedTodoCount / todos.length) * 100)
        : 0;

    return {
        mainGoal,
        todos,
        totalTodoCount: todos.length,
        completedTodoCount,
        todoCompletionPercent,
    };
};
