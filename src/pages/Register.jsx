import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [step, setStep] = useState('register')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', age: '', parent_email: '' })
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [childEmail, setChildEmail] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const isChild = parseInt(form.age) <= 15 && form.age !== ''

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await authAPI.register(form)
      if (res.data.requiresVerification) {
        setChildEmail(form.email)
        setStep('verify')
      } else {
        login(res.data.token, res.data.user)
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.verifyLink({ child_email: childEmail, code })
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: '600', color: 'var(--purple)', marginBottom: '8px' }}>Personal Wallet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Enter the code sent to your parent</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', background: 'var(--purple-light)', padding: '10px 14px', borderRadius: 'var(--radius)', color: 'var(--purple)' }}>
            A 6-digit code was sent to your parent's email. Ask them to check their inbox.
          </div>
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Verification code</label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }}
                required
              />
            </div>
            {error && <div className="error-msg" style={{ marginBottom: '12px' }}>{error}</div>}
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify and finish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: '600', color: 'var(--purple)', marginBottom: '8px' }}>Personal Wallet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Create your account</div>
        </div>
        <div className="card">
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full name</label>
              <input type="text" name="full_name" placeholder="Iman Hodzic" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input type="number" name="age" placeholder="Your age" min="1" max="120" value={form.age} onChange={handleChange} required />
            </div>

            {isChild && (
              <div>
                <div style={{ fontSize: '13px', background: 'var(--purple-light)', color: 'var(--purple)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
                  Since you are under 16, a parent account is required. Enter your parent's email — they will receive a verification code.
                </div>
                <div className="form-group">
                  <label>Parent's email</label>
                  <input type="email" name="parent_email" placeholder="parent@example.com" value={form.parent_email} onChange={handleChange} required />
                </div>
              </div>
            )}

            {error && <div className="error-msg" style={{ marginBottom: '12px' }}>{error}</div>}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '4px' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--purple)', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}