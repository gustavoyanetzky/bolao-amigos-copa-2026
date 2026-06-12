import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import AdminBottomNav from "./AdminBottomNav";

/**
 * Casca das rotas administrativas (protegidas).
 * Server Component: valida a sessao via getUser() e, sem usuario,
 * redireciona para /login (defesa em profundidade junto ao middleware).
 * Renderiza header (escudo + titulo + Sair) + conteudo + bottom nav.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-navy-deep">
      {/* Header sticky */}
      <header className="sticky top-0 z-20 mx-auto flex h-header-height w-full max-w-md items-center justify-between border-b border-border bg-surface px-edge-margin">
        <div className="flex items-center gap-2">
          <Image
            src="/escudo.jpg"
            alt="Escudo do Bolão Amigos FC"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full bg-brand-cream object-contain"
          />
          <span className="text-headline-md-mobile font-bold text-brand-cream">
            Bolão Amigos FC
          </span>
        </div>

        {/* Botao Sair — Server Action de logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-label-sm font-medium text-text-secondary transition-colors hover:text-error-red"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              aria-hidden="true"
            >
              logout
            </span>
            Sair
          </button>
        </form>
      </header>

      {/* Conteudo */}
      <main className="mx-auto w-full max-w-md flex-1 px-edge-margin pb-[calc(var(--spacing-bottom-nav-height)+1rem)] pt-edge-margin">
        {children}
      </main>

      <AdminBottomNav />
    </div>
  );
}
