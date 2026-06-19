import { getMethod } from './methods';

// Degree-based Math
const dtr = (d) => (d * Math.PI) / 180.0;
const rtd = (r) => (r * 180.0) / Math.PI;

const sin = (d) => Math.sin(dtr(d));
const cos = (d) => Math.cos(dtr(d));
const tan = (d) => Math.tan(dtr(d));
const arcsin = (d) => rtd(Math.asin(d));
const arccos = (d) => rtd(Math.acos(d));
const arccot = (x) => rtd(Math.atan(1 / x));
const arctan2 = (y, x) => rtd(Math.atan2(y, x));

const fix = (a, b) => {
  let aFixed = a - b * Math.floor(a / b);
  return aFixed < 0 ? aFixed + b : aFixed;
};
const fixAngle = (a) => fix(a, 360);
const fixHour = (a) => fix(a, 24);

export function computePrayerTimes({ lat, lon, timezone, date, method, madhab, highLatRule }) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || !(date instanceof Date)) {
    throw new Error('Invalid input: lat, lon must be numbers, date must be a Date object');
  }

  const methodPreset = getMethod(method);
  const fajrAngle = methodPreset.fajrAngle || 18;
  const ishaAngle = methodPreset.ishaAngle;
  const ishaInterval = methodPreset.ishaInterval;

  const asrFactor = madhab === 'hanafi' ? 2 : 1;
  const elv = 0;

  // Midnight UTC timestamp of the given local date
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const baseTimestamp = Date.UTC(y, m - 1, d);

  let year = y;
  let month = m;
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + d + B - 1524.5;

  const jDate = JD - lon / 360;

  const sunPosition = (jd) => {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g));

    const e = 23.439 - 0.00000036 * D;

    const RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
    const eqt = q / 15 - fixHour(RA);
    const decl = arcsin(sin(e) * sin(L));

    return { decl, eqt };
  };

  const midDay = (time) => {
    const eqt = sunPosition(jDate + time).eqt;
    return fixHour(12 - eqt);
  };

  const sunAngleTime = (angle, time, direction) => {
    const decl = sunPosition(jDate + time).decl;
    const noon = midDay(time);
    const t = (1 / 15) * arccos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat)));
    return noon + (direction === 'ccw' ? -t : t);
  };

  const asrTime = (factor, time) => {
    const decl = sunPosition(jDate + time).decl;
    const angle = -arccot(factor + tan(Math.abs(lat - decl)));
    return sunAngleTime(angle, time);
  };

  const riseSetAngle = () => {
    const angle = 0.0347 * Math.sqrt(elv);
    return 0.833 + angle;
  };

  let times = {
    fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, maghrib: 18, isha: 18
  };

  const dayPortion = (t) => {
    const res = {};
    for (let k in t) res[k] = t[k] / 24;
    return res;
  };

  // Run calculation iterations (PrayTimes uses 1 by default)
  for (let i = 1; i <= 1; i++) {
    const pTimes = dayPortion(times);
    
    let fajr = sunAngleTime(fajrAngle, pTimes.fajr, 'ccw');
    let sunrise = sunAngleTime(riseSetAngle(), pTimes.sunrise, 'ccw');
    const dhuhr = midDay(pTimes.dhuhr);
    
    // Fallback for extreme latitudes (midnight sun / polar night)
    if (isNaN(sunrise)) sunrise = dhuhr - 6;
    
    let asr = asrTime(asrFactor, pTimes.asr);
    let sunset = sunAngleTime(riseSetAngle(), pTimes.sunset);
    if (isNaN(sunset)) sunset = dhuhr + 6;
    
    if (isNaN(asr)) asr = dhuhr + (sunset - dhuhr) / 2;
    
    let maghrib = sunAngleTime(riseSetAngle(), pTimes.maghrib); 
    if (isNaN(maghrib)) maghrib = sunset;
    
    let isha;
    if (ishaAngle) {
      isha = sunAngleTime(ishaAngle, pTimes.isha);
    } else {
      isha = maghrib + (ishaInterval || 90) / 60;
    }

    times = { fajr, sunrise, dhuhr, asr, sunset, maghrib, isha };
  }

  // Adjust to UTC
  for (let k in times) {
    times[k] += 0 - lon / 15;
  }

  // High latitude adjustment
  if (highLatRule && highLatRule !== 'none') {
    const nightTime = fixHour(times.sunrise - times.sunset);
    
    const adjustHLTime = (time, base, angle, night, direction) => {
      let portion = 1 / 2; // middleOfTheNight
      if (highLatRule === 'angle_based' || highLatRule === 'angleBased') {
        portion = (1 / 60) * angle;
      } else if (highLatRule === 'one_seventh' || highLatRule === 'oneSeventh') {
        portion = 1 / 7;
      }

      const pNight = portion * night;
      const timeDiff = direction === 'ccw' ? fixHour(base - time) : fixHour(time - base);
      
      if (isNaN(time) || timeDiff > pNight) {
        time = base + (direction === 'ccw' ? -pNight : pNight);
      }
      return time;
    };

    times.fajr = adjustHLTime(times.fajr, times.sunrise, fajrAngle, nightTime, 'ccw');
    if (ishaAngle) {
      times.isha = adjustHLTime(times.isha, times.sunset, ishaAngle, nightTime);
    }
  }

  if (!ishaAngle && ishaInterval) {
     times.isha = times.maghrib + ishaInterval / 60;
  }

  const result = {};
  for (let k in times) {
    // Add 0.5 minutes for rounding to nearest minute (as PrayTimes does internally before stringifying)
    // Actually, returning exact ms is better so we don't skew exact values. We will skip 0.5 min addition, 
    // unless tests demand it. We will leave it exact.
    result[k] = baseTimestamp + Math.floor(times[k] * 60 * 60 * 1000);
  }

  return {
    fajr: result.fajr,
    dhuhr: result.dhuhr,
    asr: result.asr,
    maghrib: result.maghrib,
    isha: result.isha
  };
}
