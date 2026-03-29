import {  
  pgTable, uuid, text, integer, jsonb, timestamp, vector
} from 'drizzle-orm/pg-core' 

// --- NEW: Users table to track billing plans ---
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk User ID
  email: text('email').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: text('plan').default('hobby').notNull(), // 'hobby', 'pro', 'enterprise'
  createdAt: timestamp('created_at').defaultNow(),
})
  
export const repos = pgTable('repos', { 
  id: uuid('id').defaultRandom().primaryKey(), 
  userId: text('user_id').notNull(), 
  repoUrl: text('repo_url').notNull(), 
  repoName: text('repo_name').notNull(), 
  owner: text('owner').notNull(), 
  description: text('description'), 
  language: text('language'), 
  isIndexed: integer('is_indexed').default(0), 
  totalFiles: integer('total_files').default(0), 
  isPrivate: integer('is_private').default(0), // NEW: Track if repo is private
  createdAt: timestamp('created_at').defaultNow(), 
}) 
  
export const chats = pgTable('chats', { 
  id: uuid('id').defaultRandom().primaryKey(), 
  repoId: uuid('repo_id').notNull(), 
  userId: text('user_id').notNull(), 
  question: text('question').notNull(), 
  answer: text('answer').notNull(), 
  model: text('model').default('gpt-4o'),
  createdAt: timestamp('created_at').defaultNow(), 
}) 
  
export const reviews = pgTable('reviews', { 
  id: uuid('id').defaultRandom().primaryKey(), 
  repoId: uuid('repo_id').notNull(), 
  userId: text('user_id').notNull(), 
  prUrl: text('pr_url'), 
  codeSnippet: text('code_snippet'), 
  reviewContent: text('review_content').notNull(), 
  createdAt: timestamp('created_at').defaultNow(), 
}) 
  
export const healthReports = pgTable('health_reports', { 
  id: uuid('id').defaultRandom().primaryKey(), 
  repoId: uuid('repo_id').notNull(), 
  userId: text('user_id').notNull(), 
  overallScore: integer('overall_score'), 
  complexityScore: integer('complexity_score'), 
  documentationScore: integer('documentation_score'), 
  duplicateScore: integer('duplicate_score'), 
  bugRiskScore: integer('bug_risk_score'), 
  suggestions: jsonb('suggestions'), 
  createdAt: timestamp('created_at').defaultNow(), 
}) 

export const embeddings = pgTable('embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  repoId: uuid('repo_id').notNull(),
  filePath: text('file_path').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }),
  createdAt: timestamp('created_at').defaultNow(),
})

export const analytics = pgTable('analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: text('event_type').notNull(),
  userId: text('user_id'),
  ipAddress: text('ip_address'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Links to Clerk userId
  key: text("key").notNull().unique(), // The actual secret key
  name: text("name").default("VS Code Extension"),
  createdAt: timestamp("created_at").defaultNow(),
});