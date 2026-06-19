import { describe, it, expect } from 'vitest';
import { validateLocation, sanitizeSettings, DEFAULT_SETTINGS } from './storage-helpers';

describe('validateLocation', () => {
  it('validates correct location', () => {
    expect(validateLocation({ lat: 40.7128, lon: -74.0060, timezone: 'America/New_York' })).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(validateLocation(null)).toBe(false);
    expect(validateLocation({})).toBe(false);
    expect(validateLocation({ lat: 40.7128 })).toBe(false);
    expect(validateLocation({ lat: 40.7128, lon: -74.0060 })).toBe(false);
  });

  it('rejects invalid types', () => {
    expect(validateLocation({ lat: "40.7", lon: -74, timezone: 'UTC' })).toBe(false);
    expect(validateLocation({ lat: 40.7, lon: "-74", timezone: 'UTC' })).toBe(false);
    expect(validateLocation({ lat: 40.7, lon: -74, timezone: '' })).toBe(false);
    expect(validateLocation({ lat: 40.7, lon: -74, timezone: 123 })).toBe(false);
  });
});

describe('sanitizeSettings', () => {
  it('returns defaults for empty or invalid input', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("junk")).toEqual(DEFAULT_SETTINGS);
  });

  it('preserves valid settings', () => {
    const valid = { method: 'isna', madhab: 'hanafi', highLatRule: 'angle_based', reminderOffsetMin: 15, timeFormat: '24h' };
    expect(sanitizeSettings(valid)).toEqual(valid);
  });

  it('clamps invalid fields to defaults', () => {
    const partial = { method: 'unknown_method', madhab: 'hanafi', highLatRule: 'none', reminderOffsetMin: "foo", timeFormat: 'binary' };
    expect(sanitizeSettings(partial)).toEqual({
      method: DEFAULT_SETTINGS.method,
      madhab: 'hanafi',
      highLatRule: 'none',
      reminderOffsetMin: DEFAULT_SETTINGS.reminderOffsetMin,
      timeFormat: DEFAULT_SETTINGS.timeFormat
    });
  });
  
  it('parses valid string offsets', () => {
    const partial = { reminderOffsetMin: "15" };
    expect(sanitizeSettings(partial).reminderOffsetMin).toBe(15);
  });

  it('defaults timeFormat to 12h when missing or invalid', () => {
    expect(DEFAULT_SETTINGS.timeFormat).toBe('12h');
    expect(sanitizeSettings({}).timeFormat).toBe('12h');
    expect(sanitizeSettings({ timeFormat: '24h' }).timeFormat).toBe('24h');
    expect(sanitizeSettings({ timeFormat: 'weird' }).timeFormat).toBe('12h');
  });
});
