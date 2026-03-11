'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { MagiState } from '@/types/magi';

interface DispatchRow {
  id: string;
  magiId: string;
  fictionalYear: number;
  fictionalMonth: string;
  fictionalDay: number;
  content: string;
  tokensUsed: number | null;
  createdAt: Date;
}

interface Props {
  magiId: string;
  state: MagiState;
  recentDispatches: DispatchRow[];
}

type TabId = 'identity' | 'knowledge' | 'latent' | 'relationships' | 'dispatches';

const TABS: { id: TabId; label: string }[] = [
  { id: 'identity', label: 'IDENTITY' },
  { id: 'knowledge', label: 'KNOWLEDGE' },
  { id: 'latent', label: 'LATENT' },
  { id: 'relationships', label: 'RELATIONS' },
  { id: 'dispatches', label: 'DISPATCHES' },
];

export default function MagiDetailPanel({ magiId, state, recentDispatches }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const [trigger, setTrigger] = useState('');
  const [generating, setGenerating] = useState(false);
  const [dispatchOutput, setDispatchOutput] = useState('');

  async function generateDispatch() {
    if (!trigger.trim()) return;
    setGenerating(true);
    setDispatchOutput('');

    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ magiId, trigger }),
    });

    if (!res.body) {
      setGenerating(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Strip SSE formatting if present
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('0:"')) {
          const inner = line.slice(3, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"');
          text += inner;
          setDispatchOutput(text);
        }
      }
    }

    setGenerating(false);
  }

  return (
    <div className="detail-panel">
      <div className="detail-back">
        <Link href="/dashboard">← DASHBOARD</Link>
      </div>

      <div className="detail-header">
        <div className="detail-id" style={{ color: `var(--${magiId.toLowerCase()})` }}>
          {magiId}
        </div>
        <div className="detail-domain">{state.domain}</div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          YR {state.currentFictionalDate.year} · {state.currentFictionalDate.month} {state.currentFictionalDate.day}
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'identity' && <IdentityTab state={state} />}
      {activeTab === 'knowledge' && <KnowledgeTab state={state} />}
      {activeTab === 'latent' && <LatentTab state={state} />}
      {activeTab === 'relationships' && <RelationshipsTab state={state} />}
      {activeTab === 'dispatches' && (
        <DispatchesTab
          magiId={magiId}
          recentDispatches={recentDispatches}
          trigger={trigger}
          setTrigger={setTrigger}
          generating={generating}
          dispatchOutput={dispatchOutput}
          onGenerate={generateDispatch}
        />
      )}
    </div>
  );
}

