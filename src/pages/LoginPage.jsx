import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!form.name.trim()) return setError('Enter your name');
      if (form.password.length < 6) return setError('Password must be 6+ characters');
      if (form.password !== form.confirm) return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await signup(form.name.trim(), form.email, form.password);
    } catch (err) {
      const msg = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered — sign in instead',
        'auth/invalid-email': 'Invalid email address',
        'auth/too-many-requests': 'Too many attempts — try again later',
      }[err.code] || err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try { await loginWithGoogle(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const s = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#fafaf8' },
    box: { width: '100%', maxWidth: 400, background: '#fff', border: '0.5px solid #ddd', borderRadius: 12, padding: '2rem' },
    logo: { fontSize: 24, fontWeight: 500, textAlign: 'center', marginBottom: 4 },
    sub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: '1.5rem' },
    label: { display: 'block', fontSize: 12, color: '#666', marginBottom: 4 },
    input: { width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
    btn: { width: '100%', padding: '10px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 8 },
    err: { fontSize: 12, color: '#dc2626', marginBottom: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 },
    divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0', color: '#aaa', fontSize: 12 },
    link: { background: 'none', border: 'none', color: '#FF6B00', cursor: 'pointer', fontSize: 13 },
  };

  return (
    <div style={s.page}>
      <div style={s.box}>
        <div style={s.logo}><span style={{ color: '#FF6B00' }}>IPL</span> Fantasy 2026</div>
        <div style={s.sub}>Pick your XI · Beat your group · Win</div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={s.label}>Full name</label>
              <input style={s.input} placeholder="e.g. Virat Fan" value={form.name} onChange={e => set('name', e.target.value)} />
            </>
          )}
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} />
          {mode === 'signup' && (
            <>
              <label style={s.label}>Confirm password</label>
              <input style={s.input} type="password" placeholder="Repeat password" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
            </>
          )}

          {error && <div style={s.err}>{error}</div>}

          <button type="submit" style={{ ...s.btn, background: '#FF6B00', color: '#fff' }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={s.divider}>
          <div style={{ flex: 1, height: '0.5px', background: '#e5e5e5' }} />
          <span>or</span>
          <div style={{ flex: 1, height: '0.5px', background: '#e5e5e5' }} />
        </div>

        <button style={{ ...s.btn, background: '#fff', border: '0.5px solid #ccc', color: '#333' }} onClick={handleGoogle} disabled={loading}>
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 12 }}>
          {mode === 'login' ? (
            <>No account? <button style={s.link} onClick={() => { setMode('signup'); setError(''); }}>Sign up free</button></>
          ) : (
            <>Have an account? <button style={s.link} onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}

