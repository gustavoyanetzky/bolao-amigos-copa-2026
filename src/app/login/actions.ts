"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Resultado de uma tentativa de login.
 * Em caso de sucesso ha redirect (nao retorna); erro volta a mensagem.
 */
export type LoginState = { error: string } | undefined;

/**
 * Server Action de login do admin.
 * Toda a autenticacao acontece no servidor (thin client / fat server).
 * Sucesso -> redireciona para /admin. Erro -> retorna { error }.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe email e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou senha invalidos." };
  }

  // redirect() lanca internamente — manter fora do try/catch.
  redirect("/admin");
}

/**
 * Server Action de logout: encerra a sessao e volta para /login.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
