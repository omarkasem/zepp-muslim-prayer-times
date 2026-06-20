import { BaseSideService } from "@zeppos/zml/base-side";

// Some models return res.body as a JSON string, others as an object.
function parseBody(res) {
  const body = res && res.body;
  return typeof body === "string" ? JSON.parse(body) : body;
}

// IP-geolocation providers (HTTPS, no API key). IP-based location works
// indoors (uses the phone's internet connection). Accuracy varies a lot by
// provider for the same IP — geojs resolved an Egyptian (Alexandria) IP
// correctly with precise coordinates while ipwho.is mislabelled it as Giza, so
// geojs is primary and the others are ordered fallbacks.
function fetchFromGeojs() {
  return fetch({ url: "https://get.geojs.io/v1/ip/geo.json", method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d && d.latitude != null) {
      const lat = Number(d.latitude);
      const lon = Number(d.longitude);
      if (!isFinite(lat) || !isFinite(lon)) throw new Error("geojs bad coords");
      return {
        lat: lat,
        lon: lon,
        city: d.city || "",
        country: d.country || "",
        timezone: d.timezone || "",
      };
    }
    throw new Error("geojs returned no location");
  });
}

function fetchFromReallyfreegeoip() {
  return fetch({ url: "https://reallyfreegeoip.org/json/", method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d && d.latitude != null) {
      return {
        lat: Number(d.latitude),
        lon: Number(d.longitude),
        city: d.city || "",
        country: d.country_name || "",
        timezone: d.time_zone || "",
      };
    }
    throw new Error("reallyfreegeoip returned no location");
  });
}

function fetchFromIpinfo() {
  return fetch({ url: "https://ipinfo.io/json", method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d && typeof d.loc === "string" && d.loc.indexOf(",") !== -1) {
      const parts = d.loc.split(",");
      const lat = Number(parts[0]);
      const lon = Number(parts[1]);
      if (!isFinite(lat) || !isFinite(lon)) throw new Error("ipinfo bad coords");
      return {
        lat: lat,
        lon: lon,
        city: d.city || "",
        country: d.country || "",
        timezone: d.timezone || "",
      };
    }
    throw new Error("ipinfo returned no location");
  });
}

function fetchFromIpwhois() {
  return fetch({ url: "https://ipwho.is/", method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d && d.success && d.latitude != null) {
      return {
        lat: d.latitude,
        lon: d.longitude,
        city: d.city || "",
        country: d.country || "",
        timezone: (d.timezone && d.timezone.id) || "",
      };
    }
    throw new Error("ipwho.is returned no location");
  });
}

function fetchFromIpapi() {
  return fetch({ url: "https://ipapi.co/json/", method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d && d.latitude != null) {
      return {
        lat: d.latitude,
        lon: d.longitude,
        city: d.city || "",
        country: d.country_name || "",
        timezone: d.timezone || "",
      };
    }
    throw new Error("ipapi.co returned no location");
  });
}

// Reverse-geocode the city name in the requested language (BigDataCloud's
// client endpoint is free + key-less and supports localityLanguage). Used to
// localize the city label (e.g. Arabic). Falls back to the IP-provided name.
function fetchLocalizedCity(lat, lon, lang) {
  const url =
    "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
    lat + "&longitude=" + lon + "&localityLanguage=" + lang;
  return fetch({ url: url, method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d) {
      return d.city || d.locality || d.principalSubdivision || "";
    }
    return "";
  });
}

function withLocalizedCity(loc, lang) {
  if (!lang) return Promise.resolve(loc);
  return fetchLocalizedCity(loc.lat, loc.lon, lang)
    .then((name) => {
      if (name) loc.city = name;
      return loc;
    })
    .catch(() => loc);
}

// Walk the providers in priority order, skipping any that fail or return no
// usable timezone, until one yields a valid location.
function fetchIpLocation() {
  const providers = [
    fetchFromGeojs,
    fetchFromReallyfreegeoip,
    fetchFromIpinfo,
    fetchFromIpapi,
    fetchFromIpwhois,
  ];
  let chain = Promise.reject(new Error("no provider"));
  for (let i = 0; i < providers.length; i++) {
    const next = providers[i];
    chain = chain.catch(() =>
      next().then((loc) => {
        if (!loc || !loc.timezone) throw new Error("missing timezone");
        return loc;
      })
    );
  }
  return chain;
}

AppSideService(
  BaseSideService({
    onInit() {},
    onRun() {},
    onDestroy() {},

    onRequest(req, res) {
      if (req.method === "GET_LOCATION") {
        const lang = (req.params && req.params.lang) || "";
        fetchIpLocation()
          .then((loc) => withLocalizedCity(loc, lang))
          .then((loc) => res(null, loc))
          .catch((err) => res((err && err.message) || "location lookup failed"));
      } else {
        res("unknown method: " + req.method);
      }
    },
  })
);
