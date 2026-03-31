import { useAuth } from '../src/hooks/useAuth'
import LoginPage from '../src/pages/LoginPage'
import MainApp from '../src/pages/MainApp'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: '#888', fontSize: 14 }}>
      Loading IPL Fantasy 2026...
    </div>
  )

  return user ? <MainApp /> : <LoginPage />
}
