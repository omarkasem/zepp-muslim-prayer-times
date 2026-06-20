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
Prayer times, reminders & Qibla compass
```

**App Details** (full description)

```
Five daily prayers on your Amazfit watch, computed on-device — no phone needed once your location is set.

Features
• Five prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) at a glance.
• Current prayer highlighted with a live countdown to the next.
• Jumu'ah on Fridays; Hijri date display.
• Reminders with adjustable offset (at time, 5/10/15/20 min before).
• Live Qibla compass pointing to Makkah, vibrating when you face it.
• Methods: MWL, Umm al-Qura, Egyptian, ISNA, Karachi; Asr madhab; high-latitude rules; 12/24h.

Location is IP-based and stored on the watch; never tracked or shared.
```

---

## Arabic (العربية)

**App Name**

```
مواقيت الصلاة
```

**App Introduction** (short tagline)

```
مواقيت الصلاة والتذكيرات وبوصلة القبلة
```

**App Details** (full description)

```
يعرض "مواقيت الصلاة" أوقات الصلوات الخمس على ساعة أمازفيت ويحسبها على الجهاز وفقًا لموقعك — دون حاجة إلى الهاتف بعد ضبط الموقع.

المميزات
• الصلوات الخمس (الفجر، الظهر، العصر، المغرب، العشاء) بنظرة واحدة.
• تمييز الصلاة الحالية مع عدّاد تنازلي للصلاة التالية.
• عرض "الجمعة" بدل الظهر يوم الجمعة.
• عرض التاريخ الهجري.
• تذكيرات مع ضبط الوقت (عند الأذان أو قبله بـ 5/10/15/20 دقيقة).
• بوصلة قبلة حيّة تشير إلى مكة وتهتزّ عند مواجهتها.
• طرق حساب متعددة، ومذهب العصر، وقواعد خطوط العرض المرتفعة، وتنسيق 12/24 ساعة.

يُحدَّد موقعك عبر إنترنت هاتفك (IP) ويُخزَّن على الساعة؛ لا يُتتبَّع ولا يُشارَك.
```

---

## App Icon

```
XhoWnmWcVxzgGZawYqvMYzRXPbGhNtkq.png
```

- Size: **240 × 240 px**; Format: **PNG**.
- Circular image with a **transparent background**, no padding around it.

---

## Privacy Statement (Privacy Policy)

> Paste this text into the store's "Privacy Policy" field. It describes what data the app
> collects, how it is used, and whether it is shared. Replace the contact email before submitting.

```
Privacy Policy — Muslim Prayer Times
Last updated: 2026-06-20

Muslim Prayer Times ("the app") is a prayer-times and Qibla utility for Amazfit/Zepp watches. We operate no servers and receive none of your data.

1. Data we handle
- Approximate location (city, latitude/longitude, timezone), derived from your internet IP address via the paired phone, NOT GPS.
- Your settings: calculation method, Asr madhab, high-latitude rule, reminder offset, time format.
- Device screen dimensions, used only for layout.
We do NOT collect names, accounts, contacts, health data, advertising IDs, or any personal identifiers. No accounts, analytics, or tracking.

2. How it is used
- Location calculates prayer times and the Qibla; settings schedule reminders. The compass is read only on the Qibla screen, on-device, and never stored or sent.

3. Storage
- Location and settings are stored only on the watch. Uninstalling removes them.

4. Third parties
- We do not sell, rent, or share your data. To find your location, the phone queries IP-geolocation services in order until one responds: geojs.io, reallyfreegeoip.org, ipinfo.io, ipapi.co, ipwho.is. The coordinates go to BigDataCloud (bigdatacloud.net) for the localized city name. They receive only the IP/coordinates and return location details, under their own privacy policies.

5. Children
- The app is not directed to children and collects no personal information.

6. Changes
- Updates are reflected by the "Last updated" date.

