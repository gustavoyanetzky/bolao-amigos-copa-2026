import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser (Client Components).
 * Usa a anon key — protegida por RLS. Nunca expor a service role aqui.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
