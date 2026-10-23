import type { AdminCopy } from "@/lib/admin-i18n";
import { AGENT_KEY_LABELS } from "@/lib/pipeline/agent-keys";
import type { RoomActivityEntry } from "@/lib/pipeline/room-activity-log";

const MAX_JSON_LENGTH = 4000;

function truncateJson(value: string) {
  if (value.length <= MAX_JSON_LENGTH) return value;
  return `${value.slice(0, MAX_JSON_LENGTH)}…`;
}

function formatPayloadValue(value: unknown, options?: { fullText?: boolean }): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return options?.fullText ? value : truncateJson(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return truncateJson(JSON.stringify(value, null, 2));
}

function eventLabel(admin: AdminCopy, entry: RoomActivityEntry): string {
  const derived = admin.activityLogEvents[entry.kind];
  if (derived) return derived;

  if (entry.source === "pipeline") {
    const pipeline = admin.activityLogPipelineEvents[entry.kind];
    if (pipeline) return pipeline;
    return entry.kind;
  }

  return entry.kind;
}

function partyLabel(admin: AdminCopy, entry: RoomActivityEntry) {
  if (!entry.partyRole) return null;
  return admin.roles[entry.partyRole] ?? entry.partyRole;
}

function formatPayloadLines(
  admin: AdminCopy,
  entry: RoomActivityEntry,
): string[] {
  if (!entry.payload) return [];

  const lines: string[] = [];
  const payload = entry.payload;

  if (entry.kind === "test_completed" && typeof payload.testKey === "string") {
    const testName =
      admin.activityLogTests[payload.testKey] ?? payload.testKey;
    lines.push(`${admin.activityLogFields.test}: ${testName}`);
    return lines;
  }

  if (entry.kind === "dispute_intake_submitted") {
    if (payload.disputeDescription) {
      lines.push(
        `${admin.activityLogFields.disputeDescription}: ${formatPayloadValue(payload.disputeDescription)}`,
      );
    }
    if (payload.disputePriority) {
      lines.push(
        `${admin.activityLogFields.disputePriority}: ${formatPayloadValue(payload.disputePriority)}`,
      );
    }
    if (payload.disputeAcceptableOutcome) {
      lines.push(
        `${admin.activityLogFields.disputeAcceptableOutcome}: ${formatPayloadValue(payload.disputeAcceptableOutcome)}`,
      );
    }
    return lines;
  }

  if (entry.kind === "participant_message" || entry.kind === "mediation_message") {
    if (payload.sender) {
      lines.push(`${admin.activityLogFields.sender ?? "Sender"}: ${String(payload.sender)}`);
    }
    if (payload.channel) {
      lines.push(`${admin.activityLogFields.channel}: ${String(payload.channel)}`);
    }
    if (payload.audience) {
      lines.push(`${admin.activityLogFields.audience ?? "Audience"}: ${String(payload.audience)}`);
    }
    if (payload.messageKind) {
      lines.push(`${admin.activityLogFields.messageKind}: ${String(payload.messageKind)}`);
    }
    if (payload.content) {
      lines.push(
        `${admin.activityLogFields.message}: ${formatPayloadValue(payload.content, { fullText: true })}`,
      );
    }
    return lines;
  }

  if (entry.kind === "personal_bot_ready" && payload.personalBotPrompt) {
    lines.push(
      `${admin.activityLogFields.personalBotPrompt}: ${formatPayloadValue(payload.personalBotPrompt)}`,
    );
    return lines;
  }

  if (entry.kind === "options_published" && Array.isArray(payload.options)) {
    for (const option of payload.options) {
      if (!option || typeof option !== "object") continue;
      const row = option as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : "—";
      const text =
        typeof row.canonicalDescription === "string" ? row.canonicalDescription : "—";
      lines.push(`${admin.activityLogFields.optionId ?? "Option"} ${id}: ${text}`);
    }
    return lines;
  }

  if (entry.kind === "option_vote_cast") {
    if (payload.partyRole) {
      lines.push(
        `${admin.activityLogFields.partyRole ?? "Party"}: ${String(payload.partyRole)}`,
      );
    }
    if (payload.optionId) {
      lines.push(`${admin.activityLogFields.optionId ?? "Option"}: ${String(payload.optionId)}`);
    }
    if (payload.canonicalDescription) {
      lines.push(
        `${admin.activityLogFields.canonicalDescription ?? "Description"}: ${formatPayloadValue(payload.canonicalDescription, { fullText: true })}`,
      );
    }
    return lines;
  }

  if (
    entry.kind === "compromise_published" ||
    entry.kind === "compromise_rejected" ||
    entry.kind === "agreement_published" ||
    entry.kind === "session_completed_with_agreement" ||
    entry.kind === "session_ended_without_agreement"
  ) {
    if (payload.canonicalDescription) {
      lines.push(
        `${admin.activityLogFields.canonicalDescription ?? "Description"}: ${formatPayloadValue(payload.canonicalDescription, { fullText: true })}`,
      );
    }
    if (payload.title) {
      lines.push(`${admin.activityLogFields.title ?? "Title"}: ${String(payload.title)}`);
    }
    if (Array.isArray(payload.terms)) {
      for (const term of payload.terms) {
        lines.push(`${admin.activityLogFields.terms ?? "Terms"}: ${String(term)}`);
      }
    }
    if (payload.reason) {
      lines.push(`${admin.activityLogFields.reason}: ${String(payload.reason)}`);
    }
    if (payload.optionId) {
      lines.push(`${admin.activityLogFields.optionId ?? "Option"}: ${String(payload.optionId)}`);
    }
    return lines;
  }

  for (const [key, value] of Object.entries(payload)) {
    const label = admin.activityLogFields[key] ?? key;
    lines.push(`${label}: ${formatPayloadValue(value)}`);
  }

  return lines;
}

export type FormattedRoomActivityEntry = {
  id: string;
  title: string;
  subtitle: string | null;
  detailLines: string[];
  occurredAt: Date;
  sourceLabel: string;
};

export function formatRoomActivityEntry(
  admin: AdminCopy,
  entry: RoomActivityEntry,
): FormattedRoomActivityEntry {
  const title = eventLabel(admin, entry);
  const party = partyLabel(admin, entry);
  const agent =
    entry.agentKey && entry.agentKey in AGENT_KEY_LABELS
      ? AGENT_KEY_LABELS[entry.agentKey as keyof typeof AGENT_KEY_LABELS]
      : entry.agentKey;

  const subtitleParts = [party, agent].filter(Boolean);
  const detailLines = formatPayloadLines(admin, entry);

  return {
    id: entry.id,
    title,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : null,
    detailLines,
    occurredAt: entry.occurredAt,
    sourceLabel:
      entry.source === "pipeline"
        ? admin.activityLogSourcePipeline
        : admin.activityLogSourceMilestone,
  };
}
