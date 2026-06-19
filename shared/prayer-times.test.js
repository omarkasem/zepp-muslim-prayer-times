import { describe, it, expect } from 'vitest';
import { computePrayerTimes } from './prayer-times';
import fs from 'fs';

const orig = fs.readFileSync('./shared/__tests__/praytimes-reference.js', 'utf8');
const getPrayTimes = new Function(orig + '\nreturn PrayTimes;');
const PrayTimes = getPrayTimes();

describe('computePrayerTimes', () => {
  const cairoLat = 30.0444;
  const cairoLon = 31.2357;
  const cairoDate = new Date(Date.UTC(2023, 8, 1)); // Sept 1, 2023

  it('matches the original PrayTimes.js algorithm (Cairo, Egyptian)', () => {
    expect(PrayTimes).toBeDefined();

    const pt = new PrayTimes('Egypt');
    pt.tune({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
    
    // Original output float UTC hours
    const origTimes = pt.getTimes(cairoDate, [cairoLat, cairoLon], 0, 0, 'Float');
    
    const ourTimes = computePrayerTimes({
      lat: cairoLat,
      lon: cairoLon,
      timezone: 'Africa/Cairo',
      date: cairoDate,
      method: 'egyptian',
      madhab: 'standard',
      highLatRule: 'none'
    });

    const baseTimestamp = Date.UTC(2023, 8, 1);
    
    // We didn't do the 0.5 minute rounding internally like PrayTimes formatted output does.
    // PrayTimes's Float output is exact.
    const expectMatch = (ourEpoch, origFloat) => {
      const origEpoch = baseTimestamp + Math.floor(origFloat * 60 * 60 * 1000);
      // Math should be extremely close (within 1 ms precision due to floats)
      expect(Math.abs(ourEpoch - origEpoch)).toBeLessThan(5); 
    };

    expectMatch(ourTimes.fajr, origTimes.fajr);
    expectMatch(ourTimes.dhuhr, origTimes.dhuhr);
    expectMatch(ourTimes.asr, origTimes.asr);
    expectMatch(ourTimes.maghrib, origTimes.maghrib);
    expectMatch(ourTimes.isha, origTimes.isha);
  });

  it('Asr hanafi is later than standard', () => {
    const std = computePrayerTimes({
      lat: cairoLat, lon: cairoLon, timezone: 'Africa/Cairo', date: cairoDate,
      method: 'egyptian', madhab: 'standard', highLatRule: 'none'
    });

    const hanafi = computePrayerTimes({
      lat: cairoLat, lon: cairoLon, timezone: 'Africa/Cairo', date: cairoDate,
      method: 'egyptian', madhab: 'hanafi', highLatRule: 'none'
    });

    expect(hanafi.asr).toBeGreaterThan(std.asr);
  });

  it('Handles high latitude fallback without NaN', () => {
    // Tromso, Norway
    const times = computePrayerTimes({
      lat: 69.6492,
      lon: 18.9553,
      timezone: 'Europe/Oslo',
      date: new Date(Date.UTC(2023, 5, 21)), // Summer solstice, no real night
      method: 'mwl',
      madhab: 'standard',
      highLatRule: 'middle_of_night'
    });

    expect(Number.isNaN(times.fajr)).toBe(false);
    expect(Number.isNaN(times.isha)).toBe(false);
    expect(times.fajr).toBeLessThan(times.dhuhr);
    expect(times.isha).toBeGreaterThan(times.maghrib);
  });

  it('one_seventh and middle_of_night produce different times', () => {
    const lat = 69.6492;
    const lon = 18.9553;
    const date = new Date(Date.UTC(2023, 5, 21));

    const middle = computePrayerTimes({
      lat, lon, timezone: 'Europe/Oslo', date, method: 'mwl', madhab: 'standard', highLatRule: 'middle_of_night'
    });

    const seventh = computePrayerTimes({
      lat, lon, timezone: 'Europe/Oslo', date, method: 'mwl', madhab: 'standard', highLatRule: 'one_seventh'
    });

    expect(seventh.fajr).not.toEqual(middle.fajr);
    expect(seventh.isha).not.toEqual(middle.isha);
  });

  it('Rejects invalid input', () => {
    expect(() => computePrayerTimes({
      lat: null, lon: 31, date: new Date(), method: 'mwl', madhab: 'standard', highLatRule: 'none'
    })).toThrow();
  });
});
