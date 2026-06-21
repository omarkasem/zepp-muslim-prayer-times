export function planAlarms({
  now,
  location,
  settings,
  existingAlarms = [],
  scheduledThrough = null,
  windowDays = 2,
  computeTimes
}) {
  // Incremental scheduling: we diff the desired set of reminders against the
  // alarms already registered and only create what's missing / cancel what's
  // stale. This avoids the old "cancel everything then recreate everything"
  // teardown, which could leave the watch with zero alarms if any recreate
  // failed (e.g. momentarily exceeding the device alarm cap).
  if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
    // No usable location: nothing should be scheduled, so cancel all we know of.
    return {
      cancelIds: existingAlarms.map((a) => a.id).filter((id) => id != null),
      create: [],
      keep: [],
      scheduledThrough
    };
  }

  const s = settings || {};
  const offsetMs = (s.reminderOffsetMin ? s.reminderOffsetMin : 0) * 60 * 1000;
  const nowSec = Math.floor(now / 1000);

  let newScheduledThrough = scheduledThrough || 0;

  // Desired future reminder times -> prayer, keyed by epoch-seconds. First
  // writer wins so the earliest day's labelling is kept on collisions.
  const desired = new Map();

  for (let i = 0; i <= windowDays; i++) {
    // Advance by 24h intervals to cover the window
    const targetDate = new Date(now + i * 86400000);

    // Track the high-water mark using UTC midnight of the target local date.
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
        if (!desired.has(timeSec)) {
          desired.set(timeSec, prayer);
        }
      }
    }
  }

  // Diff existing alarms against the desired set.
  const keep = [];
  const cancelIds = [];
  const covered = new Set();

  for (const entry of existingAlarms) {
    if (!entry || entry.id == null) continue;
    const t = entry.time;
    // Cancel if: malformed, already fired/passed, no longer desired, or a
    // duplicate of one we're already keeping.
    if (typeof t !== 'number' || t <= nowSec || !desired.has(t) || covered.has(t)) {
      cancelIds.push(entry.id);
    } else {
      keep.push(entry);
      covered.add(t);
    }
  }

  // Anything desired but not already covered by a kept alarm must be created.
  const create = [];
  desired.forEach((prayer, timeSec) => {
    if (!covered.has(timeSec)) {
      create.push({ time: timeSec, prayer });
    }
  });
  create.sort((a, b) => a.time - b.time);

  return {
    cancelIds,
    create,
    keep,
    scheduledThrough: newScheduledThrough
  };
}
