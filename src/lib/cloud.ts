import { supabase } from './supabase';
import type { Category, CustomPlan, Session, SetupVariant } from '../state/types';

// The slice of app state that lives in the cloud.
export interface CloudData {
  categories: Category[];
  customSubjects: Record<string, string[]>;
  methods: string[];
  sessions: Session[];
  customPlans: CustomPlan[];
  trash: Session[];
  settings: Record<string, unknown> | null;
  setupVariants: SetupVariant[];
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

// Deterministic ids for subjects and methods so a plain upsert plus
// delete-missing keeps the cloud in sync without tracking row ids in app state.
function subjectId(catId: string, name: string): string {
  return `${catId}::${name}`;
}
function methodId(name: string): string {
  return `m::${name}`;
}

export async function loadAll(): Promise<CloudData> {
  const db = client();
  const [sectors, subjects, methods, sessions, plans, trash, settings] = await Promise.all([
    db.from('sectors').select('*'),
    db.from('subjects').select('*'),
    db.from('methods').select('*'),
    db.from('sessions').select('*'),
    db.from('custom_plans').select('*'),
    db.from('trash').select('*'),
    db.from('app_settings').select('data').maybeSingle(),
  ]);

  const firstError =
    sectors.error ||
    subjects.error ||
    methods.error ||
    sessions.error ||
    plans.error ||
    trash.error ||
    settings.error;
  if (firstError) throw firstError;

  const categories: Category[] = (sectors.data ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({ id: r.id, name: r.name, color: r.color, goalH: Number(r.goal_hours) }));

  const customSubjects: Record<string, string[]> = {};
  for (const r of subjects.data ?? []) {
    (customSubjects[r.sector_id] ??= []).push(r.name);
  }

  const methodList: string[] = (methods.data ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => r.name);

  const sessionList: Session[] = (sessions.data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    min: r.total_min,
    items: r.items ?? [],
    method: r.method ?? '',
    notes: r.notes ?? '',
  }));

  const planList: CustomPlan[] = (plans.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    steps: r.steps ?? [],
  }));

  const trashList: Session[] = (trash.data ?? []).map((r) => r.payload as Session);

  // app_settings.data stores both the user's settings and their saved setup variants.
  const settingsBlob = settings.data?.data ?? null;
  const setupVariants: SetupVariant[] =
    (settingsBlob?.setupVariants as SetupVariant[] | undefined) ?? [];

  // Strip setupVariants out before returning pureSettings so the app's
  // Settings type does not see an unexpected field.
  let pureSettings: Record<string, unknown> | null = null;
  if (settingsBlob) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { setupVariants: _sv, ...rest } = settingsBlob as Record<string, unknown>;
    pureSettings = rest;
  }

  return {
    categories,
    customSubjects,
    methods: methodList,
    sessions: sessionList,
    customPlans: planList,
    trash: trashList,
    settings: pureSettings,
    setupVariants,
  };
}

// Remove the user's rows in a table whose id is not in the current set. RLS
// already scopes selects and deletes to the signed in user.
async function deleteMissing(table: string, currentIds: string[]): Promise<void> {
  const db = client();
  const { data, error } = await db.from(table).select('id');
  if (error) throw error;
  const keep = new Set(currentIds);
  const remove = (data ?? []).map((r) => r.id).filter((id) => !keep.has(id));
  if (remove.length) {
    const { error: delError } = await db.from(table).delete().in('id', remove);
    if (delError) throw delError;
  }
}

// Push the whole data slice to the cloud. Calls are serialized below so two
// rapid edits cannot interleave and clobber each other.
async function pushAllInner(userId: string, data: CloudData): Promise<void> {
  const db = client();

  const sectorRows = data.categories.map((c, i) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    goal_hours: c.goalH,
    sort_order: i,
  }));
  if (sectorRows.length) {
    const { error } = await db.from('sectors').upsert(sectorRows);
    if (error) throw error;
  }
  await deleteMissing('sectors', data.categories.map((c) => c.id));

  const subjectRows: { id: string; sector_id: string; name: string }[] = [];
  for (const [catId, names] of Object.entries(data.customSubjects)) {
    for (const name of names) subjectRows.push({ id: subjectId(catId, name), sector_id: catId, name });
  }
  if (subjectRows.length) {
    const { error } = await db.from('subjects').upsert(subjectRows);
    if (error) throw error;
  }
  await deleteMissing('subjects', subjectRows.map((r) => r.id));

  const methodRows = data.methods.map((name, i) => ({ id: methodId(name), name, sort_order: i }));
  if (methodRows.length) {
    const { error } = await db.from('methods').upsert(methodRows);
    if (error) throw error;
  }
  await deleteMissing('methods', methodRows.map((r) => r.id));

  const sessionRows = data.sessions.map((s) => ({
    id: s.id,
    date: s.date,
    total_min: s.min,
    method: s.method,
    notes: s.notes,
    items: s.items,
  }));
  if (sessionRows.length) {
    const { error } = await db.from('sessions').upsert(sessionRows);
    if (error) throw error;
  }
  await deleteMissing('sessions', data.sessions.map((s) => s.id));

  const planRows = data.customPlans.map((p) => ({
    id: p.id,
    title: p.title,
    steps: p.steps,
    sector_id: null,
  }));
  if (planRows.length) {
    const { error } = await db.from('custom_plans').upsert(planRows);
    if (error) throw error;
  }
  await deleteMissing('custom_plans', data.customPlans.map((p) => p.id));

  const trashRows = data.trash.map((s) => ({ id: s.id, payload: s }));
  if (trashRows.length) {
    const { error } = await db.from('trash').upsert(trashRows);
    if (error) throw error;
  }
  await deleteMissing('trash', data.trash.map((s) => s.id));

  // Bundle settings and saved variants together in one row.
  const settingsBlob = {
    ...(data.settings ?? {}),
    setupVariants: data.setupVariants ?? [],
  };
  const { error: settingsErr } = await db
    .from('app_settings')
    .upsert({ user_id: userId, data: settingsBlob }, { onConflict: 'user_id' });
  if (settingsErr) throw settingsErr;
}

let _chain: Promise<void> = Promise.resolve();

export function pushAll(userId: string, data: CloudData): Promise<void> {
  _chain = _chain.catch(() => {}).then(() => pushAllInner(userId, data));
  return _chain;
}
