export const METHODS = {
  mwl: { fajrAngle: 18, ishaAngle: 17, name: "Muslim World League" },
  isna: { fajrAngle: 15, ishaAngle: 15, name: "Islamic Society of North America" },
  egyptian: { fajrAngle: 19.5, ishaAngle: 17.5, name: "Egyptian General Authority of Survey" },
  umm_al_qura: { fajrAngle: 18.5, ishaInterval: 90, name: "Umm Al-Qura University, Makkah" },
  karachi: { fajrAngle: 18, ishaAngle: 18, name: "University of Islamic Sciences, Karachi" }
};

export const DEFAULT_METHOD_ID = "mwl";

export function getMethod(id) {
  if (id && METHODS[id]) {
    return METHODS[id];
  }
  return METHODS[DEFAULT_METHOD_ID];
}
