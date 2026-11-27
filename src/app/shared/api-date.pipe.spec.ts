import { apiDate } from './api-date.pipe';

describe('apiDate', () => {
  it('treats API timestamps without offset as UTC', () => {
    const value = apiDate('2026-11-27T19:00:00.123456');
    expect(value).toBe('2026-11-27T19:00:00.123456Z');
    expect(new Date(value!).toISOString()).toBe('2026-11-27T19:00:00.123Z');
  });

  it('keeps explicit offsets and supports a local API', () => {
    expect(apiDate('2026-11-27T19:00:00-03:00')).toBe('2026-11-27T19:00:00-03:00');
    expect(apiDate('2026-11-27T19:00:00Z')).toBe('2026-11-27T19:00:00Z');
    expect(apiDate('2026-11-27T19:00:00', 'local')).toBe('2026-11-27T19:00:00');
    expect(apiDate(null)).toBeNull();
  });
});
