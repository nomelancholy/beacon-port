import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

import { profiles } from "../auth/schema";

export const englishLevelEnum = pgEnum("english_level", [
  "Native",
  "Advanced",
  "Intermediate",
  "Basic",
]);

export const resumes = pgTable("resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  name: text("name").notNull(),
  role: text("role"),
  phone: text("phone"),
  email: text("email"),
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
});

export const experiences = pgTable("experiences", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "cascade",
  }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const sideProjects = pgTable("side_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const educations = pgTable("educations", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "cascade",
  }),
  institution: text("institution").notNull(),
  major: text("major"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const certifications = pgTable("certifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  acquisitionDate: timestamp("acquisition_date").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const languageTests = pgTable("language_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  score: text("score").notNull(),
  testDate: timestamp("test_date").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const etcs = pgTable("etcs", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  link: text("link"),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").unique().notNull(),
  is_verified: boolean("is_verified").notNull().default(false),
});

export const skill_aliases = pgTable("skill_aliases", {
  id: uuid("id").defaultRandom().primaryKey(),
  skill_id: uuid("skill_id").references(() => skills.id, {
    onDelete: "cascade",
  }),
  alias: text("alias").notNull().unique(),
});

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
  (table) => ({
    pk: primaryKey({ columns: [table.experienceId, table.skillId] }),
  })
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
  (table) => ({
    pk: primaryKey({ columns: [table.sideProjectId, table.skillId] }),
  })
);
