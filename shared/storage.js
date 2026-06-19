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

export function getAlarmIds() {
  try {
    const data = localStorage.getItem('alarmIds');
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) {
    return [];
  }
}

export function setAlarmIds(ids) {
  if (!Array.isArray(ids)) return;
  localStorage.setItem('alarmIds', JSON.stringify(ids));
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
