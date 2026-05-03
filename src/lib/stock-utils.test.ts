import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Order } from './types';

const updateMock = vi.fn();
const commitMock = vi.fn().mockResolvedValue(undefined);
const writeBatchMock = vi.fn(() => ({ update: updateMock, commit: commitMock }));
const incrementMock = vi.fn((n: number) => ({ __increment: n }));
const docMock = vi.fn((_db: unknown, collection: string, id: string) => ({ collection, id }));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...(args as [unknown, string, string])),
  writeBatch: (...args: unknown[]) => writeBatchMock(...args),
  increment: (n: number) => incrementMock(n),
  getDoc: vi.fn(),
}));

import { decrementStockForOrder } from './stock-utils';

const fakeDb = {} as never;

const buildOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    plats: [],
    ...overrides,
  }) as Order;

describe('decrementStockForOrder', () => {
  beforeEach(() => {
    updateMock.mockClear();
    commitMock.mockClear();
    writeBatchMock.mockClear();
    incrementMock.mockClear();
    docMock.mockClear();
  });

  it('does nothing when order has no ingredients', async () => {
    const order = buildOrder({ plats: [{ id: 'p1', nom: 'Plat', quantite: 2 }] as Order['plats'] });
    await decrementStockForOrder(fakeDb, order);
    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it('aggregates the same ingredient across multiple plats and multiplies by quantity', async () => {
    const order = buildOrder({
      plats: [
        {
          id: 'p1',
          nom: 'Plat A',
          quantite: 2,
          ingredients: [
            { stockItemId: 's1', nom: 'Tomate', quantite: 3 },
            { stockItemId: 's2', nom: 'Sel', quantite: 1 },
          ],
        },
        {
          id: 'p2',
          nom: 'Plat B',
          quantite: 1,
          ingredients: [{ stockItemId: 's1', nom: 'Tomate', quantite: 4 }],
        },
      ] as Order['plats'],
    });

    await decrementStockForOrder(fakeDb, order);

    expect(writeBatchMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledTimes(2);

    const calls = updateMock.mock.calls.map(([ref, payload]) => ({ id: ref.id, payload }));
    const tomate = calls.find((c) => c.id === 's1');
    const sel = calls.find((c) => c.id === 's2');

    // Tomate: 3*2 + 4*1 = 10
    expect(incrementMock).toHaveBeenCalledWith(-10);
    // Sel: 1*2 = 2
    expect(incrementMock).toHaveBeenCalledWith(-2);
    expect(tomate?.payload.quantite).toEqual({ __increment: -10 });
    expect(sel?.payload.quantite).toEqual({ __increment: -2 });
    expect(commitMock).toHaveBeenCalledOnce();
  });
});
