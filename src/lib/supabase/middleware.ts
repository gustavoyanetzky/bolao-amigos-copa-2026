import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessao do admin a cada request e protege /admin/*.
 * Padrao oficial @supabase/ssr para Next.js App Router.
 *
 * - Cria um server client ligado aos cookies do request/response.
 * - Chama getUser() para validar a sessao (NUNCA confie so no cookie cru).
 * - Sem usuario E rota /admin -> redireciona para /login.
 * - Retorna o NextResponse preservando os cookies renovados.
 */
export async function updateSession(request: NextRequest) {
  // Resposta base que carrega adiante os cookies da sessao.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Atualiza tanto o request (para handlers seguintes) quanto a resposta.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: nao rodar codigo entre createServerClient e getUser para
  // evitar sessoes encerradas de forma imprevisivel (logout aleatorio).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guarda das rotas administrativas.
  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANTE: retornar o supabaseResponse intacto para manter os cookies
  // em sincronia entre o browser e o servidor.
  return supabaseResponse;
}
