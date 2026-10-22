export const AGENT_KEYS = [
  "psychodynamic",
  "interests",
  "emotional_triggers",
  "legal_analysis",
  "mediation",
] as const;

export type AgentKey = (typeof AGENT_KEYS)[number];

export type PostIntakeAgentKey = Exclude<AgentKey, "mediation">;

export const AGENT_KEY_LABELS: Record<AgentKey, string> = {
  psychodynamic: "Psychodynamic Profile",
  interests: "Interests Analysis",
  emotional_triggers: "Emotional Triggers",
  legal_analysis: "Legal Analysis",
  mediation: "Mediation Agent",
};

export type PipelineEventType =
  | "pipeline_triggered"
  | "pipeline_completed"
  | "agent_started"
  | "agent_completed"
  | "agent_failed"
  | "agent_skipped"
  | "mediation_phase_changed"
  | "mediation_timer_expired"
  | "options_published"
  | "option_vote_cast"
  | "compromise_published"
  | "agreement_published"
  | "session_ended_without_agreement";
