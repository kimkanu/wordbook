import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const wordStatusEnum = pgEnum("word_status", [
  "learning",
  "reviewing",
  "mastered",
]);

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  definition: text("definition"),
  pronunciation: text("pronunciation"),
  exampleSentence: text("example_sentence"),
  status: wordStatusEnum("status").default("learning").notNull(),
  articleId: integer("article_id").references(() => articles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const wordTags = pgTable("word_tags", {
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
