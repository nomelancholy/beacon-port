// Optional real PostgreSQL engine: PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node tests/resume-transaction.integration.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const root = new URL('../', import.meta.url);
const sql = async path => db.exec(await readFile(new URL(path, root), 'utf8'));
try {
  await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb, raw_app_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;`);
  // Follow the journal, excluding the untracked supplemental ALTER TABLE files.
  for (const file of ['0000_mysterious_nuke', '0001_curious_archangel', '0002_ancient_moira_mactaggert',
    '0003_spotty_taskmaster', '0004_tiny_mystique', '0005_quick_whizzer', '0006_big_jubilee',
    '0007_grey_mesmero', '0008_futuristic_namora', '0009_mysterious_trauma', '0010_broad_eternals', '0011_familiar_baron_zemo', '0012_square_wraith']) {
    await sql(`app/sql/migrations/${file}.sql`);
  }
  await sql('supabase/save_resume.sql');
  await sql('app/sql/triggers/user_to_profile_trigger.sql');
  const owner = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  await db.exec(`INSERT INTO auth.users(id, email, raw_user_meta_data, raw_app_meta_data) VALUES
      ('${owner}','owner@example.test','{"full_name":"Google User"}','{"provider":"google"}'),
      ('${other}','other@example.test','{"user_name":"GitHub User"}','{"provider":"github"}');
    INSERT INTO public.profiles(id,email,nickname,provider) VALUES
      ('${owner}','owner@example.test','owner','email'), ('${other}','other@example.test','other','email') ON CONFLICT (id) DO NOTHING;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    SET ROLE authenticated;`);
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [owner]);
  const profiles = (await db.query('SELECT nickname, provider FROM public.profiles ORDER BY id')).rows;
  assert.deepEqual(profiles.map(p => p.provider), ['google', 'github']);
  assert.deepEqual(profiles.map(p => p.nickname), ['Google User', 'GitHub User']);
  console.log('PASS Google and GitHub signups automatically create profiles');
  const payload = {
    resume: { title: 'Original', name: 'Owner' },
    experiences: [{ company: 'Company', start_date: '2025-01', skills: ['react', 'typescript'] }],
    side_projects: [{ name: 'Project', skills: ['react'] }], educations: [{ institution: 'School' }],
    certifications: [{ name: 'Certificate' }], language_tests: [{ name: 'Exam' }], etcs: [{ name: 'Activity' }],
  };
  const save = async (id, body) => (await db.query('SELECT public.save_resume($1::uuid, $2::jsonb) AS id', [id, JSON.stringify(body)])).rows[0].id;
  const id = await save(null, payload);
  assert.ok(id);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.experience_skills')).rows[0].n, 2);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.language_tests')).rows[0].n, 1);
  console.log('PASS create all six categories and skill mappings');

  await db.query('UPDATE public.resumes SET is_public = true WHERE id = $1', [id]);
  const snapshot = async () => JSON.stringify((await db.query(`SELECT
    (SELECT jsonb_agg(to_jsonb(r)) FROM public.resumes r) AS resumes,
    (SELECT jsonb_agg(to_jsonb(e)) FROM public.experiences e) AS experiences,
    (SELECT jsonb_agg(to_jsonb(e)) FROM public.etcs e) AS etcs,
    (SELECT jsonb_agg(to_jsonb(s)) FROM public.skills s) AS skills,
    (SELECT jsonb_agg(to_jsonb(s)) FROM public.experience_skills s) AS mappings`)).rows);
  const before = await snapshot();
  const invalid = structuredClone(payload);
  invalid.resume.title = 'Must roll back';
  invalid.experiences[0].skills = ['new-skill-must-roll-back'];
  invalid.etcs = [{ name: '' }];
  await assert.rejects(save(id, invalid));
  assert.equal(await snapshot(), before);
  console.log('PASS late failure rolls back parent, deleted rows, new skills and mappings');

  const count = (await db.query('SELECT count(*)::int AS n FROM public.resumes')).rows[0].n;
  await assert.rejects(save(null, invalid));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.resumes')).rows[0].n, count);
  console.log('PASS failed creation leaves no partial resume');

  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [other]);
  await assert.rejects(save(id, payload));
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [owner]);
  assert.equal(await snapshot(), before);
  console.log('PASS another user cannot change a public resume');

  const updated = structuredClone(payload);
  updated.resume.title = 'Updated';
  updated.experiences = [{ company: 'Second', skills: ['react'] }, { company: 'First', skills: [] }];
  await save(id, updated);
  const rows = (await db.query('SELECT company, display_order FROM public.experiences ORDER BY display_order')).rows;
  assert.deepEqual(rows.map(r => r.company), ['Second', 'First']);
  assert.equal((await db.query('SELECT is_public FROM public.resumes WHERE id = $1', [id])).rows[0].is_public, true);
  console.log('PASS update preserves public status and submitted order');

  await db.exec('RESET ROLE; SET ROLE anon;');
  await assert.rejects(save(id, payload));
  console.log('PASS anonymous callers cannot execute save_resume');
} catch (error) {
  console.error(error.message, error.code || ""); process.exitCode = 1;
} finally { await db.close(); }
