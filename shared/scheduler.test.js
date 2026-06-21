import { describe, it, expect } from 'vitest';
import { planAlarms } from './scheduler.js';

describe('planAlarms', () => {
    const mockLocation = { lat: 30, lon: 30, timezone: 'UTC' };

    const mockComputeTimes = ({ date }) => {
        const y = date.getFullYear();
        const m = date.getMonth();
        const d = date.getDate();
        const base = new Date(y, m, d).getTime();
        return {
            fajr: base + 5 * 3600000,
            dhuhr: base + 12 * 3600000,
            asr: base + 15 * 3600000,
            maghrib: base + 18 * 3600000,
            isha: base + 20 * 3600000
        };
    };

    it('returns empty create and no throw for invalid location', () => {
        const res = planAlarms({
            now: new Date(2024, 0, 1, 10).getTime(),
            location: null,
            existingAlarms: [{ id: 100, time: 1, prayer: 'fajr' }, { id: 101, time: 2, prayer: 'dhuhr' }],
            computeTimes: mockComputeTimes
        });
        expect(res.create).toEqual([]);
        // Invalid location cancels everything we know about.
        expect(res.cancelIds).toEqual([100, 101]);
        expect(res.keep).toEqual([]);
    });

    it('cancels stale (already-fired) alarms and keeps still-future ones', () => {
        const now = new Date(2024, 0, 1, 13).getTime();
        const asrSec = Math.floor(new Date(2024, 0, 1, 15).getTime() / 1000);
        const pastSec = Math.floor(new Date(2024, 0, 1, 12).getTime() / 1000);
        const res = planAlarms({
            now,
            location: mockLocation,
            windowDays: 0,
            existingAlarms: [
                { id: 1, time: pastSec, prayer: 'dhuhr' }, // already passed -> cancel
                { id: 2, time: asrSec, prayer: 'asr' },    // still future + desired -> keep
            ],
            computeTimes: mockComputeTimes
        });

        expect(res.cancelIds).toEqual([1]);
        expect(res.keep.map((k) => k.id)).toEqual([2]);
        // Asr is already covered by the kept alarm, so it must not be re-created.
        expect(res.create.map((c) => c.time)).not.toContain(asrSec);
    });

    it('mid-day plan excludes past prayers and includes future prayers + tomorrow', () => {
        const now = new Date(2024, 0, 1, 13).getTime();
        const res = planAlarms({
            now,
            location: mockLocation,
            windowDays: 1,
            computeTimes: mockComputeTimes
        });

        const expectedTimes = [
            new Date(2024, 0, 1, 15).getTime(),
            new Date(2024, 0, 1, 18).getTime(),
            new Date(2024, 0, 1, 20).getTime(),
            new Date(2024, 0, 2, 5).getTime(),
            new Date(2024, 0, 2, 12).getTime(),
            new Date(2024, 0, 2, 15).getTime(),
            new Date(2024, 0, 2, 18).getTime(),
            new Date(2024, 0, 2, 20).getTime(),
        ].map(t => Math.floor(t / 1000));

        expect(res.create.map(c => c.time)).toEqual(expectedTimes);
        expect(res.create[0].prayer).toBe('asr');
    });

    it('applies reminderOffsetMin correctly', () => {
        const now = new Date(2024, 0, 1, 13).getTime();
        const res = planAlarms({
            now,
            location: mockLocation,
            settings: { reminderOffsetMin: 10 },
            windowDays: 1,
            computeTimes: mockComputeTimes
        });

        const expectedFirstTime = Math.floor((new Date(2024, 0, 1, 15).getTime() - 10 * 60000) / 1000);
        expect(res.create[0].time).toBe(expectedFirstTime);
    });

    it('is idempotent with the same now', () => {
        const now = new Date(2024, 0, 1, 13).getTime();
        const res1 = planAlarms({ now, location: mockLocation, windowDays: 2, computeTimes: mockComputeTimes });
        const res2 = planAlarms({ now, location: mockLocation, windowDays: 2, computeTimes: mockComputeTimes });

        expect(res1.create).toEqual(res2.create);

        const times = res1.create.map(c => c.time);
        const uniqueTimes = new Set(times);
        expect(times.length).toBe(uniqueTimes.size);
    });

    it('re-running with the previously created alarms produces no new work', () => {
        const now = new Date(2024, 0, 1, 13).getTime();
        const first = planAlarms({ now, location: mockLocation, windowDays: 2, computeTimes: mockComputeTimes });

        // Simulate those alarms now being registered with assigned ids.
        const registered = first.create.map((c, i) => ({ id: 1000 + i, time: c.time, prayer: c.prayer }));

        const second = planAlarms({
            now,
            location: mockLocation,
            windowDays: 2,
            existingAlarms: registered,
            computeTimes: mockComputeTimes
        });

        expect(second.create).toEqual([]);
        expect(second.cancelIds).toEqual([]);
        expect(second.keep.map((k) => k.id)).toEqual(registered.map((r) => r.id));
    });

    it('advances scheduledThrough on rollover', () => {
        const now = new Date(2024, 0, 1, 23).getTime();
        const res = planAlarms({
            now,
            location: mockLocation,
            windowDays: 2,
            scheduledThrough: Date.UTC(2024, 0, 1),
            computeTimes: mockComputeTimes
        });

        expect(res.scheduledThrough).toBe(Date.UTC(2024, 0, 3));
    });
});
