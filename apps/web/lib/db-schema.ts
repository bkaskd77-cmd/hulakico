import type { DatabaseSync } from "node:sqlite";

export function ensureSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK (account_type IN ('INDIVIDUAL', 'BUSINESS')),
      platform_role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (
        platform_role IN ('CUSTOMER', 'OPS', 'ADMIN')
      ),
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

    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      organization_id TEXT,
      status TEXT NOT NULL CHECK (status IN (
        'DRAFT', 'QUOTED', 'BOOKED', 'HANDOVER_PENDING', 'IN_TRANSIT',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO', 'EXCEPTION', 'CANCELLED'
      )),
      transport_mode TEXT NOT NULL CHECK (transport_mode IN ('THIRD_PARTY', 'OWN_FLEET')),
      lane TEXT NOT NULL CHECK (lane IN ('DOMESTIC', 'INTERNATIONAL')),
      package_type TEXT NOT NULL CHECK (package_type IN ('DOCUMENT', 'PARCEL', 'FREIGHT_LITE')),
      service_class TEXT NOT NULL CHECK (service_class IN ('EXPRESS', 'ECONOMY', 'FREIGHT_ASSIST')),
      origin_country TEXT NOT NULL,
      origin_city TEXT NOT NULL,
      origin_address TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      destination_city TEXT NOT NULL,
      destination_address TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      length_cm REAL,
      width_cm REAL,
      height_cm REAL,
      declared_value REAL,
      currency TEXT NOT NULL,
      contents TEXT NOT NULL,
      wants_cod INTEGER NOT NULL DEFAULT 0,
      hulakico_awb TEXT,
      external_awb TEXT,
      selected_quote_option_id TEXT,
      carrier_id TEXT,
      carrier_service_id TEXT,
      tracking_token TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS quote_options (
      id TEXT PRIMARY KEY,
      quote_id TEXT NOT NULL,
      carrier_id TEXT NOT NULL,
      carrier_service_id TEXT NOT NULL,
      carrier_name TEXT NOT NULL,
      service_name TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount REAL NOT NULL,
      eta_days_min INTEGER NOT NULL,
      eta_days_max INTEGER NOT NULL,
      zone_label TEXT NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
    );

    CREATE TABLE IF NOT EXISTS tracking_events (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT,
      occurred_at TEXT NOT NULL,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS exception_cases (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL,
      opened_by_user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('OPEN', 'INFO_REQUIRED', 'RESOLVED')),
      reason TEXT NOT NULL,
      previous_status TEXT NOT NULL,
      resolution_note TEXT,
      info_request_note TEXT,
      customer_reply TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      info_requested_at TEXT,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS cod_collections (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN (
        'PENDING_COLLECTION', 'COLLECTED', 'SETTLED', 'FAILED'
      )),
      collected_at TEXT,
      settled_at TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );
  `);

  migrateShipmentColumns(database);
  migrateUserPlatformRole(database);
  migrateExceptionInfoRequired(database);
  bootstrapOpsRole(database);
}

function migrateExceptionInfoRequired(database: DatabaseSync): void {
  try {
    const columns = database
      .prepare("PRAGMA table_info(exception_cases)")
      .all() as Array<{ name: string }>;
    if (columns.length === 0) return;
    const names = new Set(columns.map((column) => column.name));
    if (names.has("info_request_note")) return;

    database.exec(`
      CREATE TABLE exception_cases_v2 (
        id TEXT PRIMARY KEY,
        shipment_id TEXT NOT NULL,
        opened_by_user_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('OPEN', 'INFO_REQUIRED', 'RESOLVED')),
        reason TEXT NOT NULL,
        previous_status TEXT NOT NULL,
        resolution_note TEXT,
        info_request_note TEXT,
        customer_reply TEXT,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        info_requested_at TEXT,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id)
      );
      INSERT INTO exception_cases_v2 (
        id, shipment_id, opened_by_user_id, status, reason, previous_status,
        resolution_note, created_at, resolved_at
      )
      SELECT id, shipment_id, opened_by_user_id, status, reason, previous_status,
             resolution_note, created_at, resolved_at
      FROM exception_cases;
      DROP TABLE exception_cases;
      ALTER TABLE exception_cases_v2 RENAME TO exception_cases;
    `);
  } catch (error) {
    console.error(
      "[db-schema.ts:migrateExceptionInfoRequired]",
      error instanceof Error ? error.message : error,
    );
  }
}

function migrateUserPlatformRole(database: DatabaseSync): void {
  const columns = database
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;
  const names = new Set(columns.map((column) => column.name));
  if (!names.has("platform_role")) {
    database.exec(
      `ALTER TABLE users ADD COLUMN platform_role TEXT NOT NULL DEFAULT 'CUSTOMER'`,
    );
  }
}

function bootstrapOpsRole(database: DatabaseSync): void {
  try {
    const email = process.env.OPS_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    if (!email) return;
    database
      .prepare(
        `UPDATE users SET platform_role = 'OPS'
         WHERE email = ? AND platform_role = 'CUSTOMER'`,
      )
      .run(email);
  } catch (error) {
    console.error(
      "[db-schema.ts:bootstrapOpsRole]",
      error instanceof Error ? error.message : error,
    );
  }
}

function migrateShipmentColumns(database: DatabaseSync): void {
  const columns = database
    .prepare("PRAGMA table_info(shipments)")
    .all() as Array<{ name: string }>;
  const names = new Set(columns.map((column) => column.name));
  const additions: Array<[string, string]> = [
    ["hulakico_awb", "TEXT"],
    ["external_awb", "TEXT"],
    ["selected_quote_option_id", "TEXT"],
    ["carrier_id", "TEXT"],
    ["carrier_service_id", "TEXT"],
    ["tracking_token", "TEXT"],
  ];
  for (const [name, type] of additions) {
    if (!names.has(name)) {
      database.exec(`ALTER TABLE shipments ADD COLUMN ${name} ${type}`);
    }
  }
}
