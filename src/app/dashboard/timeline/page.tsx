'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { MAGI_IDS } from '@/types/magi';
import { YEAR_BASE } from '@/lib/constants';

interface WorldEvent {
  id: string;
  title: string;
  description: string;
  fictionalYear: number;
  fictionalMonth: string;
  fictionalDay: number;
  affectedMagi: string[] | null;
  eventTypes: string[];
  significance: string;
  status: string;
  injectedAt: string;
}

const EVENT_TYPES = ['political', 'ecological', 'technological', 'conflict', 'social', 'astronomical'] as const;

const TYPE_IMPLICATIONS: Record<string, string> = {
  political:     'Shifts governance, treaties, power equilibrium',
  ecological:    'Environmental and resource pressure',
  technological: 'New capabilities, disruptions to existing order',
  conflict:      'Active hostility, territorial or military pressure',
  social:        'Cultural movements, broad societal ripple',
  astronomical:  'Celestial or cosmic phenomena',
};

const SIGNIFICANCE_TIERS = [
  { value: 'standard',  label: 'STANDARD',  glyph: '',  desc: 'Routine — daily operational log' },
  { value: 'notable',   label: 'NOTABLE',   glyph: '◇', desc: 'Inflection point worth watching' },
  { value: 'milestone', label: 'MILESTONE', glyph: '◆', desc: 'Clear turning point in the narrative' },
  { value: 'epochal',   label: 'EPOCHAL',   glyph: '◈', desc: 'Civilization-scale, permanent shift' },
] as const;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_ORDER = ['planned', 'seeding', 'active', 'resolved'];

const STATUS_COLORS: Record<string, string> = {
  planned:  'var(--text-muted)',
  seeding:  'var(--hermes)',
  active:   'var(--apollo)',
  resolved: 'var(--text-muted)',
};

// Significance → border color on EventRow
const SIG_BORDER: Record<string, string> = {
  standard:  'var(--border)',
  notable:   'var(--text-muted)',
  milestone: 'var(--accent-dim)',
  epochal:   'var(--accent)',
};

// Significance → title font weight
const SIG_WEIGHT: Record<string, number> = {
  standard:  400,
  notable:   500,
  milestone: 600,
  epochal:   700,
};

export default function TimelinePage() {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state — year stored as display value (2039+), converted to DB offset on submit
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(YEAR_BASE);
  const [month, setMonth] = useState('January');
  const [day, setDay] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['political']);
  const [significance, setSignificance] = useState('standard');
  const [selectedMagi, setSelectedMagi] = useState<string[]>([]);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    const res = await fetch('/api/events');
    if (res.ok) setEvents(await res.json() as WorldEvent[]);
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (selectedTypes.length === 0) { setError('Select at least one event type'); return; }
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description,
        fictionalYear: year - YEAR_BASE,  // convert display → DB offset
        fictionalMonth: month,
        fictionalDay: day,
        affectedMagi: selectedMagi,
        eventTypes: selectedTypes,
        significance,
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
    setTitle(''); setDescription(''); setYear(YEAR_BASE); setMonth('January');
    setDay(1); setSelectedTypes(['political']); setSignificance('standard'); setSelectedMagi([]);
  }

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? (prev.length > 1 ? prev.filter((t) => t !== type) : prev) : [...prev, type]
    );
  }

  function toggleMagi(id: string) {
    setSelectedMagi((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
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

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="section-title">NEW WORLD EVENT</div>
          <form onSubmit={handleSubmit}>

            {/* Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>TITLE</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Date row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>YEAR</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  style={inputStyle}
                  min={YEAR_BASE}
                />
              </div>
              <div>
                <label style={labelStyle}>MONTH</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle}>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>DAY</label>
                <input
                  type="number" value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  style={inputStyle} min={1} max={31}
                />
              </div>
            </div>

            {/* Event types — multi-select toggle buttons */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>EVENT TYPE (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: selectedTypes.includes(type) ? 'var(--accent-dim)' : 'var(--background)',
                      color: selectedTypes.includes(type) ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
              {/* Implication hints for selected types */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {selectedTypes.map((type) => (
                  <div key={type} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{type}</span>
                    {' — '}{TYPE_IMPLICATIONS[type]}
                  </div>
                ))}
              </div>
            </div>

            {/* Significance — segmented control */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>SIGNIFICANCE</label>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {SIGNIFICANCE_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => setSignificance(tier.value)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.65rem',
                      letterSpacing: '0.12em',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      border: `1px solid ${significance === tier.value ? SIG_BORDER[tier.value] : 'var(--border)'}`,
                      background: significance === tier.value ? 'var(--surface-2)' : 'var(--background)',
                      color: significance === tier.value ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                    title={tier.desc}
                  >
                    {tier.glyph ? `${tier.glyph} ` : ''}{tier.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
                {SIGNIFICANCE_TIERS.find((t) => t.value === significance)?.desc}
              </div>
            </div>

            {/* Affected MAGI */}
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
  const sig = event.significance ?? 'standard';
  const glyph = { standard: '', notable: '◇', milestone: '◆', epochal: '◈' }[sig] ?? '';
  const displayYear = event.fictionalYear + YEAR_BASE;

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid var(--border)`,
      borderLeft: `2px solid ${SIG_BORDER[sig] ?? 'var(--border)'}`,
      padding: '1rem',
      marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              {displayYear} · {event.fictionalMonth} {event.fictionalDay}
            </span>
            {/* Type pills */}
            {(event.eventTypes ?? []).map((type) => (
              <span key={type} style={{
                fontSize: '0.55rem', letterSpacing: '0.1em',
                padding: '0.1rem 0.4rem', border: '1px solid var(--border)',
                color: 'var(--text-muted)', textTransform: 'uppercase',
              }}>{type}</span>
            ))}
            {glyph && (
              <span style={{ fontSize: '0.65rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>{glyph}</span>
            )}
          </div>
          <div style={{
            fontSize: sig === 'epochal' ? '0.9rem' : '0.85rem',
            fontWeight: SIG_WEIGHT[sig] ?? 400,
            letterSpacing: sig === 'epochal' ? '0.08em' : '0.05em',
            textTransform: sig === 'epochal' ? 'uppercase' : 'none',
            color: 'var(--text-primary)',
            marginBottom: '0.25rem',
          }}>
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
