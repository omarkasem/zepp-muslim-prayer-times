import { describe, it, expect } from 'vitest';
import { qiblaBearing } from './qibla.js';

describe('qiblaBearing', () => {
    it('calculates Cairo bearing correctly (approx 136°)', () => {
        // Cairo: 30.0444° N, 31.2357° E
        const bearing = qiblaBearing({ lat: 30.0444, lon: 31.2357 });
        expect(bearing).toBeGreaterThan(135);
        expect(bearing).toBeLessThan(137);
    });

    it('calculates New York bearing correctly (approx 58°)', () => {
        // New York: 40.7128° N, 74.0060° W
        const bearing = qiblaBearing({ lat: 40.7128, lon: -74.0060 });
        expect(bearing).toBeGreaterThan(57);
        expect(bearing).toBeLessThan(59);
    });

    it('calculates Jakarta bearing correctly (approx 295°)', () => {
        // Jakarta: 6.2088° S, 106.8456° E
        const bearing = qiblaBearing({ lat: -6.2088, lon: 106.8456 });
        expect(bearing).toBeGreaterThan(294);
        expect(bearing).toBeLessThan(296);
    });

    it('throws error for invalid input', () => {
        expect(() => qiblaBearing({ lat: '30', lon: 31 })).toThrow();
        expect(() => qiblaBearing({ lat: 30 })).toThrow();
    });
});
