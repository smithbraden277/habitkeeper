// Supabase project settings. Both values are safe to publish: the anon key only
// grants what the row level security policies in supabase/migrations allow.
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
