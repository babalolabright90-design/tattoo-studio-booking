import { getDb } from '../../../lib/db';

const studioOpenHour = 10;
const studioCloseHour = 18;

function toMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function overlaps(startA, durationA, startB, durationB) {
  const endA = startA + durationA;
  const endB = startB + durationB;
  return startA < endB && endA > startB;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, serviceType } = req.query;
  if (!date || !serviceType) {
    return res.status(400).json({ error: 'Date and service type are required.' });
  }

  const db = await getDb();
  const durationMap = {
    custom: 120,
    flash: 60,
    coverup: 120,
    consultation: 60,
  };

  const duration = durationMap[serviceType] || 60;
  const day = new Date(`${date}T00:00:00`);
  const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });

  if (dayName === 'Sunday' || dayName === 'Monday') {
    return res.status(200).json({ slots: [] });
  }

  const bookings = await db.all(
    'SELECT booking_time, appointment_duration FROM bookings WHERE booking_date = ? AND status != ?',
    [date, 'cancelled']
  );

  const startMinutes = studioOpenHour * 60;
  const endMinutes = studioCloseHour * 60;
  const slots = [];

  for (let time = startMinutes; time + duration <= endMinutes; time += 30) {
    const slotTime = formatTime(time);
    const slotStartMinutes = toMinutes(slotTime);
    let blocked = false;

    for (const booking of bookings) {
      const bookingStartMinutes = toMinutes(booking.booking_time);
      const bookingDuration = Number(booking.appointment_duration) || 60;

      if (overlaps(slotStartMinutes, duration, bookingStartMinutes, bookingDuration)) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      slots.push(slotTime);
    }
  }

  return res.status(200).json({ slots });
}
