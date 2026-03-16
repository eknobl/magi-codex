'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DispatchCardProps {
  id: string;
  magiId: string;
  domain: string;
  content: string;
  tokensUsed: number | null;
  periodType: string;
  color: string;
  isAuthor?: boolean;
}

export default function DispatchCard({ id, magiId, domain, content, tokensUsed, periodType, color, isAuthor = false }: DispatchCardProps) {
  const [editing, setEditing] = useState(false);
  const [displayed, setDisplayed] = useState(content);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/dispatches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Save failed');
      } else {
        setDisplayed(draft);
        setEditing(false);
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(displayed);
    setEditing(false);
    setError('');
  }

  return (
    <article style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderTop: `2px solid ${color}`,
      padding: '1rem',
    }}>
      {/* Card header */}
      <div style={{
        marginBottom: '0.6rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)',
      }}>
        <Link
          href={`/dashboard/${magiId.toLowerCase()}`}
          style={{ color, letterSpacing: '0.15em', fontSize: '0.8rem' }}
        >
          {magiId}
        </Link>
      </div>

      {/* Domain */}
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>
        {domain}
      </div>

      {/* Content — display or edit */}
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          style={{
            width: '100%',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: '0.78rem',
            lineHeight: '1.75',
            padding: '0.5rem',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <p style={{
          fontSize: '0.78rem', lineHeight: '1.75',
          color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', margin: 0,
        }}>
          {displayed}
        </p>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '0.6rem', paddingTop: '0.4rem',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
      }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          {tokensUsed ? `${tokensUsed} tokens` : ''}
        </span>

        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {error && (
              <span style={{ fontSize: '0.6rem', color: 'var(--tyr)', letterSpacing: '0.05em' }}>{error}</span>
            )}
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-muted)', padding: '0.15rem 0.5rem',
                fontFamily: 'inherit', fontSize: '0.6rem', letterSpacing: '0.1em',
                cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.5 : 1,
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'var(--accent-dim)', border: 'none',
                color: 'var(--text-primary)', padding: '0.15rem 0.6rem',
                fontFamily: 'inherit', fontSize: '0.6rem', letterSpacing: '0.1em',
                cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        ) : isAuthor ? (
          <button
            onClick={() => { setDraft(displayed); setEditing(true); }}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '0.15rem 0.5rem',
              fontFamily: 'inherit', fontSize: '0.6rem', letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            EDIT
          </button>
        ) : null}
      </div>
    </article>
  );
}
