import {  
  pgTable, uuid, text, integer, jsonb, timestamp, vector, index, pgEnum
} from 'drizzle-orm/pg-core' 
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm'

// =======================================================
// --- ENUMS (Industry Standard for strict data typing) ---
// =======================================================
export const planEnum = pgEnum('plan_enum', ['hobby', 'pro', 'enterprise']);
export const actionTypeEnum = pgEnum('action_type_enum', ['refactor', 'agent']);

// =======================================================
// --- HELPER FOR TIMESTAMPS ---
// =======================================================
const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}

// =======================================================
// --- TABLES ---
// =======================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk User ID
  email: text('email').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: planEnum('plan').default('hobby').notNull(), // UPGRADED: Now strictly typed at the DB level
  ...timestamps,
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  stripeCustomerIdx: index('users_stripe_customer_idx').on(table.stripeCustomerId),
}))
  
export const repos = pgTable('repos', { 
  id: uuid('id').defaultRandom().primaryKey(), 
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), 
  repoUrl: text('repo_url').notNull(), 
  repoName: text('repo_name').notNull(), 
  owner: text('owner').notNull(), 
  description: text('description'), 
  language: text('language'), 
  isIndexed: integer('is_indexed').default(0), 
  totalFiles: integer('total_files').default(0), 
  isPrivate: integer('is_private').default(0), 
  ...timestamps, 
}, (table) => ({
  userIdIdx: index('repos_user_id_idx').on(table.userId),
})) 
  
export const chats = pgTable('chats', { 
  id: uuid('id').defaultRandom().primaryKey(), 
  repoId: uuid('repo_id')
    .notNull()
    .references(() => repos.id, { onDelete: 'cascade' }), 
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), 
  question: text('question').notNull(), 
  answer: text('answer').notNull(), 
  model: text('model').default('gpt-4o'),
  ...timestamps, 
}, (table) => ({
  repoIdIdx: index('chats_repo_id_idx').on(table.repoId),
  userIdIdx: index('chats_user_id_idx').on(table.userId),
})) 
  
export const reviews = pgTable('reviews', { 
  id: uuid('id').defaultRandom().primaryKey(), 
  repoId: uuid('repo_id')
    .notNull()
    .references(() => repos.id, { onDelete: 'cascade' }), 
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), 
  prUrl: text('pr_url'), 
  codeSnippet: text('code_snippet'), 
  reviewContent: text('review_content').notNull(), 
  ...timestamps, 
}, (table) => ({
  repoIdIdx: index('reviews_repo_id_idx').on(table.repoId),
})) 
  
export const healthReports = pgTable('health_reports', { 
  id: uuid('id').defaultRandom().primaryKey(), 
  repoId: uuid('repo_id')
    .notNull()
    .references(() => repos.id, { onDelete: 'cascade' }), 
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), 
  overallScore: integer('overall_score'), 
  complexityScore: integer('complexity_score'), 
  documentationScore: integer('documentation_score'), 
  duplicateScore: integer('duplicate_score'), 
  bugRiskScore: integer('bug_risk_score'), 
  suggestions: jsonb('suggestions'), 
  ...timestamps, 
}, (table) => ({
  repoIdIdx: index('health_reports_repo_id_idx').on(table.repoId),
})) 

export const embeddings = pgTable('embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  repoId: uuid('repo_id')
    .notNull()
    .references(() => repos.id, { onDelete: 'cascade' }),
  branch: text('branch').default('main').notNull(),
  filePath: text('file_path').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }),
  ...timestamps,
}, (table) => ({
  repoIdIdx: index('embeddings_repo_id_idx').on(table.repoId),
  filePathIdx: index('embeddings_file_path_idx').on(table.filePath),
  embeddingIndex: index('embedding_hnsw_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
}))

export const analytics = pgTable('analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: text('event_type').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), 
  ipAddress: text('ip_address'),
  metadata: jsonb('metadata'),
  ...timestamps,
}, (table) => ({
  userIdIdx: index('analytics_user_id_idx').on(table.userId),
  eventTypeIdx: index('analytics_event_type_idx').on(table.eventType),
}))

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  key: text("key").notNull().unique(), 
  name: text("name").default("VS Code Extension"),
  ...timestamps,
}, (table) => ({
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
}));

export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  actionType: actionTypeEnum('action_type').default('refactor').notNull(), // UPGRADED
  tokensUsed: integer('tokens_used').default(0),
  language: text('language'),
  ...timestamps,
}, (table) => ({
  userIdIdx: index('usage_logs_user_id_idx').on(table.userId),
}))

// =======================================================
// --- TYPE EXPORTS (UPGRADED: Use these in your UI/APIs) ---
// =======================================================
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Repo = InferSelectModel<typeof repos>;
export type NewRepo = InferInsertModel<typeof repos>;

export type Chat = InferSelectModel<typeof chats>;
export type HealthReport = InferSelectModel<typeof healthReports>;

// =======================================================
// --- RELATIONS ---
// =======================================================
export const usersRelations = relations(users, ({ many }) => ({
  repos: many(repos),
  apiKeys: many(apiKeys),
  chats: many(chats),
  usageLogs: many(usageLogs),
  analytics: many(analytics),
}))

export const reposRelations = relations(repos, ({ one, many }) => ({
  user: one(users, {
    fields: [repos.userId],
    references: [users.id],
  }),
  chats: many(chats),
  reviews: many(reviews),
  healthReports: many(healthReports),
  embeddings: many(embeddings),
}))

export const chatsRelations = relations(chats, ({ one }) => ({
  repo: one(repos, {
    fields: [chats.repoId],
    references: [repos.id],
  }),
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
}))

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  repo: one(repos, {
    fields: [embeddings.repoId],
    references: [repos.id],
  }),
}))

export const healthReportsRelations = relations(healthReports, ({ one }) => ({
  repo: one(repos, {
    fields: [healthReports.repoId],
    references: [repos.id],
  }),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  repo: one(repos, {
    fields: [reviews.repoId],
    references: [repos.id],
  }),
}))