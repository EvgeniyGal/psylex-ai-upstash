import type { TestKey } from "@/lib/test-keys";

export type AirtableTableConfig = {
  baseId: string;
  tableId: string;
  loginField: string;
};

export const TEST_AIRTABLE_CONFIG: Record<TestKey, AirtableTableConfig> = {
  personality_type: {
    baseId: "app1BCLSbEJjEOwYC",
    tableId: "tblQX0d7Y5upguWVN",
    loginField: "U_Email",
  },
  face_fear: {
    baseId: "appD8bCuWdqbVTNPX",
    tableId: "tblKDNcU8e7T9ISN8",
    loginField: "Електронна адреса",
  },
  character_traits: {
    baseId: "app4NSOtEu3oPT1Fi",
    tableId: "tblQX0d7Y5upguWVN",
    loginField: "U_Email",
  },
  personality_conflicts: {
    baseId: "appoy9cxR5YxWMkkL",
    tableId: "tblg5IEV6SlV5NqMv",
    loginField: "Email",
  },
};

export const PERSONAL_BOT_AIRTABLE_CONFIG: AirtableTableConfig & {
  promptField: string;
  /** Optional Airtable "Last modified time" field for the prompt; falls back to record createdTime. */
  promptUpdatedField?: string;
} = {
  baseId: "app1ZVsARMCWgWOPz",
  tableId: "tblbaCrLD2UOk6euI",
  loginField: "Email",
  promptField: "prompt",
};
