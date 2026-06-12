import { createClient } from "@supabase/supabase-js";
import "server-only";

/**
 * Cliente Supabase anonimo (sem cookies) para leitura PUBLICA (RLS).
 * Permite cache/ISR nas telas publicas — sem dependencia de cookies,
 * a renderizacao nao e forcada a dynamic. SINCRONO.
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
