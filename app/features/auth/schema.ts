import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgSchema,
  pgPolicy,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

const isOwner = (columnName: string = "user_id") =>
  sql`auth.uid() = ${sql.identifier(columnName)}`;

const users = pgSchema("auth").table("users", {
  id: uuid().primaryKey(),
});

// --- [ 1. Profiles ] ---
export const profilesWithRLS = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    nickname: text("nickname").notNull(),
    provider: text("provider").notNull(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("profiles_public_read", { for: "select", using: sql`true` }),
    pgPolicy("profiles_owner_update", { for: "update", using: isOwner("id") }),
  ]
);
