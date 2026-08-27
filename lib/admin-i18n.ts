import type { Locale } from "@/lib/i18n";

export type AdminCopy = {
  adminConsole: string;
  mediatorConsole: string;
  navRooms: string;
  navCalendar: string;
  navMediators: string;
  navSettings: string;
  logout: string;
  portalTitle: string;
  searchPlaceholder: string;
  roomsTitle: string;
  roomsSubtitle: string;
  newRoom: string;
  createRoom: string;
  cancel: string;
  close: string;
  jurisdictionFieldHelp: string;
  jurisdictionLabel: string;
  jurisdictionUkraineDesc: string;
  jurisdictionUsaDesc: string;
  roomUsaSubJurisdiction: string;
  roomUsaSubJurisdictionHelp: string;
  deleteRoom: string;
  deleteRoomConfirm: string;
  returnToRooms: string;
  createRoomSubtitle: string;
  roomDetails: string;
  participants: string;
  roomTitleLabel: string;
  roomDescriptionLabel: string;
  partyATitleLabel: string;
  partyADescriptionLabel: string;
  partyBTitleLabel: string;
  partyBDescriptionLabel: string;
  titleLabel: string;
  descriptionLabel: string;
  noRooms: string;
  noAdminRooms: string;
  noMediatorRooms: string;
  noSearchResults: string;
  tabAdminRooms: string;
  tabMediatorRooms: string;
  unknownMediator: string;
  tableCreatedAt: string;
  tableSides: string;
  tableStatus: string;
  active: string;
  save: string;
  saveParticipant: string;
  saveChanges: string;
  roleLabel: string;
  loginLabel: string;
  passwordLabel: string;
  copyCredentials: string;
  magicLink: string;
  magicLinkCopied: string;
  magicLinkFailed: string;
  mediatorsTitle: string;
  mediatorsSubtitle: string;
  createMediator: string;
  addMediator: string;
  mediatorTitleLabel: string;
  returnToMediators: string;
  createMediatorSubtitle: string;
  mediatorDetails: string;
  deleteMediator: string;
  deleteMediatorConfirm: string;
  selectRoom: string;
  mediatorTitlePlaceholder: string;
  mediatorDescPlaceholder: string;
  noMediators: string;
  saveMediator: string;
  tableActions: string;
  openCard: string;
  tableRowsPerPage: string;
  tablePageOf: string;
  tablePreviousPage: string;
  tableNextPage: string;
  settingsTitle: string;
  settingsSubtitle: string;
  tabCredentials: string;
  tabTests: string;
  credentialsSubtitle: string;
  testsSubtitle: string;
  openaiApiKeyLabel: string;
  airtableApiKeyLabel: string;
  showApiKey: string;
  hideApiKey: string;
  testUrlLabel: string;
  testPersonalityType: string;
  testFaceFear: string;
  testCharacterTraits: string;
  testPersonalityConflicts: string;
  settingsSaved: string;
  tabPrompts: string;
  tabRag: string;
  ragSubtitle: string;
  ragUploadDocument: string;
  ragDocumentName: string;
  ragSourceUrl: string;
  ragCategory: string;
  ragCategoryFilter: string;
  ragAllCategories: string;
  ragJurisdictionUkraine: string;
  ragJurisdictionUsa: string;
  ragUsaSubJurisdiction: string;
  ragUsaSubJurisdictionFilter: string;
  ragAllUsaSubJurisdictions: string;
  ragUsaSubJurisdictionHint: string;
  ragUpload: string;
  ragUploading: string;
  ragUploadingHint: string;
  ragEditDocument: string;
  ragDeleteDocument: string;
  ragDeleteConfirm: string;
  ragReprocess: string;
  ragStatusPending: string;
  ragStatusProcessing: string;
  ragStatusReady: string;
  ragStatusFailed: string;
  ragNoDocuments: string;
  ragTestInquiry: string;
  ragTestQuestion: string;
  ragTestSubmit: string;
  ragTestSelectDocument: string;
  ragTestAllDocuments: string;
  ragTestPreparedQueries: string;
  ragDocumentUploaded: string;
  ragDocumentUpdated: string;
  ragDocumentDeleted: string;
  ragProcessingIncomplete: string;
  ragFileLabel: string;
  ragFileInputAriaLabel: string;
  ragChooseFile: string;
  ragNoFileChosen: string;
  promptsComingSoonDesc: string;
  agentPromptsSubtitle: string;
  agentTabPsychodynamic: string;
  agentTabInterests: string;
  agentTabEmotionalTriggers: string;
  agentTabLegalAnalysis: string;
  agentTabMediation: string;
  agentSystemPrompt: string;
  agentTestPanel: string;
  agentTestSelectUser: string;
  agentTestSelectRoom: string;
  agentTestRun: string;
  agentTestInput: string;
  agentTestResult: string;
  agentTestPersonalBotPrompt: string;
  agentTestDisputeAnswers: string;
  agentTestJurisdiction: string;
  agentTestResponseLocale: string;
  agentLegalNotFoundTitle: string;
  agentPromptSaved: string;
  mediationStatusTitle: string;
  mediationPhaseLabel: string;
  mediationRoundLabel: string;
  mediationNotStarted: string;
  mediationSelectedOption: string;
  mediationCompletedAt: string;
  pipelineLogTitle: string;
  mediationDetailsButton: string;
  mediationDetailsTitle: string;
  mediationDetailsMessagesTitle: string;
  mediationDetailsNoMessages: string;
  mediationDetailsOptionsTitle: string;
  mediationDetailsNoVote: string;
  mediationDetailsAgreementTitle: string;
  mediationDetailsAgreementPending: string;
  mediationDetailsCompromiseVote: string;
  mediationDetailsAccepted: string;
  mediationDetailsRejected: string;
  mediationDetailsActionFailed: string;
  activityLogEmpty: string;
  scheduleSectionTitle: string;
  scheduleSessionComplete: string;
  scheduleDateTimeLabel: string;
  scheduleDateLabel: string;
  scheduleHourLabel: string;
  scheduleMinutesLabel: string;
  scheduleDurationLabel: string;
  scheduleDurationOption: (minutes: number) => string;
  scheduleSave: string;
  scheduleSaved: string;
  scheduleNotSet: string;
  scheduleReadinessPartyA: string;
  scheduleReadinessPartyB: string;
  scheduleReadinessPipeline: string;
  scheduleReady: string;
  scheduleNotReady: string;
  scheduleDisabledHint: string;
  scheduleStartRequiresReadyHint: string;
  tableScheduledTime: string;
  tablePreparationStatus: string;
  tableStatusReady: string;
  tableStatusNotReady: string;
  tableStatusComplete: string;
  scheduleOpenLobby: string;
  scheduleOpenSession: string;
  tableSessionAction: string;
  scheduleError: string;
  calendarTitle: string;
  calendarSubtitle: string;
  calendarToday: string;
  calendarViewDay: string;
  calendarViewWeek: string;
  calendarViewMonth: string;
  calendarSelectSession: string;
  calendarSelectSessionHint: string;
  calendarEditSession: string;
  calendarDragHint: string;
  calendarSessionStartedHint: string;
  calendarOpenRoom: string;
  calendarUpcomingTitle: string;
  calendarNoSessions: string;
  calendarStartedBadge: string;
  calendarUnscheduledTitle: string;
  calendarScheduleAction: string;
  mediatorGenerateQuestions: string;
  mediatorSendQuestion: string;
  mediatorEditQuestion: string;
  mediatorGenerateOptions: string;
  mediatorPublishCompromise: string;
  mediatorQuestionCandidates: string;
  mediatorOwnQuestion: string;
  mediatorSelectCandidate: string;
  mediatorCompromiseDraft: string;
  mediatorCompromiseCanonical: string;
  mediatorCompromisePartyA: string;
  mediatorCompromisePartyB: string;
  mediatorCompromiseLegalNorms: string;
  mediatorCompromiseFulfillment: string;
  mediatorCompromiseRefusalRisks: string;
  mediatorProfilesTitle: string;
  mediatorMessageKinds: Record<string, string>;
  mediatorMessageToParty: string;
  activityLogSourcePipeline: string;
  activityLogSourceMilestone: string;
  activityLogEvents: Record<string, string>;
  activityLogPipelineEvents: Record<string, string>;
  activityLogTests: Record<string, string>;
  activityLogFields: Record<string, string>;
  comingSoon: string;
  comingSoonDesc: string;
  general: string;
  notifications: string;
  security: string;
  integrations: string;
  settingsPlaceholder: (name: string) => string;
  roles: Record<string, string>;
};

