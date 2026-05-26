// Public configuration for the budget-support frontend.
// SAFE: only the publishable (anon) key is here — RLS gates everything.
// To repoint at a different Supabase project, edit these constants only.
export const SUPABASE_URL  = "https://mdxutmbpoqjtdcwjscux.supabase.co";
export const SUPABASE_ANON = "sb_publishable_lPfS842rgq7Ru0IUy4KaOg_Q55SGLhQ";
export const GENERATE_LETTER_URL = `${SUPABASE_URL}/functions/v1/generate-letter`;
export const CURATOR_URL         = `${SUPABASE_URL}/functions/v1/letter-curator`;
