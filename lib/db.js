const { initDatabase } = require('./init-db');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'studio.db');

async function seedDatabase() {
  await initDatabase();

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const slotDate = tomorrow.toISOString().slice(0, 10);

  const sampleBookings = [
    {
      client_name: 'Ava Miller',
      client_phone: '555-101-2233',
      client_email: 'ava@example.com',
      service_type: 'flash',
      design_idea: 'Small floral wrist tattoo',
      booking_date: slotDate,
      booking_time: '11:00',
      appointment_duration: 60,
      status: 'confirmed',
    },
    {
      client_name: 'Kai Thompson',
      client_phone: '555-204-9911',
      client_email: 'kai@example.com',
      service_type: 'custom',
      design_idea: 'Half sleeve blackwork dragon',
      booking_date: slotDate,
      booking_time: '13:00',
      appointment_duration: 120,
      status: 'pending',
    },
  ];

  for (const booking of sampleBookings) {
    const existing = await db.get(
      'SELECT id FROM bookings WHERE client_email = ? AND booking_date = ? AND booking_time = ?',
      [booking.client_email, booking.booking_date, booking.booking_time]
    );

    if (!existing) {
      await db.run(
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.client_name,
          booking.client_phone,
          booking.client_email,
          booking.service_type,
          booking.design_idea,
          booking.booking_date,
          booking.booking_time,
          booking.appointment_duration,
          booking.status,
        ]
      );
    }
  }

  await db.close();
  console.log('Seed data added successfully.');
}

seedDatabase().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
