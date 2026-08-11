'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg, #fff8f7)', padding: '20px'
      }}>
        <div style={{
          width: '100%', maxWidth: '400px', background: 'var(--card-bg, #fff)',
          borderRadius: '16px', padding: '40px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--ink, #222)', marginBottom: '12px' }}>
            Password Updated
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--sub, #888)', marginBottom: '24px' }}>
            Your password has been successfully updated.
          </p>
          <button onClick={() => router.push('/')} style={{
            padding: '12px 24px', background: 'var(--rn-red, #ff2442)', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
          }}>
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (!validSession) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg, #fff8f7)', padding: '20px'
      }}>
        <div style={{
          width: '100%', maxWidth: '400px', background: 'var(--card-bg, #fff)',
          borderRadius: '16px', padding: '40px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--ink, #222)', marginBottom: '12px' }}>
            Invalid or Expired Link
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--sub, #888)', marginBottom: '24px' }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/auth/forgot-password" style={{
            display: 'inline-block', padding: '12px 24px', background: 'var(--rn-red, #ff2442)',
            color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none'
          }}>
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg, #fff8f7)', padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px', background: 'var(--card-bg, #fff)',
        borderRadius: '16px', padding: '40px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink, #222)', textAlign: 'center', marginBottom: '8px' }}>
          Reset Password
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--sub, #888)', textAlign: 'center', marginBottom: '32px' }}>
          Enter your new password below
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--ink, #222)', marginBottom: '6px' }}>
              New Password
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid var(--line, #e5e5e5)',
                borderRadius: '8px', fontSize: '14px', background: 'var(--input-bg, #f5f5f5)',
                color: 'var(--ink, #222)', outline: 'none', boxSizing: 'border-box'
              }}
              placeholder="••••••••" />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--ink, #222)', marginBottom: '6px' }}>
              Confirm New Password
            </label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid var(--line, #e5e5e5)',
                borderRadius: '8px', fontSize: '14px', background: 'var(--input-bg, #f5f5f5)',
                color: 'var(--ink, #222)', outline: 'none', boxSizing: 'border-box'
              }}
              placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: 'var(--rn-red, #ff2442)', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
