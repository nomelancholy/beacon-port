import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  primaryKey,
  pgPolicy,
  check,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

import { profilesWithRLS } from "../auth/schema";

// --- [ 헬퍼 함수 ] ---
const isOwner = (columnName: string = "user_id") =>
  sql`auth.uid() = ${sql.identifier(columnName)}`;

const canViewSharedData = (resumeIdColumn: string = "resume_id") =>
  sql`EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = ${sql.identifier(resumeIdColumn)} 
    AND (resumes.is_public = true OR resumes.user_id = auth.uid())
  )`;

const isResumeOwner = (resumeIdColumn: string = "resume_id") =>
  sql`EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = ${sql.identifier(resumeIdColumn)} 
    AND resumes.user_id = auth.uid()
  )`;

// --- [ Enums ] ---
export const englishLevelEnum = pgEnum("english_level", [
  "Native",
  "Advanced",
  "Intermediate",
  "Basic",
]);
// --- [ 2. Resumes ] ---
export const resumesWithRLS = pgTable(
  "resumes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => profilesWithRLS.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    name: text("name").notNull(),
    photo: text("photo"),
    role: text("role"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    blog: text("blog"),
    linkedin: text("linkedin"),
    instagram: text("instagram"),
    facebook: text("facebook"),
    github: text("github"),
    youtube: text("youtube"),
    x: text("x"),
    introduce: text("introduce"),
    englishLevel: englishLevelEnum("english_level"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("view_resumes", {
      for: "select",
      using: sql`is_public = true OR auth.uid() = user_id`,
    }),
    pgPolicy("manage_resumes", { for: "all", using: isOwner() }),
  ]
);

// --- [ 3. 하위 상세 정보 (Experiences, SideProjects 등) ] ---
const sharedSubTableConfig = (table: any) => [
  pgPolicy(`view_${table.tableName}`, {
    for: "select",
    using: canViewSharedData(),
  }),
  pgPolicy(`manage_${table.tableName}`, { for: "all", using: isResumeOwner() }),
];

export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeId: uuid("resume_id").references(() => resumesWithRLS.id, {
      onDelete: "cascade",
    }),
    company: text("company").notNull(),
    role: text("role"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    description: text("description"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => sharedSubTableConfig(table)
);

export const sideProjects = pgTable(
  "side_projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeId: uuid("resume_id").references(() => resumesWithRLS.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    link: text("link"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => sharedSubTableConfig(table)
);

export const educations = pgTable(
  "educations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeId: uuid("resume_id").references(() => resumesWithRLS.id, {
      onDelete: "cascade",
    }),
    institution: text("institution").notNull(),
    major: text("major"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    description: text("description"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => sharedSubTableConfig(table)
);

// --- [ 1. Certifications ] ---
export const certifications = pgTable(
  "certifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeId: uuid("resume_id").references(() => resumesWithRLS.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    issuer: text("issuer"),
    acquisitionDate: timestamp("acquisition_date"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => sharedSubTableConfig(table)
);

// --- [ 2. Language Tests ] ---
export const languageTests = pgTable(
  "language_tests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeId: uuid("resume_id").references(() => resumesWithRLS.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    score: text("score"),
    testDate: timestamp("test_date"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => sharedSubTableConfig(table)
);

// --- [ 3. ETCs ] ---
export const etcs = pgTable(
  "etcs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeId: uuid("resume_id").references(() => resumesWithRLS.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    link: text("link"),
    description: text("description"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => sharedSubTableConfig(table)
);
// --- [ 4. Skills & Aliases (소문자 제약 포함) ] ---
export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").unique().notNull(),
    is_verified: boolean("is_verified").notNull().default(false),
  },
  (table) => [
    check("skills_name_lowercase", sql`name = LOWER(name)`),
    pgPolicy("read_skills", { for: "select", using: sql`true` }),
    pgPolicy("insert_skills", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`true`,
    }),
  ]
);

export const skill_aliases = pgTable(
  "skill_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skill_id: uuid("skill_id").references(() => skills.id, {
      onDelete: "cascade",
    }),
    alias: text("alias").notNull().unique(),
  },
  (table) => [
    check("aliases_lowercase", sql`alias = LOWER(alias)`),
    pgPolicy("read_aliases", { for: "select", using: sql`true` }),
  ]
);

// --- [ 5. Mapping Tables ] ---
export const experienceSkills = pgTable(
  "experience_skills",
  {
    experienceId: uuid("experience_id").references(() => experiences.id, {
      onDelete: "cascade",
    }),
    skillId: uuid("skill_id").references(() => skills.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.experienceId, table.skillId] }),
    pgPolicy("manage_exp_skills", {
      for: "all",
      using: sql`EXISTS (
      SELECT 1 FROM experiences e 
      JOIN resumes r ON e.resume_id = r.id 
      WHERE e.id = experience_id AND r.user_id = auth.uid()
    )`,
    }),
  ]
);

export const sideProjectSkills = pgTable(
  "side_project_skills",
  {
    sideProjectId: uuid("side_project_id").references(() => sideProjects.id, {
      onDelete: "cascade",
    }),
    skillId: uuid("skill_id").references(() => skills.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.sideProjectId, table.skillId] }),
    pgPolicy("manage_proj_skills", {
      for: "all",
      using: sql`EXISTS (
      SELECT 1 FROM side_projects p 
      JOIN resumes r ON p.resume_id = r.id 
      WHERE p.id = side_project_id AND r.user_id = auth.uid()
    )`,
    }),
  ]
);
