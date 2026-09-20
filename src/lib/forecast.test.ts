import { describe, it, expect } from 'vitest';
import { linearForecast } from './forecast';

describe('linearForecast', () => {
  it('returns 0 for an empty series', () => {
    expect(linearForecast([])).toBe(0);
  });

  it('returns the single value unchanged', () => {
    expect(linearForecast([500])).toBe(500);
  });

  it('projects a flat trend forward unchanged', () => {
    expect(linearForecast([100, 100, 100])).toBe(100);
  });

  it('extrapolates a rising trend', () => {
    expect(linearForecast([100, 200, 300])).toBe(400);
  });

  it('extrapolates a falling trend', () => {
    expect(linearForecast([300, 200, 100])).toBe(0);
  });

  it('never returns a negative projection', () => {
    expect(linearForecast([100, 50, 0])).toBe(0);
  });
});
