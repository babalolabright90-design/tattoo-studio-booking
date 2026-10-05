import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@inkandbonestudio.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('studioAdminToken', data.token);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login</title>
      </Head>

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={`${styles.card} ${styles.loginCard}`}>
            <h1 className={styles.title}>Studio Admin</h1>
            {error ? <div className={styles.error}>{error}</div> : null}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <button className={styles.primaryButton} type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
