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

## Privacy Statement (Privacy Policy)

> Paste this text into the store's "Privacy Policy" field. It describes what data the app
> collects, how it is used, and whether it is shared. Replace the contact email before submitting.

```
Privacy Policy — Muslim Prayer Times
Last updated: 2026-06-19

Muslim Prayer Times ("the app") is a prayer-times and Qibla utility for Amazfit/Zepp
watches. We respect your privacy. This policy explains exactly what data the app handles.

1. Data we collect
- Approximate location: city name, latitude/longitude, and timezone. This is determined
  from your internet IP address (via the paired phone's connection), NOT from GPS. The app
  does not request or use device GPS/positioning.
- App settings you choose: calculation method, Asr madhab, high-latitude rule, reminder
  offset, and time format.
- Device information: screen dimensions, used only to lay out the interface correctly.
We do NOT collect names, accounts, email addresses, contacts, health/heart-rate data,
advertising identifiers, or any personally identifying information. The app has no user
accounts and no analytics or tracking.

2. How we use the data
- The approximate location is used solely to calculate prayer times and the Qibla
  (direction to Makkah) for your area.
- Your settings are used to compute and schedule prayer times and reminders.
The compass/geomagnetic sensor is read only while the Qibla screen is open, on-device, to
rotate the direction arrow; its readings are not stored or transmitted.

3. How the data is stored
- Your location and settings are stored locally on the watch (local storage) only. They are
  not uploaded to us; we operate no servers and receive none of your data.

4. Data sharing and third parties
- We do not sell, rent, or share your data.
- To determine your approximate location, the paired phone makes a network request to a
  third-party IP-geolocation service: ipwho.is (primary) or ipapi.co (fallback). These
  services receive the request's IP address and return the corresponding city, coordinates,
  and timezone. Their handling of that request is governed by their own privacy policies
  (https://ipwho.is and https://ipapi.co). No other data is sent to them.

5. Data retention and deletion
- Cached location and settings remain on the watch until you change them or uninstall the
  app. Uninstalling the app removes this local data.

6. Children's privacy
- The app is not directed to children and collects no personal information from anyone.

7. Changes to this policy
- We may update this policy; the "Last updated" date will reflect any change.

8. Contact
- Questions: [your contact email]
```

### Permission selections (submission form)

Selections for the form's permission questions, with justification. Derived from `app.json`
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
- Schedules a notification (with vibration) at each prayer time, or a chosen number of
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
  IP address via the paired phone. Required for accurate prayer times and Qibla. No personal
  data sent — only a request to a public IP-geolocation endpoint.
- **Background execution:** Schedule and fire prayer reminders even when the UI is closed.
- **Notifications & Alarms:** Alert the user at (or before) each prayer time.
- **Compass (geomagnetic sensor):** Determine the watch's heading so the Qibla arrow points to Makkah.
- **Local storage:** Cache the resolved location and user settings on the watch.
- **Device info:** Read screen dimensions for correct layout.
