/** Public base URL for uploaded media, used by admin previews. */
export const MEDIA_BASE = (process.env.MEDIA_URL ?? process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
