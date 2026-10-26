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
  mediationStartNow: string;
  mediationStartNowHint: string;
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
  modeBNotifyCompromiseRejected: string;
  modeBNotifyAgreement: string;
  modeBNotifyCompleted: string;
  modeBSessionTimeUp: string;
  modeBWaitingCompromisePublish: string;
  modeBWaitingAgreementPublish: string;
  modeBWaitingMediatorComplete: string;
  modeBToastWaitingSchedule: string;
  modeBToastWaitingMediatorQuestion: string;
  modeBToastWaitingOtherVote: string;
  modeBToastMediatorWaitingPartyA: string;
  modeBToastMediatorWaitingPartyB: string;
  modeBToastMediatorReadyNext: string;
  modeBToastGeneratingCandidates: string;
  modeBToastCandidatesReady: string;
  modeBToastGeneratingCompromise: string;
  modeBToastCompromiseDraftReady: string;
  modeBToastAgreementDraftReady: string;
  modeBToastWaitingVotes: string;
  modeBToastWaitingCompromiseVotes: string;
  modeBToastBothAcceptedEnd: string;
  modeBToastSessionStarting: string;
  modeBToastPartyAVoted: string;
  modeBToastPartyBVoted: string;
  modeBToastPartyAAcceptedCompromise: string;
  modeBToastPartyBAcceptedCompromise: string;
  modeBToastPartyARejectedCompromise: string;
  modeBToastPartyBRejectedCompromise: string;
  modeBToastCompromiseBothRejected: string;
  modeBToastPartyAAcceptedAgreement: string;
  modeBToastPartyBAcceptedAgreement: string;
  modeBToastPartyAReplied: string;
  modeBToastPartyBReplied: string;
  myRoomsTitle: string;
  myRoomsSubtitle: string;
  myRoomsEmpty: string;
  myRoomsStatusCompleted: string;
  myRoomsStatusLive: string;
  myRoomsStatusScheduled: string;
  myRoomsStatusPrep: string;
  myRoomsStatusIntake: string;
  myRoomsNav: string;
  profileRefreshBanner: string;
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
  mediationMediatorLabel: (name: string) => string;
  mediationSystem: string;
  mediationReplyPlaceholder: string;
  mediationSendReply: string;
  mediationTranslatedBadge: string;
  mediationShowOriginal: string;
  mediationHideOriginal: string;
  mediationHelpFormulate: string;
  mediationHelpFormulatePending: string;
  mediationHelpFormulateFailed: string;
  mediationAttackRedirected: string;
  mediationActionFailed: string;
  modeAToastIntakeSubmitting: string;
  modeAToastPipelineWorking: string;
  modeAToastOpeningPreparing: string;
  modeAToastGeneratingQuestion: string;
  modeAToastGeneratingOptions: string;
  modeAToastGeneratingCompromise: string;
  modeAToastGeneratingAgreement: string;
  modeAToastNewQuestion: string;
  modeAToastOptionsReady: string;
  modeAToastCompromiseReady: string;
  modeAToastAgreementReady: string;
  modeAToastTestsSaving: string;
  modeAToastSendFailedRetry: string;
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
    mediationStartNow: "Start now",
    mediationStartNowHint:
      "Available when Party A, Party B, and you have all clicked Start Mediation.",
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
    mediationSessionEnded: "The mediation session has ended.",
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
    modeBAllReadyCountdown:
      "Everyone is ready. The session starts at the scheduled time, or the mediator can start now.",
    modeBActionRequired: "Action required",
    modeBNotifyScheduled: "A mediation session has been scheduled.",
    modeBNotifyStartWindow: "You can now click Start Mediation.",
    modeBNotifyPeerReady: "Another participant is ready to start.",
    modeBNotifySessionStarted: "The mediation session has started.",
    modeBNotifyQuestion: "You have a new question from the mediator.",
    modeBNotifyOptions: "Solution options are ready to review.",
    modeBNotifyCompromise: "A compromise option is ready for your vote.",
    modeBNotifyCompromiseRejected:
      "Compromise was not accepted by both parties. The mediator may continue the session.",
    modeBNotifyAgreement: "The agreement is ready for your confirmation.",
    modeBNotifyCompleted: "The mediation session has completed.",
    modeBSessionTimeUp:
      "Scheduled session time is up. The mediator will complete the session when ready.",
    modeBWaitingCompromisePublish: "Waiting for the mediator to publish a compromise option.",
    modeBWaitingAgreementPublish: "Waiting for the mediator to finalize the agreement.",
    modeBWaitingMediatorComplete:
      "Both parties have accepted. Waiting for the mediator to complete the session.",
    modeBToastWaitingSchedule: "Waiting for the mediator to schedule the session.",
    modeBToastWaitingMediatorQuestion: "Waiting for the mediator’s next question.",
    modeBToastWaitingOtherVote: "Waiting for the other party to vote.",
    modeBToastMediatorWaitingPartyA: "Waiting for Party A to answer.",
    modeBToastMediatorWaitingPartyB: "Waiting for Party B to answer.",
    modeBToastMediatorReadyNext: "Parties have replied — send the next question or generate options.",
    modeBToastGeneratingCandidates: "Generating question suggestions…",
    modeBToastCandidatesReady: "Question suggestions are ready to send.",
    modeBToastGeneratingCompromise: "Generating a compromise option for the parties…",
    modeBToastCompromiseDraftReady: "Compromise draft is ready to review and publish.",
    modeBToastAgreementDraftReady: "Agreement draft is ready to review and publish.",
    modeBToastWaitingVotes: "Waiting for parties to vote on options.",
    modeBToastWaitingCompromiseVotes: "Waiting for parties to vote on the compromise.",
    modeBToastBothAcceptedEnd: "Both parties accepted — you can complete the session.",
    modeBToastSessionStarting: "Everyone is ready — session is starting…",
    modeBToastPartyAVoted: "Party A selected a solution option.",
    modeBToastPartyBVoted: "Party B selected a solution option.",
    modeBToastPartyAAcceptedCompromise: "Party A accepted the compromise.",
    modeBToastPartyBAcceptedCompromise: "Party B accepted the compromise.",
    modeBToastPartyARejectedCompromise: "Party A rejected the compromise.",
    modeBToastPartyBRejectedCompromise: "Party B rejected the compromise.",
    modeBToastCompromiseBothRejected: "Both parties rejected the compromise.",
    modeBToastPartyAAcceptedAgreement: "Party A accepted the agreement.",
    modeBToastPartyBAcceptedAgreement: "Party B accepted the agreement.",
    modeBToastPartyAReplied: "Party A replied.",
    modeBToastPartyBReplied: "Party B replied.",
    myRoomsTitle: "My rooms",
    myRoomsSubtitle: "Select a mediation room to continue.",
    myRoomsEmpty: "You are not assigned to any rooms yet.",
    myRoomsStatusCompleted: "Completed",
    myRoomsStatusLive: "In session",
    myRoomsStatusScheduled: "Scheduled",
    myRoomsStatusPrep: "Preparing",
    myRoomsStatusIntake: "Needs dispute intake",
    myRoomsNav: "My rooms",
    profileRefreshBanner:
      "Your mediator asked you to update your profile. Please complete the tests again.",
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
    mediationOtherPartyAnsweringHint: "The other party is currently answering question.",
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
    mediationMediatorLabel: (name) => `Mediator: ${name}`,
    mediationSystem: "System",
    mediationReplyPlaceholder: "Type your substantive reply…",
    mediationSendReply: "Send reply",
    mediationTranslatedBadge: "Translated",
    mediationShowOriginal: "Show original",
    mediationHideOriginal: "Hide original",
    mediationHelpFormulate: "Help me phrase this",
    mediationHelpFormulatePending: "Rewriting…",
    mediationHelpFormulateFailed: "Could not rewrite. Try again.",
    mediationAttackRedirected: "Please focus on the substance of the dispute.",
    mediationActionFailed: "Action failed. Please try again.",
    modeAToastIntakeSubmitting: "Saving your answers…",
    modeAToastPipelineWorking:
      "Analyzing your intake — this can take up to about 5–10 minutes.",
    modeAToastOpeningPreparing:
      "Preparing your mediation opening — usually under a couple of minutes.",
    modeAToastGeneratingQuestion:
      "Generating the next question — usually under 1–2 minutes.",
    modeAToastGeneratingOptions:
      "Generating solution options — this can take up to about 10 minutes.",
    modeAToastGeneratingCompromise:
      "Generating a compromise — this can take up to about 10 minutes.",
    modeAToastGeneratingAgreement: "Preparing the draft agreement…",
    modeAToastNewQuestion: "You have a new question — please answer.",
    modeAToastOptionsReady: "Solution options are ready — please review and vote.",
    modeAToastCompromiseReady: "A compromise is ready — please vote.",
    modeAToastAgreementReady: "The draft agreement is ready — please review.",
    modeAToastTestsSaving: "Saving your test progress…",
    modeAToastSendFailedRetry:
      "Could not send your reply. Your text was restored — please try again.",
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
    mediationStartNow: "Почати зараз",
    mediationStartNowHint:
      "Доступно, коли сторона A, сторона B і ви всі натиснули «Почати медіацію».",
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
    mediationSessionEnded: "Сесію медіації завершено.",
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
    modeBAllReadyCountdown:
      "Усі готові. Сесія почнеться у запланований час, або медіатор може почати зараз.",
    modeBActionRequired: "Потрібна дія",
    modeBNotifyScheduled: "Сесію медіації заплановано.",
    modeBNotifyStartWindow: "Тепер можна натиснути «Почати медіацію».",
    modeBNotifyPeerReady: "Інший учасник готовий почати.",
    modeBNotifySessionStarted: "Сесія медіації розпочалася.",
    modeBNotifyQuestion: "У вас нове запитання від медіатора.",
    modeBNotifyOptions: "Варіанти рішення готові до перегляду.",
    modeBNotifyCompromise: "Компромісний варіант готовий до голосування.",
    modeBNotifyCompromiseRejected:
      "Компроміс не прийнято обома сторонами. Медіатор може продовжити сесію.",
    modeBNotifyAgreement: "Угода готова до вашого підтвердження.",
    modeBNotifyCompleted: "Сесію медіації завершено.",
    modeBSessionTimeUp:
      "Запланований час сесії минув. Медіатор завершить сесію, коли буде готовий.",
    modeBWaitingCompromisePublish: "Очікуємо, поки медіатор опублікує компромісний варіант.",
    modeBWaitingAgreementPublish: "Очікуємо, поки медіатор фіналізує угоду.",
    modeBWaitingMediatorComplete:
      "Обидві сторони прийняли угоду. Очікуємо, поки медіатор завершить сесію.",
    modeBToastWaitingSchedule: "Очікуємо, поки медіатор призначить сесію.",
    modeBToastWaitingMediatorQuestion: "Очікуємо наступне запитання від медіатора.",
    modeBToastWaitingOtherVote: "Очікуємо голосування іншої сторони.",
    modeBToastMediatorWaitingPartyA: "Очікуємо відповідь сторони A.",
    modeBToastMediatorWaitingPartyB: "Очікуємо відповідь сторони B.",
    modeBToastMediatorReadyNext:
      "Сторони відповіли — надішліть наступне запитання або згенеруйте варіанти.",
    modeBToastGeneratingCandidates: "Генеруємо пропозиції запитань…",
    modeBToastCandidatesReady: "Пропозиції запитань готові до надсилання.",
    modeBToastGeneratingCompromise: "Генеруємо компромісний варіант для сторін…",
    modeBToastCompromiseDraftReady: "Чернетка компромісу готова до перегляду та публікації.",
    modeBToastAgreementDraftReady: "Чернетка угоди готова до перегляду та публікації.",
    modeBToastWaitingVotes: "Очікуємо голосування сторін за варіанти.",
    modeBToastWaitingCompromiseVotes: "Очікуємо голосування сторін за компроміс.",
    modeBToastBothAcceptedEnd: "Обидві сторони прийняли угоду — можна завершити сесію.",
    modeBToastSessionStarting: "Усі готові — сесія починається…",
    modeBToastPartyAVoted: "Сторона A обрала варіант рішення.",
    modeBToastPartyBVoted: "Сторона B обрала варіант рішення.",
    modeBToastPartyAAcceptedCompromise: "Сторона A прийняла компроміс.",
    modeBToastPartyBAcceptedCompromise: "Сторона B прийняла компроміс.",
    modeBToastPartyARejectedCompromise: "Сторона A відхилила компроміс.",
    modeBToastPartyBRejectedCompromise: "Сторона B відхилила компроміс.",
    modeBToastCompromiseBothRejected: "Обидві сторони відхилили компроміс.",
    modeBToastPartyAAcceptedAgreement: "Сторона A прийняла угоду.",
    modeBToastPartyBAcceptedAgreement: "Сторона B прийняла угоду.",
    modeBToastPartyAReplied: "Сторона A відповіла.",
    modeBToastPartyBReplied: "Сторона B відповіла.",
    myRoomsTitle: "Мої кімнати",
    myRoomsSubtitle: "Оберіть кімнату медіації, щоб продовжити.",
    myRoomsEmpty: "Вас ще не додано до жодної кімнати.",
    myRoomsStatusCompleted: "Завершено",
    myRoomsStatusLive: "У сесії",
    myRoomsStatusScheduled: "Заплановано",
    myRoomsStatusPrep: "Підготовка",
    myRoomsStatusIntake: "Потрібен опис спору",
    myRoomsNav: "Мої кімнати",
    profileRefreshBanner:
      "Медіатор попросив оновити профіль. Будь ласка, пройдіть тести знову.",
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
    mediationOtherPartyAnsweringHint: "Інша сторона зараз відповідає на запитання.",
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
    mediationMediatorLabel: (name) => `Медіатор: ${name}`,
    mediationSystem: "Система",
    mediationReplyPlaceholder: "Введіть змістовну відповідь…",
    mediationSendReply: "Надіслати відповідь",
    mediationTranslatedBadge: "Перекладено",
    mediationShowOriginal: "Показати оригінал",
    mediationHideOriginal: "Приховати оригінал",
    mediationHelpFormulate: "Допоможи сформулювати",
    mediationHelpFormulatePending: "Переписуємо…",
    mediationHelpFormulateFailed: "Не вдалося переписати. Спробуйте ще раз.",
    mediationAttackRedirected: "Будь ласка, зосередьтеся на суті спору.",
    mediationActionFailed: "Не вдалося виконати дію. Спробуйте ще раз.",
    modeAToastIntakeSubmitting: "Зберігаємо ваші відповіді…",
    modeAToastPipelineWorking:
      "Аналізуємо анкету — це може зайняти приблизно до 5–10 хвилин.",
    modeAToastOpeningPreparing:
      "Готуємо вступ до медіації — зазвичай до кількох хвилин.",
    modeAToastGeneratingQuestion:
      "Готуємо наступне запитання — зазвичай до 1–2 хвилин.",
    modeAToastGeneratingOptions:
      "Формуємо варіанти рішення — це може зайняти приблизно до 10 хвилин.",
    modeAToastGeneratingCompromise:
      "Формуємо компроміс — це може зайняти приблизно до 10 хвилин.",
    modeAToastGeneratingAgreement: "Готуємо проєкт угоди…",
    modeAToastNewQuestion: "У вас нове запитання — будь ласка, дайте відповідь.",
    modeAToastOptionsReady: "Варіанти рішення готові — перегляньте й проголосуйте.",
    modeAToastCompromiseReady: "Компроміс готовий — будь ласка, проголосуйте.",
    modeAToastAgreementReady: "Проєкт угоди готовий — будь ласка, перегляньте.",
    modeAToastTestsSaving: "Зберігаємо прогрес тестів…",
    modeAToastSendFailedRetry:
      "Не вдалося надіслати відповідь. Текст відновлено — спробуйте ще раз.",
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
