import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { parseResumeForm } from "../app/features/resume/save-resume";
import { saveResume } from "../app/features/resume/save-resume.server";

function form() {
  const result = new FormData();
  result.set("title", "개발자 이력서"); result.set("이름", "홍길동");
  return result;
}
function payload() {
  const parsed = parseResumeForm(form());
  if (!parsed.success) throw new Error(parsed.error);
  return parsed.data;
}

test("all six detail categories keep their order and optional fields", () => {
  const input = form();
  for (const [category, label] of [["Experience", "회사명"], ["Side Project", "프로젝트명"],
    ["Education", "기관명"], ["자격증", "자격증명"], ["어학성적", "시험명"], ["그 외 활동", "활동명"]]) {
    input.set(`${category}_a_${label}`, "first"); input.set(`${category}_b_${label}`, "second");
    input.set(`_order_${category}`, JSON.stringify([`${category}_b`, `${category}_a`]));
  }
  input.set("Experience_b_스킬", "React, react, TypeScript");
  const parsed = parseResumeForm(input);
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.experiences[0].company, "second");
  assert.deepEqual(parsed.data.experiences[0].skills, ["react", "typescript"]);
  for (const rows of [parsed.data.side_projects, parsed.data.certifications, parsed.data.language_tests, parsed.data.etcs]) {
    assert.equal(rows[0].name, "second");
  }
  assert.equal(parsed.data.educations[0].institution, "second");
  assert.equal(parsed.data.language_tests[0].score, null);
});

test("invalid required fields, date ranges and metadata are rejected", () => {
  const cases: Array<Record<string, string>> = [
    { title: " " }, { 이름: " " }, { 이메일: "bad-email" },
    { Experience_a_회사명: " " },
    { Experience_a_회사명: "A", Experience_a_시작일: "2026-13" },
    { Experience_a_회사명: "A", Experience_a_시작일: "2026-06", Experience_a_종료일: "2026-01" },
    { "_order_Experience": "{" }, { "_order_Experience": '["Experience_missing"]' },
    { Experience_a_회사명: "A", "_order_Experience": "[]" },
    { Experience_a_회사명: "A", "_order_Experience": '["Experience_a","Experience_a"]' },
    { skill_stack_selected: "{}" }, { skill_stack_selected: "{" },
  ];
  for (const values of cases) {
    const input = form();
    for (const [key, value] of Object.entries(values)) input.set(key, value);
    assert.equal(parseResumeForm(input).success, false, JSON.stringify(values));
  }
});

function client(options: { error?: { code: string }; owner?: string; lostResponse?: boolean } = {}) {
  const calls: string[] = [];
  const storage = {
    upload: async () => { calls.push("upload"); return { error: null }; },
    getPublicUrl: () => ({ data: { publicUrl: "https://example.test/photo.png" } }),
    remove: async () => { calls.push("remove"); return { error: null }; },
  };
  return { calls, supabase: {
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { user_id: options.owner }, error: null }) }) }) }),
    storage: { from: () => storage },
    rpc: async () => {
      calls.push("rpc");
      if (options.lostResponse) throw new Error("Network disconnected");
      return { data: options.error ? null : "saved-id", error: options.error || null };
    },
  } as unknown as SupabaseClient<Database> };
}

test("success uses exactly one RPC", async () => {
  const fake = client();
  assert.deepEqual(await saveResume(fake.supabase, "owner", null, payload()), { success: true, resumeId: "saved-id" });
  assert.deepEqual(fake.calls, ["rpc"]);
});

test("ownership is checked before a photo upload or RPC", async () => {
  const fake = client({ owner: "someone-else" });
  const input = payload(); input.resume.photo = "data:image/png;base64,YQ==";
  assert.equal((await saveResume(fake.supabase, "owner", "existing", input)).success, false);
  assert.deepEqual(fake.calls, []);
});

test("database failure returns an error and cleans up only the new upload", async () => {
  const fake = client({ error: { code: "23514" } });
  const input = payload(); input.resume.photo = "data:image/png;base64,YQ==";
  assert.equal((await saveResume(fake.supabase, "owner", null, input)).success, false);
  assert.deepEqual(fake.calls, ["upload", "rpc", "remove"]);
  assert.equal(input.resume.photo, "data:image/png;base64,YQ==");
});

test("an uncertain network result cannot delete a potentially committed photo", async () => {
  const fake = client({ lostResponse: true });
  const input = payload(); input.resume.photo = "data:image/png;base64,YQ==";
  assert.equal((await saveResume(fake.supabase, "owner", null, input)).success, false);
  assert.deepEqual(fake.calls, ["upload", "rpc"]);
});

test("unsupported photos are rejected without writes", async () => {
  for (const photo of ["data:image/svg+xml;base64,YQ==", "javascript:alert(1)"]) {
    const fake = client(); const input = payload(); input.resume.photo = photo;
    assert.equal((await saveResume(fake.supabase, "owner", null, input)).success, false);
    assert.deepEqual(fake.calls, []);
  }
});
