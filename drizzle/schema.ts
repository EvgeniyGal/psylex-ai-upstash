import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string) {
    if (!value) return [];
    const trimmed = value.replace(/^\[/, "").replace(/\]$/, "");
    if (!trimmed) return [];
    return trimmed.split(",").map((part) => Number(part.trim()));
  },
});

export const userRole = pgEnum("user_role", [
  "admin",
  "mediator",
  "party_a",
  "party_b",
]);

export const preferredLocale = pgEnum("preferred_locale", ["en", "uk"]);

export const PARTY_ROLES = ["party_a", "party_b"] as const;

export const roomJurisdiction = pgEnum("room_jurisdiction", ["ukraine", "usa"]);

export const legalDocumentStatus = pgEnum("legal_document_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const legalDocumentCategory = pgEnum("legal_document_category", [
  "labor",
  "family",
  "contract",
  "property",
  "consumer",
  "corporate",
  "insurance",
  "odr_international",
]);

export const mediationPhase = pgEnum("mediation_phase", [
  "opening",
  "dialogue",
  "generating_options",
  "voting",
  "voting_discrepancy",
  "agreement",
  "completed",
]);

export const messageChannel = pgEnum("message_channel", ["shared", "private"]);

export const messageSenderType = pgEnum("message_sender_type", [
  "participant",
  "agent",
  "system",
]);

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  jurisdiction: roomJurisdiction("jurisdiction").notNull().default("ukraine"),
  usaSubJurisdiction: text("usa_sub_jurisdiction"),
  createdByUserId: uuid("created_by_user_id"),
  interestsAnalysis: jsonb("interests_analysis"),
  interestsAnalysisAt: timestamp("interests_analysis_at", { withTimezone: true }),
  legalAnalysis: jsonb("legal_analysis"),
  legalAnalysisAt: timestamp("legal_analysis_at", { withTimezone: true }),
  postIntakePipelineStartedAt: timestamp("post_intake_pipeline_started_at", { withTimezone: true }),
  postIntakePipelineCompletedAt: timestamp("post_intake_pipeline_completed_at", { withTimezone: true }),
  partyAMediationStartClickedAt: timestamp("party_a_mediation_start_clicked_at", { withTimezone: true }),
  partyBMediationStartClickedAt: timestamp("party_b_mediation_start_clicked_at", { withTimezone: true }),
  mediationStartedAt: timestamp("mediation_started_at", { withTimezone: true }),
  mediationDurationMinutes: integer("mediation_duration_minutes").notNull().default(60),
  mediationPhase: mediationPhase("mediation_phase"),
  mediationRound: integer("mediation_round").notNull().default(0),
  mediationActiveParty: text("mediation_active_party"),
  mediationTurnDeadlineAt: timestamp("mediation_turn_deadline_at", { withTimezone: true }),
  mediationTurnNudged: boolean("mediation_turn_nudged").notNull().default(false),
  partyAReadyForOptionsAt: timestamp("party_a_ready_for_options_at", { withTimezone: true }),
  partyBReadyForOptionsAt: timestamp("party_b_ready_for_options_at", { withTimezone: true }),
  mediationOptions: jsonb("mediation_options"),
  compromiseOption: jsonb("compromise_option"),
  partyAVoteOptionId: text("party_a_vote_option_id"),
  partyBVoteOptionId: text("party_b_vote_option_id"),
  partyACompromiseVote: boolean("party_a_compromise_vote"),
  partyBCompromiseVote: boolean("party_b_compromise_vote"),
  selectedOptionId: text("selected_option_id"),
  draftAgreement: jsonb("draft_agreement"),
  partyAAgreementAcceptedAt: timestamp("party_a_agreement_accepted_at", { withTimezone: true }),
  partyBAgreementAcceptedAt: timestamp("party_b_agreement_accepted_at", { withTimezone: true }),
  agreementFinalizedAt: timestamp("agreement_finalized_at", { withTimezone: true }),
  mediationCompletedAt: timestamp("mediation_completed_at", { withTimezone: true }),
  /** Mode B (mediator-facilitated) fields — unused when createdByUserId is null. */
  scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
  mediatorMediationStartClickedAt: timestamp("mediator_mediation_start_clicked_at", {
    withTimezone: true,
  }),
  mediatorSessionStartedAt: timestamp("mediator_session_started_at", { withTimezone: true }),
  mediatorQuestionCandidates: jsonb("mediator_question_candidates"),
  mediatorCompromiseDraft: jsonb("mediator_compromise_draft"),
  partyNotification: jsonb("party_notification"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  login: text("login").notNull().unique(),
  password: text("password").notNull(),
  role: userRole("role").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  welcomeSeenAt: timestamp("welcome_seen_at", { withTimezone: true }),
  disclaimerAcceptedAt: timestamp("disclaimer_accepted_at", { withTimezone: true }),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  personalBotPrompt: text("personal_bot_prompt"),
  personalBotReadyAt: timestamp("personal_bot_ready_at", { withTimezone: true }),
  disputeDescription: text("dispute_description"),
  disputePriority: text("dispute_priority"),
  disputeAcceptableOutcome: text("dispute_acceptable_outcome"),
  disputeIntakeSubmittedAt: timestamp("dispute_intake_submitted_at", { withTimezone: true }),
  psychodynamicProfile: jsonb("psychodynamic_profile"),
  psychodynamicProfileAt: timestamp("psychodynamic_profile_at", { withTimezone: true }),
  emotionalTriggers: jsonb("emotional_triggers"),
  emotionalTriggersAt: timestamp("emotional_triggers_at", { withTimezone: true }),
  preferredLocale: preferredLocale("preferred_locale").notNull().default("en"),
});

