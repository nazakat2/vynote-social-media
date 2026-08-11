'use client'

import { useState } from 'react'
import Link from 'next/link'
import { auth } from '../../../lib/api/index'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await auth.resetPassword(email)
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #fff8f7)',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--card-bg, #fff)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--ink, #222)',
            marginBottom: '12px'
          }}>
            Check Your Email
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--sub, #888)',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
          </p>
          <Link href="/auth/login" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'var(--rn-red, #ff2442)',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none'
          }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #fff8f7)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--card-bg, #fff)',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--ink, #222)',
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          Forgot Password?
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--sub, #888)',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          Enter your email and we&apos;ll send you a reset link
        </p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--ink, #222)',
              marginBottom: '6px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--line, #e5e5e5)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--input-bg, #f5f5f5)',
                color: 'var(--ink, #222)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--rn-red, #ff2442)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--sub, #888)',
          marginTop: '24px'
        }}>
          Remember your password?{' '}
          <Link href="/auth/login" style={{
            color: 'var(--rn-red, #ff2442)',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
