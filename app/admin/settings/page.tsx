import { getAllLegalDocuments } from "@/lib/rag/documents";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getAllAgentPrompts } from "@/lib/pipeline/load-prompt";
import { listAllHelpDocuments } from "@/lib/help/documents";
import { AGENT_KEYS, type AgentKey } from "@/lib/pipeline/agent-keys";
import { SettingsContent } from "@/components/admin/settings-content";

export default async function AdminSettingsPage() {
  const [settings, documents, promptRows, helpDocuments] = await Promise.all([
    getPlatformSettings(),
    getAllLegalDocuments(),
    getAllAgentPrompts(),
    listAllHelpDocuments(),
  ]);

  const promptMap = new Map(promptRows.map((row) => [row.agentKey, row.systemPrompt]));
  const prompts = AGENT_KEYS.map((agentKey) => ({
    agentKey,
    systemPrompt: promptMap.get(agentKey) ?? "",
  }));

  return <SettingsContent documents={documents} helpDocuments={helpDocuments} prompts={prompts} settings={settings} />;
}
