import { describe, it, expect } from 'vitest';
import { toHijri } from './hijri.js';

describe('toHijri', () => {
    it('converts civil epoch 1 Muharram 1 AH', () => {
        let d1 = new Date(622, 6, 19); // 19 July 622 (Gregorian equivalent of 16 July 622 Julian)
        d1.setFullYear(622); // ensure it's not mapped to 19xx
        expect(toHijri(d1)).toEqual({
            day: 1,
            month: 1,
            monthName: 'Muharram',
            year: 1
        });
    });

    it('converts modern date correctly (March 11, 2024)', () => {
        let d = new Date(2024, 2, 11); // March 11, 2024
        const result = toHijri(d);
        // We will just print or assert typical tabular ramadan start for 1445
        expect(result.year).toBe(1445);
        expect(result.monthName).toBe("Ramadan");
    });
});
