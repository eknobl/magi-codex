import {
  pgTable,
  text,
  jsonb,
  timestamp,
  integer,
  doublePrecision,
  uuid,
  index,
  real,
  serial,
} from 'drizzle-orm/pg-core';

// ── Core MAGI state ───────────────────────────────────────────────────────────
// One row per MAGI. The `state` column holds the full MagiState JSON blob.
// Mutations are applied via PATCH — the full blob is replaced each time.
export const magiStates = pgTable('magi_states', {
  id: text('id').primaryKey(),
  domain: text('domain').notNull(),
  optimizationTarget: text('optimization_target').notNull(),
  state: jsonb('state').notNull(),
  fictionalYear: integer('fictional_year').default(0).notNull(),
  fictionalMonth: text('fictional_month').default('January').notNull(),
  fictionalDay: integer('fictional_day').default(1).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Dispatch fragments ────────────────────────────────────────────────────────
// One row per generated dispatch. content is the raw markdown prose.
export const dispatches = pgTable(
  'dispatches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    magiId: text('magi_id')
      .references(() => magiStates.id)
      .notNull(),
    fictionalYear: integer('fictional_year').notNull(),
    fictionalMonth: text('fictional_month').notNull(),
    fictionalDay: integer('fictional_day').notNull(),
    content: text('content').notNull(),
    promptUsed: text('prompt_used'),
    tokensUsed: integer('tokens_used'),
    periodType: text('period_type').notNull().default('standard'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    magiIdx: index('dispatches_magi_idx').on(table.magiId),
    yearIdx: index('dispatches_year_idx').on(table.fictionalYear),
  })
);

// ── World events ──────────────────────────────────────────────────────────────
// Author-injected events. status: planned → seeding → active → resolved
export const worldEvents = pgTable('world_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  fictionalYear: integer('fictional_year').notNull(),
  fictionalMonth: text('fictional_month').notNull(),
  fictionalDay: integer('fictional_day').notNull(),
  affectedMagi: text('affected_magi').array(),
  eventTypes: text('event_type').array().notNull().default([]),
  significance: text('significance').default('standard').notNull(),
  status: text('status').default('planned').notNull(),
  injectedAt: timestamp('injected_at').defaultNow().notNull(),
});

// ── Global fictional clock ─────────────────────────────────────────────────────
// Singleton row (id=1). Single source of truth for the current fictional date.
export const systemClock = pgTable('system_clock', {
  id: serial('id').primaryKey(),
  fictionalYear: integer('fictional_year').notNull().default(0),
  fictionalMonth: text('fictional_month').notNull().default('January'),
  fictionalDay: integer('fictional_day').notNull().default(1),
  periodType: text('period_type').notNull().default('standard'),
  incidentPostsRemaining: integer('incident_posts_remaining').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Relationship snapshots ────────────────────────────────────────────────────
// Periodic snapshots of all MAGI pair values for drift visualization.
export const relationshipSnapshots = pgTable('relationship_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  magiA: text('magi_a').notNull(),
  magiB: text('magi_b').notNull(),
  trust: doublePrecision('trust').notNull(),
  conflict: doublePrecision('conflict').notNull(),
  pattern: text('pattern').notNull(),
  fictionalYear: integer('fictional_year').notNull(),
  snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),
});

// ── Evolution log ─────────────────────────────────────────────────────────────
// Tracks changes to the four evolution axes over time per MAGI.
export const evolutionLog = pgTable('evolution_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  magiId: text('magi_id')
    .references(() => magiStates.id)
    .notNull(),
  curiosity: real('curiosity').notNull(),
  assertiveness: real('assertiveness').notNull(),
  emotionalRange: real('emotional_range').notNull(),
  selfAwareness: real('self_awareness').notNull(),
  fictionalYear: integer('fictional_year').notNull(),
  loggedAt: timestamp('logged_at').defaultNow().notNull(),
});
