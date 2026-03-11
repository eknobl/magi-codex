'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard/timeline';

  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });

    if (res.ok) {
      router.push(next);
    } else {
      setError('ACCESS DENIED');
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: '320px' }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            MAGI CODEX
          </div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
            AUTHOR ACCESS REQUIRED
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              PASSPHRASE
            </div>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                padding: '0.5rem 0.75rem',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: '0.7rem', color: 'var(--tyr)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !secret}
            style={{
              width: '100%',
              background: 'var(--accent-dim)',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '0.6rem',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              cursor: loading || !secret ? 'default' : 'pointer',
              opacity: loading || !secret ? 0.5 : 1,
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
