# App Store Listing — Muslim Prayer Times

Canonical copy for the Zepp App Store submission form. Keep this in sync with any
store edits so the listing always lives with the app. Target device: Amazfit Bip 6.

---

## English (Default)

**App Name**

```
Muslim Prayer Times
```

**App Introduction** (short tagline)

```
Accurate daily prayer times, smart reminders, and a live Qibla compass — right on your wrist.
```

**App Details** (full description)

```
Muslim Prayer Times brings the five daily prayers to your Amazfit watch, computed
on-device for your location — no phone needed once your location is set.

Features
• Five daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) at a glance.
• The current prayer is highlighted with a live countdown to the next one.
• Jumu'ah shown automatically in place of Dhuhr on Fridays.
• Hijri (Islamic) date display.
• Prayer reminders/notifications with an adjustable offset (at time, 5/10/15/20 min before).
• Live Qibla compass: a rotating arrow points to Makkah; aligns and vibrates when you face it.
• Multiple calculation methods: Muslim World League, Umm al-Qura, Egyptian, ISNA, Karachi.
• Asr madhab selection (Standard / Hanafi).
• High-latitude rules (Middle of Night, One-Seventh, Angle-Based).
• 12-hour / 24-hour time format.

Your location is determined via your phone's internet connection (IP-based) and stored
on the watch; the app does not track or share your location.
```

---

## Arabic (العربية)

**App Name**

```
مواقيت الصلاة
```

**App Introduction** (short tagline)

```
مواقيت صلاة دقيقة، وتذكيرات ذكية، وبوصلة قبلة حيّة — على معصمك مباشرة.
```

**App Details** (full description)

```
يعرض تطبيق "مواقيت الصلاة" أوقات الصلوات الخمس على ساعة أمازفيت، ويحسبها على الجهاز
وفقًا لموقعك — دون الحاجة إلى الهاتف بعد ضبط الموقع.

المميزات
• أوقات الصلوات الخمس (الفجر، الظهر، العصر، المغرب، العشاء) بنظرة واحدة.
• تمييز الصلاة الحالية مع عدّاد تنازلي للصلاة التالية.
• عرض "الجمعة" تلقائيًا بدل الظهر يوم الجمعة.
• عرض التاريخ الهجري.
• تذكيرات/إشعارات للصلاة مع إمكانية ضبط وقت التذكير (عند الأذان، أو قبله بـ 5/10/15/20 دقيقة).
• بوصلة قبلة حيّة: سهم يدور ليشير إلى مكة، ويهتزّ عند مواجهة القبلة.
• طرق حساب متعددة: رابطة العالم الإسلامي، أم القرى، الهيئة المصرية، ISNA، كراتشي.
• اختيار مذهب العصر (قياسي / حنفي).
• قواعد خطوط العرض المرتفعة (منتصف الليل، السُّبع، حسب الزاوية).
• تنسيق الوقت 12 / 24 ساعة.

يُحدَّد موقعك عبر اتصال الإنترنت في هاتفك (استنادًا إلى عنوان IP) ويُخزَّن على الساعة؛
لا يتتبّع التطبيق موقعك ولا يشاركه.
```

---

## App Icon

```
XhoWnmWcVxzgGZawYqvMYzRXPbGhNtkq.png
```

- Size: **240 × 240 px**; Format: **PNG**.
- Circular image with a **transparent background**, no padding around it.

---

## Privacy Statement (Permissions)

Selections for the submission form, with justification. Derived from `app.json`
`permissions` and `app-side/index.js` (IP-geolocation over the phone's network).

| Permission | Selection | Why |
|---|---|---|
| Call Permission | **None** | The app makes no phone calls. |
| Heart Rate | **No** | No health/heart-rate sensors are used. |
| Connect to the network | **Yes** | Companion app fetches approximate location + timezone via IP-geolocation (`ipwho.is`, fallback `ipapi.co`). |
| Positioning | **No** | No GPS/positioning permission is requested; location is IP-based via the network, not device GPS. |
| Run in background | **Yes** | A background service schedules prayer-time alarms/reminders. |
| Others | **Yes** | Notifications (`device:os.notification`), alarms (`device:os.alarm`), compass/geomagnetic sensor for Qibla (`device:os.compass`), local storage (`device:os.local_storage`), device info (`data:os.device.info`). |

---

## Other Form Fields

| Field | Answer | Notes |
|---|---|---|
| Whether the installation package includes SDK | **No** | No third-party SDKs bundled; built on ZeppOS (`@zeppos/zml`) only. |
| Full music playback | **No** | The app does not play music tracks (relevant to EU regulations). |

---

## Features Descriptions

Use if the store asks for a per-permission / feature usage explanation:

- **Network:** Used once (and on refresh) to look up the user's city, coordinates, and
  timezone from their IP address via the paired phone's internet connection. Required to
  compute accurate prayer times and the Qibla direction. No personal data is sent; only an
  outbound request to a public IP-geolocation endpoint.
- **Background execution:** Used to schedule and fire prayer-time reminders/notifications at
  the correct times even when the app UI is closed.
- **Notifications & Alarms:** Used to alert the user at (or a chosen offset before) each
  prayer time.
- **Compass (geomagnetic sensor):** Used by the Qibla screen to determine the watch's heading
  so the on-screen arrow can point toward Makkah.
- **Local storage:** Used to cache the resolved location and user settings (calculation
  method, madhab, high-latitude rule, reminder offset, time format) on the watch.
- **Device info:** Used to read screen dimensions for correct layout.
