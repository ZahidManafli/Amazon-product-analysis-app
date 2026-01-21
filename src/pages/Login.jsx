import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Input from '../components/UI/Input.jsx'
import Button from '../components/UI/Button.jsx'
import Alert from '../components/UI/Alert.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard/offered')
    } catch (err) {
      setError(err.message ?? 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-xl shadow-black/40">
        <div className="mb-6 space-y-1 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
            eBay Dropshipping
          </div>
          <h1 className="text-xl font-semibold text-slate-50">
            Market Analyzer
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to analyze Amazon products for eBay dropshipping.
          </p>
        </div>

        <Alert message={error} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Create one
          </Link>
        </p>

        <p className="mt-6 text-center text-[10px] leading-snug text-slate-500">
          This tool is for research purposes only. We are not affiliated with
          Amazon or eBay.
        </p>
      </div>
    </div>
  )
}

