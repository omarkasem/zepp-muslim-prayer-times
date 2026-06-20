import { setLocation } from "../shared/storage";
import { applyReminders } from "./reminders";
import { isRTL } from "./i18n";

// Language code passed to the side-service so the city name can be reverse-
// geocoded in the user's language.
export function locationLang() {
  return isRTL() ? "ar" : "en";
}

function validLoc(loc) {
  return loc && typeof loc.lat === "number" && typeof loc.lon === "number" && loc.timezone;
}

// Ask the side-service for the IP-based location (it walks several geolocation
// providers in accuracy order), persist it, and reschedule reminders. Returns
// the location on success or null on failure.
export function requestAndStoreLocation(requestFn) {
  return requestFn({ method: "GET_LOCATION", params: { lang: locationLang() } })
    .then((loc) => {
      if (!validLoc(loc)) return null;
      try {
        setLocation(loc);
      } catch (e) {
        return null;
      }
      try { applyReminders(); } catch (e) {}
      return loc;
    });
}
