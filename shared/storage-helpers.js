export const DEFAULT_SETTINGS = {
  method: "mwl",
  madhab: "standard",
  highLatRule: "none",
  reminderOffsetMin: 0
};

export function validateLocation(loc) {
  if (!loc) return false;
  if (typeof loc.lat !== 'number' || isNaN(loc.lat)) return false;
  if (typeof loc.lon !== 'number' || isNaN(loc.lon)) return false;
  if (!loc.timezone || typeof loc.timezone !== 'string' || loc.timezone.trim() === '') return false;
  return true;
}

export function sanitizeSettings(settings) {
  if (!settings || typeof settings !== 'object') return DEFAULT_SETTINGS;
  
  const methods = ['umm_al_qura', 'mwl', 'egyptian', 'isna', 'karachi'];
  const method = methods.includes(settings.method) ? settings.method : DEFAULT_SETTINGS.method;
  
  const madhabs = ['standard', 'hanafi'];
  const madhab = madhabs.includes(settings.madhab) ? settings.madhab : DEFAULT_SETTINGS.madhab;
  
  const rules = ['none', 'middleOfTheNight', 'seventhOfTheNight', 'angleBased'];
  const highLatRule = rules.includes(settings.highLatRule) ? settings.highLatRule : DEFAULT_SETTINGS.highLatRule;
  
  let offset = DEFAULT_SETTINGS.reminderOffsetMin;
  if (typeof settings.reminderOffsetMin === 'number' && !isNaN(settings.reminderOffsetMin)) {
    offset = settings.reminderOffsetMin;
  } else if (typeof settings.reminderOffsetMin === 'string' && !isNaN(parseInt(settings.reminderOffsetMin, 10))) {
    offset = parseInt(settings.reminderOffsetMin, 10);
  }
  
  return { method, madhab, highLatRule, reminderOffsetMin: offset };
}
