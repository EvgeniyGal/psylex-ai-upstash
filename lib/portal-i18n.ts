import type { Locale } from "@/lib/i18n";
import type { ParticipantRole } from "@/lib/participant-roles";
import type { TestKey } from "@/lib/test-keys";

type RoleCopy = {
  welcomeTitle: string;
  welcomeBody: string;
  welcomeCta: string;
  disclaimerIntro: string;
  disclaimerParagraphs: string[];
  testsTitle: string;
  testsSubtitle: string;
};

type PortalCopy = {
  brand: string;
  roleLabel: string;
  roles: Record<ParticipantRole, string>;
  confidential: string;
  disclaimerTitle: string;
  importantInfo: string;
  consentLabel: string;
  proceed: string;
  proceedLoading: string;
  secureEnv: string;
  testsHint: string;
  nextStep: string;
  passed: string;
  notPassed: string;
  locked: string;
  pendingCompletion: string;
  openTest: string;
  updateTestStatus: string;
  updateBotStatus: string;
  personalBoardTitle: string;
  personalBoardReady: string;
  personalBoardPending: string;
  personalBoardReadySubtitle: string;
  personalBoardPendingSubtitle: string;
  personalBoardLockedSubtitle: string;
  testMeta: Record<TestKey, { title: string; subtitle: string; icon: string }>;
  participant: RoleCopy;
  mediator: RoleCopy;
  dashboardTitle: string;
  dashboardBody: string;
  dashboardEnterRoom: string;
  disputeIntakeTitle: string;
  disputeIntakeSubtitle: string;
  disputeIntakeQ1: string;
  disputeIntakeQ2: string;
  disputeIntakeQ3: string;
  disputeIntakeSubmit: string;
  disputeIntakeSubmitting: string;
  mediationLobbyTitle: string;
  mediationLobbySubtitle: string;
  mediationOppositeSide: string;
  mediationStatusReady: string;
  mediationStatusNotReady: string;
  mediationOppositeNotReady: string;
  mediationStart: string;
  mediationYourStatus: string;
  mediationAgentsWorking: string;
  mediationRoomPreparing: string;
  mediationHandshakeWaiting: string;
  mediationHandshakeOppositeReady: string;
  mediationHandshakeStarting: string;
  mediationCountdownLabel: string;
  mediationSessionEnded: string;
  mediationElapsedLabel: string;
  modeBScheduledAt: string;
  modeBWaitingSchedule: string;
  modeBStartWindowOpens: string;
  modeBStartAvailableHint: string;
  modeBCountdownToStart: string;
  modeBWaitingMediator: string;
  modeBWaitingPartyA: string;
  modeBWaitingPartyB: string;
  modeBSelfClicked: string;
  modeBAllReadyCountdown: string;
  modeBActionRequired: string;
  modeBNotifyScheduled: string;
  modeBNotifyStartWindow: string;
  modeBNotifyPeerReady: string;
  modeBNotifySessionStarted: string;
  modeBNotifyQuestion: string;
  modeBNotifyOptions: string;
  modeBNotifyCompromise: string;
  modeBNotifyAgreement: string;
  modeBNotifyCompleted: string;
  modeBWaitingCompromisePublish: string;
  backToStart: string;
  logout: string;
  helpTitle: string;
  helpAria: string;
  helpDownloadPdf: string;
  helpDownloadDocx: string;
  helpNoDocuments: string;
  helpChatTitle: string;
  helpChatPlaceholder: string;
  helpChatSend: string;
  helpChatClear: string;
  helpChatEmpty: string;
  helpChatError: string;
  helpChatThinking: string;
  helpChatOpen: string;
  helpChatClose: string;
  helpDocOverview: string;
  helpDocParties: string;
  helpDocMediator: string;
  helpDocAdmin: string;
  roomTitle: string;
  roomComingSoon: string;
  roomComingSoonDesc: string;
  mediationPhaseLabel: string;
  mediationRoundLabel: string;
  mediationYourTurn: string;
  mediationOtherPartyAnswering: string;
  mediationOtherPartyAnsweringHint: string;
  mediationReplyTimer: string;
  mediationReadyForOptions: string;
  mediationReadyConfirmed: string;
  mediationOtherReady: string;
  mediationWaitingOtherReady: string;
  mediationReadyForOptionsHint: string;
  mediationPreparing: string;
  mediationAwaitingAgent: string;
  mediationQuestionIncoming: string;
  mediationYou: string;
  mediationAgent: string;
  mediationSystem: string;
  mediationReplyPlaceholder: string;
  mediationSendReply: string;
  mediationAttackRedirected: string;
  mediationActionFailed: string;
  mediationOptionsTitle: string;
  mediationOptionsReady: string;
  modeBSessionStarted: string;
  mediationOptionLabel: string;
  mediationYourSelection: string;
  mediationPartySelected: string;
  mediationAgreedResolution: string;
  mediationLegalInfo: string;
  mediationFulfillment: string;
  mediationRefusalRisks: string;
  mediationSelectOption: string;
  mediationVoteRecorded: string;
  mediationOtherChose: string;
  mediationVotesDiscrepancy: string;
  mediationVotesDiscrepancyPending: string;
  mediationCompromiseTitle: string;
  mediationCompromiseGenerating: string;
  mediationAcceptCompromise: string;
  mediationRejectCompromise: string;
  mediationCompromiseVoteRecorded: string;
  mediationCompromiseAccepted: string;
  mediationCompromiseRejected: string;
  mediationCompromiseNoVote: string;
  mediationAgreementTitle: string;
  mediationUplDisclaimer: string;
  mediationIAccept: string;
  mediationAccepted: string;
  mediationWaitingOtherAccept: string;
  mediationSessionCompleted: string;
  mediationDownloadResults: string;
  mediationPdfPsychodynamicProfile: string;
  mediationPdfLegislation: string;
  mediationPdfSolution: string;
  mediationPdfDocumentTitle: string;
  mediationPdfCompanyName: string;
  mediationPdfTopDisclaimer: string;
  mediationPdfTerms: string;
  mediationPdfNotAvailable: string;
  mediationLegislationJurisdiction: string;
  mediationLegislationSolutionNorms: string;
  mediationLegislationOverview: string;
  mediationLegislationApplicableLaws: string;
  mediationLegislationRegulations: string;
  mediationLegislationCitations: string;
  mediationLegislationRelevance: string;
  mediationLegislationSource: string;
  mediationLegislationExcerpt: string;
  mediationEmailPlaceholder: string;
  mediationEmailSend: string;
  mediationEmailComingSoon: string;
  mediationNoAgreementOutcome: string;
  mediationPhases: Record<string, string>;
  participantFlowNavLabel: string;
  flowReviewNext: string;
  flowReviewBackToCurrent: string;
  participantFlowSteps: [string, string, string, string, string, string];
};

