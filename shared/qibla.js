const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

export function qiblaBearing({ lat, lon }) {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error('lat and lon must be numbers');
    }

    const lat1 = toRadians(lat);
    const lon1 = toRadians(lon);
    const lat2 = toRadians(KAABA_LAT);
    const lon2 = toRadians(KAABA_LON);

    const deltaLon = lon2 - lon1;

    const y = Math.sin(deltaLon);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLon);

    let bearing = toDegrees(Math.atan2(y, x));

    // Normalize to 0-360
    return (bearing + 360) % 360;
}
