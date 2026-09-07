import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/drizzle/schema";
import { postgresSslOption } from "@/lib/db-ssl";

const connectionString = process.env.DATABASE_URL ?? "postgres://invalid:invalid@localhost:5432/invalid";

type PostgresClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: PostgresClient;
};

function createClient() {
  return postgres(connectionString, {
    prepare: false,
    connect_timeout: 2,
    ssl: postgresSslOption(connectionString),
    max: process.env.NODE_ENV === "production" ? 3 : 5,
  });
}

const queryClient = globalForDb.postgresClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = queryClient;
}

export const db = drizzle(queryClient, { schema });
