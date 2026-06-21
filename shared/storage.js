import { localStorage } from '@zos/storage';
import { validateLocation, sanitizeSettings, DEFAULT_SETTINGS } from './storage-helpers';

export function getLocation() {
  try {
    const data = localStorage.getItem('location');
    if (!data) return null;
    const parsed = JSON.parse(data);
    return validateLocation(parsed) ? parsed : null;
  } catch(e) {
    return null;
  }
}

export function setLocation(loc) {
  if (!validateLocation(loc)) {
    throw new Error('Invalid location payload. Must contain numeric lat/lon and a non-empty timezone string.');
  }
  localStorage.setItem('location', JSON.stringify(loc));
}

export function getSettings() {
  try {
    const data = localStorage.getItem('settings');
    if (!data) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(data));
  } catch(e) {
    return DEFAULT_SETTINGS;
  }
}

export function setSettings(settings) {
  const sanitized = sanitizeSettings(settings);
  localStorage.setItem('settings', JSON.stringify(sanitized));
}

// Prayer reminder alarms, stored with timing metadata so the scheduler can
// diff against them incrementally: [{ id, time, prayer }] (time in epoch-sec).
export function getAlarmEntries() {
  try {
    const data = localStorage.getItem('alarmEntries');
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) {
    return [];
  }
}

export function setAlarmEntries(entries) {
  if (!Array.isArray(entries)) return;
  localStorage.setItem('alarmEntries', JSON.stringify(entries));
}

// The midnight rollover alarm lives in its own slot so the prayer-alarm diff
// can never cancel it: { id, time } or null.
export function getRolloverAlarm() {
  try {
    const data = localStorage.getItem('rolloverAlarm');
    if (!data) return null;
    const parsed = JSON.parse(data);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch(e) {
    return null;
  }
}

export function setRolloverAlarm(entry) {
  if (entry == null) {
    localStorage.removeItem('rolloverAlarm');
    return;
  }
  localStorage.setItem('rolloverAlarm', JSON.stringify(entry));
}

// Legacy: older builds stored a flat list of alarm ids under 'alarmIds' with no
// timing metadata. We can't diff those, so we cancel them once and clear.
export function getLegacyAlarmIds() {
  try {
    const data = localStorage.getItem('alarmIds');
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) {
    return [];
  }
}

export function clearLegacyAlarmIds() {
  localStorage.removeItem('alarmIds');
}

export function getScheduledThrough() {
  try {
    const data = localStorage.getItem('scheduledThrough');
    if (!data) return null;
    const val = parseInt(data, 10);
    return isNaN(val) ? null : val;
  } catch(e) {
    return null;
  }
}

export function setScheduledThrough(timestamp) {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) return;
  localStorage.setItem('scheduledThrough', timestamp.toString());
}
