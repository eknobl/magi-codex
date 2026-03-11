'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { MAGI_IDS } from '@/types/magi';

interface WorldEvent {
  id: string;
  title: string;
  description: string;
  fictionalYear: number;
  fictionalMonth: string;
  fictionalDay: number;
  affectedMagi: string[] | null;
  eventType: string;
  isMilestone: boolean;
  status: string;
  injectedAt: string;
}

const EVENT_TYPES = ['political', 'ecological', 'technological', 'conflict', 'social', 'astronomical'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_ORDER = ['planned', 'seeding', 'active', 'resolved'];

const STATUS_COLORS: Record<string, string> = {
  planned: 'var(--text-muted)',
  seeding: 'var(--hermes)',
  active: 'var(--apollo)',
  resolved: 'var(--text-muted)',
};

export default function TimelinePage() {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(0);
  const [month, setMonth] = useState('January');
  const [day, setDay] = useState(1);
  const [eventType, setEventType] = useState('political');
  const [isMilestone, setIsMilestone] = useState(false);
  const [selectedMagi, setSelectedMagi] = useState<string[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const res = await fetch('/api/events');
    if (res.ok) {
      const data = await res.json() as WorldEvent[];
      setEvents(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description,
        fictionalYear: year, fictionalMonth: month, fictionalDay: day,
        affectedMagi: selectedMagi,
        eventType, isMilestone,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      resetForm();
      await loadEvents();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Failed to create event');
    }

    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    await loadEvents();
  }

  function resetForm() {
    setTitle(''); setDescription(''); setYear(0); setMonth('January');
    setDay(1); setEventType('political'); setIsMilestone(false); setSelectedMagi([]);
  }

  function toggleMagi(id: string) {
    setSelectedMagi((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  const grouped = STATUS_ORDER.reduce<Record<string, WorldEvent[]>>((acc, s) => {
    acc[s] = events.filter((e) => e.status === s);
    return acc;
  }, {});

  return (
    <main className="dashboard-grid">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Link href="/dashboard" className="detail-back">← DASHBOARD</Link>
            <h1 style={{ marginTop: '0.5rem' }}>WORLD TIMELINE</h1>
            <span className="dashboard-subtitle">AUTHOR EVENT MANAGEMENT</span>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError(''); }}
            style={{
              background: showForm ? 'var(--surface-2)' : 'var(--accent-dim)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              fontFamily: 'inherit',
              fontSize: '0.7rem',
              letterSpacing: '0.15em',
              cursor: 'pointer',
            }}
          >
            {showForm ? 'CANCEL' : '+ NEW EVENT'}
          </button>
        </div>
      </header>

      {/* Create event form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="section-title">NEW WORLD EVENT</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>TITLE</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>EVENT TYPE</label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={inputStyle}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>FICTIONAL YEAR</label>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle} min={0} />
              </div>
              <div>
                <label style={labelStyle}>MONTH</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle}>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>DAY</label>
                <input type="number" value={day} onChange={(e) => setDay(Number(e.target.value))} style={inputStyle} min={1} max={31} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>AFFECTED MAGI (click to select)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {MAGI_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleMagi(id)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: selectedMagi.includes(id) ? 'var(--accent-dim)' : 'var(--background)',
                      color: selectedMagi.includes(id) ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={isMilestone} onChange={(e) => setIsMilestone(e.target.checked)} />
                MILESTONE EVENT
              </label>
            </div>

            {error && (
              <div style={{ fontSize: '0.7rem', color: 'var(--tyr)', letterSpacing: '0.1em', marginBottom: '1rem' }}>{error}</div>
            )}

            <button type="submit" disabled={submitting} style={{
              background: 'var(--accent-dim)', border: 'none', color: 'var(--text-primary)',
              padding: '0.5rem 1.5rem', fontFamily: 'inherit', fontSize: '0.75rem',
              letterSpacing: '0.15em', cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}>
              {submitting ? 'CREATING...' : 'CREATE EVENT'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>LOADING TIMELINE...</div>
      ) : (
        <div>
          {STATUS_ORDER.map((status) => {
            const group = grouped[status];
            if (!group.length) return null;
            return (
              <div key={status} style={{ marginBottom: '2rem' }}>
                <div style={{
                  fontSize: '0.65rem', letterSpacing: '0.25em',
                  color: STATUS_COLORS[status], borderBottom: '1px solid var(--border)',
                  paddingBottom: '0.5rem', marginBottom: '1rem',
                }}>
                  {status.toUpperCase()} — {group.length}
                </div>
                {group.map((event) => (
                  <EventRow key={event.id} event={event} onDelete={handleDelete} />
                ))}
              </div>
            );
          })}
          {events.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              No events on the timeline. Create the first one.
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function EventRow({ event, onDelete }: { event: WorldEvent; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      padding: '1rem', marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              YR {event.fictionalYear} · {event.fictionalMonth} {event.fictionalDay}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              {event.eventType.toUpperCase()}
            </span>
            {event.isMilestone && (
              <span style={{ fontSize: '0.6rem', color: 'var(--surya)', letterSpacing: '0.1em' }}>★ MILESTONE</span>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {event.title}
          </div>
          {expanded && (
            <>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>
                {event.description}
              </div>
              {event.affectedMagi?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
                  {event.affectedMagi.map((id) => (
                    <span key={id} style={{
                      fontSize: '0.6rem', letterSpacing: '0.1em', padding: '0.15rem 0.5rem',
                      border: '1px solid var(--border)', color: 'var(--text-muted)',
                    }}>{id}</span>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
        {event.status === 'planned' && (
          <button
            onClick={() => onDelete(event.id)}
            style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
              padding: '0.2rem 0.5rem', fontFamily: 'inherit', fontSize: '0.65rem',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', letterSpacing: '0.15em',
  color: 'var(--text-muted)', marginBottom: '0.4rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--background)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', padding: '0.4rem 0.6rem',
  fontFamily: 'inherit', fontSize: '0.8rem', outline: 'none',
};