export const adminCopy: Record<Locale, AdminCopy> = {
  en: {
    adminConsole: "Admin Console",
    mediatorConsole: "Mediator Console",
    navRooms: "Rooms",
    navCalendar: "Calendar",
    navMediators: "Mediators",
    navSettings: "Settings",
    logout: "Logout",
    portalTitle: "Mediation Portal",
    searchPlaceholder: "Search...",
    roomsTitle: "Negotiation Rooms",
    roomsSubtitle:
      "Oversee and manage secure mediation environments. Monitor credentials and distribute access links to participating parties.",
    newRoom: "New Room",
    createRoom: "Create Room",
    cancel: "Cancel",
    close: "Close",
    jurisdictionFieldHelp:
      "Choose the legal jurisdiction for this room. This determines which laws and precedents apply throughout the mediation process.",
    jurisdictionLabel: "Jurisdiction",
    jurisdictionUkraineDesc: "Ukrainian law and legal practice",
    jurisdictionUsaDesc: "United States law and legal practice",
    roomUsaSubJurisdiction: "State / territory / Federal",
    roomUsaSubJurisdictionHelp:
      "Select the US state or territory whose law applies to this dispute, or Federal for nationwide federal law.",
    deleteRoom: "Delete Room",
    deleteRoomConfirm: "Delete this room and all its participants? This cannot be undone.",
    returnToRooms: "Return to rooms",
    createRoomSubtitle: "Set up the room and both sides. Credentials will be generated when you create the room.",
    roomDetails: "Room details",
    participants: "Participants",
    roomTitleLabel: "Room title",
    roomDescriptionLabel: "Room description",
    partyATitleLabel: "Title / Name",
    partyADescriptionLabel: "Description",
    partyBTitleLabel: "Title / Name",
    partyBDescriptionLabel: "Description",
    titleLabel: "Title",
    descriptionLabel: "Description",
    noRooms: "No rooms yet. Create your first room to generate Sides credentials.",
    noAdminRooms: "No admin rooms yet. Create a room to generate participant credentials.",
    noMediatorRooms: "No mediator rooms yet.",
    noSearchResults: "No rooms match your search.",
    tabAdminRooms: "Admin rooms",
    tabMediatorRooms: "Mediator rooms",
    unknownMediator: "Unknown mediator",
    tableCreatedAt: "Created",
    tableSides: "Sides",
    tableStatus: "Status",
    active: "ACTIVE",
    save: "Save",
    saveParticipant: "Save participant",
    saveChanges: "Save Changes",
    roleLabel: "Role",
    loginLabel: "Login",
    passwordLabel: "Password",
    copyCredentials: "Copy Credentials",
    magicLink: "Magic Link",
    magicLinkCopied: "Magic link copied to clipboard",
    magicLinkFailed: "Could not generate magic link",
    mediatorsTitle: "Registry",
    mediatorsSubtitle: "Manage credentials and access for accredited legal mediators.",
    createMediator: "Create Mediator",
    addMediator: "Add Mediator",
    mediatorTitleLabel: "Title / Name",
    returnToMediators: "Return to mediators",
    createMediatorSubtitle: "Add a mediator with title/name and description. Login and password will be generated automatically.",
    mediatorDetails: "Mediator details",
    deleteMediator: "Delete mediator",
    deleteMediatorConfirm: "Delete this mediator? This cannot be undone.",
    selectRoom: "Select room",
    mediatorTitlePlaceholder: "Mediator title/name",
    mediatorDescPlaceholder: "Mediator description",
    noMediators: "No mediators yet. Create your first mediator to generate credentials.",
    saveMediator: "Save Changes",
    tableActions: "Actions",
    openCard: "Open card",
    tableRowsPerPage: "Rows per page",
    tablePageOf: "Page {page} of {pages}",
    tablePreviousPage: "Previous",
    tableNextPage: "Next",
    settingsTitle: "Settings",
    settingsSubtitle: "Configure platform preferences and administrative controls.",
    tabCredentials: "Credentials",
    tabTests: "Tests",
    credentialsSubtitle: "Add API keys for external integrations used by the platform.",
    testsSubtitle: "Configure links to personality and conflict assessment tests.",
    openaiApiKeyLabel: "OpenAI API key",
    airtableApiKeyLabel: "Airtable API key",
    showApiKey: "Show key",
    hideApiKey: "Hide key",
    testUrlLabel: "Test URL",
    testPersonalityType: "What is my personality type",
    testFaceFear: "Face to face with fear",
    testCharacterTraits: "Character traits",
    testPersonalityConflicts: "Personality conflicts",
    settingsSaved: "Settings saved",
    tabPrompts: "Prompts",
    tabRag: "RAG",
    ragSubtitle: "Manage legal documents for hybrid retrieval. Upload legislation by jurisdiction and category.",
    ragUploadDocument: "Upload document",
    ragDocumentName: "Document name",
    ragSourceUrl: "Source URL",
    ragCategory: "Category",
    ragCategoryFilter: "Filter by category",
    ragAllCategories: "All categories",
    ragJurisdictionUkraine: "Ukraine",
    ragJurisdictionUsa: "United States",
    ragUsaSubJurisdiction: "Jurisdiction",
    ragUsaSubJurisdictionFilter: "Filter by jurisdiction",
    ragAllUsaSubJurisdictions: "All jurisdictions",
    ragUsaSubJurisdictionHint:
      "Documents are stored per jurisdiction. Use Federal for nationwide law (included in every state search), or select a state (e.g. Florida for FL statutes).",
    ragUpload: "Upload",
    ragUploading: "Uploading document…",
    ragUploadingHint: "Extracting text and building the search index. This may take a moment.",
    ragEditDocument: "Edit document",
    ragDeleteDocument: "Delete",
    ragDeleteConfirm: "Delete this document and all indexed chunks?",
    ragReprocess: "Reprocess",
    ragStatusPending: "Pending",
    ragStatusProcessing: "Processing",
    ragStatusReady: "Ready",
    ragStatusFailed: "Failed",
    ragNoDocuments: "No documents yet.",
    ragTestInquiry: "Test inquiry",
    ragTestQuestion: "Ask a question about the corpus",
    ragTestSubmit: "Run inquiry",
    ragTestSelectDocument: "Document (optional)",
    ragTestAllDocuments: "Search entire jurisdiction",
    ragTestPreparedQueries: "Prepared search queries",
    ragDocumentUploaded: "Document uploaded",
    ragDocumentUpdated: "Document updated",
    ragDocumentDeleted: "Document deleted",
    ragProcessingIncomplete: "Document processing is not complete.",
    ragFileLabel: "File (TXT, PDF, DOCX)",
    ragFileInputAriaLabel: "Upload file (TXT, PDF, DOCX)",
    ragChooseFile: "Choose file",
    ragNoFileChosen: "No file chosen",
    promptsComingSoonDesc:
      "AI prompt configuration will be available here in a future release.",
    agentPromptsSubtitle: "Edit system prompts and test each analysis agent in isolation.",
    agentTabPsychodynamic: "Psychodynamic",
    agentTabInterests: "Interests",
    agentTabEmotionalTriggers: "Emotional Triggers",
    agentTabLegalAnalysis: "Legal Analysis",
    agentTabMediation: "Mediation Agent",
    agentSystemPrompt: "System prompt",
    agentTestPanel: "Test agent",
    agentTestSelectUser: "Select participant",
    agentTestSelectRoom: "Select room",
    agentTestRun: "Run test",
    agentTestInput: "Input data",
    agentTestResult: "Result",
    agentTestPersonalBotPrompt: "Personal bot prompt",
    agentTestDisputeAnswers: "Dispute answers",
    agentTestJurisdiction: "Jurisdiction",
    agentTestResponseLocale: "Response language",
    agentLegalNotFoundTitle: "No relevant legal information found",
    agentPromptSaved: "Agent prompt saved",
    mediationStatusTitle: "Mediation session",
    mediationPhaseLabel: "Phase",
    mediationRoundLabel: "Round",
    mediationNotStarted: "Not started",
    mediationSelectedOption: "Selected option",
    mediationCompletedAt: "Completed at",
    pipelineLogTitle: "Pipeline & mediation log",
    mediationDetailsButton: "Mediation details",
    mediationDetailsTitle: "Mediation details",
    mediationDetailsMessagesTitle: "Mediation dialogue",
    mediationDetailsNoMessages: "No messages yet.",
    mediationDetailsOptionsTitle: "Solution options & votes",
    mediationDetailsNoVote: "No vote",
    mediationDetailsAgreementTitle: "Agreement & results",
    mediationDetailsAgreementPending: "Agreement and final results will appear here after mediation is completed.",
    mediationDetailsCompromiseVote: "Compromise vote",
    mediationDetailsAccepted: "Accepted",
    mediationDetailsRejected: "Rejected",
    mediationDetailsActionFailed: "Action failed",
    activityLogEmpty: "No activity recorded yet.",
    scheduleSectionTitle: "Mediation schedule",
    scheduleSessionComplete: "Mediation completed",
    scheduleDateTimeLabel: "Scheduled start",
    scheduleDateLabel: "Date",
    scheduleHourLabel: "Hour",
    scheduleMinutesLabel: "Minutes",
    scheduleDurationLabel: "Duration",
    scheduleDurationOption: (minutes) => {
      if (minutes === 30) return "30 minutes";
      if (minutes === 60) return "1 hour";
      if (minutes % 60 === 0) return `${minutes / 60} hours`;
      return `${minutes / 60} hours`;
    },
    scheduleSave: "Save schedule",
    scheduleSaved: "Schedule saved",
    scheduleNotSet: "Not scheduled yet",
    scheduleReadinessPartyA: "Party A ready",
    scheduleReadinessPartyB: "Party B ready",
    scheduleReadinessPipeline: "AI analysis complete",
    scheduleReady: "Ready",
    scheduleNotReady: "Not ready",
    scheduleDisabledHint: "Both parties must finish tests, conflict questions, and AI analysis before scheduling.",
    scheduleStartRequiresReadyHint:
      "You can schedule now. Parties still need to finish tests, conflict questions, and AI analysis before the session can start.",
    tableScheduledTime: "Scheduled time",
    tablePreparationStatus: "Status",
    tableStatusReady: "Ready",
    tableStatusNotReady: "Not ready",
    tableStatusComplete: "Complete",
    scheduleOpenLobby: "Open pre-session lobby",
    scheduleOpenSession: "Open live session",
    tableSessionAction: "Session",
    scheduleError: "Could not save schedule",
    calendarTitle: "Session calendar",
    calendarSubtitle: "Review scheduled sessions and reschedule directly from the calendar.",
    calendarToday: "Today",
    calendarViewDay: "Day",
    calendarViewWeek: "Week",
    calendarViewMonth: "Month",
    calendarSelectSession: "Select a session",
    calendarSelectSessionHint: "Click a session on the calendar or in the list to view and edit its schedule.",
    calendarEditSession: "Edit schedule",
    calendarDragHint:
      "Drag to move, resize to change duration, or click a slot/day to update the selected session, then save.",
    calendarSessionStartedHint: "This session has already started, so the schedule can no longer be changed.",
    calendarOpenRoom: "Open room",
    calendarUpcomingTitle: "Upcoming sessions",
    calendarNoSessions: "No scheduled sessions here.",
    calendarStartedBadge: "Started",
    calendarUnscheduledTitle: "Rooms without a schedule",
    calendarScheduleAction: "Schedule",
    mediatorGenerateQuestions: "Generate question options",
    mediatorSendQuestion: "Send to party",
    mediatorEditQuestion: "Edit question",
    mediatorGenerateOptions: "Generate solution options",
    mediatorPublishCompromise: "Publish compromise",
    mediatorQuestionCandidates: "Question candidates",
    mediatorOwnQuestion: "Your question",
    mediatorSelectCandidate: "Select a question",
    mediatorCompromiseDraft: "Compromise draft",
    mediatorCompromiseCanonical: "Canonical description (mediator view)",
    mediatorCompromisePartyA: "Text for Party A",
    mediatorCompromisePartyB: "Text for Party B",
    mediatorCompromiseLegalNorms: "Legal information (not advice)",
    mediatorCompromiseFulfillment: "Fulfillment likelihood",
    mediatorCompromiseRefusalRisks: "Risks if refused",
    mediatorProfilesTitle: "Party profiles",
    mediatorMessageKinds: {
      mediation_system: "Notice",
      mediation_opening: "Opening",
      mediation_question: "Question",
      mediation_summary: "Summary",
      mediation_moderation: "Moderation",
      mediation_nudge: "Nudge",
      mediation_options: "Options",
    },
    mediatorMessageToParty: "to",
    activityLogSourcePipeline: "Pipeline",
    activityLogSourceMilestone: "Milestone",
    activityLogEvents: {
      room_created: "Room created",
      welcome_seen: "Welcome screen viewed",
      disclaimer_accepted: "Disclaimer accepted",
      test_completed: "Assessment test completed",
      onboarding_completed: "Onboarding completed",
      personal_bot_ready: "Personal AI bot ready",
      dispute_intake_submitted: "Dispute intake submitted",
      psychodynamic_profile_completed: "Psychodynamic profile generated",
      emotional_triggers_completed: "Emotional triggers profile generated",
      interests_analysis_completed: "Interests analysis completed",
      legal_analysis_completed: "Legal analysis completed",
      post_intake_pipeline_started: "Post-intake pipeline started",
      post_intake_pipeline_completed: "Post-intake pipeline completed",
      mediation_start_clicked: "Start mediation clicked",
      mediation_started: "Mediation session started",
      ready_for_options: "Ready for solution options",
      agreement_accepted: "Agreement accepted",
      agreement_finalized: "Agreement finalized",
      mediation_completed: "Mediation completed",
      compromise_votes_recorded: "Compromise votes recorded",
      filing_receipt_saved: "Filing receipt saved",
      participant_message: "Participant message",
    },
    activityLogPipelineEvents: {
      pipeline_triggered: "Pipeline triggered",
      pipeline_completed: "Pipeline completed",
      agent_started: "Agent started",
      agent_completed: "Agent completed",
      agent_failed: "Agent failed",
      agent_skipped: "Agent skipped",
      mediation_phase_changed: "Mediation phase changed",
      mediation_timer_expired: "Mediation timer expired",
    },
    activityLogTests: {
      personality_type: "Personality type",
      face_fear: "Face to face with fear",
      character_traits: "Character traits",
      personality_conflicts: "Personality conflicts",
    },
    activityLogFields: {
      test: "Test",
      disputeDescription: "Dispute description",
      disputePriority: "Priority",
      disputeAcceptableOutcome: "Acceptable outcome",
      channel: "Channel",
      messageKind: "Message type",
      message: "Message",
      personalBotPrompt: "Personal bot prompt",
      phase: "Phase",
      reason: "Reason",
      step: "Step",
      count: "Count",
      selectedOptionId: "Selected option",
      partyAVoteOptionId: "Party A vote",
      partyBVoteOptionId: "Party B vote",
      partyACompromiseVote: "Party A compromise vote",
      partyBCompromiseVote: "Party B compromise vote",
      contentHash: "Content hash",
      profile: "Profile",
      triggers: "Triggers",
      error: "Error",
    },
    comingSoon: "COMING SOON",
    comingSoonDesc:
      "Application settings are not yet available in this MVP. Future releases will include notification preferences, branding options, and integration controls.",
    general: "General",
    notifications: "Notifications",
    security: "Security",
    integrations: "Integrations",
    settingsPlaceholder: (name) => `Placeholder for ${name.toLowerCase()} settings.`,
    roles: {
      party_a: "Party A",
      party_b: "Party B",
      mediator: "Mediator",
      admin: "Admin",
    },
  },
  uk: {
    adminConsole: "Адмін-панель",
    mediatorConsole: "Панель медіатора",
    navRooms: "Кімнати",
    navCalendar: "Календар",
    navMediators: "Медіатори",
    navSettings: "Налаштування",
    logout: "Вийти",
    portalTitle: "Портал медіації",
    searchPlaceholder: "Пошук...",
    roomsTitle: "Кімнати перемовин",
    roomsSubtitle:
      "Керуйте безпечними середовищами медіації. Переглядайте облікові дані та надсилайте посилання учасникам.",
    newRoom: "Нова кімната",
    createRoom: "Створити кімнату",
    cancel: "Скасувати",
    close: "Закрити",
    jurisdictionFieldHelp:
      "Оберіть правову юрисдикцію для цієї кімнати. Вона визначатиме, які закони та прецеденти застосовуватимуться під час медіації.",
    jurisdictionLabel: "Юрисдикція",
    jurisdictionUkraineDesc: "Українське право та судова практика",
    jurisdictionUsaDesc: "Право США та судова практика",
    roomUsaSubJurisdiction: "Штат / територія / Федеральна",
    roomUsaSubJurisdictionHelp:
      "Оберіть штат або територію США, право яких застосовується до цього спору, або Федеральну для загальнодержавного права.",
    deleteRoom: "Видалити кімнату",
    deleteRoomConfirm: "Видалити цю кімнату та всіх учасників? Цю дію не можна скасувати.",
    returnToRooms: "Повернутися до кімнат",
    createRoomSubtitle: "Налаштуйте кімнату та обидві сторони. Облікові дані буде згенеровано після створення.",
    roomDetails: "Деталі кімнати",
    participants: "Учасники",
    roomTitleLabel: "Назва кімнати",
    roomDescriptionLabel: "Опис кімнати",
    partyATitleLabel: "Назва / Ім'я",
    partyADescriptionLabel: "Опис",
    partyBTitleLabel: "Назва / Ім'я",
    partyBDescriptionLabel: "Опис",
    titleLabel: "Назва",
    descriptionLabel: "Опис",
    noRooms: "Кімнат ще немає. Створіть першу кімнату для генерації облікових даних сторін.",
    noAdminRooms: "Адміністративних кімнат ще немає. Створіть кімнату для генерації облікових даних учасників.",
    noMediatorRooms: "Кімнат медіаторів ще немає.",
    noSearchResults: "Немає кімнат за вашим запитом.",
    tabAdminRooms: "Кімнати адміна",
    tabMediatorRooms: "Кімнати медіаторів",
    unknownMediator: "Невідомий медіатор",
    tableCreatedAt: "Створено",
    tableSides: "Сторони",
    tableStatus: "Статус",
    active: "АКТИВНА",
    save: "Зберегти",
    saveParticipant: "Зберегти учасника",
    saveChanges: "Зберегти зміни",
    roleLabel: "Роль",
    loginLabel: "Логін",
    passwordLabel: "Пароль",
    copyCredentials: "Копіювати дані",
    magicLink: "Magic Link",
    magicLinkCopied: "Посилання скопійовано",
    magicLinkFailed: "Не вдалося створити magic link",
    mediatorsTitle: "Реєстр",
    mediatorsSubtitle: "Керуйте обліковими даними та доступом акредитованих медіаторів.",
    createMediator: "Створити медіатора",
    addMediator: "Додати медіатора",
    mediatorTitleLabel: "Назва / Ім'я",
    returnToMediators: "Повернутися до медіаторів",
    createMediatorSubtitle: "Додайте медіатора з назвою/ім'ям та описом. Логін і пароль буде згенеровано автоматично.",
    mediatorDetails: "Деталі медіатора",
    deleteMediator: "Видалити медіатора",
    deleteMediatorConfirm: "Видалити цього медіатора? Цю дію не можна скасувати.",
    selectRoom: "Оберіть кімнату",
    mediatorTitlePlaceholder: "Назва/ім'я медіатора",
    mediatorDescPlaceholder: "Опис медіатора",
    noMediators: "Медіаторів ще немає. Створіть першого медіатора для генерації облікових даних.",
    saveMediator: "Зберегти зміни",
    tableActions: "Дії",
    openCard: "Відкрити",
    tableRowsPerPage: "Рядків на сторінці",
    tablePageOf: "Сторінка {page} з {pages}",
    tablePreviousPage: "Назад",
    tableNextPage: "Далі",
    settingsTitle: "Налаштування",
    settingsSubtitle: "Налаштування платформи та адміністративні параметри.",
    tabCredentials: "Облікові дані",
    tabTests: "Тести",
    credentialsSubtitle: "Додайте API-ключі для зовнішніх інтеграцій платформи.",
    testsSubtitle: "Налаштуйте посилання на тести особистості та конфліктів.",
    openaiApiKeyLabel: "OpenAI API ключ",
    airtableApiKeyLabel: "Airtable API ключ",
    showApiKey: "Показати ключ",
    hideApiKey: "Приховати ключ",
    testUrlLabel: "Посилання на тест",
    testPersonalityType: "Який мій тип характеру",
    testFaceFear: "Віч-на-віч зі страхом",
    testCharacterTraits: "Риси характеру",
    testPersonalityConflicts: "Конфлікти особистості",
    settingsSaved: "Налаштування збережено",
    tabPrompts: "Промпти",
    tabRag: "RAG",
    ragSubtitle: "Керуйте правовими документами для гібридного пошуку. Завантажуйте законодавство за юрисдикцією та категорією.",
    ragUploadDocument: "Завантажити документ",
    ragDocumentName: "Назва документа",
    ragSourceUrl: "Посилання на джерело",
    ragCategory: "Категорія",
    ragCategoryFilter: "Фільтр за категорією",
    ragAllCategories: "Усі категорії",
    ragJurisdictionUkraine: "Україна",
    ragJurisdictionUsa: "США",
    ragUsaSubJurisdiction: "Юрисдикція",
    ragUsaSubJurisdictionFilter: "Фільтр за юрисдикцією",
    ragAllUsaSubJurisdictions: "Усі юрисдикції",
    ragUsaSubJurisdictionHint:
      "Документи прив’язані до юрисдикції. Оберіть Федеральну для загальнодержавного права (враховується в пошуку для кожного штату) або штат (наприклад, Флорида для законів FL).",
    ragUpload: "Завантажити",
    ragUploading: "Завантаження документа…",
    ragUploadingHint: "Витягуємо текст і будуємо пошуковий індекс. Це може зайняти деякий час.",
    ragEditDocument: "Редагувати документ",
    ragDeleteDocument: "Видалити",
    ragDeleteConfirm: "Видалити цей документ і всі проіндексовані фрагменти?",
    ragReprocess: "Переобробити",
    ragStatusPending: "Очікує",
    ragStatusProcessing: "Обробка",
    ragStatusReady: "Готово",
    ragStatusFailed: "Помилка",
    ragNoDocuments: "Документів ще немає.",
    ragTestInquiry: "Тестовий запит",
    ragTestQuestion: "Поставте питання щодо корпусу",
    ragTestSubmit: "Запустити запит",
    ragTestSelectDocument: "Документ (необов'язково)",
    ragTestAllDocuments: "Шукати в усій юрисдикції",
    ragTestPreparedQueries: "Підготовлені пошукові запити",
    ragDocumentUploaded: "Документ завантажено",
    ragDocumentUpdated: "Документ оновлено",
    ragDocumentDeleted: "Документ видалено",
    ragProcessingIncomplete: "Обробка документа ще не завершена.",
    ragFileLabel: "Файл (TXT, PDF, DOCX)",
    ragFileInputAriaLabel: "Завантажити файл (TXT, PDF, DOCX)",
    ragChooseFile: "Обрати файл",
    ragNoFileChosen: "Файл не обрано",
    promptsComingSoonDesc:
      "Налаштування AI-промптів буде доступне тут у майбутньому релізі.",
    agentPromptsSubtitle: "Редагуйте системні промпти та тестуйте кожного агента аналізу окремо.",
    agentTabPsychodynamic: "Психодинаміка",
    agentTabInterests: "Інтереси",
    agentTabEmotionalTriggers: "Емоційні тригери",
    agentTabLegalAnalysis: "Правовий аналіз",
    agentTabMediation: "Агент медіації",
    agentSystemPrompt: "Системний промпт",
    agentTestPanel: "Тест агента",
    agentTestSelectUser: "Оберіть учасника",
    agentTestSelectRoom: "Оберіть кімнату",
    agentTestRun: "Запустити тест",
    agentTestInput: "Вхідні дані",
    agentTestResult: "Результат",
    agentTestPersonalBotPrompt: "Промпт персонального бота",
    agentTestDisputeAnswers: "Відповіді про спір",
    agentTestJurisdiction: "Юрисдикція",
    agentTestResponseLocale: "Мова відповіді",
    agentLegalNotFoundTitle: "Релевантну правову інформацію не знайдено",
    agentPromptSaved: "Промпт агента збережено",
    mediationStatusTitle: "Сесія медіації",
    mediationPhaseLabel: "Фаза",
    mediationRoundLabel: "Раунд",
    mediationNotStarted: "Не розпочато",
    mediationSelectedOption: "Обраний варіант",
    mediationCompletedAt: "Завершено",
    pipelineLogTitle: "Журнал пайплайну та медіації",
    mediationDetailsButton: "Деталі медіації",
    mediationDetailsTitle: "Деталі медіації",
    mediationDetailsMessagesTitle: "Діалог медіації",
    mediationDetailsNoMessages: "Повідомлень ще немає.",
    mediationDetailsOptionsTitle: "Варіанти рішень і голоси",
    mediationDetailsNoVote: "Без голосу",
    mediationDetailsAgreementTitle: "Угода та результати",
    mediationDetailsAgreementPending:
      "Угода та фінальні результати з’являться тут після завершення медіації.",
    mediationDetailsCompromiseVote: "Голос за компроміс",
    mediationDetailsAccepted: "Прийнято",
    mediationDetailsRejected: "Відхилено",
    mediationDetailsActionFailed: "Не вдалося виконати дію",
    activityLogEmpty: "Активність ще не зафіксована.",
    scheduleSectionTitle: "Розклад медіації",
    scheduleSessionComplete: "Медіацію завершено",
    scheduleDateTimeLabel: "Запланований старт",
    scheduleDateLabel: "Дата",
    scheduleHourLabel: "Година",
    scheduleMinutesLabel: "Хвилини",
    scheduleDurationLabel: "Тривалість",
    scheduleDurationOption: (minutes) => {
      if (minutes === 30) return "30 хвилин";
      if (minutes === 60) return "1 година";
      if (minutes % 60 === 0) return `${minutes / 60} години`;
      return `${minutes / 60} години`;
    },
    scheduleSave: "Зберегти розклад",
    scheduleSaved: "Розклад збережено",
    scheduleNotSet: "Ще не заплановано",
    scheduleReadinessPartyA: "Сторона A готова",
    scheduleReadinessPartyB: "Сторона B готова",
    scheduleReadinessPipeline: "AI-аналіз завершено",
    scheduleReady: "Готово",
    scheduleNotReady: "Не готово",
    scheduleDisabledHint: "Обидві сторони мають завершити тести, питання про конфлікт і AI-аналіз перед плануванням.",
    scheduleStartRequiresReadyHint:
      "Можна планувати зараз. Сторони все одно мають завершити тести, питання про конфлікт і AI-аналіз, перш ніж сесія зможе початися.",
    tableScheduledTime: "Запланований час",
    tablePreparationStatus: "Статус",
    tableStatusReady: "Готово",
    tableStatusNotReady: "Не готово",
    tableStatusComplete: "Завершено",
    scheduleOpenLobby: "Відкрити лобі перед сесією",
    scheduleOpenSession: "Відкрити живу сесію",
    tableSessionAction: "Сесія",
    scheduleError: "Не вдалося зберегти розклад",
    calendarTitle: "Календар сесій",
    calendarSubtitle: "Переглядайте заплановані сесії та змінюйте розклад прямо з календаря.",
    calendarToday: "Сьогодні",
    calendarViewDay: "День",
    calendarViewWeek: "Тиждень",
    calendarViewMonth: "Місяць",
    calendarSelectSession: "Оберіть сесію",
    calendarSelectSessionHint: "Натисніть сесію в календарі або в списку, щоб переглянути й змінити розклад.",
    calendarEditSession: "Змінити розклад",
    calendarDragHint:
      "Перетягніть, щоб перенести, змініть розмір для тривалості, або натисніть слот/день для вибраної сесії, потім збережіть.",
    calendarSessionStartedHint: "Ця сесія вже почалася, тому розклад змінити не можна.",
    calendarOpenRoom: "Відкрити кімнату",
    calendarUpcomingTitle: "Найближчі сесії",
    calendarNoSessions: "Тут немає запланованих сесій.",
    calendarStartedBadge: "Розпочато",
    calendarUnscheduledTitle: "Кімнати без розкладу",
    calendarScheduleAction: "Запланувати",
    mediatorGenerateQuestions: "Згенерувати варіанти запитань",
    mediatorSendQuestion: "Надіслати стороні",
    mediatorEditQuestion: "Редагувати запитання",
    mediatorGenerateOptions: "Згенерувати варіанти рішення",
    mediatorPublishCompromise: "Опублікувати компроміс",
    mediatorQuestionCandidates: "Варіанти запитань",
    mediatorOwnQuestion: "Ваше запитання",
    mediatorSelectCandidate: "Оберіть запитання",
    mediatorCompromiseDraft: "Чернетка компромісу",
    mediatorCompromiseCanonical: "Канонічний опис (для медіатора)",
    mediatorCompromisePartyA: "Текст для сторони A",
    mediatorCompromisePartyB: "Текст для сторони B",
    mediatorCompromiseLegalNorms: "Правова інформація (не порада)",
    mediatorCompromiseFulfillment: "Ймовірність виконання",
    mediatorCompromiseRefusalRisks: "Ризики відмови",
    mediatorProfilesTitle: "Профілі сторін",
    mediatorMessageKinds: {
      mediation_system: "Повідомлення",
      mediation_opening: "Відкриття",
      mediation_question: "Запитання",
      mediation_summary: "Підсумок",
      mediation_moderation: "Модерація",
      mediation_nudge: "Нагадування",
      mediation_options: "Варіанти",
    },
    mediatorMessageToParty: "до",
    activityLogSourcePipeline: "Пайплайн",
    activityLogSourceMilestone: "Етап",
    activityLogEvents: {
      room_created: "Кімнату створено",
      welcome_seen: "Переглянуто вітальний екран",
      disclaimer_accepted: "Дисклеймер прийнято",
      test_completed: "Тест пройдено",
      onboarding_completed: "Онбординг завершено",
      personal_bot_ready: "Особистий AI-бот готовий",
      dispute_intake_submitted: "Анкету спору подано",
      psychodynamic_profile_completed: "Психодинамічний профіль згенеровано",
      emotional_triggers_completed: "Профіль емоційних тригерів згенеровано",
      interests_analysis_completed: "Аналіз інтересів завершено",
      legal_analysis_completed: "Правовий аналіз завершено",
      post_intake_pipeline_started: "Пост-інтейк пайплайн розпочато",
      post_intake_pipeline_completed: "Пост-інтейк пайплайн завершено",
      mediation_start_clicked: "Натиснуто «Почати медіацію»",
      mediation_started: "Сесію медіації розпочато",
      ready_for_options: "Готовність до варіантів рішень",
      agreement_accepted: "Угоду прийнято",
      agreement_finalized: "Угоду фіналізовано",
      mediation_completed: "Медіацію завершено",
      compromise_votes_recorded: "Голоси за компроміс зафіксовано",
      filing_receipt_saved: "Квитанцію подання збережено",
      participant_message: "Повідомлення учасника",
    },
    activityLogPipelineEvents: {
      pipeline_triggered: "Пайплайн запущено",
      pipeline_completed: "Пайплайн завершено",
      agent_started: "Агента запущено",
      agent_completed: "Агента завершено",
      agent_failed: "Помилка агента",
      agent_skipped: "Агента пропущено",
      mediation_phase_changed: "Фазу медіації змінено",
      mediation_timer_expired: "Таймер медіації завершився",
    },
    activityLogTests: {
      personality_type: "Тип особистості",
      face_fear: "Віч-на-віч зі страхом",
      character_traits: "Риси характеру",
      personality_conflicts: "Конфлікти особистості",
    },
    activityLogFields: {
      test: "Тест",
      disputeDescription: "Опис спору",
      disputePriority: "Пріоритет",
      disputeAcceptableOutcome: "Прийнятний результат",
      channel: "Канал",
      messageKind: "Тип повідомлення",
      message: "Повідомлення",
      personalBotPrompt: "Промпт особистого бота",
      phase: "Фаза",
      reason: "Причина",
      step: "Крок",
      count: "Кількість",
      selectedOptionId: "Обраний варіант",
      partyAVoteOptionId: "Голос сторони А",
      partyBVoteOptionId: "Голос сторони Б",
      partyACompromiseVote: "Компроміс сторони А",
      partyBCompromiseVote: "Компроміс сторони Б",
      contentHash: "Хеш вмісту",
      profile: "Профіль",
      triggers: "Тригери",
      error: "Помилка",
    },
    comingSoon: "НЕЗАБАРОМ",
    comingSoonDesc:
      "Налаштування застосунку ще недоступні в цьому MVP. У майбутніх релізах з’являться сповіщення, брендинг та інтеграції.",
    general: "Загальні",
    notifications: "Сповіщення",
    security: "Безпека",
    integrations: "Інтеграції",
    settingsPlaceholder: (name) => `Заглушка для налаштувань: ${name.toLowerCase()}.`,
    roles: {
      party_a: "Сторона А",
      party_b: "Сторона Б",
      mediator: "Медіатор",
      admin: "Адмін",
    },
  },
};
