import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];

const formatStatus = (status) => {
  if (!status) return 'pending';
  return status;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const loadBookings = async () => {
    const token = localStorage.getItem('studioAdminToken');
    if (!token) {
      router.push('/admin');
      return;
    }

    const response = await fetch(`/api/bookings/list?date=${selectedDate}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem('studioAdminToken');
      router.push('/admin');
      return;
    }

    const data = await response.json();
    setBookings(data.bookings || []);
  };

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  const handleStatusChange = async (bookingId, status) => {
    const token = localStorage.getItem('studioAdminToken');
    const response = await fetch('/api/bookings/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: bookingId, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Unable to update booking');
      return;
    }

    setStatusMessage(`Booking updated to ${status}.`);
    setError('');
    await loadBookings();
  };

  const logout = () => {
    localStorage.removeItem('studioAdminToken');
    router.push('/admin');
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
      </Head>

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.header}>
              <h1 className={styles.title}>Day bookings</h1>
              <button className={styles.secondaryButton} onClick={logout}>Logout</button>
            </div>

            <div className={styles.toolbar}>
              <label htmlFor="dateFilter">Date</label>
              <input
                id="dateFilter"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            {statusMessage ? <div className={styles.success}>{statusMessage}</div> : null}
            {error ? <div className={styles.error}>{error}</div> : null}

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Time</th>
                  <th>Contact</th>
                  <th>Design</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No bookings found for this date.</td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <strong>{booking.client_name}</strong>
                        <br />
                        {booking.phone || booking.client_phone}
                      </td>
                      <td>{booking.service_type}</td>
                      <td>
                        {booking.booking_date}
                        <br />
                        {booking.booking_time}
                      </td>
                      <td>
                        {booking.client_email}
                        <br />
                        {booking.client_phone}
                      </td>
                      <td>{booking.design_idea || 'No design notes'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge${formatStatus(booking.status).charAt(0).toUpperCase() + formatStatus(booking.status).slice(1)}`]}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        {statusOptions.map((status) => (
                          <button
                            key={status}
                            className={styles.statusButton}
                            onClick={() => handleStatusChange(booking.id, status)}
                            disabled={booking.status === status}
                          >
                            {status}
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
