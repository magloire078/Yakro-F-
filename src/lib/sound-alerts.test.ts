import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playNewOrderSound, playSuccessSound } from './sound-alerts';

describe('sound-alerts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ne lève pas d\'erreur dans un environnement serveur sans AudioContext', () => {
    expect(() => playNewOrderSound()).not.toThrow();
    expect(() => playSuccessSound()).not.toThrow();
  });

  it('exécute les nœuds audio quand AudioContext est disponible et actif', () => {
    const mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    const mockContext = {
      state: 'running',
      currentTime: 10,
      destination: {},
      createOscillator: vi.fn(() => ({ ...mockOscillator })),
      createGain: vi.fn(() => ({ ...mockGain })),
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Inject mock into global window
    (global as unknown as { window: { AudioContext: unknown } }).window = {
      AudioContext: vi.fn(() => mockContext),
    };

    expect(() => playNewOrderSound()).not.toThrow();
    expect(() => playSuccessSound()).not.toThrow();
  });
});
