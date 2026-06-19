export function planAlarms({
  now,
  location,
  settings,
  existingAlarmIds = [],
  scheduledThrough = null,
  windowDays = 2,
  computeTimes
}) {
  // We use full-replace semantics for V1 as specified in the feature spec.
  // All existing alarms are returned to be cancelled.
  if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
    return { cancelIds: [], create: [], scheduledThrough };
  }

  const cancelIds = [...existingAlarmIds];
  const create = [];

  const s = settings || {};
  const offsetMs = (s.reminderOffsetMin ? s.reminderOffsetMin : 0) * 60 * 1000;
  
  let newScheduledThrough = scheduledThrough || 0;
  
  // Track seen alarm times to ensure idempotency and prevent duplicates
  const seenTimes = new Set();

  for (let i = 0; i <= windowDays; i++) {
    // Advance by 24h intervals to cover the window
    const targetDate = new Date(now + i * 86400000);
    
    // Extract local day to update the scheduledThrough high-water mark
    // We use UTC midnight of the target local date as a day-key
    const dayKey = Date.UTC(
      targetDate.getFullYear(), 
      targetDate.getMonth(), 
      targetDate.getDate()
    );
    
    if (dayKey > newScheduledThrough) {
      newScheduledThrough = dayKey;
    }

    const times = computeTimes({
      lat: location.lat,
      lon: location.lon,
      timezone: location.timezone,
      date: targetDate,
      method: s.method,
      madhab: s.madhab,
      highLatRule: s.highLatRule
    });

    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const prayer of prayers) {
      const prayerInstant = times[prayer];
      if (!prayerInstant) continue;

      const reminderTimeMs = prayerInstant - offsetMs;
      if (reminderTimeMs > now) {
        const timeSec = Math.floor(reminderTimeMs / 1000);
        if (!seenTimes.has(timeSec)) {
          seenTimes.add(timeSec);
          create.push({
            time: timeSec,
            prayer: prayer
          });
        }
      }
    }
  }

  return {
    cancelIds,
    create,
    scheduledThrough: newScheduledThrough
  };
}
