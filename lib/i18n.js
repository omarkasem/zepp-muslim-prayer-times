import { getText } from "@zos/i18n";

const FALLBACKS = {
  "appName": "Muslim Prayer Times",
  "prayer_fajr": "Fajr",
  "prayer_dhuhr": "Dhuhr",
  "prayer_asr": "Asr",
  "prayer_maghrib": "Maghrib",
  "prayer_isha": "Isha",
  "prayer_jumuah": "Jumu'ah",
  "next": "Next",
  "in": "in",
  "tomorrow": "Tomorrow",
  "settings": "Settings",
  "calc_method": "Calculation Method",
  "asr_madhab": "Asr Madhab",
  "high_lat_rule": "High Latitude Rule",
  "reminder_offset": "Reminder Offset",
  "time_format": "Time Format",
  "standard": "Standard",
  "hanafi": "Hanafi",
  "none": "None",
  "middle_of_night": "Middle of Night",
  "one_seventh": "One-Seventh",
  "angle_based": "Angle-Based",
  "at_prayer_time": "At prayer time",
  "5_min": "5 min",
  "10_min": "10 min",
  "15_min": "15 min",
  "20_min": "20 min",
  "method_mwl": "Muslim World League",
  "method_isna": "ISNA",
  "method_egyptian": "Egyptian",
  "method_umm_al_qura": "Umm al-Qura",
  "method_karachi": "Karachi",
  "unknown_setting": "Unknown setting",
  "calibrating": "Calibrating…",
  "figure_8_hint": "Move your watch in a figure-8 motion",
  "mecca": "MECCA",
  "cardinal_n": "N",
  "cardinal_e": "E",
  "cardinal_s": "S",
  "cardinal_w": "W",
  "location_required": "Location required for Qibla direction.",
  "heading": "heading",
  "time_for": "Time for",
  "dismiss": "Dismiss",
  "prayer": "Prayer",
  "12h": "12h",
  "24h": "24h",
  "qibla": "Qibla",
  "update_location": "Update Location",
  "updating": "Updating…",
  "dir": "ltr"
};

export function t(key) {
  let result = "";
  try {
    result = getText(key);
  } catch (e) {}
  if (!result || result === key) {
    return FALLBACKS[key] || key;
  }
  return result;
}

// RTL is locale-driven, not code-driven: the "dir" key resolves through the same
// .po locale resolution as every other string ("rtl" in ar-EG, "ltr" in en-US),
// so it can't drift from a guessed numeric language code.
export function isRTL() {
  return t("dir") === "rtl";
}

export function prayerName(key) {
  if (key === "dhuhr" && new Date().getDay() === 5) {
    return t("prayer_jumuah");
  }
  return t("prayer_" + key);
}

const HIJRI_MONTHS_EN = [
  "Muharram", "Safar", "Rabi' I", "Rabi' II", "Jumada I", "Jumada II",
  "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qada", "Dhu al-Hijja"
];

const HIJRI_MONTHS_AR = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

export function hijriMonth(index) {
  if (index < 0 || index > 11) return "";
  if (isRTL()) {
    return HIJRI_MONTHS_AR[index];
  }
  return HIJRI_MONTHS_EN[index];
}
