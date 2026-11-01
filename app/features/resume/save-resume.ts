import { z } from "zod";

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "날짜는 YYYY-MM 형식이어야 합니다");
const nullableMonth = month.nullable();
const dates = { start_date: nullableMonth, end_date: nullableMonth };
const rangeIsValid = (row: { start_date: string | null; end_date: string | null }) =>
  !row.start_date || !row.end_date || row.start_date <= row.end_date;
const required = z.string().trim().min(1, "필수 입력 항목을 확인해주세요");
const optional = z.string().nullable();
const skills = z.array(z.string().min(1));

const resumeSchema = z.object({
  resume: z.object({
    title: required, name: required, photo: optional, role: optional,
    phone: optional, email: z.email("이메일 형식을 확인해주세요").nullable(),
    address: optional, blog: optional, linkedin: optional, instagram: optional,
    facebook: optional, github: optional, youtube: optional, x: optional,
    introduce: optional,
    english_level: z.enum(["Native", "Advanced", "Intermediate", "Basic"]).nullable(),
    skill_stack_selected: z.string().nullable(),
  }),
  experiences: z.array(z.object({ company: required, role: optional, ...dates, description: optional, skills })
    .refine(rangeIsValid, "경력 종료일이 시작일보다 빠릅니다")),
  side_projects: z.array(z.object({ name: required, ...dates, description: optional, link: optional, skills })
    .refine(rangeIsValid, "프로젝트 종료일이 시작일보다 빠릅니다")),
  educations: z.array(z.object({ institution: required, major: optional, ...dates, description: optional })
    .refine(rangeIsValid, "교육 종료일이 시작일보다 빠릅니다")),
  certifications: z.array(z.object({ name: required, issuer: optional, acquisition_date: nullableMonth })),
  language_tests: z.array(z.object({ name: required, score: optional, test_date: nullableMonth })),
  etcs: z.array(z.object({ name: required, link: optional, description: optional })),
});

export type ResumePayload = z.infer<typeof resumeSchema>;

export function parseResumeForm(form: FormData):
  | { success: true; data: ResumePayload }
  | { success: false; error: string } {
  try {
    const text = (key: string): string | null => {
      const value = form.get(key);
      if (value !== null && typeof value !== "string") throw new Error("잘못된 입력 형식입니다");
      return value?.trim() || null;
    };
    const list = (category: string) => {
      const prefix = `${category}_`;
      const found = [...new Set([...form.keys()].filter(key => key.startsWith(prefix))
        .map(key => key.slice(0, key.indexOf("_", prefix.length))))];
      const order = text(`_order_${category}`);
      if (!order) return found;
      const parsed = z.array(z.string()).parse(JSON.parse(order));
      // A stale/incomplete order must never silently drop submitted entries.
      if (new Set(parsed).size !== parsed.length || parsed.length !== found.length ||
          parsed.some(id => !found.includes(id))) {
        throw new Error(`${category}: 항목 순서가 올바르지 않습니다. 다시 시도해주세요`);
      }
      return parsed;
    };
    const fields = (id: string, mapping: Record<string, string>) =>
      Object.fromEntries(Object.entries(mapping).map(([column, label]) => [column, text(`${id}_${label}`)]));
    const skillNames = (key: string) => [...new Set((text(key) || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean))];
    const selected = text("skill_stack_selected");
    const selectedSkills = selected === null ? null : JSON.stringify(z.array(z.string()).parse(JSON.parse(selected)));
    const result = resumeSchema.safeParse({
      resume: { title: text("title"), name: text("이름"), photo: text("사진"),
        role: text("Role"), phone: text("전화번호"), email: text("이메일"), address: text("주소"),
        blog: text("블로그"), linkedin: text("LinkedIn"), instagram: text("Instagram"),
        facebook: text("Facebook"), github: text("Github"), youtube: text("Youtube"),
        x: text("X"), introduce: text("Introduce"), english_level: text("영어 구사 능력"),
        skill_stack_selected: selectedSkills },
      experiences: list("Experience").map(id => ({ ...fields(id, { company: "회사명", role: "Role", start_date: "시작일", end_date: "종료일", description: "작업내용" }), skills: skillNames(`${id}_스킬`) })),
      side_projects: list("Side Project").map(id => ({ ...fields(id, { name: "프로젝트명", start_date: "시작일", end_date: "종료일", description: "주요작업", link: "링크" }), skills: skillNames(`${id}_기술스택`) })),
      educations: list("Education").map(id => fields(id, { institution: "기관명", major: "전공", start_date: "시작일", end_date: "종료일", description: "내용" })),
      certifications: list("자격증").map(id => fields(id, { name: "자격증명", issuer: "발급기관", acquisition_date: "취득일" })),
      language_tests: list("어학성적").map(id => fields(id, { name: "시험명", score: "점수", test_date: "응시일자" })),
      etcs: list("그 외 활동").map(id => fields(id, { name: "활동명", link: "링크", description: "내용" })),
    });
    if (!result.success) return { success: false, error: result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("\n") };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error instanceof z.ZodError || error instanceof SyntaxError
      ? "항목 순서 또는 스킬 선택 정보가 올바르지 않습니다"
      : error instanceof Error ? error.message : "입력값을 확인해주세요" };
  }
}
