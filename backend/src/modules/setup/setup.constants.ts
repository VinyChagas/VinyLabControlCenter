/** Temporary first-access credentials — never persisted; only valid while no OWNER exists. */
export const SETUP_TEMP_USERNAME = 'admin';
export const SETUP_TEMP_PASSWORD = '1234';

/** Setup session TTL (short-lived). */
export const SETUP_SESSION_TTL_MS = 30 * 60 * 1000;

/** pg_advisory_xact_lock key for first-OWNER creation. */
export const SETUP_OWNER_ADVISORY_LOCK_KEY = 824_501_337;
