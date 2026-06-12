import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Proxy (Next 16, ex-"middleware"): renova a sessao do admin e protege /admin/*.
 * Toda a logica fica em lib/supabase/middleware.ts (fat server).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Casa todas as rotas, EXCETO:
     * - _next/static (arquivos estaticos)
     * - _next/image (otimizacao de imagem)
     * - favicon.ico
     * - arquivos com extensao (svg, png, jpg, jpeg, gif, webp, ico, etc.)
     * Garante /admin/:path* sempre protegido.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
