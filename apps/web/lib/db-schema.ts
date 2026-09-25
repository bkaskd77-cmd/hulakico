import type { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

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

    CREATE TABLE IF NOT EXISTS saved_addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      label TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT,
      line1 TEXT NOT NULL,
      line2 TEXT,
      is_residential INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS commercial_invoices (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL UNIQUE,
      currency TEXT NOT NULL CHECK (currency IN ('NPR', 'USD')),
      export_reason TEXT NOT NULL DEFAULT 'SALE' CHECK (
        export_reason IN ('SALE', 'GIFT', 'SAMPLE', 'RETURN', 'OTHER')
      ),
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS commercial_invoice_lines (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'PCS',
      unit_value REAL NOT NULL,
      weight_kg REAL,
      hs_code TEXT,
      country_of_origin TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES commercial_invoices(id)
    );
  `);

  migrateShipmentColumns(database);
  migrateUserPlatformRole(database);
  migrateExceptionInfoRequired(database);
  migrateInvoiceLineWeight(database);
  ensureStaffTables(database);
  migrateStaffRoles(database);
  bootstrapStaffAdmin(database);
  ensureSiteContentTable(database);
  ensureContactMessagesTable(database);
}

function ensureContactMessagesTable(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      topic TEXT NOT NULL,
      reference TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TEXT NOT NULL
    );
  `);
}

function ensureSiteContentTable(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS site_content (
      slug TEXT PRIMARY KEY,
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function migrateInvoiceLineWeight(database: DatabaseSync): void {
  try {
    const columns = database
      .prepare("PRAGMA table_info(commercial_invoice_lines)")
      .all() as Array<{ name: string }>;
    if (columns.length === 0) return;
    const names = new Set(columns.map((column) => column.name));
    if (names.has("weight_kg")) return;
    database.exec(`ALTER TABLE commercial_invoice_lines ADD COLUMN weight_kg REAL`);
  } catch (error) {
    console.error(
      "[db-schema.ts:migrateInvoiceLineWeight]",
      error instanceof Error ? error.message : error,
    );
  }
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

function ensureStaffTables(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS staff_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EDITOR', 'SUB_ADMIN')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff_sessions (
      id TEXT PRIMARY KEY,
      staff_user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (staff_user_id) REFERENCES staff_users(id)
    );
  `);
}

/** Expand staff roles: OPS → EDITOR; allow ADMIN | EDITOR | SUB_ADMIN. */
function migrateStaffRoles(database: DatabaseSync): void {
  try {
    const row = database
      .prepare(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'staff_users'`,
      )
      .get() as { sql: string } | undefined;
    if (!row?.sql) return;
    if (row.sql.includes("SUB_ADMIN")) return;

    database.exec(`
      CREATE TABLE staff_users_v2 (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EDITOR', 'SUB_ADMIN')),
        created_at TEXT NOT NULL
      );
      INSERT INTO staff_users_v2 (id, email, password_hash, name, role, created_at)
      SELECT id, email, password_hash, name,
             CASE WHEN role = 'OPS' THEN 'EDITOR' ELSE role END,
             created_at
      FROM staff_users;
      DROP TABLE staff_users;
      ALTER TABLE staff_users_v2 RENAME TO staff_users;
    `);
  } catch (error) {
    console.error(
      "[db-schema.ts:migrateStaffRoles]",
      error instanceof Error ? error.message : error,
    );
  }
}

function bootstrapStaffAdmin(database: DatabaseSync): void {
  try {
    const email = process.env.STAFF_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const password = process.env.STAFF_BOOTSTRAP_PASSWORD?.trim();
    if (!email || !password || password.length < 8) return;

    const count = database
      .prepare(`SELECT COUNT(*) as c FROM staff_users`)
      .get() as { c: number };
    if (count.c > 0) return;

    const id = `stf_${randomBytes(12).toString("hex")}`;
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, 12);
    database
      .prepare(
        `INSERT INTO staff_users (id, email, password_hash, name, role, created_at)
         VALUES (?, ?, ?, ?, 'ADMIN', ?)`,
      )
      .run(id, email, passwordHash, "Hulakico Admin", now);
  } catch (error) {
    console.error(
      "[db-schema.ts:bootstrapStaffAdmin]",
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
    ["origin_contact_name", "TEXT"],
    ["origin_company", "TEXT"],
    ["origin_phone", "TEXT"],
    ["origin_email", "TEXT"],
    ["origin_line1", "TEXT"],
    ["origin_line2", "TEXT"],
    ["origin_postal_code", "TEXT"],
    ["destination_contact_name", "TEXT"],
    ["destination_company", "TEXT"],
    ["destination_phone", "TEXT"],
    ["destination_email", "TEXT"],
    ["destination_line1", "TEXT"],
    ["destination_line2", "TEXT"],
    ["destination_postal_code", "TEXT"],
    ["partner_label", "TEXT"],
    ["partner_track_url", "TEXT"],
  ];
  for (const [name, type] of additions) {
    if (!names.has(name)) {
      database.exec(`ALTER TABLE shipments ADD COLUMN ${name} ${type}`);
    }
  }
}
