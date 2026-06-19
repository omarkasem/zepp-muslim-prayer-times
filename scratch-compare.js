const { computePrayerTimes } = require('./shared/prayer-times.js');
const fs = require('fs');
eval(fs.readFileSync('./scratch-praytimes.js', 'utf8'));

// Test parameters
const date = new Date(Date.UTC(2023, 8, 1)); // Sept 1, 2023
const lat = 30.0444, lon = 31.2357; // Cairo
const method = 'egyptian';

// Our function
const ourTimes = computePrayerTimes({
  lat, lon, timezone: 'Africa/Cairo', date, method, madhab: 'standard', highLatRule: 'none'
});

// Original PrayTimes
const pt = new PrayTimes('Egypt');
pt.tune({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }); // No tuning
const origTimes = pt.getTimes(date, [lat, lon], 0, 0, 'Float'); // timeZone=0, dst=0, format=Float

const baseTimestamp = Date.UTC(2023, 8, 1);
console.log('--- Our Times (UTC Hours) ---');
for(let k in ourTimes) {
  console.log(`${k}: ${(ourTimes[k] - baseTimestamp) / (1000 * 60 * 60)}`);
}

console.log('\n--- Original PrayTimes (UTC Hours) ---');
console.log(`fajr: ${origTimes.fajr}`);
console.log(`dhuhr: ${origTimes.dhuhr}`);
console.log(`asr: ${origTimes.asr}`);
console.log(`maghrib: ${origTimes.maghrib}`);
console.log(`isha: ${origTimes.isha}`);