export const portalCopy: Record<Locale, PortalCopy> = {
  en: {
    brand: "PsyLex",
    roleLabel: "Role",
    roles: {
      party_a: "Party A",
      party_b: "Party B",
      mediator: "Mediator",
    },
    confidential: "Your responses are strictly confidential",
    disclaimerTitle: "Disclaimer & Consent",
    importantInfo: "Important Information",
    consentLabel: "I have read and agree to the terms of participation.",
    proceed: "Proceed to Next Step",
    proceedLoading: "Checking test completion…",
    secureEnv: "Secure & Confidential Environment",
    testsHint:
      "Complete all tests and wait for your personal AI bot to be ready before proceeding. Results may take up to two hours to process after you submit a test.",
    nextStep: "Next Step",
    passed: "Passed",
    notPassed: "Not passed",
    locked: "Locked until prerequisites met",
    pendingCompletion: "Pending completion",
    openTest: "Open test",
    updateTestStatus: "Update test status",
    updateBotStatus: "Update bot status",
    personalBoardTitle: "Personal AI Bot",
    personalBoardReady: "Ready",
    personalBoardPending: "Pending",
    personalBoardReadySubtitle: "Your personal AI bot is ready",
    personalBoardPendingSubtitle: "Processing your profile — this may take up to two hours",
    personalBoardLockedSubtitle: "Available after all tests are completed",
    testMeta: {
      personality_type: {
        title: "What is my personality type",
        subtitle: "Core assessment module",
        icon: "psychology",
      },
      face_fear: {
        title: "Face to face with fear",
        subtitle: "Emotional resilience module",
        icon: "mood_bad",
      },
      character_traits: {
        title: "Character traits",
        subtitle: "In-depth analysis",
        icon: "analytics",
      },
      personality_conflicts: {
        title: "Personality conflicts",
        subtitle: "Conflict dynamics module",
        icon: "gavel",
      },
    },
    participant: {
      welcomeTitle: "Welcome to the application",
      welcomeBody:
        "This tool will help you assess your psychological state, identify your strengths, and prepare for the next steps in your case.",
      welcomeCta: "Start Assessment",
      disclaimerIntro:
        "Please review the following information carefully before proceeding with the mediation process.",
      disclaimerParagraphs: [
        "This service does not provide professional legal advice and is not a substitute for therapy. The tools and insights provided by PsyLex are intended to facilitate communication and structured negotiation.",
        "Participation in this platform is completely voluntary. You may choose to pause or exit the process at any time without penalty.",
        "All your responses remain strictly confidential and are protected by enterprise-grade encryption.",
      ],
      testsTitle: "Psychological Assessment",
      testsSubtitle: "Complete the required modules below to proceed with your mediation profile.",
    },
    mediator: {
      welcomeTitle: "Welcome, Mediator",
      welcomeBody:
        "This platform will help you facilitate structured mediation, review psychological profiles, and guide parties toward a balanced resolution.",
      welcomeCta: "Begin Mediator Setup",
      disclaimerIntro:
        "Please review the following information carefully before facilitating sessions on this platform.",
      disclaimerParagraphs: [
        "As a mediator, you facilitate communication between parties. PsyLex does not replace your professional judgment, legal counsel, or therapeutic services.",
        "You are responsible for maintaining neutrality and confidentiality throughout the mediation process. Participation remains voluntary for all parties.",
        "All session data and psychological assessments are confidential and protected by enterprise-grade encryption.",
      ],
      testsTitle: "Mediator Assessment",
      testsSubtitle: "Complete the required modules below to build your mediator profile and unlock session tools.",
    },
    dashboardTitle: "You're all set",
    dashboardBody: "Your onboarding is complete. Enter your mediation room when you are ready.",
    dashboardEnterRoom: "Enter mediation room",
    disputeIntakeTitle: "Describe your dispute",
    disputeIntakeSubtitle:
      "Please answer the following questions so we can prepare your mediation session.",
    disputeIntakeQ1: "Please describe the dispute in your own words.",
    disputeIntakeQ2: "What is most important to you in this dispute?",
    disputeIntakeQ3: "What outcome would you consider acceptable?",
    disputeIntakeSubmit: "Submit answers",
    disputeIntakeSubmitting: "Submitting…",
    mediationLobbyTitle: "Mediation readiness",
    mediationLobbySubtitle: "Both sides must complete onboarding and answer the dispute questions before mediation can begin.",
    mediationOppositeSide: "Opposite side",
    mediationStatusReady: "Ready for mediation",
    mediationStatusNotReady: "Not ready for mediation",
    mediationOppositeNotReady:
      "The opposite side is not ready for mediation yet. They may still be completing tests or answering the dispute questions.",
    mediationStart: "Start Mediation",
    mediationYourStatus: "Your status",
    mediationAgentsWorking:
      "Our analysis agents are preparing your mediation session. This may take several minutes. Please wait — the Start Mediation button will become available when analysis is complete.",
    mediationRoomPreparing:
      "The mediation agent is preparing your opening messages. This usually takes a minute — the Start Mediation button will appear when the room is ready.",
    mediationHandshakeWaiting:
      "You clicked Start Mediation. Waiting for the opposite side to click as well.",
    mediationHandshakeOppositeReady:
      "The opposite side is ready to start. Click Start Mediation to join the session together.",
    mediationHandshakeStarting: "Both sides are ready. Starting mediation…",
    mediationCountdownLabel: "Session time remaining",
    mediationSessionEnded: "The 60-minute mediation session has ended.",
    mediationElapsedLabel: "Session time",
    modeBScheduledAt: "Scheduled session",
    modeBWaitingSchedule: "Waiting for the mediator to schedule the session.",
    modeBStartWindowOpens: "Start becomes available in",
    modeBStartAvailableHint:
      "Start Mediation becomes available 10 minutes before the scheduled time.",
    modeBCountdownToStart: "Session starts in",
    modeBWaitingMediator: "Waiting for the mediator",
    modeBWaitingPartyA: "Waiting for Party A",
    modeBWaitingPartyB: "Waiting for Party B",
    modeBSelfClicked: "You clicked Start Mediation.",
    modeBAllReadyCountdown: "Everyone is ready. Session starts at the scheduled time.",
    modeBActionRequired: "Action required",
    modeBNotifyScheduled: "A mediation session has been scheduled.",
    modeBNotifyStartWindow: "You can now click Start Mediation.",
    modeBNotifyPeerReady: "Another participant is ready to start.",
    modeBNotifySessionStarted: "The mediation session has started.",
    modeBNotifyQuestion: "You have a new question from the mediator.",
    modeBNotifyOptions: "Solution options are ready to review.",
    modeBNotifyCompromise: "A compromise option is ready for your vote.",
    modeBNotifyAgreement: "A draft agreement is ready for review.",
    modeBNotifyCompleted: "The mediation session has completed.",
    modeBWaitingCompromisePublish: "Waiting for the mediator to publish a compromise option.",
    backToStart: "Back to start",
    logout: "Logout",
    helpTitle: "Help",
    helpAria: "Open help",
    helpDownloadPdf: "Download PDF",
    helpDownloadDocx: "Download DOCX",
    helpNoDocuments: "No instructions are available for your role.",
    helpChatTitle: "PsyLex assistant",
    helpChatPlaceholder: "Ask a question about PsyLex…",
    helpChatSend: "Send",
    helpChatClear: "Clear history",
    helpChatEmpty: "Ask anything about how PsyLex works. Answers stay in this browser.",
    helpChatError: "The assistant could not answer. Try again in a moment.",
    helpChatThinking: "Preparing an answer…",
    helpChatOpen: "Open chat assistant",
    helpChatClose: "Close chat assistant",
    helpDocOverview: "Overview",
    helpDocParties: "Parties A and B",
    helpDocMediator: "Mediator",
    helpDocAdmin: "Administrator",
    roomTitle: "Mediation room",
    roomComingSoon: "COMING SOON",
    roomComingSoonDesc: "Mediation room features are being rebuilt and will be available in a future release.",
    mediationPhaseLabel: "Phase",
    mediationRoundLabel: "Round",
    mediationYourTurn: "Your turn to reply",
    mediationOtherPartyAnswering: "Other party is answering",
    mediationOtherPartyAnsweringHint: "The other party is currently answering this question.",
    mediationReplyTimer: "Reply time",
    mediationReadyForOptions: "I am ready for solution options",
    mediationReadyConfirmed: "You are ready for solution options",
    mediationOtherReady: "The other party is also ready.",
    mediationWaitingOtherReady: "Waiting for the other party to click ready.",
    mediationReadyForOptionsHint:
      "Both parties can click this at any time during dialogue to move to solution options early.",
    mediationPreparing: "The mediation agent is preparing your session…",
    mediationAwaitingAgent: "The mediation agent is working on the next step. Please wait a moment.",
    mediationQuestionIncoming: "Your question is being prepared…",
    mediationYou: "You",
    mediationAgent: "Mediation agent",
    mediationSystem: "System",
    mediationReplyPlaceholder: "Type your substantive reply…",
    mediationSendReply: "Send reply",
    mediationAttackRedirected: "Please focus on the substance of the dispute.",
    mediationActionFailed: "Action failed. Please try again.",
    mediationOptionsTitle: "Solution options",
    mediationOptionsReady:
      "Solution options are ready. Please review and vote independently.",
    modeBSessionStarted:
      "Mediator-facilitated session started. The mediator will guide the dialogue.",
    mediationOptionLabel: "Option {n}",
    mediationYourSelection: "Your selection",
    mediationPartySelected: "{party} selected",
    mediationAgreedResolution: "Agreed resolution",
    mediationLegalInfo: "Legal information (not advice)",
    mediationFulfillment: "Fulfillment likelihood",
    mediationRefusalRisks: "Risks if refused",
    mediationSelectOption: "Select this option",
    mediationVoteRecorded: "Your vote has been recorded. Waiting for the other party.",
    mediationOtherChose: "The other party selected option",
    mediationVotesDiscrepancy: "The parties selected different options. Review the compromise proposal below.",
    mediationVotesDiscrepancyPending:
      "The parties selected different options. A compromise is being prepared for both sides.",
    mediationCompromiseTitle: "Compromise option",
    mediationCompromiseGenerating: "Votes differ — the AI mediator is generating a compromise option...",
    mediationAcceptCompromise: "Accept compromise",
    mediationRejectCompromise: "Reject compromise",
    mediationCompromiseVoteRecorded: "Your compromise vote has been recorded.",
    mediationCompromiseAccepted: "Accepted compromise",
    mediationCompromiseRejected: "Rejected compromise",
    mediationCompromiseNoVote: "No vote",
    mediationAgreementTitle: "Draft agreement",
    mediationUplDisclaimer:
      "This agreement is the result of a voluntary choice made by the parties. PsyLex provides legal information exclusively and does not render legal services. To give the document legal force, it is recommended to consult a licensed attorney.",
    mediationIAccept: "I accept",
    mediationAccepted: "You have accepted",
    mediationWaitingOtherAccept: "Waiting for the other party to accept.",
    mediationSessionCompleted: "Session completed",
    mediationDownloadResults: "Download results",
    mediationPdfPsychodynamicProfile: "Psychodynamic profile",
    mediationPdfLegislation: "Legislation",
    mediationPdfSolution: "Solution",
    mediationPdfDocumentTitle: "Mediation results",
    mediationPdfCompanyName: "AI Innovation Management LLC",
    mediationPdfTopDisclaimer:
      "Legal information, not legal advice. PsyLex provides legal information only, not legal services. Every legal statement cites its source with an “information as of 2024–2025” note; a mediator confirms relevance before parties see it, and parties are referred to a licensed attorney for advice.",
    mediationPdfTerms: "Terms",
    mediationPdfNotAvailable: "Not available for this session.",
    mediationLegislationJurisdiction: "Jurisdiction",
    mediationLegislationSolutionNorms: "Legal norms for the selected solution",
    mediationLegislationOverview: "Legal analysis overview",
    mediationLegislationApplicableLaws: "Applicable laws",
    mediationLegislationRegulations: "Regulations",
    mediationLegislationCitations: "Source citations",
    mediationLegislationRelevance: "Relevance",
    mediationLegislationSource: "Source",
    mediationLegislationExcerpt: "Excerpt",
    mediationEmailPlaceholder: "Email for agreement (optional)",
    mediationEmailSend: "Send",
    mediationEmailComingSoon: "Email delivery is coming soon. Use download for now.",
    mediationNoAgreementOutcome: "No mutual agreement was reached in this session.",
    mediationPhases: {
      opening: "Opening",
      dialogue: "Dialogue",
      generating_options: "Generating options",
      voting: "Voting",
      voting_discrepancy: "Second vote",
      agreement: "Agreement",
      completed: "Completed",
    },
    participantFlowNavLabel: "Participant journey",
    flowReviewNext: "Next",
    flowReviewBackToCurrent: "Back to current step",
    participantFlowSteps: [
      "Landing",
      "Disclaimer",
      "Test results",
      "Dispute description",
      "Mediation",
      "Treaty",
    ],
  },
  uk: {
    brand: "PsyLex",
    roleLabel: "Роль",
    roles: {
      party_a: "Сторона А",
      party_b: "Сторона Б",
      mediator: "Медіатор",
    },
    confidential: "Ваші відповіді суворо конфіденційні",
    disclaimerTitle: "Відмова та згода",
    importantInfo: "Важлива інформація",
    consentLabel: "Я прочитав(ла) та погоджуюсь з умовами участі.",
    proceed: "Перейти до наступного кроку",
    proceedLoading: "Перевіряємо проходження тестів…",
    secureEnv: "Безпечне та конфіденційне середовище",
    testsHint:
      "Пройдіть усі тести та дочекайтеся готовності персонального ШІ-бота, перш ніж продовжити. Обробка результатів після надсилання тесту може тривати до двох годин.",
    nextStep: "Наступний крок",
    passed: "Пройдено",
    notPassed: "Не пройдено",
    locked: "Заблоковано до виконання попередніх",
    pendingCompletion: "Очікує завершення",
    openTest: "Відкрити тест",
    updateTestStatus: "Оновити статус тестів",
    updateBotStatus: "Оновити статус бота",
    personalBoardTitle: "Персональний ШІ-бот",
    personalBoardReady: "Готово",
    personalBoardPending: "Очікується",
    personalBoardReadySubtitle: "Ваш персональний ШІ-бот готовий",
    personalBoardPendingSubtitle: "Обробка профілю — це може зайняти до двох годин",
    personalBoardLockedSubtitle: "Доступно після проходження всіх тестів",
    testMeta: {
      personality_type: {
        title: "Який мій тип характеру",
        subtitle: "Базовий модуль оцінювання",
        icon: "psychology",
      },
      face_fear: {
        title: "Обличчям до страху",
        subtitle: "Модуль емоційної стійкості",
        icon: "mood_bad",
      },
      character_traits: {
        title: "Риси характеру",
        subtitle: "Поглиблений аналіз",
        icon: "analytics",
      },
      personality_conflicts: {
        title: "Конфлікти особистості",
        subtitle: "Модуль динаміки конфліктів",
        icon: "gavel",
      },
    },
    participant: {
      welcomeTitle: "Ласкаво просимо до застосунку",
      welcomeBody:
        "Цей інструмент допоможе вам оцінити психологічний стан, визначити сильні сторони та підготуватися до наступних кроків у вашій справі.",
      welcomeCta: "Почати оцінювання",
      disclaimerIntro:
        "Уважно ознайомтеся з наведеною інформацією перед початком процесу медіації.",
      disclaimerParagraphs: [
        "Цей сервіс не надає професійних юридичних порад і не є заміною терапії. Інструменти та аналітика PsyLex призначені для полегшення комунікації та структурованих переговорів.",
        "Участь на платформі є повністю добровільною. Ви можете призупинити або завершити процес у будь-який момент без наслідків.",
        "Усі ваші відповіді залишаються суворо конфіденційними та захищені шифруванням корпоративного рівня.",
      ],
      testsTitle: "Психологічне оцінювання",
      testsSubtitle: "Пройдіть обов'язкові модулі нижче, щоб продовжити формування профілю медіації.",
    },
    mediator: {
      welcomeTitle: "Ласкаво просимо, медіаторе",
      welcomeBody:
        "Ця платформа допоможе вам проводити структуровану медіацію, переглядати психологічні профілі та спрямовувати сторони до збалансованого рішення.",
      welcomeCta: "Почати налаштування медіатора",
      disclaimerIntro:
        "Уважно ознайомтеся з наведеною інформацією перед проведенням сесій на цій платформі.",
      disclaimerParagraphs: [
        "Як медіатор, ви сприяєте комунікації між сторонами. PsyLex не замінює ваш професійний судж, юридичні консультації чи терапевтичні послуги.",
        "Ви відповідаєте за нейтральність і конфіденційність протягом усього процесу медіації. Участь усіх сторін залишається добровільною.",
        "Усі дані сесій та психологічні оцінювання є конфіденційними та захищені шифруванням корпоративного рівня.",
      ],
      testsTitle: "Оцінювання медіатора",
      testsSubtitle: "Пройдіть обов'язкові модулі нижче, щоб сформувати профіль медіатора та розблокувати інструменти сесій.",
    },
    dashboardTitle: "Усе готово",
    dashboardBody: "Онбординг завершено. Увійдіть до кімнати медіації, коли будете готові.",
    dashboardEnterRoom: "Увійти до кімнати медіації",
    disputeIntakeTitle: "Опишіть ваш спір",
    disputeIntakeSubtitle:
      "Будь ласка, дайте відповіді на наступні запитання, щоб ми могли підготувати сесію медіації.",
    disputeIntakeQ1: "Опишіть, будь ласка, суть спору у довільній формі.",
    disputeIntakeQ2: "Що для вас є найважливішим у цьому конфлікті?",
    disputeIntakeQ3: "Який результат ви вважаєте прийнятним?",
    disputeIntakeSubmit: "Надіслати відповіді",
    disputeIntakeSubmitting: "Надсилання…",
    mediationLobbyTitle: "Готовність до медіації",
    mediationLobbySubtitle:
      "Обидві сторони мають завершити онбординг і відповісти на запитання про спір, перш ніж можна почати медіацію.",
    mediationOppositeSide: "Інша сторона",
    mediationStatusReady: "Готова до медіації",
    mediationStatusNotReady: "Не готова до медіації",
    mediationOppositeNotReady:
      "Інша сторона ще не готова до медіації. Вона може ще проходити тести або відповідати на запитання про спір.",
    mediationStart: "Почати медіацію",
    mediationYourStatus: "Ваш статус",
    mediationAgentsWorking:
      "Агенти аналізу готують вашу сесію медіації. Це може зайняти кілька хвилин. Зачекайте — кнопка «Почати медіацію» стане доступною після завершення аналізу.",
    mediationRoomPreparing:
      "Агент медіації готує вступні повідомлення. Зазвичай це займає хвилину — кнопка «Почати медіацію» з’явиться, коли кімната буде готова.",
    mediationHandshakeWaiting:
      "Ви натиснули «Почати медіацію». Очікуємо, поки інша сторона також натисне кнопку.",
    mediationHandshakeOppositeReady:
      "Інша сторона готова почати. Натисніть «Почати медіацію», щоб разом увійти в сесію.",
    mediationHandshakeStarting: "Обидві сторони готові. Запускаємо медіацію…",
    mediationCountdownLabel: "Час сесії",
    mediationSessionEnded: "60-хвилинна сесія медіації завершилася.",
    mediationElapsedLabel: "Час сесії",
    modeBScheduledAt: "Запланована сесія",
    modeBWaitingSchedule: "Очікуємо, поки медіатор призначить час сесії.",
    modeBStartWindowOpens: "Кнопка старту стане доступною через",
    modeBStartAvailableHint:
      "Кнопка «Почати медіацію» стане доступною за 10 хвилин до запланованого часу.",
    modeBCountdownToStart: "Сесія почнеться через",
    modeBWaitingMediator: "Очікуємо медіатора",
    modeBWaitingPartyA: "Очікуємо сторону A",
    modeBWaitingPartyB: "Очікуємо сторону B",
    modeBSelfClicked: "Ви натиснули «Почати медіацію».",
    modeBAllReadyCountdown: "Усі готові. Сесія почнеться у запланований час.",
    modeBActionRequired: "Потрібна дія",
    modeBNotifyScheduled: "Сесію медіації заплановано.",
    modeBNotifyStartWindow: "Тепер можна натиснути «Почати медіацію».",
    modeBNotifyPeerReady: "Інший учасник готовий почати.",
    modeBNotifySessionStarted: "Сесія медіації розпочалася.",
    modeBNotifyQuestion: "У вас нове запитання від медіатора.",
    modeBNotifyOptions: "Варіанти рішення готові до перегляду.",
    modeBNotifyCompromise: "Компромісний варіант готовий до голосування.",
    modeBNotifyAgreement: "Чернетка угоди готова до перегляду.",
    modeBNotifyCompleted: "Сесію медіації завершено.",
    modeBWaitingCompromisePublish: "Очікуємо, поки медіатор опублікує компромісний варіант.",
    backToStart: "На головну",
    logout: "Вийти",
    helpTitle: "Довідка",
    helpAria: "Відкрити довідку",
    helpDownloadPdf: "Завантажити PDF",
    helpDownloadDocx: "Завантажити DOCX",
    helpNoDocuments: "Для вашої ролі інструкції недоступні.",
    helpChatTitle: "Помічник PsyLex",
    helpChatPlaceholder: "Запитайте про роботу PsyLex…",
    helpChatSend: "Надіслати",
    helpChatClear: "Очистити історію",
    helpChatEmpty: "Запитайте будь-що про роботу PsyLex. Історія зберігається в цьому браузері.",
    helpChatError: "Помічник не зміг відповісти. Спробуйте ще раз за мить.",
    helpChatThinking: "Готуємо відповідь…",
    helpChatOpen: "Відкрити чат-помічника",
    helpChatClose: "Закрити чат-помічника",
    helpDocOverview: "Огляд",
    helpDocParties: "Сторони А і Б",
    helpDocMediator: "Медіатор",
    helpDocAdmin: "Адміністратор",
    roomTitle: "Кімната медіації",
    roomComingSoon: "НЕЗАБАРОМ",
    roomComingSoonDesc: "Функції кімнати медіації перебудовуються та будуть доступні в майбутньому релізі.",
    mediationPhaseLabel: "Фаза",
    mediationRoundLabel: "Раунд",
    mediationYourTurn: "Ваша черга відповісти",
    mediationOtherPartyAnswering: "Інша сторона відповідає",
    mediationOtherPartyAnsweringHint: "Інша сторона зараз відповідає на це запитання.",
    mediationReplyTimer: "Час відповіді",
    mediationReadyForOptions: "Я готовий до варіантів рішення",
    mediationReadyConfirmed: "Ви позначили готовність до варіантів",
    mediationOtherReady: "Інша сторона готова до вибору варіантів рішення.",
    mediationWaitingOtherReady: "Очікуємо, поки інша сторона натисне «готово».",
    mediationReadyForOptionsHint:
      "Обидві сторони можуть натиснути це під час діалогу, щоб достроково перейти до варіантів рішення.",
    mediationPreparing: "Агент медіації готує сесію…",
    mediationAwaitingAgent: "Агент медіації готує наступний крок. Зачекайте, будь ласка.",
    mediationQuestionIncoming: "Ваше запитання готується…",
    mediationYou: "Ви",
    mediationAgent: "Агент медіації",
    mediationSystem: "Система",
    mediationReplyPlaceholder: "Введіть змістовну відповідь…",
    mediationSendReply: "Надіслати відповідь",
    mediationAttackRedirected: "Будь ласка, зосередьтеся на суті спору.",
    mediationActionFailed: "Не вдалося виконати дію. Спробуйте ще раз.",
    mediationOptionsTitle: "Варіанти рішення",
    mediationOptionsReady:
      "Варіанти рішення готові. Перегляньте їх і проголосуйте незалежно.",
    modeBSessionStarted:
      "Сесію під керівництвом медіатора розпочато. Медіатор вестиме діалог.",
    mediationOptionLabel: "Варіант {n}",
    mediationYourSelection: "Ваш вибір",
    mediationPartySelected: "{party} обрала",
    mediationAgreedResolution: "Узгоджене рішення",
    mediationLegalInfo: "Правова інформація (не порада)",
    mediationFulfillment: "Ймовірність виконання",
    mediationRefusalRisks: "Ризики відмови",
    mediationSelectOption: "Обрати цей варіант",
    mediationVoteRecorded: "Ваш голос зафіксовано. Очікуємо іншу сторону.",
    mediationOtherChose: "Інша сторона обрала варіант",
    mediationVotesDiscrepancy: "Сторони обрали різні варіанти. Перегляньте компромісну пропозицію нижче.",
    mediationVotesDiscrepancyPending:
      "Сторони обрали різні варіанти. Для обох сторін готується компромісна пропозиція.",
    mediationCompromiseTitle: "Компромісний варіант",
    mediationCompromiseGenerating: "Голоси розійшлися — AI-медіатор формує компромісний варіант...",
    mediationAcceptCompromise: "Прийняти компроміс",
    mediationRejectCompromise: "Відхилити компроміс",
    mediationCompromiseVoteRecorded: "Ваш голос щодо компромісу зафіксовано.",
    mediationCompromiseAccepted: "Компроміс прийнято",
    mediationCompromiseRejected: "Компроміс відхилено",
    mediationCompromiseNoVote: "Без голосу",
    mediationAgreementTitle: "Проєкт угоди",
    mediationUplDisclaimer:
      "Ця угода є результатом добровільного вибору сторін. PsyLex надає виключно правову інформацію і не надає юридичних послуг. Щоб надати документу юридичну силу, рекомендується звернутися до ліцензованого адвоката.",
    mediationIAccept: "Я приймаю",
    mediationAccepted: "Ви прийняли угоду",
    mediationWaitingOtherAccept: "Очікуємо прийняття від іншої сторони.",
    mediationSessionCompleted: "Сесію завершено",
    mediationDownloadResults: "Завантажити результати",
    mediationPdfPsychodynamicProfile: "Психодинамічний профіль",
    mediationPdfLegislation: "Законодавство",
    mediationPdfSolution: "Рішення",
    mediationPdfDocumentTitle: "Результати медіації",
    mediationPdfCompanyName: "AI Innovation Management LLC",
    mediationPdfTopDisclaimer:
      "Правова інформація, а не правова консультація. PsyLex надає виключно правову інформацію, а не юридичні послуги. Кожне правове твердження містить посилання на джерело з позначкою «інформація станом на 2024–2025»; медіатор підтверджує релевантність перед тим, як сторони її бачать, а сторони направляються до ліцензованого адвоката за консультацією.",
    mediationPdfTerms: "Умови",
    mediationPdfNotAvailable: "Недоступно для цієї сесії.",
    mediationLegislationJurisdiction: "Юрисдикція",
    mediationLegislationSolutionNorms: "Правові норми щодо обраного рішення",
    mediationLegislationOverview: "Загальний правовий аналіз",
    mediationLegislationApplicableLaws: "Застосовні закони",
    mediationLegislationRegulations: "Нормативні акти",
    mediationLegislationCitations: "Цитати з джерел",
    mediationLegislationRelevance: "Релевантність",
    mediationLegislationSource: "Джерело",
    mediationLegislationExcerpt: "Уривок",
    mediationEmailPlaceholder: "Email для угоди (необовʼязково)",
    mediationEmailSend: "Надіслати",
    mediationEmailComingSoon: "Надсилання email незабаром. Поки що скористайтеся завантаженням.",
    mediationNoAgreementOutcome: "У цій сесії взаємну згоду не досягнуто.",
    mediationPhases: {
      opening: "Відкриття",
      dialogue: "Діалог",
      generating_options: "Генерація варіантів",
      voting: "Голосування",
      voting_discrepancy: "Друге голосування",
      agreement: "Угода",
      completed: "Завершено",
    },
    participantFlowNavLabel: "Етапи для сторони",
    flowReviewNext: "Далі",
    flowReviewBackToCurrent: "Повернутися до поточного кроку",
    participantFlowSteps: [
      "Вступ",
      "Згода",
      "Тести",
      "Опис спору",
      "Медіація",
      "Угода",
    ],
  },
};

export function getRoleCopy(role: ParticipantRole, locale: Locale): RoleCopy {
  const copy = portalCopy[locale];
  return role === "mediator" ? copy.mediator : copy.participant;
}
