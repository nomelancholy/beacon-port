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
  // Supabase-owned schemas are stubbed locally; app schema, grants and policies
  // come exclusively from the exact bootstrap SQL delivered to the user.
  await db.exec(`CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
    $$ SELECT (string_to_array($1, '/'))[1:greatest(array_length(string_to_array($1, '/'), 1)-1, 0)] $$;
    GRANT USAGE ON SCHEMA storage TO anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;`);
  const bootstrap = await readFile(new URL('supabase/bootstrap.sql', root), 'utf8');
  assert.ok(bootstrap.includes(await readFile(new URL('supabase/save_resume.sql', root), 'utf8')));
  assert.ok(bootstrap.includes(await readFile(new URL('app/sql/triggers/user_to_profile_trigger.sql', root), 'utf8')));
  const existing = '33333333-3333-4333-8333-333333333333';
  await db.query(`INSERT INTO auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
    VALUES ($1,'existing@example.test','{"full_name":"Existing Google User"}','{"provider":"google"}')`, [existing]);
  await sql('supabase/bootstrap.sql');
  assert.equal((await db.query('SELECT nickname FROM public.profiles WHERE id=$1', [existing])).rows[0].nickname, 'Existing Google User');
  await db.query("UPDATE public.profiles SET nickname='Custom name' WHERE id=$1", [existing]);
  await sql('supabase/bootstrap.sql');
  assert.equal((await db.query('SELECT nickname FROM public.profiles WHERE id=$1', [existing])).rows[0].nickname, 'Custom name');
  await db.query('DELETE FROM auth.users WHERE id=$1', [existing]);
  console.log('PASS fresh bootstrap and repeat execution');
  const owner = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  await db.exec(`INSERT INTO auth.users(id, email, raw_user_meta_data, raw_app_meta_data) VALUES
      ('${owner}','owner@example.test','{"full_name":"Google User"}','{"provider":"google"}'),
      ('${other}','other@example.test','{"user_name":"GitHub User"}','{"provider":"github"}');
    INSERT INTO public.profiles(id,email,nickname,provider) VALUES
      ('${owner}','owner@example.test','owner','email'), ('${other}','other@example.test','other','email') ON CONFLICT (id) DO NOTHING;
`);
  const profiles = (await db.query('SELECT nickname, provider FROM public.profiles ORDER BY id')).rows;
  assert.deepEqual(profiles.map(p => p.provider), ['google', 'github']);
  assert.deepEqual(profiles.map(p => p.nickname), ['Google User', 'GitHub User']);
  console.log('PASS Google and GitHub signups automatically create profiles');
  await db.exec('SET ROLE authenticated');
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [owner]);
  assert.equal((await db.query('SELECT id FROM public.profiles')).rows.length, 1);
  await assert.rejects(db.query("UPDATE public.profiles SET email = 'other@example.test' WHERE id = $1", [owner]));
  console.log('PASS profile privacy and protected email column');
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

  await db.exec("RESET ROLE; SET ROLE anon; SELECT set_config('request.jwt.claim.sub', '', false)");
  assert.equal((await db.query('SELECT id FROM public.resumes')).rows.length, 0);
  assert.equal((await db.query('SELECT id FROM public.experiences')).rows.length, 0);
  await db.exec('RESET ROLE; SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [owner]);
  await db.query('UPDATE public.resumes SET is_public = true WHERE id = $1', [id]);
  await db.exec("RESET ROLE; SET ROLE anon; SELECT set_config('request.jwt.claim.sub', '', false)");
  assert.equal((await db.query('SELECT id FROM public.resumes')).rows.length, 1);
  assert.equal((await db.query('SELECT id FROM public.experiences')).rows.length, 1);
  await db.exec('RESET ROLE; SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [owner]);
  console.log('PASS private details stay hidden and public details are readable');
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

  await db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)', ['photos', `${owner}/profile.png`]);
  await assert.rejects(db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)', ['photos', `${other}/profile.png`]));
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [other]);
  assert.equal((await db.query('DELETE FROM storage.objects RETURNING id')).rows.length, 0);
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [owner]);
  assert.equal((await db.query('DELETE FROM storage.objects RETURNING id')).rows.length, 1);
  console.log('PASS photo upload and deletion are limited to the owner folder');

  await db.exec('RESET ROLE; SET ROLE anon;');
  await assert.rejects(save(id, payload));
  console.log('PASS anonymous callers cannot execute save_resume');
} catch (error) {
  console.error(error.message, error.code || ""); process.exitCode = 1;
} finally { await db.close(); }
