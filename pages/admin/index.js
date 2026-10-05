import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

const serviceConfig = {
  custom: { label: 'Custom Piece', duration: 120 },
  flash: { label: 'Flash Design', duration: 60 },
  coverup: { label: 'Cover-up', duration: 120 },
  consultation: { label: 'Consultation', duration: 60 },
};

export default function Home() {
  const [formData, setFormData] = useState({
    serviceType: 'custom',
    bookingDate: '',
    bookingTime: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    designIdea: '',
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const today = new Date();
    const date = today.toISOString().slice(0, 10);
    setFormData((current) => ({ ...current, bookingDate: date }));
  }, []);

  useEffect(() => {
    if (!formData.bookingDate || !formData.serviceType) return;

    const fetchSlots = async () => {
      try {
        const res = await fetch(
          `/api/slots/available?date=${formData.bookingDate}&serviceType=${formData.serviceType}`
        );
        const data = await res.json();
        setAvailableSlots(data.slots || []);
        if (data.slots && !data.slots.includes(formData.bookingTime)) {
          setFormData((current) => ({ ...current, bookingTime: '' }));
        }
      } catch {
        setAvailableSlots([]);
      }
    };

    fetchSlots();
  }, [formData.bookingDate, formData.serviceType]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          appointmentDuration: serviceConfig[formData.serviceType]?.duration || 60,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed.');
      }

      setSuccess(`Your ${serviceConfig[formData.serviceType].label.toLowerCase()} booking was created successfully.`);
      setFormData((current) => ({
        ...current,
        bookingTime: '',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        designIdea: '',
      }));
      setAvailableSlots([]);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Ink & Bone Studio | Booking</title>
        <meta name="description" content="Tattoo studio booking system" />
      </Head>

      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.card}>
            <div className={styles.hero}>
              <h1 className={styles.title}>Book Your Appointment</h1>
              <p className={styles.subtitle}>
                Custom pieces, flash designs, cover-ups, and consultations are all available.
                Choose a service, a date, and a time that works for you.
              </p>
            </div>

            {success ? <div className={styles.success}>{success}</div> : null}
            {error ? <div className={styles.error}>{error}</div> : null}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="serviceType">Service</label>
                <select id="serviceType" name="serviceType" value={formData.serviceType} onChange={handleChange}>
                  <option value="custom">Custom Piece</option>
                  <option value="flash">Flash Design</option>
                  <option value="coverup">Cover-up</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>

              <div className={styles.grid}>
                <div className={styles.formGroup}>
                  <label htmlFor="bookingDate">Preferred date</label>
                  <input
                    id="bookingDate"
                    type="date"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bookingTime">Preferred time</label>
                  <select
                    id="bookingTime"
                    name="bookingTime"
                    value={formData.bookingTime}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a slot</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.formGroup}>
                  <label htmlFor="clientName">Client name</label>
                  <input id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} required />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="clientPhone">Phone</label>
                  <input id="clientPhone" name="clientPhone" value={formData.clientPhone} onChange={handleChange} required />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="clientEmail">Email</label>
                <input id="clientEmail" type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} required />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="designIdea">Design idea</label>
                <textarea
                  id="designIdea"
                  name="designIdea"
                  value={formData.designIdea}
                  onChange={handleChange}
                  placeholder="Tell us about the idea, placement, references, or any cover-up goals."
                  required
                />
              </div>

              <button type="submit" className={styles.primaryButton} disabled={loading}>
                {loading ? 'Booking...' : 'Book appointment'}
              </button>
            </form>
          </section>

          <aside className={styles.infoPanel}>
            <div className={styles.card}>
              <div className={styles.infoItem}>
                <h3>Studio hours</h3>
                <ul>
                  <li>Monday - Saturday</li>
                  <li>10:00 AM - 6:00 PM</li>
                  <li>Sunday closed</li>
                </ul>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.infoItem}>
                <h3>Service options</h3>
                <ul>
                  <li>Custom pieces</li>
                  <li>Flash designs</li>
                  <li>Cover-ups</li>
                  <li>Consultations</li>
                </ul>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.infoItem}>
                <h3>What happens next</h3>
                <ul>
                  <li>We reserve your chosen slot after booking.</li>
                  <li>Confirmation email is sent instantly.</li>
                  <li>Our team reviews the request before final approval.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