export const userTestCompletions = pgTable(
  "user_test_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    testKey: text("test_key").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("user_test_completions_user_test_unique").on(table.userId, table.testKey)],
);

export const magicTokens = pgTable("magic_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const roomsRelations = relations(rooms, ({ many }) => ({
  participants: many(users),
  messages: many(roomMessages),
  filingReceipts: many(mediationFilingReceipts),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  room: one(rooms, {
    fields: [users.roomId],
    references: [rooms.id],
  }),
  magicTokens: many(magicTokens),
  testCompletions: many(userTestCompletions),
}));

export const userTestCompletionsRelations = relations(userTestCompletions, ({ one }) => ({
  user: one(users, {
    fields: [userTestCompletions.userId],
    references: [users.id],
  }),
}));

export const magicTokensRelations = relations(magicTokens, ({ one }) => ({
  user: one(users, {
    fields: [magicTokens.userId],
    references: [users.id],
  }),
}));

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  openaiApiKey: text("openai_api_key").notNull().default(""),
  airtableApiKey: text("airtable_api_key").notNull().default(""),
  testPersonalityTypeUrl: text("test_personality_type_url").notNull().default(""),
  testFaceFearUrl: text("test_face_fear_url").notNull().default(""),
  testCharacterTraitsUrl: text("test_character_traits_url").notNull().default(""),
  testPersonalityConflictsUrl: text("test_personality_conflicts_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const legalDocuments = pgTable("legal_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  sourceUrl: text("source_url").notNull(),
  jurisdiction: roomJurisdiction("jurisdiction").notNull(),
  usaSubJurisdiction: text("usa_sub_jurisdiction"),
  category: legalDocumentCategory("category").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileData: bytea("file_data").notNull(),
  status: legalDocumentStatus("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => legalDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count").notNull(),
    pageNumber: integer("page_number"),
    metadata: jsonb("metadata"),
    embedding: vector1536("embedding"),
  },
  (table) => [unique("document_chunks_document_chunk_unique").on(table.documentId, table.chunkIndex)],
);

export const legalDocumentsRelations = relations(legalDocuments, ({ many, one }) => ({
  chunks: many(documentChunks),
  uploadedBy: one(users, {
    fields: [legalDocuments.uploadedByUserId],
    references: [users.id],
  }),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(legalDocuments, {
    fields: [documentChunks.documentId],
    references: [legalDocuments.id],
  }),
}));

export const agentPrompts = pgTable("agent_prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentKey: text("agent_key").notNull().unique(),
  systemPrompt: text("system_prompt").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pipelineEventLogs = pgTable("pipeline_event_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  agentKey: text("agent_key"),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pipelineEventLogsRelations = relations(pipelineEventLogs, ({ one }) => ({
  room: one(rooms, {
    fields: [pipelineEventLogs.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [pipelineEventLogs.userId],
    references: [users.id],
  }),
}));

export const roomMessages = pgTable("room_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  channel: messageChannel("channel").notNull().default("shared"),
  participantUserId: uuid("participant_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  senderType: messageSenderType("sender_type").notNull(),
  senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  canonicalContent: text("canonical_content"),
  adaptations: jsonb("adaptations"),
  messageKind: text("message_kind"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const roomMessagesRelations = relations(roomMessages, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMessages.roomId],
    references: [rooms.id],
  }),
  participant: one(users, {
    fields: [roomMessages.participantUserId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [roomMessages.senderUserId],
    references: [users.id],
  }),
}));

export const mediationFilingReceipts = pgTable("mediation_filing_receipts", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  selectedOptionId: text("selected_option_id").notNull(),
  documentVersion: text("document_version").notNull(),
  contentHash: text("content_hash").notNull(),
  partyAAcceptedAt: timestamp("party_a_accepted_at", { withTimezone: true }).notNull(),
  partyBAcceptedAt: timestamp("party_b_accepted_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mediationFilingReceiptsRelations = relations(mediationFilingReceipts, ({ one }) => ({
  room: one(rooms, {
    fields: [mediationFilingReceipts.roomId],
    references: [rooms.id],
  }),
}));

export const helpDocumentSlug = pgEnum("help_document_slug", [
  "overview",
  "parties",
  "mediator",
  "admin",
]);

export const helpDocuments = pgTable(
  "help_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: helpDocumentSlug("slug").notNull(),
    locale: preferredLocale("locale").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("help_documents_slug_locale_unique").on(table.slug, table.locale)],
);