7. Contact
- omar.kasem207@gmail.com
```

### Permission selections (submission form)

Selections for the form's permission questions, with justification. Derived from `app.json`
`permissions` and `app-side/index.js` (IP-geolocation over the phone's network).

| Permission | Selection | Why |
|---|---|---|
| Call Permission | **None** | The app makes no phone calls. |
| Heart Rate | **No** | No health/heart-rate sensors are used. |
| Connect to the network | **Yes** | Companion app fetches approximate location + timezone via third-party IP-geolocation services (geojs, reallyfreegeoip, ipinfo, ipapi, ipwho.is) and BigDataCloud reverse-geocoding for the localized city name. |
| Positioning | **No** | No GPS/positioning permission is requested; location is IP-based via the network, not device GPS. |
| Run in background | **Yes** | A background service schedules prayer-time alarms/reminders. |
| Others | **Yes** | Alarms (`device:os.alarm`), compass/geomagnetic sensor for Qibla (`device:os.compass`), local storage (`device:os.local_storage`), device info (`data:os.device.info`). |

---

## Other Form Fields

| Field | Answer | Notes |
|---|---|---|
| Whether the installation package includes SDK | **No** | No third-party SDKs bundled; built on ZeppOS (`@zeppos/zml`) only. |
| Full music playback | **No** | The app does not play music tracks (relevant to EU regulations). |

---

## Features Descriptions

> Paste into the store's "Features Descriptions" field. Written to help a reviewer quickly
> understand what each part of the app does.

```
Muslim Prayer Times is a single-purpose Islamic utility for the watch. After a one-time
location lookup it works fully offline — all prayer-time calculations run on the device.

Main screen (Home)
- Shows the five daily prayer times for the user's location: Fajr, Dhuhr, Asr, Maghrib, Isha.
- Highlights the prayer currently in effect and shows a live countdown to the next one
  (e.g. "Maghrib in 1h 23m"), updating every minute.
- On Fridays, the Dhuhr row is shown as "Jumu'ah".
- Displays the Hijri (Islamic) date and the detected city.
- Two buttons navigate to the Qibla compass and to Settings.

Reminders
- Schedules a full-screen alert (with vibration) at each prayer time, or a chosen number of
  minutes before it (at time / 5 / 10 / 15 / 20). Reminders re-schedule automatically each day.

Qibla compass
- A circular compass with a rotating arrow that points toward Makkah as the user turns the
  watch, a Kaaba marker at the top as the target, and N/E/S/W letters that track north.
- When the user is facing the Qibla, the ring turns green and the watch vibrates.
- Shows the exact bearing (e.g. 135°) and cardinal direction (e.g. SE).
- Starts with a brief "move in a figure-8" calibration prompt for the compass sensor.

Settings
- Calculation method (Muslim World League, Umm al-Qura, Egyptian, ISNA, Karachi).
- Asr madhab (Standard / Hanafi) and high-latitude rule.
- Reminder offset and 12-hour / 24-hour time format.
- Changes take effect immediately and re-schedule reminders.

The app uses no accounts, no ads, and no analytics. Location is approximate (IP-based via the
paired phone), used only to compute prayer times and the Qibla.
```

### Per-permission usage (if the form asks separately)

- **Network:** One lookup (and on manual refresh) of city, coordinates, and timezone from the
  IP address via the paired phone, using public IP-geolocation services with a fallback chain
  plus BigDataCloud reverse-geocoding for the localized city name. Required for accurate prayer
  times and Qibla. No personal data sent — only the IP/coordinates of the request.
- **Background execution:** Schedule and fire prayer reminders even when the UI is closed.
- **Alarms:** Alert the user at (or before) each prayer time.
- **Compass (geomagnetic sensor):** Determine the watch's heading so the Qibla arrow points to Makkah.
- **Local storage:** Cache the resolved location and user settings on the watch.
- **Device info:** Read screen dimensions for correct layout.
