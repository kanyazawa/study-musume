import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLocalSaveDataTimestamp } from '../utils/saveUtils';

const mockDoc = vi.fn((_db, ...segments) => segments.join('/'));
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}));

vi.mock('./config', () => ({
  db: {},
}));

describe('syncOnLogin', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockDoc.mockClear();
    mockSetDoc.mockReset();
    mockGetDoc.mockReset();
  });

  it('restores cloud data when local data has never been timestamped', async () => {
    localStorage.setItem('gameStats', JSON.stringify({ tp: 10, hasReceivedWelcomeBonus: true }));

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        gameStats: JSON.stringify({ tp: 99, hasReceivedWelcomeBonus: true }),
        studyHistory: '["cloud"]',
        _savedAt: 1700000000000,
      }),
    });

    const { syncOnLogin } = await import('./sync');
    const result = await syncOnLogin('user-1');

    expect(result).toMatchObject({
      success: true,
      source: 'cloud',
    });
    expect(JSON.parse(localStorage.getItem('gameStats')).tp).toBe(99);
    expect(localStorage.getItem('studyHistory')).toBe('["cloud"]');
    expect(getLocalSaveDataTimestamp()).toBe(1700000000000);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc).toHaveBeenCalledWith(
      'users/user-1/stats/current',
      expect.objectContaining({
        updatedAt: 'SERVER_TIMESTAMP',
      }),
      { merge: true },
    );
  });
});
