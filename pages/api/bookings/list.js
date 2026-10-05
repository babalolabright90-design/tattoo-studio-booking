import { getDb } from '../../../lib/db';
import { sendBookingConfirmation } from '../../../lib/email';

const serviceDurations = {
  custom: 120,
  flash: 60,
  coverup: 120,
  consultation: 60,
};

function toMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function overlaps(startA, durationA, startB, durationB) {
  const endA = startA + durationA;
  const endB = startB + durationB;
  return startA < endB && endA > startB;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    serviceType,
    bookingDate,
    bookingTime,
    clientName,
    clientPhone,
    clientEmail,
    designIdea,
    appointmentDuration,
  } = req.body || {};

  if (!serviceType || !bookingDate || !bookingTime || !clientName || !clientPhone || !clientEmail || !designIdea) {
    return res.status(400).json({ error: 'All booking fields are required.' });
  }

  const db = await getDb();
  const normalizedService = serviceType.toLowerCase();
  const duration = Number(appointmentDuration) || serviceDurations[normalizedService] || 60;
  const selectedDate = new Date(`${bookingDate}T00:00:00`);
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

  if (dayName === 'Sunday' || dayName === 'Monday') {
    return res.status(400).json({ error: 'The studio is closed on Sundays and Mondays.' });
  }

  const bookingStartMinutes = toMinutes(bookingTime);
  const openMinutes = 10 * 60;
  const closeMinutes = 18 * 60;

  if (bookingStartMinutes < openMinutes || bookingStartMinutes + duration > closeMinutes) {
    return res.status(400).json({ error: 'Selected time falls outside studio opening hours.' });
  }

  const existingBookings = await db.all(
    'SELECT booking_time, appointment_duration FROM bookings WHERE booking_date = ? AND status != ?',
    [bookingDate, 'cancelled']
  );

  const isConflict = existingBookings.some((booking) => {
    const existingStart = toMinutes(booking.booking_time);
    return overlaps(bookingStartMinutes, duration, existingStart, Number(booking.appointment_duration) || 60);
  });

  if (isConflict) {
    return res.status(409).json({ error: 'That time slot is already booked. Please choose another time.' });
  }

  const result = await db.run(
    `INSERT INTO bookings (
      client_name,
      client_phone,
      client_email,
      service_type,
      design_idea,
      booking_date,
      booking_time,
      appointment_duration,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      clientName,
      clientPhone,
      clientEmail,
      normalizedService,
      designIdea,
      bookingDate,
      bookingTime,
      duration,
    ]
  );

  const booking = {
    id: result.lastID,
    client_name: clientName,
    client_phone: clientPhone,
    client_email: clientEmail,
    service_type: normalizedService,
    design_idea: designIdea,
    booking_date: bookingDate,
    booking_time: bookingTime,
    appointment_duration: duration,
    status: 'pending',
  };

  await sendBookingConfirmation(booking);

  return res.status(201).json({ message: 'Booking created successfully.', booking });
}