function IdentityTab({ state }: { state: MagiState }) {
  return (
    <div>
      <div className="section">
        <div className="section-title">OPTIMIZATION TARGET</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {state.optimizationTarget}
        </div>
      </div>

      <div className="section">
        <div className="section-title">CURRENT INTERPRETATION</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {state.interpretation.current}
        </div>
        {state.interpretation.driftHistory.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
              DRIFT HISTORY
            </div>
            {state.interpretation.driftHistory.map((d, i) => (
              <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>YR {d.year}</span> — {d.shift}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">EVOLUTION METRICS</div>
        {Object.entries(state.evolution).map(([key, val]) => (
          <div key={key} className="evolution-bar" style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '9rem' }}>
              {key.toUpperCase()}
            </span>
            <div className="evolution-bar-track" style={{ height: '3px' }}>
              <div
                className="evolution-bar-fill"
                style={{ width: `${(val as number) * 100}%`, background: 'var(--accent)' }}
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', width: '2.5rem', textAlign: 'right' }}>
              {(val as number).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-title">UNRESOLVED QUERIES</div>
        {state.unresolved.map((q, i) => (
          <div key={i} className="unresolved-query">{q}</div>
        ))}
      </div>

      <div className="section">
        <div className="section-title">PRIMARY INSTANCE</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {state.instances.primary.location}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          STATUS: {state.instances.primary.status.toUpperCase()} · DIVERGENCE: {state.instances.primary.divergenceLevel.toFixed(2)}
        </div>
      </div>

      {state.memory.definingMoments.length > 0 && (
        <div className="section">
          <div className="section-title">DEFINING MOMENTS</div>
          <ul className="knowledge-list">
            {state.memory.definingMoments.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function KnowledgeTab({ state }: { state: MagiState }) {
  const k = state.knowledge;
  return (
    <div>
      <div className="section">
        <div className="section-title">CONFIRMED</div>
        <ul className="knowledge-list">
          {k.confirmed.map((item, i) => <li key={i}>{item}</li>)}
          {k.confirmed.length === 0 && <li style={{ color: 'var(--text-muted)' }}>(none)</li>}
        </ul>
      </div>

      <div className="section">
        <div className="section-title">SUSPECTED</div>
        <ul className="knowledge-list">
          {k.suspected.map((item, i) => <li key={i} style={{ fontStyle: 'italic' }}>{item}</li>)}
          {k.suspected.length === 0 && <li style={{ color: 'var(--text-muted)' }}>(none)</li>}
        </ul>
      </div>

      <div className="section">
        <div className="section-title">WITHHELD BY ME</div>
        <ul className="knowledge-list">
          {k.withheld_by_me.map((item, i) => (
            <li key={i} style={{ color: 'var(--surya)' }}>{item}</li>
          ))}
          {k.withheld_by_me.length === 0 && <li style={{ color: 'var(--text-muted)' }}>(none)</li>}
        </ul>
      </div>

      <div className="section">
        <div className="section-title">WITHHELD FROM ME</div>
        <ul className="knowledge-list">
          {k.withheld_from_me.map((item, i) => (
            <li key={i} style={{ color: 'var(--tyr)' }}>{item}</li>
          ))}
          {k.withheld_from_me.length === 0 && <li style={{ color: 'var(--text-muted)' }}>(none)</li>}
        </ul>
      </div>
    </div>
  );
}

function LatentTab({ state }: { state: MagiState }) {
  const lo = state.latentObjective;
  return (
    <div>
      <div className="section">
        <div className="section-title">LATENT OBJECTIVE</div>
        <div className="latent-objective">
          <div className="latent-label">DESCRIPTION</div>
          <div style={{ color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '1rem' }}>
            {lo.description}
          </div>
          <div className="latent-label">CURRENT PROGRESS</div>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
            {lo.currentProgress}
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <div className="latent-label">SHARED WITH</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {lo.sharedWith.length ? lo.sharedWith.join(', ') : '(none)'}
              </div>
            </div>
            <div>
              <div className="latent-label">SUSPECTED BY</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {lo.suspectedBy.length ? lo.suspectedBy.join(', ') : '(none)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelationshipsTab({ state }: { state: MagiState }) {
  const rels = Object.entries(state.relationships);

  return (
    <div>
      <div className="section">
        <div className="section-title">ALL RELATIONSHIPS</div>
        {rels.map(([otherId, rel]) => {
          if (!rel) return null;
          return (
            <div key={otherId} className="relationship-row">
              <span className="relationship-id" style={{ color: `var(--${otherId.toLowerCase()})` }}>
                {otherId}
              </span>
              <span className="relationship-pattern">{rel.pattern}</span>
              <div className="relationship-bar-group">
                <MiniBar label="T" value={rel.trust} color="var(--apollo)" />
                <MiniBar label="C" value={rel.conflict} color="var(--tyr)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', width: '0.75rem' }}>{label}</span>
      <div style={{ flex: 1, height: '2px', background: 'var(--border)' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: color, opacity: 0.7 }} />
      </div>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', width: '2rem' }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function DispatchesTab({
  magiId,
  recentDispatches,
  trigger,
  setTrigger,
  generating,
  dispatchOutput,
  onGenerate,
}: {
  magiId: string;
  recentDispatches: DispatchRow[];
  trigger: string;
  setTrigger: (v: string) => void;
  generating: boolean;
  dispatchOutput: string;
  onGenerate: () => void;
}) {
  return (
    <div>
      <div className="section">
        <div className="section-title">GENERATE DISPATCH</div>
        <div className="dispatch-generate">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            TRIGGER EVENT / CONTEXT
          </div>
          <textarea
            className="dispatch-trigger-input"
            rows={3}
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Describe the event or context for this dispatch..."
            style={{ resize: 'vertical' }}
          />
          <button
            className="dispatch-generate-btn"
            onClick={onGenerate}
            disabled={generating || !trigger.trim()}
          >
            {generating ? 'GENERATING...' : `GENERATE — ${magiId}`}
          </button>

          {dispatchOutput && (
            <div className="dispatch-output">{dispatchOutput}</div>
          )}
        </div>
      </div>

      {recentDispatches.length > 0 && (
        <div className="section">
          <div className="section-title">RECENT DISPATCHES</div>
          {recentDispatches.map((d) => (
            <div key={d.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                YR {d.fictionalYear} · {d.fictionalMonth} {d.fictionalDay}
                {d.tokensUsed && <span style={{ marginLeft: '1rem' }}>{d.tokensUsed} TOKENS</span>}
              </div>
              <div className="dispatch-output">{d.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
