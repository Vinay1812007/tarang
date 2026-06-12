/** Single registry of every localStorage key VinaX owns. */
export const STORAGE_PREFIX = 'vinax';

export const KEYS = {
  schemaVersion: `${STORAGE_PREFIX}.schema-version`,
  settings: `${STORAGE_PREFIX}.settings.v1`,
  player: `${STORAGE_PREFIX}.player.v1`,
  library: `${STORAGE_PREFIX}.library.v1`,
  history: `${STORAGE_PREFIX}.history.v1`,
  search: `${STORAGE_PREFIX}.search.v1`,
  profile: `${STORAGE_PREFIX}.profile.v1`,
  region: `${STORAGE_PREFIX}.region.v1`,
  onboarded: `${STORAGE_PREFIX}.onboarded.v1`,
  lastSeenVersion: `${STORAGE_PREFIX}.last-seen-version`,
} as const;

export const CURRENT_SCHEMA_VERSION = 2;
