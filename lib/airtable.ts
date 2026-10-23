import type { AirtableTableConfig } from "@/lib/airtable-config";

export type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: AirtableRecord[];
  offset?: string;
};

function escapeFormulaValue(value: string) {
  return value.replace(/'/g, "''");
}

/** Match when the email field contains the bare portal login (e.g. finds `psylex_x@test.com`). */
function buildFilterFormula(fieldName: string, login: string) {
  return `FIND('${escapeFormulaValue(login)}', {${fieldName}})`;
}

async function listAirtableRecordsByLogin(
  apiKey: string,
  config: AirtableTableConfig,
  login: string,
): Promise<AirtableRecord[]> {
  const formula = buildFilterFormula(config.loginField, login);
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${config.baseId}/${config.tableId}`);
    url.searchParams.set("filterByFormula", formula);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `Airtable request failed (${response.status}) for ${config.baseId}/${config.tableId}: ${body}`,
      );
      return records;
    }

    const data = (await response.json()) as AirtableListResponse;
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);

  return records;
}

export async function findAirtableRecordByLogin(
  apiKey: string,
  config: AirtableTableConfig,
  login: string,
): Promise<AirtableRecord | null> {
  const latest = await findLatestAirtableRecordByLogin(apiKey, config, login);
  return latest;
}

/** Latest matching record by Airtable `createdTime` (ISO). */
export async function findLatestAirtableRecordByLogin(
  apiKey: string,
  config: AirtableTableConfig,
  login: string,
): Promise<AirtableRecord | null> {
  const records = await listAirtableRecordsByLogin(apiKey, config, login);
  if (records.length === 0) return null;

  let best: AirtableRecord | null = null;
  let bestMs = -1;
  for (const record of records) {
    const ms = record.createdTime ? Date.parse(record.createdTime) : Number.NaN;
    if (!Number.isNaN(ms) && ms >= bestMs) {
      best = record;
      bestMs = ms;
    } else if (!best) {
      best = record;
    }
  }
  return best;
}

export async function hasAirtableRecordForLogin(
  apiKey: string,
  config: AirtableTableConfig,
  login: string,
) {
  const record = await findLatestAirtableRecordByLogin(apiKey, config, login);
  return record !== null;
}

export function parseAirtableCreatedTime(record: AirtableRecord | null): Date | null {
  if (!record?.createdTime) return null;
  const ms = Date.parse(record.createdTime);
  return Number.isNaN(ms) ? null : new Date(ms);
}

export function parseAirtableFieldDate(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : new Date(ms);
  }
  return null;
}
