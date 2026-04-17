import SunCalc from 'suncalc';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const SEASONS = {
  N: ['winter', 'winter', 'spring', 'spring', 'spring', 'summer',
      'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'],
  S: ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter',
      'winter', 'winter', 'spring', 'spring', 'spring', 'summer']
};

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function collectClock(now = new Date(), hemisphere = 'N') {
  const dow = DAYS[now.getDay()];
  const month = MONTHS[now.getMonth()];
  const season = SEASONS[hemisphere][now.getMonth()];

  const lat = Number(process.env.AUBADE_LAT || 39.9);
  const lon = Number(process.env.AUBADE_LON || -91.4);
  const times = SunCalc.getTimes(now, lat, lon);
  const sunriseHour = times.sunrise.getHours();
  const sunriseMinute = times.sunrise.getMinutes();

  return {
    kind: 'clock',
    date: now,
    dow,
    month,
    day: now.getDate(),
    dayOrdinal: ordinal(now.getDate()),
    year: now.getFullYear(),
    season,
    sunriseHour,
    sunriseMinute,
    sunriseSpoken: speakSunrise(sunriseHour, sunriseMinute),
    spoken: `${dow}, ${month} ${ordinal(now.getDate())}`
  };
}

function speakSunrise(hour, minute) {
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'a.m.' : 'p.m.';
  if (minute === 0) return `${h} ${ampm}`;
  if (minute < 10) return `${h} oh ${minute} ${ampm}`;
  return `${h}:${String(minute).padStart(2, '0')} ${ampm}`;
}
