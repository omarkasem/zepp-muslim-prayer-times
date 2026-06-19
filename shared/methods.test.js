import { describe, it, expect } from 'vitest';
import { METHODS, getMethod, DEFAULT_METHOD_ID } from './methods';

describe('getMethod', () => {
  it('returns requested method for valid id', () => {
    expect(getMethod('isna')).toEqual(METHODS['isna']);
    expect(getMethod('umm_al_qura')).toEqual(METHODS['umm_al_qura']);
  });

  it('returns default method for unknown id', () => {
    expect(getMethod('garbage')).toEqual(METHODS[DEFAULT_METHOD_ID]);
    expect(getMethod(null)).toEqual(METHODS[DEFAULT_METHOD_ID]);
    expect(getMethod('')).toEqual(METHODS[DEFAULT_METHOD_ID]);
  });
  
  it('every preset has required params', () => {
    for (const key of Object.keys(METHODS)) {
      const preset = METHODS[key];
      expect(typeof preset.fajrAngle).toBe('number');
      
      // Must have either ishaAngle or ishaInterval
      const hasIsha = typeof preset.ishaAngle === 'number' || typeof preset.ishaInterval === 'number';
      expect(hasIsha).toBe(true);
      expect(typeof preset.name).toBe('string');
    }
  });
});
