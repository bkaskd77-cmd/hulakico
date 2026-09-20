import type { DatabaseSync } from "node:sqlite";

export function ensureSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK (account_type IN ('INDIVIDUAL', 'BUSINESS')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
      UNIQUE (user_id, organization_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS carriers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      transport_mode TEXT NOT NULL CHECK (transport_mode IN ('THIRD_PARTY', 'OWN_FLEET')),
      scope TEXT NOT NULL CHECK (scope IN ('DOMESTIC', 'INTERNATIONAL', 'BOTH')),
      is_active INTEGER NOT NULL DEFAULT 1,
      adapter_key TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS carrier_services (
      id TEXT PRIMARY KEY,
      carrier_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      service_class TEXT NOT NULL CHECK (service_class IN ('EXPRESS', 'ECONOMY', 'FREIGHT_ASSIST')),
      eta_days_min INTEGER NOT NULL,
      eta_days_max INTEGER NOT NULL,
      supports_cod INTEGER NOT NULL DEFAULT 0,
      UNIQUE (carrier_id, code),
      FOREIGN KEY (carrier_id) REFERENCES carriers(id)
    );

    CREATE TABLE IF NOT EXISTS rate_cards (
      id TEXT PRIMARY KEY,
      carrier_service_id TEXT NOT NULL,
      currency TEXT NOT NULL,
      base_amount REAL NOT NULL,
      per_kg_amount REAL NOT NULL,
      zone_label TEXT NOT NULL,
      FOREIGN KEY (carrier_service_id) REFERENCES carrier_services(id)
    );
  `);
}
