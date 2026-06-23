export function toHijri(date, offsetDays = 0) {
    // The arithmetic (tabular) Hijri calendar routinely differs by ±1 day from
    // the locally announced (moon-sighting / Umm al-Qura) date. offsetDays lets
    // the user nudge the result to match their region; we apply it by shifting
    // the civil date before conversion.
    const n = (typeof offsetDays === 'number' && !isNaN(offsetDays)) ? offsetDays : 0;
    const src = n ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + n) : date;

    let year = src.getFullYear();
    let month = src.getMonth() + 1;
    let day = src.getDate();
    
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    
    let jd = Math.floor(365.25 * (year + 4716)) + 
             Math.floor(30.6001 * (month + 1)) + 
             day + B - 1524.5;
             
    jd = Math.floor(jd + 0.5);
    
    let days = jd - 1948440; // 1948440 is JDN of 16 July 622 CE (Civil Epoch)
    
    let cycle = Math.floor(days / 10631);
    let rem = days - cycle * 10631;
    
    let hYear = Math.floor((rem * 30 + 10646) / 10631);
    let yDays = Math.round((hYear - 1) * 10631 / 30);
    let dOfYear = rem - yDays;
    
    let hMonth = Math.min(12, Math.floor(dOfYear / 29.5) + 1);
    let mDays = Math.ceil((hMonth - 1) * 29.5);
    let hDay = dOfYear - mDays + 1;
    
    const monthNames = [
        "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
        "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ];
    
    return {
        day: hDay,
        month: hMonth,
        monthName: monthNames[hMonth - 1],
        year: cycle * 30 + hYear
    };
}
