import { beforeEach, describe, expect, it } from 'vitest';
import {
  getStoredGoalData,
  loadGoalTodos,
  loadMainGoal,
  saveGoalTodos,
  saveMainGoal,
} from './goalUtils';

describe('goalUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads the main goal', () => {
    expect(saveMainGoal('英検2級に合格')).toBe(true);
    expect(loadMainGoal()).toBe('英検2級に合格');
  });

  it('normalizes todo items when saving', () => {
    const result = saveGoalTodos([
      { id: 1, text: ' 単語20個 ', completed: false },
      { id: 2, text: '', completed: false },
      null,
    ]);

    expect(result.ok).toBe(true);
    expect(loadGoalTodos()).toEqual([
      { id: 1, text: '単語20個', completed: false },
    ]);
  });

  it('summarizes stored goal data', () => {
    saveMainGoal('定期テストで80点');
    saveGoalTodos([
      { id: 'a', text: '文法10問', completed: true },
      { id: 'b', text: '英単語30個', completed: false },
    ]);

    expect(getStoredGoalData()).toEqual({
      mainGoal: '定期テストで80点',
      todos: [
        { id: 'a', text: '文法10問', completed: true },
        { id: 'b', text: '英単語30個', completed: false },
      ],
      totalTodoCount: 2,
      completedTodoCount: 1,
      todoCompletionPercent: 50,
    });
  });
});

